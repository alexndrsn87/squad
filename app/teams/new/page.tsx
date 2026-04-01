import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { NewTeamForm } from './NewTeamForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Create team' }

export default async function NewTeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  // Count existing teams to enforce free tier limit
  const { count: teamCount } = await supabase
    .from('teams')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', user.id)

  return (
    <AppShell user={profile}>
      <div className="p-5 md:p-8 max-w-xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl tracking-wide mb-1">Create a team</h1>
          <p className="text-text-secondary text-sm">
            Set up your squad and invite players to join.
          </p>
        </div>
        <NewTeamForm userId={user.id} existingTeamCount={teamCount ?? 0} />
      </div>
    </AppShell>
  )
}
