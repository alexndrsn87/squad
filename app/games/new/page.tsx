import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { NewGameForm } from './NewGameForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Schedule game' }

interface Props { searchParams: Promise<{ team?: string }> }

export default async function NewGamePage({ searchParams }: Props) {
  const { team: teamId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  // Get teams the user owns
  const { data: ownedTeams } = await supabase
    .from('teams')
    .select('id, name, format, subscription_status')
    .eq('owner_id', user.id)
    .order('created_at')

  return (
    <AppShell user={profile}>
      <div className="p-5 md:p-8 max-w-xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl tracking-wide mb-1">Schedule a game</h1>
          <p className="text-text-secondary text-sm">
            SQUAD will open availability polling 72 hours before kick-off.
          </p>
        </div>
        <NewGameForm
          teams={ownedTeams ?? []}
          defaultTeamId={teamId}
        />
      </div>
    </AppShell>
  )
}
