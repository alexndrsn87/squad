import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardClient } from './DashboardClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Fetch teams the user belongs to or owns
  const { data: teams } = await supabase
    .from('teams')
    .select(`
      *,
      team_members(count),
      games(
        id, scheduled_at, status, cost_per_player,
        availability(status, payment_status, user_id)
      )
    `)
    .or(`owner_id.eq.${user.id},team_members.user_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  // Upcoming games across all teams
  const { data: upcomingGames } = await supabase
    .from('games')
    .select(`
      *,
      teams!inner(id, name, format, owner_id, subscription_status),
      availability(status, payment_status, user_id)
    `)
    .in(
      'team_id',
      (teams ?? []).map(t => t.id)
    )
    .in('status', ['upcoming', 'polling', 'teams_picked'])
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(5)

  return (
    <AppShell user={profile}>
      <DashboardClient
        user={profile}
        teams={teams as unknown as Parameters<typeof DashboardClient>[0]['teams'] ?? []}
        upcomingGames={upcomingGames as unknown as Parameters<typeof DashboardClient>[0]['upcomingGames'] ?? []}
      />
    </AppShell>
  )
}
