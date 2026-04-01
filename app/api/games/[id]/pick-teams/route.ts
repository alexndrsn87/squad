import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface PlayerData {
  user_id: string
  ability_score: number
  preferred_position: string
  games_missed_priority: number
  payment_status: string
}

function pickTeams(
  players: PlayerData[],
  tier: 'free' | 'basic' | 'pro'
): { teamA: PlayerData[]; teamB: PlayerData[] } {
  // Filter eligible players
  const eligible = players.filter(p =>
    tier === 'free' ? true : p.payment_status === 'paid'
  )

  const hasRatingData = eligible.some(p => p.ability_score > 0)

  if (tier === 'free' || !hasRatingData) {
    // Pure random
    const shuffled = [...eligible].sort(() => Math.random() - 0.5)
    return {
      teamA: shuffled.filter((_, i) => i % 2 === 0),
      teamB: shuffled.filter((_, i) => i % 2 !== 0),
    }
  }

  // Sort: priority credits first, then ability score descending
  const sorted = [...eligible].sort((a, b) => {
    if (b.games_missed_priority !== a.games_missed_priority) {
      return b.games_missed_priority - a.games_missed_priority
    }
    return b.ability_score - a.ability_score
  })

  // Snake draft: 1→A, 2→B, 3→B, 4→A, 5→A, 6→B ...
  const teamA: PlayerData[] = []
  const teamB: PlayerData[] = []

  sorted.forEach((player, i) => {
    const round = Math.floor(i / 2)
    const isEvenRound = round % 2 === 0
    const posInRound = i % 2
    if ((isEvenRound && posInRound === 0) || (!isEvenRound && posInRound === 1)) {
      teamA.push(player)
    } else {
      teamB.push(player)
    }
  })

  // Position balance pass (Pro only)
  if (tier === 'pro') {
    optimisePositions(teamA, teamB)
  }

  return { teamA, teamB }
}

function optimisePositions(teamA: PlayerData[], teamB: PlayerData[]) {
  const positions = ['goalkeeper', 'defensive', 'midfield', 'attacking']

  for (const pos of positions) {
    const aCount = teamA.filter(p => p.preferred_position === pos).length
    const bCount = teamB.filter(p => p.preferred_position === pos).length

    if (Math.abs(aCount - bCount) >= 2) {
      // Find lowest-impact swap candidate
      const surplus = aCount > bCount ? teamA : teamB
      const deficit = aCount > bCount ? teamB : teamA

      const swapFrom = surplus.find(p => p.preferred_position === pos)
      const swapTo = deficit.find(p => p.preferred_position !== pos)

      if (swapFrom && swapTo) {
        const fromIdx = surplus.indexOf(swapFrom)
        const toIdx = deficit.indexOf(swapTo)
        ;[surplus[fromIdx], deficit[toIdx]] = [deficit[toIdx], surplus[fromIdx]]
      }
    }
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  // Verify user is the team owner
  const { data: game } = await supabase
    .from('games')
    .select('id, team_id, status, teams(owner_id, subscription_status, format)')
    .eq('id', gameId)
    .single()

  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 })

  const team = game.teams as { owner_id: string; subscription_status: string; format: number }
  if (team.owner_id !== user.id) {
    return NextResponse.json({ error: 'Only the organiser can pick teams' }, { status: 403 })
  }

  const tier = team.subscription_status as 'free' | 'basic' | 'pro'

  // Get eligible players using admin client (to read ability_score from player_stats)
  const admin = createAdminClient()

  const { data: availabilityData } = await admin
    .from('availability')
    .select('user_id, status, payment_status')
    .eq('game_id', gameId)
    .eq('status', 'in')

  if (!availabilityData?.length) {
    return NextResponse.json({ error: 'No confirmed players' }, { status: 400 })
  }

  // Get player stats for ability scores
  const userIds = availabilityData.map(a => a.user_id)
  const { data: statsData } = await admin
    .from('player_stats')
    .select('user_id, ability_score, games_missed_priority')
    .eq('team_id', game.team_id)
    .in('user_id', userIds)

  const { data: memberData } = await admin
    .from('team_members')
    .select('user_id, preferred_position')
    .eq('team_id', game.team_id)
    .in('user_id', userIds)

  // Merge data
  const players: PlayerData[] = availabilityData.map(a => {
    const stats = statsData?.find(s => s.user_id === a.user_id)
    const member = memberData?.find(m => m.user_id === a.user_id)
    return {
      user_id: a.user_id,
      ability_score: stats?.ability_score ?? 0,
      preferred_position: member?.preferred_position ?? 'midfield',
      games_missed_priority: stats?.games_missed_priority ?? 0,
      payment_status: a.payment_status,
    }
  })

  const { teamA, teamB } = pickTeams(players, tier)
  const totalEligible = teamA.length + teamB.length

  if (totalEligible < team.format * 2) {
    return NextResponse.json(
      { error: `Need ${team.format * 2} eligible players, only have ${totalEligible}` },
      { status: 400 }
    )
  }

  // Delete previous assignments
  await admin.from('game_teams').delete().eq('game_id', gameId)

  // Insert new assignments
  const assignments = [
    ...teamA.map(p => ({ game_id: gameId, user_id: p.user_id, team: 'A' as const })),
    ...teamB.map(p => ({ game_id: gameId, user_id: p.user_id, team: 'B' as const })),
  ]

  const { error: insertError } = await admin.from('game_teams').insert(assignments)
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  // Update game status
  await admin.from('games').update({ status: 'teams_picked' }).eq('id', gameId)

  // Award priority credits to paid players who didn't get a spot
  if (tier !== 'free') {
    const selectedIds = new Set([...teamA, ...teamB].map(p => p.user_id))
    const bumpedPlayers = players.filter(p =>
      p.payment_status === 'paid' && !selectedIds.has(p.user_id)
    )

    for (const bumped of bumpedPlayers) {
      await admin.from('priority_credits')
        .upsert({
          team_id: game.team_id,
          user_id: bumped.user_id,
          credits: 1,
          last_updated: new Date().toISOString(),
        }, { onConflict: 'team_id,user_id' })

      // Also update games_missed_priority in player_stats
      await admin.from('player_stats')
        .upsert({
          user_id: bumped.user_id,
          team_id: game.team_id,
          games_missed_priority: (statsData?.find(s => s.user_id === bumped.user_id)?.games_missed_priority ?? 0) + 1,
          last_updated: new Date().toISOString(),
        }, { onConflict: 'user_id,team_id' })
    }
  }

  // Calculate team balance score for display
  const scoreA = teamA.reduce((sum, p) => sum + p.ability_score, 0) / (teamA.length || 1)
  const scoreB = teamB.reduce((sum, p) => sum + p.ability_score, 0) / (teamB.length || 1)
  const differential = Math.abs(scoreA - scoreB).toFixed(2)

  return NextResponse.json({
    success: true,
    teamA: teamA.map(p => p.user_id),
    teamB: teamB.map(p => p.user_id),
    balanceDifferential: differential,
    bumped: tier !== 'free' ? players
      .filter(p => p.payment_status === 'paid' && !new Set([...teamA, ...teamB].map(x => x.user_id)).has(p.user_id))
      .map(p => p.user_id) : [],
  })
}
