import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { JoinTeamClient } from './JoinTeamClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: "You've been invited" }

interface Props { params: Promise<{ code: string }> }

export default async function JoinTeamPage({ params }: Props) {
  const { code } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch invite + team info
  const { data: invite } = await supabase
    .from('team_invites')
    .select(`
      id, code, expires_at,
      teams(id, name, format, venue, owner_id,
        users!teams_owner_id_fkey(name),
        team_members(count)
      )
    `)
    .eq('code', code)
    .gt('expires_at', new Date().toISOString())
    .single()

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg">
      <div className="w-full max-w-sm">
        <div className="font-display text-3xl tracking-widest text-brand mb-8">SQUAD</div>
        <JoinTeamClient
          invite={invite as Parameters<typeof JoinTeamClient>[0]['invite']}
          code={code}
          userId={user?.id ?? null}
        />
      </div>
    </div>
  )
}
