'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Team } from '@/types/database'

interface UpgradeClientProps {
  teams: Team[]
}

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 5,
    tag: 'Most popular',
    features: [
      'Unlimited teams',
      'Unlimited players',
      'In-game payments',
      'Paid-first selection',
      'Team kitty',
      'Chip-in expenses',
      'Position balancing',
      'No banner ads',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 7,
    tag: 'Best results',
    features: [
      'Everything in Basic',
      'AI-weighted team algorithm',
      'Form score (last 5 games)',
      'Balance confidence score',
      'Priority in future builds',
    ],
  },
]

export function UpgradeClient({ teams }: UpgradeClientProps) {
  const router = useRouter()
  const [selectedTeam, setSelectedTeam] = useState<string>(teams[0]?.id ?? '')
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro'>('basic')
  const [loading, setLoading] = useState(false)

  const team = teams.find(t => t.id === selectedTeam)
  const alreadyOnPlan = team?.subscription_status === selectedPlan
  const alreadyPro = team?.subscription_status === 'pro'

  async function subscribe() {
    if (!selectedTeam) return
    setLoading(true)
    const res = await fetch('/api/billing/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team_id: selectedTeam, plan: selectedPlan }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.url) {
      window.location.href = data.url
    } else {
      toast.error(data.error ?? 'Failed to start checkout')
    }
  }

  return (
    <div className="space-y-8">
      {/* Team selector */}
      {teams.length > 1 && (
        <div>
          <label className="label mb-2 block">Which team?</label>
          <div className="grid grid-cols-1 gap-2">
            {teams.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTeam(t.id)}
                className={cn(
                  'flex items-center justify-between p-3 rounded-xl border text-sm transition-all text-left',
                  selectedTeam === t.id
                    ? 'border-brand bg-brand/5'
                    : 'border-bg-border hover:border-text-secondary'
                )}
              >
                <span className="font-medium">{t.name}</span>
                <span className="text-xs text-text-muted capitalize">{t.subscription_status}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PLANS.map(plan => {
          const current = team?.subscription_status === plan.id
          const selected = selectedPlan === plan.id
          return (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id as 'basic' | 'pro')}
              className={cn(
                'relative text-left p-5 rounded-2xl border transition-all',
                selected
                  ? 'border-brand bg-brand/5'
                  : 'border-bg-border hover:border-text-secondary'
              )}
            >
              {plan.tag && (
                <div className="absolute -top-3 left-4">
                  <span className="bg-brand text-bg text-xs font-bold px-3 py-1 rounded-full">
                    {plan.tag}
                  </span>
                </div>
              )}
              {current && (
                <div className="absolute top-3 right-3">
                  <span className="bg-bg-elevated border border-bg-border text-xs text-text-muted px-2 py-0.5 rounded-full">
                    Current plan
                  </span>
                </div>
              )}
              <div className="font-display text-2xl tracking-wide mb-0.5">{plan.name}</div>
              <div className="mb-4">
                <span className="text-3xl font-bold">£{plan.price}</span>
                <span className="text-text-muted text-sm">/team/mo</span>
              </div>
              <ul className="space-y-2">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                    <Check size={14} className="text-brand mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          )
        })}
      </div>

      {/* CTA */}
      <button
        onClick={subscribe}
        disabled={loading || alreadyOnPlan || !selectedTeam}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading
          ? <><Loader2 size={15} className="animate-spin" /> Redirecting to checkout…</>
          : alreadyOnPlan
          ? `Already on ${selectedPlan} plan`
          : `Upgrade to ${selectedPlan === 'basic' ? 'Basic' : 'Pro'} – £${selectedPlan === 'basic' ? 5 : 7}/mo`
        }
      </button>

      <p className="text-xs text-text-muted text-center">
        Cancel any time. Billed monthly. Prices per team.
      </p>
    </div>
  )
}
