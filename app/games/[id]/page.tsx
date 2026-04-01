import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { GameDetailClient } from './GameDetailClient'
import type { Metadata } from 'next'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('games')
    .select('scheduled_at, teams(name)')
    .eq('id', id)
    .single()
  return {
    title: data
      ? `${(data.teams as { name: string } | null)?.name ?? 'Game'} · ${new Date(data.scheduled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
      : 'Game'
  }
}

export default async function GameDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  // Game with all related data
  const { data: game } = await supabase
    .from('games')
    .select(`
      *,
      teams(id, name, format, owner_id, subscription_status, venue)
    `)
    .eq('id', id)
    .single()

  if (!game) notFound()

  // Check user is a team member
  const { data: membership } = await supabase
    .from('team_members')
    .select('id, preferred_position')
    .eq('team_id', (game.teams as { id: string }).id)
    .eq('user_id', user.id)
    .single()

  if (!membership) notFound()

  // Availability with player details
  const { data: availability } = await supabase
    .from('availability')
    .select(`
      id, status, payment_status, responded_at,
      users(id, name, nickname, avatar_url)
    `)
    .eq('game_id', id)
    .order('responded_at', { ascending: true })

  // Team assignments (if picked)
  const { data: gameTeams } = await supabase
    .from('game_teams')
    .select(`
      id, team, assigned_at,
      users(id, name, nickname, avatar_url)
    `)
    .eq('game_id', id)

  // All team members (so we can see who hasn't responded)
  const { data: allMembers } = await supabase
    .from('team_members')
    .select(`
      user_id,
      users(id, name, nickname, avatar_url),
      player_stats(games_missed_priority)
    `)
    .eq('team_id', (game.teams as { id: string }).id)

  // MOTM votes (winner only, not who voted)
  const { data: motmVotes } = await supabase
    .from('motm_votes')
    .select('nominee_id')
    .eq('game_id', id)

  // Has current user voted MOTM?
  const { data: myMotmVote } = await supabase
    .from('motm_votes')
    .select('nominee_id')
    .eq('game_id', id)
    .eq('voter_id', user.id)
    .single()

  return (
    <AppShell user={profile}>
      <GameDetailClient
        game={game as Parameters<typeof GameDetailClient>[0]['game']}
        availability={availability as Parameters<typeof GameDetailClient>[0]['availability'] ?? []}
        gameTeams={gameTeams as unknown as Parameters<typeof GameDetailClient>[0]['gameTeams'] ?? []}
        allMembers={allMembers as unknown as Parameters<typeof GameDetailClient>[0]['allMembers'] ?? []}
        motmVotes={motmVotes ?? []}
        myMotmVote={myMotmVote?.nominee_id ?? null}
        currentUser={profile}
      />
    </AppShell>
  )
}
