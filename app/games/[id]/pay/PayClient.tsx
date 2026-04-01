'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { formatCurrency, formatGameDate } from '@/lib/utils'
import { Loader2, CheckCircle2 } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PayClientProps {
  gameId: string
  scheduledAt: string
  costPerPlayer: number
  teamName: string
}

export function PayClient({ gameId, scheduledAt, costPerPlayer, teamName }: PayClientProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/games/${gameId}/create-payment-intent`, { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setClientSecret(data.clientSecret)
      })
      .catch(() => setError('Failed to initialise payment'))
      .finally(() => setLoading(false))
  }, [gameId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-brand" size={28} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="card text-center py-12">
        <p className="text-red-400 mb-2 font-medium">{error}</p>
        <a href={`/games/${gameId}`} className="text-sm text-text-secondary hover:text-brand">
          ← Back to game
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="card mb-6">
        <div className="text-xs text-text-muted mb-1">{teamName}</div>
        <div className="font-medium">{formatGameDate(scheduledAt)}</div>
        <div className="text-2xl font-display tracking-wide mt-2 text-brand">
          {formatCurrency(costPerPlayer)}
        </div>
      </div>

      {clientSecret && (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'night',
              variables: {
                colorPrimary: '#B8FF3C',
                colorBackground: '#13131F',
                colorText: '#E8E8F0',
                colorDanger: '#f87171',
                fontFamily: 'Inter, system-ui, sans-serif',
                borderRadius: '12px',
              },
            },
          }}
        >
          <CheckoutForm gameId={gameId} />
        </Elements>
      )}
    </div>
  )
}

function CheckoutForm({ gameId }: { gameId: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [succeeded, setSucceeded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setSubmitting(true)
    setError(null)

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message ?? 'Something went wrong')
      setSubmitting(false)
      return
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/games/${gameId}?paid=1`,
      },
      redirect: 'if_required',
    })

    if (confirmError) {
      setError(confirmError.message ?? 'Payment failed')
      setSubmitting(false)
    } else {
      setSucceeded(true)
      setTimeout(() => router.push(`/games/${gameId}?paid=1`), 1500)
    }
  }

  if (succeeded) {
    return (
      <div className="card text-center py-12">
        <CheckCircle2 className="mx-auto text-brand mb-3" size={40} />
        <div className="font-semibold text-lg mb-1">Payment confirmed!</div>
        <div className="text-text-muted text-sm">Redirecting you back…</div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="card">
        <PaymentElement />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {submitting ? <><Loader2 size={16} className="animate-spin" /> Processing…</> : 'Pay now'}
      </button>
      <a
        href={`/games/${gameId}`}
        className="block text-center text-sm text-text-muted hover:text-text-secondary"
      >
        Cancel
      </a>
    </form>
  )
}
