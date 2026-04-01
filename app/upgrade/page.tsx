import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { UpgradeClient } from './UpgradeClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Upgrade' }

export default async function UpgradePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  // Get teams where user is owner
  const { data: memberships } = await supabase
    .from('team_members')
    .select('teams(id, name, subscription_status, owner_id)')
    .eq('user_id', user.id)

  const teams = (memberships ?? [])
    .map((m: any) => m.teams)
    .filter((t: any) => t && t.owner_id === user.id) as any[]

  if (teams.length === 0) redirect('/teams')

  return (
    <AppShell user={profile}>
      <div className="p-5 md:p-8 max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl tracking-wide mb-2">Upgrade your team</h1>
          <p className="text-text-secondary">
            Unlock payments, smart team selection, and more.
          </p>
        </div>
        <UpgradeClient teams={teams} />
      </div>
    </AppShell>
  )
}
