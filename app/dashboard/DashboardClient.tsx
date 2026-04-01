'use client'

import Link from 'next/link'
import { Calendar, Users, Plus, ChevronRight, Trophy, Zap } from 'lucide-react'
import { formatGameDate, formatCurrency, statusBg, statusLabel, cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { Badge, PlanBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import type { User, Team, Game } from '@/types/database'

interface DashboardClientProps {
  user: User
  teams: (Team & {
    team_members: { count: number }[]
    games: (Game & { availability: { status: string; payment_status: string; user_id: string }[] })[]
  })[]
  upcomingGames: (Game & {
    teams: Team
    availability: { status: string; payment_status: string; user_id: string }[]
  })[]
}

export function DashboardClient({ user, teams, upcomingGames }: DashboardClientProps) {
  const displayName = user.nickname ?? user.name.split(' ')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Evening'

  // Next game
  const nextGame = upcomingGames[0]

  // My availability for upcoming games
  function myStatus(game: typeof upcomingGames[0]) {
    return game.availability?.find(a => a.user_id === user.id)
  }

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl tracking-wide mb-1">
          {greeting}, {displayName} 👋
        </h1>
        <p className="text-text-secondary text-sm">
          {upcomingGames.length > 0
            ? `You've got ${upcomingGames.length} game${upcomingGames.length > 1 ? 's' : ''} coming up`
            : 'No upcoming games — time to schedule one'}
        </p>
      </div>

      {/* Next game hero card */}
      {nextGame ? (
        <Link
          href={`/games/${nextGame.id}`}
          className="block card hover:border-brand/30 transition-colors mb-6 group"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-text-muted text-xs font-medium uppercase tracking-wide">Next game</span>
                <Badge status={nextGame.status} dot />
              </div>
              <div className="font-display text-2xl tracking-wide">{nextGame.teams?.name}</div>
              <div className="text-text-secondary text-sm mt-0.5">{formatGameDate(nextGame.scheduled_at)}</div>
            </div>
            <ChevronRight className="text-text-muted group-hover:text-brand transition-colors mt-1" size={18} />
          </div>

          {/* Attendance bar */}
          <div className="flex items-center gap-4 mt-3">
            {(() => {
              const avail = nextGame.availability ?? []
              const inCount = avail.filter(a => a.status === 'in').length
              const paidCount = avail.filter(a => a.status === 'in' && a.payment_status === 'paid').length
              const needsPlayers = (nextGame.teams?.format ?? 5) * 2
              const myAvail = myStatus(nextGame)

              return (
                <>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs text-text-muted mb-1.5">
                      <span>{inCount} in · {needsPlayers} needed</span>
                      {nextGame.teams?.subscription_status !== 'free' && (
                        <span className="text-brand">{paidCount} paid</span>
                      )}
                    </div>
                    <div className="h-1.5 bg-bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand rounded-full transition-all"
                        style={{ width: `${Math.min((inCount / needsPlayers) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  {myAvail ? (
                    <Badge status={myAvail.status} dot />
                  ) : nextGame.status === 'polling' ? (
                    <span className="text-xs text-yellow-400 font-medium animate-pulse">Respond now →</span>
                  ) : null}
                </>
              )
            })()}
          </div>
        </Link>
      ) : (
        <div className="card mb-6 border-dashed">
          <EmptyState
            icon={Calendar}
            title="No upcoming games"
            description="Schedule your first game and SQUAD will handle the rest."
            action={
              teams.length > 0 ? (
                <Link href="/games/new" className="btn-primary inline-flex items-center gap-2">
                  <Plus size={16} /> Schedule game
                </Link>
              ) : undefined
            }
          />
        </div>
      )}

      {/* Rest of upcoming games */}
      {upcomingGames.length > 1 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-text-secondary text-xs font-medium uppercase tracking-wide">Also coming up</h2>
          </div>
          <div className="space-y-2">
            {upcomingGames.slice(1).map(game => {
              const myAvail = myStatus(game)
              const inCount = (game.availability ?? []).filter(a => a.status === 'in').length
              return (
                <Link
                  key={game.id}
                  href={`/games/${game.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-bg-elevated border border-bg-border
                             hover:border-brand/20 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-bg-border flex items-center justify-center flex-shrink-0">
                    <Calendar size={16} className="text-text-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">{game.teams?.name}</div>
                    <div className="text-xs text-text-muted">{formatGameDate(game.scheduled_at)} · {inCount} in</div>
                  </div>
                  {myAvail ? (
                    <Badge status={myAvail.status} />
                  ) : game.status === 'polling' ? (
                    <span className="text-xs text-yellow-400">Respond</span>
                  ) : null}
                  <ChevronRight size={14} className="text-text-muted group-hover:text-brand transition-colors" />
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Teams */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-text-secondary text-xs font-medium uppercase tracking-wide">Your teams</h2>
          <Link href="/teams/new" className="btn-ghost text-xs py-1 px-2 flex items-center gap-1">
            <Plus size={13} /> New team
          </Link>
        </div>

        {teams.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No teams yet"
            description="Create your first team and invite your squad."
            action={
              <Link href="/teams/new" className="btn-primary inline-flex items-center gap-2">
                <Plus size={16} /> Create team
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {teams.map(team => {
              const memberCount = (team.team_members as unknown as { count: number }[])?.[0]?.count ?? 0
              const isOwner = team.owner_id === user.id
              const recentGames = (team.games ?? [])
                .filter(g => g.status !== 'cancelled')
                .slice(0, 3)

              return (
                <Link
                  key={team.id}
                  href={`/teams/${team.id}`}
                  className="card hover:border-brand/30 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-text-primary group-hover:text-brand transition-colors">
                        {team.name}
                      </div>
                      <div className="text-xs text-text-muted mt-0.5">
                        {team.format}-a-side
                        {team.venue ? ` · ${team.venue}` : ''}
                      </div>
                    </div>
                    <PlanBadge plan={team.subscription_status as 'free' | 'basic' | 'pro'} />
                  </div>

                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <div className="flex items-center gap-1">
                      <Users size={12} />
                      <span>{memberCount} player{memberCount !== 1 ? 's' : ''}</span>
                    </div>
                    {isOwner && (
                      <span className="text-brand/70 font-medium">Organiser</span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
