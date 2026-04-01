import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatGameDate(date: string | Date): string {
  const d = new Date(date)
  if (isToday(d)) return `Today at ${format(d, 'HH:mm')}`
  if (isTomorrow(d)) return `Tomorrow at ${format(d, 'HH:mm')}`
  return format(d, 'EEE d MMM · HH:mm')
}

export function formatGameDateFull(date: string | Date): string {
  return format(new Date(date), 'EEEE d MMMM yyyy · HH:mm')
}

export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function statusColour(status: string): string {
  const map: Record<string, string> = {
    in: 'text-brand',
    out: 'text-red-500',
    maybe: 'text-yellow-400',
    reserve: 'text-text-secondary',
    paid: 'text-brand',
    unpaid: 'text-red-500',
    upcoming: 'text-text-secondary',
    polling: 'text-yellow-400',
    teams_picked: 'text-blue-400',
    completed: 'text-text-secondary',
    cancelled: 'text-red-500',
  }
  return map[status] ?? 'text-text-secondary'
}

export function statusBg(status: string): string {
  const map: Record<string, string> = {
    in: 'bg-brand/15 text-brand',
    out: 'bg-red-500/15 text-red-400',
    maybe: 'bg-yellow-400/15 text-yellow-400',
    reserve: 'bg-white/10 text-text-secondary',
    paid: 'bg-brand/15 text-brand',
    unpaid: 'bg-red-500/15 text-red-400',
    upcoming: 'bg-white/10 text-text-secondary',
    polling: 'bg-yellow-400/15 text-yellow-400',
    teams_picked: 'bg-blue-500/15 text-blue-400',
    completed: 'bg-white/10 text-text-secondary',
    cancelled: 'bg-red-500/15 text-red-500',
    free: 'bg-white/10 text-text-secondary',
    basic: 'bg-blue-500/15 text-blue-400',
    pro: 'bg-brand/15 text-brand',
  }
  return map[status] ?? 'bg-white/10 text-text-secondary'
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    in: 'In',
    out: 'Out',
    maybe: 'Maybe',
    reserve: 'Reserve',
    paid: 'Paid',
    unpaid: 'Unpaid',
    refunded: 'Refunded',
    upcoming: 'Upcoming',
    polling: 'Polling',
    teams_picked: 'Teams Set',
    completed: 'Completed',
    cancelled: 'Cancelled',
    free: 'Free',
    basic: 'Basic',
    pro: 'Pro',
  }
  return map[status] ?? status
}

export function isPollOpen(game: { poll_opens_at: string; scheduled_at: string; status: string }): boolean {
  const now = new Date()
  return new Date(game.poll_opens_at) <= now && new Date(game.scheduled_at) > now
}

export function canPickTeams(confirmedCount: number, format: number): boolean {
  return confirmedCount >= format * 2
}

// Team selection algorithm (client preview — real one runs server-side)
export interface PlayerForSelection {
  user_id: string
  ability_score: number
  preferred_position: string
  games_missed_priority: number
  payment_status: string
}

export function previewTeamSelection(
  players: PlayerForSelection[],
  tier: 'free' | 'basic' | 'pro'
): { teamA: PlayerForSelection[]; teamB: PlayerForSelection[] } {
  // Only include paid players (or free tier where payment isn't collected)
  const eligible = players.filter(p =>
    tier === 'free' ? true : p.payment_status === 'paid'
  )

  if (tier === 'free' || eligible.every(p => p.ability_score === 0)) {
    // Random assignment
    const shuffled = [...eligible].sort(() => Math.random() - 0.5)
    return {
      teamA: shuffled.filter((_, i) => i % 2 === 0),
      teamB: shuffled.filter((_, i) => i % 2 !== 0),
    }
  }

  // Sort: priority credit first, then ability score descending
  const sorted = [...eligible].sort((a, b) => {
    if (b.games_missed_priority !== a.games_missed_priority) {
      return b.games_missed_priority - a.games_missed_priority
    }
    return b.ability_score - a.ability_score
  })

  // Snake draft
  const teamA: PlayerForSelection[] = []
  const teamB: PlayerForSelection[] = []
  sorted.forEach((player, i) => {
    const round = Math.floor(i / 2)
    const isEvenRound = round % 2 === 0
    const posInRound = i % 2
    if ((isEvenRound && posInRound === 0) || (!isEvenRound && posInRound === 1)) {
      teamA.push(player)
    } else {
      teamB.push(player)
    }
  })

  return { teamA, teamB }
}
