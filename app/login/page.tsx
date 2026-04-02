'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Mail, ArrowRight, ArrowLeft, Shield, Zap, Users } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { AuthBackdrop } from '@/components/auth/AuthBackdrop'
import { CursorGlow } from '@/components/home/CursorGlow'
import { formatOAuthError } from '@/lib/auth-errors'

const oauthBtn =
  'flex w-full min-h-[48px] items-center justify-center gap-3 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-sm font-medium text-text-primary transition-colors hover:border-white/[0.18] hover:bg-white/[0.07] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50'

function LoginForm() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null)

  const supabase = createClient()

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${redirectTo}`,
      },
    })

    if (error) {
      toast.error(error.message)
    } else {
      setMagicLinkSent(true)
    }
    setLoading(false)
  }

  async function handleOAuth(provider: 'google' | 'apple') {
    setOauthLoading(provider)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${redirectTo}`,
      },
    })
    if (error) {
      toast.error(formatOAuthError(error))
      setOauthLoading(null)
    }
  }

  if (magicLinkSent) {
    return (
      <div className="text-center animate-fade-in">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-brand/25 bg-brand/10">
          <Mail className="text-brand" size={28} />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-text-primary">Check your email</h2>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          We sent a secure sign-in link to{' '}
          <span className="font-medium text-text-primary">{email}</span>. Tap the link on this device to continue.
        </p>
        <p className="mt-6 text-xs text-text-muted">
          Wrong address?{' '}
          <button type="button" onClick={() => setMagicLinkSent(false)} className="font-medium text-brand hover:underline">
            Go back
          </button>
        </p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Sign in</p>
        <h1 className="mt-2 font-display text-4xl tracking-wide text-text-primary sm:text-[2.75rem]">
          Back to your squad
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          Use the same email as before — we&apos;ll email you a one-tap link. No password to remember.
        </p>
      </div>

      <div className="mb-6 space-y-3">
        <button type="button" onClick={() => handleOAuth('google')} disabled={!!oauthLoading} className={oauthBtn}>
          {oauthLoading === 'google' ? (
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

        <button type="button" onClick={() => handleOAuth('apple')} disabled={!!oauthLoading} className={oauthBtn}>
          {oauthLoading === 'apple' ? (
            <LoadingSpinner size="sm" />
          ) : (
            <svg className="h-[18px] w-[18px] shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
            </svg>
          )}
          Continue with Apple
        </button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/[0.08]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-bg-elevated/80 px-3 text-xs font-medium text-text-muted backdrop-blur-sm">
            or email link
          </span>
        </div>
      </div>

      <form onSubmit={handleMagicLink} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">
            Work or personal email
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
          disabled={loading || !email}
          className="btn-primary flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold"
        >
          {loading ? <LoadingSpinner size="sm" /> : (
            <>
              Email me a link
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-xs text-text-muted">
        New here?{' '}
        <Link href="/signup" className="font-semibold text-brand hover:underline">
          Create a free account
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
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

      <div className="relative z-10 flex min-h-dvh flex-col lg:flex-row">
        <aside className="relative hidden flex-col justify-between border-r border-white/[0.06] bg-bg/20 p-12 backdrop-blur-[2px] lg:flex lg:w-[46%] xl:p-16">
          <div>
            <span className="font-display text-3xl tracking-[0.25em] text-brand">SQUAD</span>
            <p className="mt-8 max-w-sm text-lg leading-relaxed text-text-secondary">
              The hub organisers use for polls, subs, and fair teams — so the group chat stays for banter, not admin.
            </p>
          </div>
          <ul className="space-y-5 text-sm text-text-secondary">
            <li className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
                <Zap className="h-5 w-5 text-brand" />
              </span>
              <span>
                <span className="font-semibold text-text-primary">Magic-link sign-in</span>
                <br />
                Bank-grade auth without another password.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
                <Users className="h-5 w-5 text-brand" />
              </span>
              <span>
                <span className="font-semibold text-text-primary">Built for 5–7-a-side</span>
                <br />
                One link for your whole squad — works on any phone.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
                <Shield className="h-5 w-5 text-brand" />
              </span>
              <span>
                <span className="font-semibold text-text-primary">Payments-ready</span>
                <br />
                Stripe when you upgrade — we never store card details.
              </span>
            </li>
          </ul>
          <p className="text-xs text-text-muted">UK · GDPR-conscious · Encrypted sessions</p>
        </aside>

        <div className="flex flex-1 flex-col justify-center px-4 py-10 pt-20 sm:px-6 lg:px-12 lg:py-12 lg:pt-12">
          <div className="mx-auto w-full max-w-[440px] rounded-2xl border border-white/[0.1] bg-bg-elevated/[0.65] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-9">
            <div className="mb-2 font-display text-2xl tracking-[0.2em] text-brand lg:hidden">SQUAD</div>
            <Suspense fallback={<LoadingSpinner className="mx-auto" />}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
