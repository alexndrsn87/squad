import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { Calendar, Plus, ChevronRight } from 'lucide-react'
import { formatGameDate } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Games' }

export default async function GamesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  // All games user is part of
  const { data: memberTeams } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)

  const teamIds = (memberTeams ?? []).map(m => m.team_id)

  const { data: games } = await supabase
    .from('games')
    .select(`
      id, scheduled_at, status, cost_per_player,
      teams(id, name, format, owner_id),
      availability(status, payment_status, user_id)
    `)
    .in('team_id', teamIds)
    .order('scheduled_at', { ascending: false })
    .limit(30)

  const ownedTeamIds = (games ?? [])
    .filter(g => (g.teams as { owner_id: string }).owner_id === user.id)
    .map(g => (g.teams as { id: string }).id)

  return (
    <AppShell user={profile}>
      <div className="p-5 md:p-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl tracking-wide mb-1">Games</h1>
            <p className="text-text-secondary text-sm">All your upcoming and past games</p>
          </div>
          {ownedTeamIds.length > 0 && (
            <Link href="/games/new" className="btn-primary flex items-center gap-1.5 text-sm">
              <Plus size={15} /> Schedule
            </Link>
          )}
        </div>

        {(!games || games.length === 0) ? (
          <div className="card text-center py-16">
            <Calendar className="mx-auto text-text-muted mb-3" size={32} />
            <h3 className="font-semibold mb-1">No games yet</h3>
            <p className="text-text-muted text-sm">Games will appear here once your team organiser schedules one.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {games.map(game => {
              const myAvail = (game.availability as { status: string; payment_status: string; user_id: string }[])
                .find(a => a.user_id === user.id)
              const inCount = (game.availability as { status: string }[]).filter(a => a.status === 'in').length

              return (
                <Link
                  key={game.id}
                  href={`/games/${game.id}`}
                  className="flex items-center gap-3 p-4 rounded-xl bg-bg-elevated border border-bg-border
                             hover:border-brand/20 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-bg-border flex items-center justify-center flex-shrink-0">
                    <Calendar size={16} className="text-text-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {(game.teams as { name: string }).name}
                    </div>
                    <div className="text-xs text-text-muted">
                      {formatGameDate(game.scheduled_at)} · {inCount} in
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge status={game.status} />
                    {myAvail && <Badge status={myAvail.status} dot />}
                    <ChevronRight size={14} className="text-text-muted group-hover:text-brand transition-colors" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
