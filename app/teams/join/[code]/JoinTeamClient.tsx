'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Users, MapPin, AlertCircle } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface Invite {
  id: string
  code: string
  expires_at: string
  teams: {
    id: string
    name: string
    format: number
    venue: string | null
    owner_id: string
    users: { name: string }
    team_members: { count: number }[]
  }
}

interface JoinTeamClientProps {
  invite: Invite | null
  code: string
  userId: string | null
}

const POSITIONS = [
  { value: 'goalkeeper', label: '🧤 Goalkeeper' },
  { value: 'defensive', label: '🛡️ Defensive' },
  { value: 'midfield', label: '⚡ Midfield' },
  { value: 'attacking', label: '🔥 Attacking' },
]

export function JoinTeamClient({ invite, code, userId }: JoinTeamClientProps) {
  const router = useRouter()
  const [position, setPosition] = useState('midfield')
  const [joining, setJoining] = useState(false)

  if (!invite) {
    return (
      <div className="card text-center">
        <AlertCircle className="mx-auto text-red-400 mb-3" size={28} />
        <h2 className="font-semibold mb-1">Invite not found</h2>
        <p className="text-text-secondary text-sm">This link may have expired or already been used.</p>
      </div>
    )
  }

  const team = invite.teams
  const memberCount = (team.team_members as unknown as { count: number }[])?.[0]?.count ?? 0
  const ownerName = team.users?.name ?? 'The organiser'

  if (!userId) {
    return (
      <div>
        <div className="card mb-6">
          <div className="text-center mb-4">
            <div className="text-2xl mb-2">⚽</div>
            <h2 className="font-display text-2xl tracking-wide">{team.name}</h2>
            <p className="text-text-muted text-sm mt-1">
              Invited by {ownerName} · {team.format}-a-side
              {team.venue ? ` · ${team.venue}` : ''}
            </p>
            <p className="text-text-muted text-xs mt-1">{memberCount} players</p>
          </div>
        </div>
        <p className="text-text-secondary text-sm text-center mb-4">
          Create a free account to join
        </p>
        <Link
          href={`/signup?invite=${code}`}
          className="btn-primary w-full text-center block"
        >
          Create account & join
        </Link>
        <p className="text-center text-xs text-text-muted mt-3">
          Already have an account?{' '}
          <Link href={`/login?redirectTo=/teams/join/${code}`} className="text-brand hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    )
  }

  async function handleJoin() {
    if (!invite || !userId) return
    setJoining(true)

    const supabase = createClient()

    // Check not already a member
    const { data: existing } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', team.id)
      .eq('user_id', userId)
      .single()

    if (existing) {
      toast('You&apos;re already in this team!')
      router.push(`/teams/${team.id}`)
      return
    }

    const { error } = await supabase.from('team_members').insert({
      team_id: team.id,
      user_id: userId,
      preferred_position: position,
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(`Joined ${team.name}! 🎉`)
      router.push(`/teams/${team.id}`)
    }
    setJoining(false)
  }

  return (
    <div>
      <div className="card mb-6">
        <div className="text-center mb-5">
          <div className="text-3xl mb-3">⚽</div>
          <h2 className="font-display text-2xl tracking-wide">{team.name}</h2>
          <p className="text-text-muted text-sm mt-1">
            {ownerName} · {team.format}-a-side
            {team.venue ? ` · ${team.venue}` : ''}
          </p>
          <div className="flex items-center justify-center gap-1 mt-1.5 text-xs text-text-muted">
            <Users size={11} />
            <span>{memberCount} players</span>
          </div>
        </div>

        <div>
          <label className="label">Your preferred position</label>
          <div className="grid grid-cols-2 gap-2">
            {POSITIONS.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPosition(p.value)}
                className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all text-left ${
                  position === p.value
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-bg-border bg-bg-elevated text-text-secondary hover:border-text-secondary'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleJoin}
        disabled={joining}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {joining ? <LoadingSpinner size="sm" /> : `Join ${team.name}`}
      </button>
    </div>
  )
}
