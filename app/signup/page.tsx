'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { ArrowRight, Mail, ArrowLeft } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { AuthBackdrop } from '@/components/auth/AuthBackdrop'
import { CursorGlow } from '@/components/home/CursorGlow'
import { formatOAuthError } from '@/lib/auth-errors'
import { oauthGoogleEnabled } from '@/lib/oauth-flags'

const oauthBtn =
  'flex w-full min-h-[48px] items-center justify-center gap-3 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-sm font-medium text-text-primary transition-colors hover:border-white/[0.18] hover:bg-white/[0.07] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50'

function SignupForm() {
  const searchParams = useSearchParams()
  const inviteCode = searchParams.get('invite')

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)

  const supabase = createClient()
  const redirectTo = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/callback?next=/dashboard${inviteCode ? `&invite=${inviteCode}` : ''}`

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !name) return

    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        data: { full_name: name },
        emailRedirectTo: redirectTo,
      },
    })

    if (error) {
      toast.error(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  async function handleGoogle() {
    setOauthLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    if (error) {
      toast.error(formatOAuthError(error))
      setOauthLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center animate-fade-in">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-brand/25 bg-brand/10">
          <Mail className="text-brand" size={28} />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-text-primary">Confirm your email</h2>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          We sent a link to <span className="font-medium text-text-primary">{email}</span>. Open it on this device to
          finish setup — it only takes a second.
        </p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
          {inviteCode ? 'Team invite' : 'Create account'}
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-wide text-text-primary sm:text-[2.75rem]">
          {inviteCode ? "You're almost in" : 'Start your squad'}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          {inviteCode
            ? 'Create your account to join the team you were invited to.'
            : '6 months free on Starter (ad-supported), then £2.99/mo. No card needed today.'}
        </p>
      </div>

      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand">Sign up with email</p>
      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="label" htmlFor="name">
            Your name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Morgan"
            className="input min-h-[48px] border-white/[0.08] bg-white/[0.03]"
            required
            autoComplete="name"
          />
        </div>
        <div>
          <label className="label" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input min-h-[48px] border-white/[0.08] bg-white/[0.03]"
            required
            autoComplete="email"
            inputMode="email"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !email || !name}
          className="btn-primary flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold"
        >
          {loading ? <LoadingSpinner size="sm" /> : (
            <>
              Send sign-up link
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      {oauthGoogleEnabled && (
        <>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.08]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-bg-elevated/80 px-3 text-xs font-medium text-text-muted backdrop-blur-sm">
                or continue with
              </span>
            </div>
          </div>

          <button type="button" onClick={handleGoogle} disabled={oauthLoading} className={oauthBtn}>
            {oauthLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continue with Google
          </button>
        </>
      )}

      <p className="mt-8 text-center text-xs text-text-muted">
        Already registered?{' '}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Sign in
        </Link>
      </p>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-text-muted">
        By continuing you agree to our{' '}
        <Link href="/terms" className="underline hover:text-text-secondary">
          Terms
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline hover:text-text-secondary">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  )
}

export default function SignupPage() {
  return (
    <div className="landing-root relative min-h-dvh bg-bg text-text-primary">
      <CursorGlow />
      <AuthBackdrop />

      <Link
        href="/"
        className="absolute left-4 top-4 z-20 inline-flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-full px-3 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary sm:left-6 sm:top-6"
      >
        <ArrowLeft size={18} className="shrink-0" />
        <span className="hidden sm:inline">Home</span>
      </Link>

      <div className="relative z-10 flex min-h-dvh flex-col justify-center px-4 py-10 pt-20 sm:px-6">
        <div className="mx-auto w-full max-w-[440px] rounded-2xl border border-white/[0.1] bg-bg-elevated/[0.65] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-9">
          <Suspense fallback={<LoadingSpinner className="mx-auto" size="md" />}>
            <SignupForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
