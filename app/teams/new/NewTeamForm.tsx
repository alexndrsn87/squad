'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { AlertCircle } from 'lucide-react'

const FORMATS = [
  { value: 5, label: '5-a-side', desc: '10 players total' },
  { value: 6, label: '6-a-side', desc: '12 players total' },
  { value: 7, label: '7-a-side', desc: '14 players total' },
]

interface NewTeamFormProps {
  userId: string
  existingTeamCount: number
}

export function NewTeamForm({ userId, existingTeamCount }: NewTeamFormProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [format, setFormat] = useState<5 | 6 | 7>(5)
  const [venue, setVenue] = useState('')
  const [loading, setLoading] = useState(false)

  const atFreeLimit = existingTeamCount >= 1
  // (In future this will check subscription status)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name) return
    setLoading(true)

    const supabase = createClient()
    const { data: team, error } = await supabase
      .from('teams')
      .insert({
        name,
        owner_id: userId,
        format,
        venue: venue || null,
        subscription_status: 'free',
      })
      .select()
      .single()

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    const { error: memberError } = await supabase.from('team_members').insert({
      team_id: team.id,
      user_id: userId,
      preferred_position: 'midfield',
    })

    if (memberError) {
      toast.error(memberError.message)
      setLoading(false)
      return
    }

    toast.success(`${name} created!`)
    router.push(`/teams/${team.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {atFreeLimit && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-400/5 border border-yellow-400/20">
          <AlertCircle className="text-yellow-400 flex-shrink-0 mt-0.5" size={16} />
          <div className="text-sm">
            <div className="text-yellow-400 font-medium mb-0.5">Free plan: 1 team limit</div>
            <div className="text-text-secondary">
              You already have a team. Upgrade to Basic (£5/mo) for unlimited teams.
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="label" htmlFor="name">Team name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Friday Night Fives"
          className="input"
          required
          maxLength={50}
          disabled={atFreeLimit}
        />
      </div>

      <div>
        <label className="label">Format</label>
        <div className="grid grid-cols-3 gap-3">
          {FORMATS.map(f => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFormat(f.value as 5 | 6 | 7)}
              disabled={atFreeLimit}
              className={`p-3 rounded-xl border text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                format === f.value
                  ? 'border-brand bg-brand/10 text-brand'
                  : 'border-bg-border bg-bg-elevated text-text-secondary hover:border-text-secondary'
              }`}
            >
              <div className="font-semibold text-sm">{f.label}</div>
              <div className="text-xs opacity-70 mt-0.5">{f.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="venue">Venue <span className="text-text-muted font-normal normal-case">(optional)</span></label>
        <input
          id="venue"
          type="text"
          value={venue}
          onChange={e => setVenue(e.target.value)}
          placeholder="Goals Wembley, Astro Park..."
          className="input"
          maxLength={100}
          disabled={atFreeLimit}
        />
      </div>

      <button
        type="submit"
        disabled={loading || !name || atFreeLimit}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading ? <LoadingSpinner size="sm" /> : 'Create team'}
      </button>
    </form>
  )
}
