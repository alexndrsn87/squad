'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Star, Loader2, CheckCircle2 } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'

interface Ratee {
  userId: string
  name: string
  nickname: string | null
  avatarUrl: string | null
}

interface RateClientProps {
  gameId: string
  ratees: Ratee[]
  alreadyRated: boolean
}

export function RateClient({ gameId, ratees, alreadyRated }: RateClientProps) {
  const router = useRouter()
  const [scores, setScores] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(alreadyRated)

  function setScore(userId: string, score: number) {
    setScores(prev => ({ ...prev, [userId]: score }))
  }

  const allRated = ratees.length > 0 && ratees.every(r => scores[r.userId] !== undefined)

  async function submit() {
    setSubmitting(true)
    const ratings = ratees.map(r => ({ ratee_id: r.userId, score: scores[r.userId] }))
    const res = await fetch(`/api/games/${gameId}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ratings }),
    })
    setSubmitting(false)
    if (res.ok) {
      setDone(true)
      toast.success('Ratings submitted!')
    } else {
      const d = await res.json()
      toast.error(d.error ?? 'Failed to submit')
    }
  }

  if (done) {
    return (
      <div className="card text-center py-16">
        <CheckCircle2 className="mx-auto text-brand mb-3" size={40} />
        <div className="font-semibold text-lg mb-1">Ratings submitted!</div>
        <div className="text-text-muted text-sm mb-5">
          Your ratings are anonymous and help balance future team selections.
        </div>
        <button onClick={() => router.push(`/games/${gameId}`)} className="btn-primary">
          Back to game
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-text-muted text-sm mb-4">
        Rate each player out of 10. Ratings are completely anonymous — players will never see individual scores.
      </p>

      {ratees.map(ratee => {
        const currentScore = scores[ratee.userId]
        const displayName = ratee.nickname ?? ratee.name
        return (
          <div key={ratee.userId} className="card">
            <div className="flex items-center gap-3 mb-3">
              <Avatar src={ratee.avatarUrl} name={ratee.name} size="sm" />
              <div className="font-medium">{displayName}</div>
              {currentScore !== undefined && (
                <div className="ml-auto text-brand font-display text-xl tracking-wide">
                  {currentScore}
                </div>
              )}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <button
                  key={n}
                  onClick={() => setScore(ratee.userId, n)}
                  className={cn(
                    'w-9 h-9 rounded-lg text-sm font-medium transition-all border',
                    currentScore === n
                      ? 'bg-brand text-bg border-brand font-bold'
                      : 'border-bg-border text-text-secondary hover:border-brand/50 hover:text-brand'
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )
      })}

      <div className="pt-2">
        <button
          onClick={submit}
          disabled={!allRated || submitting}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {submitting
            ? <><Loader2 size={15} className="animate-spin" /> Submitting…</>
            : allRated ? 'Submit ratings' : `Rate all ${ratees.length} players to continue`
          }
        </button>
      </div>
    </div>
  )
}
