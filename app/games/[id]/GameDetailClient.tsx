'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar, MapPin, Users, Check, X, Minus,
  Trophy, Shuffle, ChevronDown, ChevronUp,
  DollarSign, Clock, Star
} from 'lucide-react'
import { format } from 'date-fns'
import { formatGameDateFull, formatCurrency, cn, statusBg, statusLabel } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { Game, Team, User } from '@/types/database'

interface AvailabilityRecord {
  id: string
  status: string
  payment_status: string
  responded_at: string
  users: { id: string; name: string; nickname: string | null; avatar_url: string | null }
}

interface GameTeamRecord {
  id: string
  team: 'A' | 'B'
  assigned_at: string
  users: { id: string; name: string; nickname: string | null; avatar_url: string | null }
}

interface MemberRecord {
  user_id: string
  users: { id: string; name: string; nickname: string | null; avatar_url: string | null }
  player_stats: { games_missed_priority: number } | null
}

interface GameDetailClientProps {
  game: Game & { teams: Team }
  availability: AvailabilityRecord[]
  gameTeams: GameTeamRecord[]
  allMembers: MemberRecord[]
  motmVotes: { nominee_id: string }[]
  myMotmVote: string | null
  currentUser: User
}

export function GameDetailClient({
  game, availability, gameTeams, allMembers, motmVotes, myMotmVote, currentUser
}: GameDetailClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [showRatingModal, setShowRatingModal] = useState(false)

  const isOwner = game.teams.owner_id === currentUser.id
  const isPaidPlan = game.teams.subscription_status !== 'free'
  const myAvailability = availability.find(a => a.users.id === currentUser.id)
  const pollOpen = new Date(game.poll_opens_at) <= new Date() && new Date(game.scheduled_at) > new Date()
  const gameIsPast = new Date(game.scheduled_at) < new Date()

  const inPlayers = availability.filter(a => a.status === 'in')
  const outPlayers = availability.filter(a => a.status === 'out')
  const maybePlayers = availability.filter(a => a.status === 'maybe')
  const paidPlayers = availability.filter(a => a.status === 'in' && a.payment_status === 'paid')
  const neededCount = game.teams.format * 2

  // Who hasn't responded
  const respondedIds = new Set(availability.map(a => a.users.id))
  const notResponded = allMembers.filter(m => !respondedIds.has(m.user_id))

  // MOTM results
  const motmCounts: Record<string, number> = {}
  motmVotes.forEach(v => { motmCounts[v.nominee_id] = (motmCounts[v.nominee_id] ?? 0) + 1 })
  const motmWinnerId = Object.entries(motmCounts).sort((a, b) => b[1] - a[1])[0]?.[0]

  const teamA = gameTeams.filter(p => p.team === 'A')
  const teamB = gameTeams.filter(p => p.team === 'B')

  async function respondAvailability(status: 'in' | 'out' | 'maybe') {
    setRespondingTo(status)
    const supabase = createClient()

    const { error } = await supabase
      .from('availability')
      .upsert({
        game_id: game.id,
        user_id: currentUser.id,
        status,
        responded_at: new Date().toISOString(),
      }, { onConflict: 'game_id,user_id' })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(
        status === 'in' ? "You're in! 🎉" :
        status === 'out' ? "Marked as out" :
        "Marked as maybe"
      )
      startTransition(() => router.refresh())
    }
    setRespondingTo(null)
  }

  async function voteMotm(nomineeId: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('motm_votes')
      .insert({ game_id: game.id, voter_id: currentUser.id, nominee_id: nomineeId })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Vote cast! 🏆')
      startTransition(() => router.refresh())
    }
  }

  async function pickTeams() {
    const res = await fetch(`/api/games/${game.id}/pick-teams`, { method: 'POST' })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? 'Failed to pick teams'); return }
    toast.success('Teams picked! 🎯')
    startTransition(() => router.refresh())
  }

  async function markComplete() {
    const supabase = createClient()
    await supabase.from('games').update({ status: 'completed' }).eq('id', game.id)
    toast.success('Game marked as complete')
    startTransition(() => router.refresh())
  }

  const canPickTeams = isOwner &&
    game.status === 'polling' &&
    (isPaidPlan ? paidPlayers.length >= neededCount : inPlayers.length >= neededCount)

  return (
    <div className="p-5 md:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-text-muted text-xs font-medium uppercase tracking-wide mb-1">
              {game.teams.name}
            </div>
            <h1 className="font-display text-3xl tracking-wide">
              {format(new Date(game.scheduled_at), 'EEE d MMM')}
            </h1>
            <div className="text-text-secondary text-sm mt-0.5">
              {format(new Date(game.scheduled_at), 'HH:mm')}
              {game.teams.venue ? ` · ${game.teams.venue}` : ''}
            </div>
          </div>
          <Badge status={game.status} dot />
        </div>

        {game.notes && (
          <p className="mt-3 text-sm text-text-secondary bg-bg-elevated border border-bg-border rounded-xl px-4 py-3">
            {game.notes}
          </p>
        )}
      </div>

      {/* Status bar */}
      <div className="card mb-5">
        <div className="grid grid-cols-3 divide-x divide-bg-border">
          <div className="text-center px-2">
            <div className="text-2xl font-display tracking-wide text-brand">{inPlayers.length}</div>
            <div className="text-xs text-text-muted">In</div>
          </div>
          <div className="text-center px-2">
            <div className="text-2xl font-display tracking-wide">{maybePlayers.length}</div>
            <div className="text-xs text-text-muted">Maybe</div>
          </div>
          <div className="text-center px-2">
            <div className={cn('text-2xl font-display tracking-wide',
              inPlayers.length >= neededCount ? 'text-brand' : 'text-text-secondary'
            )}>
              {neededCount}
            </div>
            <div className="text-xs text-text-muted">Needed</div>
          </div>
        </div>
        {isPaidPlan && game.cost_per_player > 0 && (
          <div className="mt-3 pt-3 border-t border-bg-border flex items-center justify-between text-sm">
            <span className="text-text-muted">Collected</span>
            <span className="text-brand font-medium">
              {formatCurrency(paidPlayers.length * game.cost_per_player)}
              <span className="text-text-muted font-normal"> / {formatCurrency(neededCount * game.cost_per_player)}</span>
            </span>
          </div>
        )}
      </div>

      {/* My response */}
      {pollOpen && game.status !== 'teams_picked' && (
        <div className="card mb-5">
          <div className="text-sm font-medium mb-3">
            {myAvailability ? 'Change your response' : 'Are you in?'}
          </div>
          <div className="flex gap-2">
            {(['in', 'maybe', 'out'] as const).map(s => {
              const icons = { in: Check, maybe: Minus, out: X }
              const Icon = icons[s]
              const colours = {
                in: 'border-brand bg-brand/10 text-brand',
                maybe: 'border-yellow-400 bg-yellow-400/10 text-yellow-400',
                out: 'border-red-400 bg-red-400/10 text-red-400',
              }
              const active = myAvailability?.status === s

              return (
                <button
                  key={s}
                  onClick={() => respondAvailability(s)}
                  disabled={respondingTo !== null}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-sm font-medium transition-all',
                    active ? colours[s] : 'border-bg-border bg-bg-elevated text-text-secondary hover:border-text-secondary',
                    respondingTo === s && 'opacity-60'
                  )}
                >
                  <Icon size={15} />
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              )
            })}
          </div>
          {myAvailability?.status === 'in' && isPaidPlan && game.cost_per_player > 0 && (
            <div className={cn(
              'mt-3 pt-3 border-t border-bg-border flex items-center justify-between text-sm',
            )}>
              <span className="text-text-muted">Payment</span>
              {myAvailability.payment_status === 'paid' ? (
                <span className="text-brand font-medium flex items-center gap-1">
                  <Check size={13} /> Paid
                </span>
              ) : (
                <a href={`/games/${game.id}/pay`} className="btn-primary text-xs px-3 py-1.5">
                  Pay {formatCurrency(game.cost_per_player)} →
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Teams (if picked) */}
      {game.status === 'teams_picked' && gameTeams.length > 0 && (
        <div className="mb-5">
          <div className="text-xs text-text-muted uppercase tracking-wide font-medium mb-3">Teams</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: game.team_a_label, players: teamA, team: 'A' as const },
              { label: game.team_b_label, players: teamB, team: 'B' as const },
            ].map(({ label, players, team }) => (
              <div key={team} className="card">
                <div className="text-sm font-semibold mb-3 text-center text-brand">{label}</div>
                <div className="space-y-2">
                  {players.map(p => {
                    const name = p.users.nickname ?? p.users.name.split(' ')[0]
                    const isMe = p.users.id === currentUser.id
                    return (
                      <div key={p.id} className="flex items-center gap-2">
                        <Avatar src={p.users.avatar_url} name={p.users.name} size="xs" />
                        <span className={cn('text-sm truncate', isMe && 'text-brand font-medium')}>
                          {name}{isMe && ' ⚡'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MOTM voting */}
      {game.status === 'completed' && (
        <div className="card mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={16} className="text-yellow-400" />
            <span className="font-semibold text-sm">Man of the Match</span>
          </div>

          {!myMotmVote ? (
            <div>
              <p className="text-text-muted text-xs mb-3">Who stood out today?</p>
              <div className="space-y-2">
                {inPlayers
                  .filter(a => a.users.id !== currentUser.id)
                  .map(a => {
                    const name = a.users.nickname ?? a.users.name
                    return (
                      <button
                        key={a.id}
                        onClick={() => voteMotm(a.users.id)}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-bg-elevated border border-bg-border
                                   hover:border-yellow-400/30 hover:bg-yellow-400/5 transition-all text-left"
                      >
                        <Avatar src={a.users.avatar_url} name={a.users.name} size="sm" />
                        <span className="text-sm font-medium">{name}</span>
                        <Trophy size={13} className="ml-auto text-text-muted" />
                      </button>
                    )
                  })}
              </div>
            </div>
          ) : (
            <div>
              {motmWinnerId && (
                <div className="text-center py-2">
                  {(() => {
                    const winner = inPlayers.find(a => a.users.id === motmWinnerId)
                    const name = winner?.users.nickname ?? winner?.users.name ?? 'Unknown'
                    return (
                      <div>
                        <div className="text-yellow-400 text-2xl mb-1">🏆</div>
                        <div className="font-semibold">{name}</div>
                        <div className="text-xs text-text-muted mt-0.5">
                          {motmCounts[motmWinnerId]} vote{motmCounts[motmWinnerId] !== 1 ? 's' : ''}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
              <p className="text-center text-xs text-text-muted mt-2">You voted ✓</p>
            </div>
          )}
        </div>
      )}

      {/* Player list */}
      <div className="space-y-1">
        <div className="text-xs text-text-muted uppercase tracking-wide font-medium px-1 mb-2">
          Players ({availability.length})
        </div>

        {inPlayers.map(a => <PlayerRow key={a.id} record={a} isPaidPlan={isPaidPlan} />)}
        {maybePlayers.map(a => <PlayerRow key={a.id} record={a} isPaidPlan={isPaidPlan} />)}
        {outPlayers.map(a => <PlayerRow key={a.id} record={a} isPaidPlan={isPaidPlan} />)}

        {notResponded.length > 0 && (
          <div>
            <div className="text-xs text-text-muted px-1 mt-3 mb-1.5">No response yet ({notResponded.length})</div>
            {notResponded.map(m => (
              <div key={m.user_id} className="flex items-center gap-3 px-3 py-2 rounded-xl opacity-50">
                <Avatar src={m.users.avatar_url} name={m.users.name} size="sm" />
                <span className="text-sm text-text-secondary">{m.users.nickname ?? m.users.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Organiser actions */}
      {isOwner && (
        <div className="mt-6 pt-6 border-t border-bg-border space-y-3">
          {canPickTeams && (
            <button
              onClick={pickTeams}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Shuffle size={16} />
              Pick teams ({isPaidPlan ? paidPlayers.length : inPlayers.length} eligible)
            </button>
          )}
          {game.status === 'teams_picked' && !gameIsPast && (
            <button onClick={pickTeams} className="btn-secondary w-full text-sm">
              Regenerate teams
            </button>
          )}
          {(game.status === 'teams_picked' || (gameIsPast && game.status !== 'completed')) && (
            <button onClick={markComplete} className="btn-secondary w-full text-sm">
              Mark as completed
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function PlayerRow({ record, isPaidPlan }: { record: AvailabilityRecord; isPaidPlan: boolean }) {
  const name = record.users.nickname ?? record.users.name

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/2 transition-colors">
      <Avatar src={record.users.avatar_url} name={record.users.name} size="sm" />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium truncate block">{name}</span>
      </div>
      <div className="flex items-center gap-2">
        {isPaidPlan && record.status === 'in' && (
          <Badge status={record.payment_status} />
        )}
        <Badge status={record.status} dot />
      </div>
    </div>
  )
}
