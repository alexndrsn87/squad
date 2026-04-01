import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { Users, Plus, ChevronRight } from 'lucide-react'
import { PlanBadge } from '@/components/ui/Badge'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Teams' }

export default async function TeamsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const { data: memberships } = await supabase
    .from('team_members')
    .select(`
      preferred_position,
      teams(id, name, format, venue, owner_id, subscription_status,
        team_members(count)
      )
    `)
    .eq('user_id', user.id)

  const teams = (memberships ?? [])
    .map(m => m.teams)
    .filter(Boolean) as {
      id: string; name: string; format: number; venue: string | null;
      owner_id: string; subscription_status: string;
      team_members: { count: number }[]
    }[]

  return (
    <AppShell user={profile}>
      <div className="p-5 md:p-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl tracking-wide mb-1">Teams</h1>
            <p className="text-text-secondary text-sm">{teams.length} team{teams.length !== 1 ? 's' : ''}</p>
          </div>
          <Link href="/teams/new" className="btn-primary flex items-center gap-1.5 text-sm">
            <Plus size={15} /> New team
          </Link>
        </div>

        {teams.length === 0 ? (
          <div className="card text-center py-16">
            <Users className="mx-auto text-text-muted mb-3" size={32} />
            <h3 className="font-semibold mb-1">No teams yet</h3>
            <p className="text-text-muted text-sm mb-5">Create your first team or join via an invite link.</p>
            <Link href="/teams/new" className="btn-primary inline-flex items-center gap-2">
              <Plus size={15} /> Create team
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {teams.map(team => {
              const memberCount = (team.team_members as unknown as { count: number }[])?.[0]?.count ?? 0
              const isOwner = team.owner_id === user.id

              return (
                <Link
                  key={team.id}
                  href={`/teams/${team.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-bg-elevated border border-bg-border
                             hover:border-brand/20 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-bg-border flex items-center justify-center flex-shrink-0">
                    <Users size={16} className="text-text-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{team.name}</div>
                    <div className="text-xs text-text-muted">
                      {team.format}-a-side
                      {team.venue ? ` · ${team.venue}` : ''}
                      {' · '}{memberCount} players
                      {isOwner && ' · Organiser'}
                    </div>
                  </div>
                  <PlanBadge plan={team.subscription_status as 'free' | 'basic' | 'pro'} />
                  <ChevronRight size={14} className="text-text-muted group-hover:text-brand transition-colors" />
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
