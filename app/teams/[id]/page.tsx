import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { TeamDetailClient } from './TeamDetailClient'
import type { Metadata } from 'next'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('teams').select('name').eq('id', id).single()
  return { title: data?.name ?? 'Team' }
}

export default async function TeamDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  // Fetch team with members
  const { data: team } = await supabase
    .from('teams')
    .select(`
      *,
      team_members(
        id, preferred_position, joined_at,
        users(id, name, nickname, avatar_url, email),
        player_stats(games_played, motm_count, games_missed_priority, ability_score)
      )
    `)
    .eq('id', id)
    .single()

  if (!team) notFound()

  // Check user is a member
  const isMember = team.owner_id === user.id ||
    team.team_members.some((m: { users: { id: string } }) => m.users.id === user.id)
  if (!isMember) notFound()

  // Recent and upcoming games
  const { data: games } = await supabase
    .from('games')
    .select(`
      id, scheduled_at, status, cost_per_player, team_a_label, team_b_label,
      availability(status, payment_status, user_id)
    `)
    .eq('team_id', id)
    .order('scheduled_at', { ascending: false })
    .limit(10)

  // Active invite
  const { data: invite } = await supabase
    .from('team_invites')
    .select('code, expires_at')
    .eq('team_id', id)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return (
    <AppShell user={profile}>
      <TeamDetailClient
        team={team as unknown as Parameters<typeof TeamDetailClient>[0]['team']}
        games={games ?? []}
        currentUserId={user.id}
        inviteCode={invite?.code ?? null}
      />
    </AppShell>
  )
}
