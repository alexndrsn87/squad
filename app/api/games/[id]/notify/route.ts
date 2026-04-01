import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import {
  sendPollOpenEmail,
  sendTeamsPickedEmail,
  sendRatingRequestEmail,
} from '@/lib/email/resend'

/**
 * POST /api/games/:id/notify?type=poll_open|teams_picked|rating_request
 * Called server-side (or by cron) to send batch emails to game participants.
 * Requires the user to be the team owner OR uses service role via internal header.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const url = new URL(req.url)
  const type = url.searchParams.get('type')
  if (!['poll_open', 'teams_picked', 'rating_request'].includes(type ?? '')) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const { data: game } = await admin
    .from('games')
    .select('*, teams(id, name, owner_id)')
    .eq('id', params.id)
    .single()

  if (!game) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const team = game.teams as any
  if (team.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Get all players who are 'in' for this game (or all members for poll_open)
  const { data: members } = type === 'poll_open'
    ? await admin
        .from('team_members')
        .select('users(email, name, nickname)')
        .eq('team_id', team.id)
    : await admin
        .from('availability')
        .select('users(email, name, nickname)')
        .eq('game_id', params.id)
        .eq('status', 'in')

  if (!members || members.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  const gameDate = new Date(game.scheduled_at).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  })

  let sent = 0
  for (const m of members) {
    const u = (m as any).users
    if (!u?.email) continue
    const displayName = u.nickname ?? u.name ?? 'there'

    try {
      if (type === 'poll_open') {
        await sendPollOpenEmail({ to: u.email, name: displayName, teamName: team.name, gameDate, gameId: params.id })
      } else if (type === 'teams_picked') {
        await sendTeamsPickedEmail({ to: u.email, name: displayName, teamName: team.name, gameDate, gameId: params.id })
      } else if (type === 'rating_request') {
        await sendRatingRequestEmail({ to: u.email, name: displayName, teamName: team.name, gameDate, gameId: params.id })
      }
      sent++
    } catch (e) {
      console.error('Email failed for', u.email, e)
    }
  }

  return NextResponse.json({ sent })
}
