import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { ProfileClient } from './ProfileClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My profile' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const { data: teamMemberships } = await supabase
    .from('team_members')
    .select(`
      team_id, preferred_position,
      teams(id, name, format, subscription_status),
      player_stats(games_played, motm_count)
    `)
    .eq('user_id', user.id)

  return (
    <AppShell user={profile}>
      <ProfileClient user={profile} memberships={teamMemberships as unknown as Parameters<typeof ProfileClient>[0]['memberships'] ?? []} />
    </AppShell>
  )
}
