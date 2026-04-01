'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Info } from 'lucide-react'
import { format, addDays } from 'date-fns'

interface TeamOption {
  id: string
  name: string
  format: number
  subscription_status: string
}

interface NewGameFormProps {
  teams: TeamOption[]
  defaultTeamId?: string
}

export function NewGameForm({ teams, defaultTeamId }: NewGameFormProps) {
  const router = useRouter()
  const [teamId, setTeamId] = useState(defaultTeamId ?? teams[0]?.id ?? '')
  const [date, setDate] = useState(() => {
    const d = addDays(new Date(), 7)
    return format(d, "yyyy-MM-dd'T'HH:mm")
  })
  const [costPerPlayer, setCostPerPlayer] = useState('')
  const [teamALabel, setTeamALabel] = useState('Bibs')
  const [teamBLabel, setTeamBLabel] = useState('Skins')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const selectedTeam = teams.find(t => t.id === teamId)
  const isPaid = selectedTeam?.subscription_status !== 'free'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!teamId || !date) return
    setLoading(true)

    const scheduledAt = new Date(date).toISOString()
    const pollOpensAt = new Date(new Date(date).getTime() - 72 * 60 * 60 * 1000).toISOString()

    const supabase = createClient()
    const { data: game, error } = await supabase
      .from('games')
      .insert({
        team_id: teamId,
        scheduled_at: scheduledAt,
        poll_opens_at: pollOpensAt,
        cost_per_player: isPaid ? parseFloat(costPerPlayer || '0') : 0,
        team_a_label: teamALabel,
        team_b_label: teamBLabel,
        notes: notes || null,
        status: 'upcoming',
      })
      .select()
      .single()

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success('Game scheduled!')
    router.push(`/games/${game.id}`)
    router.refresh()
  }

  if (teams.length === 0) {
    return (
      <div className="card text-center py-10">
        <p className="text-text-secondary mb-4">You need to create a team first before scheduling a game.</p>
        <a href="/teams/new" className="btn-primary">Create team</a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Team selector */}
      {teams.length > 1 && (
        <div>
          <label className="label">Team</label>
          <select
            value={teamId}
            onChange={e => setTeamId(e.target.value)}
            className="input"
            required
          >
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.format}-a-side)</option>
            ))}
          </select>
        </div>
      )}

      {teams.length === 1 && (
        <div className="p-3 rounded-xl bg-bg-elevated border border-bg-border">
          <div className="text-sm font-medium">{teams[0].name}</div>
          <div className="text-xs text-text-muted">{teams[0].format}-a-side</div>
        </div>
      )}

      {/* Date & time */}
      <div>
        <label className="label" htmlFor="datetime">Date & kick-off time</label>
        <input
          id="datetime"
          type="datetime-local"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="input"
          required
          min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
        />
        {date && (
          <p className="text-xs text-text-muted mt-1.5 flex items-center gap-1">
            <Info size={11} />
            Poll opens {format(new Date(new Date(date).getTime() - 72 * 60 * 60 * 1000), 'EEE d MMM @ HH:mm')}
          </p>
        )}
      </div>

      {/* Cost (paid plans only) */}
      {isPaid && (
        <div>
          <label className="label" htmlFor="cost">Cost per player (£)</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-sm">£</span>
            <input
              id="cost"
              type="number"
              value={costPerPlayer}
              onChange={e => setCostPerPlayer(e.target.value)}
              placeholder="0.00"
              className="input pl-7"
              min="0"
              max="50"
              step="0.50"
            />
          </div>
          <p className="text-xs text-text-muted mt-1.5">
            Players must pay this to be eligible for selection
          </p>
        </div>
      )}

      {!isPaid && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-bg-elevated border border-bg-border">
          <Info size={14} className="text-text-muted flex-shrink-0 mt-0.5" />
          <p className="text-xs text-text-secondary">
            Payment collection requires Basic (£5/mo). Teams are picked randomly on Free.
            <a href="/upgrade" className="text-brand ml-1 hover:underline">Upgrade →</a>
          </p>
        </div>
      )}

      {/* Team labels */}
      <div>
        <label className="label">Team labels</label>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={teamALabel}
            onChange={e => setTeamALabel(e.target.value)}
            placeholder="Bibs"
            className="input text-center"
            maxLength={20}
          />
          <input
            type="text"
            value={teamBLabel}
            onChange={e => setTeamBLabel(e.target.value)}
            placeholder="Skins"
            className="input text-center"
            maxLength={20}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="label" htmlFor="notes">
          Notes <span className="text-text-muted font-normal normal-case">(optional)</span>
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Parking info, what to bring, etc."
          className="input resize-none"
          rows={3}
          maxLength={500}
        />
      </div>

      <button
        type="submit"
        disabled={loading || !teamId || !date}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading ? <LoadingSpinner size="sm" /> : 'Schedule game'}
      </button>
    </form>
  )
}
