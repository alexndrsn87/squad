import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { SettingsClient } from './SettingsClient'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Team Settings' }

export default async function TeamSettingsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const { data: team } = await supabase
    .from('teams')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!team || team.owner_id !== user.id) redirect(`/teams/${params.id}`)

  // Get invite code
  const { data: inviteRow } = await supabase
    .from('team_invites' as any)
    .select('code, expires_at')
    .eq('team_id', params.id)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const inviteCode = (inviteRow as any)?.code ?? null

  const { count: memberCount } = await supabase
    .from('team_members')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', params.id)

  return (
    <AppShell user={profile}>
      <div className="p-5 md:p-8 max-w-lg mx-auto">
        <div className="mb-6">
          <Link
            href={`/teams/${params.id}`}
            className="flex items-center gap-1 text-sm text-text-muted hover:text-brand mb-4"
          >
            <ChevronLeft size={14} /> Back to team
          </Link>
          <h1 className="font-display text-3xl tracking-wide">Team Settings</h1>
          <p className="text-text-secondary text-sm mt-1">{team.name}</p>
        </div>

        <SettingsClient
          team={team}
          inviteCode={inviteCode}
          memberCount={memberCount ?? 0}
        />
      </div>
    </AppShell>
  )
}
