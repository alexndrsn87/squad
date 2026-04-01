'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Users, Calendar, Plus, Copy, Check,
  Trophy, Settings, ChevronRight, Star
} from 'lucide-react'
import { formatGameDate, statusBg, statusLabel, cn, formatCurrency } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { Badge, PlanBadge } from '@/components/ui/Badge'
import type { Team } from '@/types/database'

interface Member {
  id: string
  preferred_position: string
  joined_at: string
  users: { id: string; name: string; nickname: string | null; avatar_url: string | null; email: string }
  player_stats: { games_played: number; motm_count: number; games_missed_priority: number; ability_score: number } | null
}

interface GameSummary {
  id: string
  scheduled_at: string
  status: string
  cost_per_player: number
  team_a_label: string
  team_b_label: string
  availability: { status: string; payment_status: string; user_id: string }[]
}

interface TeamDetailClientProps {
  team: Team & { team_members: Member[] }
  games: GameSummary[]
  currentUserId: string
  inviteCode: string | null
}

export function TeamDetailClient({ team, games, currentUserId, inviteCode }: TeamDetailClientProps) {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'games' | 'players'>('games')

  const isOwner = team.owner_id === currentUserId
  const members = team.team_members ?? []

  const inviteUrl = inviteCode
    ? `${window?.location?.origin ?? ''}/teams/join/${inviteCode}`
    : null

  async function copyInvite() {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const upcomingGames = games.filter(g =>
    ['upcoming', 'polling', 'teams_picked'].includes(g.status) &&
    new Date(g.scheduled_at) > new Date()
  )
  const pastGames = games.filter(g =>
    g.status === 'completed' || new Date(g.scheduled_at) < new Date()
  )

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-display text-3xl tracking-wide">{team.name}</h1>
            <PlanBadge plan={team.subscription_status as 'free' | 'basic' | 'pro'} />
          </div>
          <div className="text-text-muted text-sm">
            {team.format}-a-side
            {team.venue ? ` · ${team.venue}` : ''}
            {' · '}{members.length} player{members.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOwner && (
            <Link href={`/teams/${team.id}/settings`} className="btn-ghost p-2">
              <Settings size={17} />
            </Link>
          )}
          {isOwner && (
            <Link href={`/games/new?team=${team.id}`} className="btn-primary flex items-center gap-1.5 text-sm">
              <Plus size={15} /> Schedule game
            </Link>
          )}
        </div>
      </div>

      {/* Invite link */}
      {isOwner && inviteUrl && (
        <div className="card mb-6 bg-brand/5 border-brand/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium mb-0.5">Invite your squad</div>
              <div className="text-xs text-text-muted font-mono truncate max-w-xs">{inviteUrl}</div>
            </div>
            <button
              onClick={copyInvite}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                copied
                  ? 'bg-brand/20 text-brand'
                  : 'bg-bg-elevated border border-bg-border text-text-secondary hover:border-text-secondary'
              )}
            >
              {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy link</>}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-bg-elevated rounded-xl p-1">
        {(['games', 'players'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all',
              activeTab === tab
                ? 'bg-bg-card text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            {tab === 'games' ? (
              <span className="flex items-center justify-center gap-1.5">
                <Calendar size={14} /> Games
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                <Users size={14} /> Players
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Games tab */}
      {activeTab === 'games' && (
        <div className="space-y-2">
          {upcomingGames.length === 0 && pastGames.length === 0 ? (
            <div className="card text-center py-12">
              <Calendar className="mx-auto text-text-muted mb-3" size={28} />
              <div className="font-medium mb-1">No games yet</div>
              <div className="text-text-muted text-sm mb-4">Schedule a game to get started</div>
              {isOwner && (
                <Link href={`/games/new?team=${team.id}`} className="btn-primary inline-flex items-center gap-2">
                  <Plus size={15} /> Schedule game
                </Link>
              )}
            </div>
          ) : (
            <>
              {upcomingGames.length > 0 && (
                <>
                  <div className="text-xs text-text-muted uppercase tracking-wide font-medium px-1 mb-2">Upcoming</div>
                  {upcomingGames.map(game => <GameRow key={game.id} game={game} currentUserId={currentUserId} />)}
                </>
              )}
              {pastGames.length > 0 && (
                <>
                  <div className="text-xs text-text-muted uppercase tracking-wide font-medium px-1 mt-5 mb-2">Past games</div>
                  {pastGames.slice(0, 5).map(game => <GameRow key={game.id} game={game} currentUserId={currentUserId} />)}
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Players tab */}
      {activeTab === 'players' && (
        <div className="space-y-2">
          {members.map(member => {
            const name = member.users.nickname ?? member.users.name
            const stats = member.player_stats
            const isCurrentUser = member.users.id === currentUserId

            return (
              <div
                key={member.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-bg-elevated border border-bg-border"
              >
                <Avatar src={member.users.avatar_url} name={member.users.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {name}
                    {isCurrentUser && <span className="text-text-muted text-xs ml-2">you</span>}
                    {member.users.id === team.owner_id && (
                      <span className="text-brand text-xs ml-2">organiser</span>
                    )}
                  </div>
                  <div className="text-xs text-text-muted capitalize">{member.preferred_position}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-text-muted">{stats?.games_played ?? 0} games</div>
                  {(stats?.motm_count ?? 0) > 0 && (
                    <div className="flex items-center justify-end gap-0.5 mt-0.5">
                      <Trophy size={11} className="text-yellow-400" />
                      <span className="text-xs text-yellow-400">{stats!.motm_count}</span>
                    </div>
                  )}
                  {(stats?.games_missed_priority ?? 0) > 0 && (
                    <div className="text-xs text-brand mt-0.5">
                      {stats!.games_missed_priority} credit{stats!.games_missed_priority !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function GameRow({ game, currentUserId }: { game: GameSummary; currentUserId: string }) {
  const myAvail = game.availability?.find(a => a.user_id === currentUserId)
  const inCount = (game.availability ?? []).filter(a => a.status === 'in').length

  return (
    <Link
      href={`/games/${game.id}`}
      className="flex items-center gap-3 p-3 rounded-xl bg-bg-elevated border border-bg-border
                 hover:border-brand/20 transition-colors group"
    >
      <div className="w-9 h-9 rounded-lg bg-bg-border flex items-center justify-center flex-shrink-0">
        <Calendar size={15} className="text-text-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{formatGameDate(game.scheduled_at)}</div>
        <div className="text-xs text-text-muted">
          {inCount} in
          {game.cost_per_player > 0 && ` · ${formatCurrency(game.cost_per_player)}/player`}
        </div>
      </div>
      <Badge status={game.status} />
      {myAvail && <Badge status={myAvail.status} />}
      <ChevronRight size={14} className="text-text-muted group-hover:text-brand transition-colors" />
    </Link>
  )
}
