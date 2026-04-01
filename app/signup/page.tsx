'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { ArrowRight, Mail } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

function SignupForm() {
  const searchParams = useSearchParams()
  const inviteCode = searchParams.get('invite')

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null)

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

  async function handleOAuth(provider: 'google' | 'apple') {
    setOauthLoading(provider)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    })
    if (error) {
      toast.error(error.message)
      setOauthLoading(null)
    }
  }

  if (sent) {
    return (
      <div className="text-center animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto mb-5">
          <Mail className="text-brand" size={24} />
        </div>
        <h2 className="text-xl font-semibold mb-2">Check your inbox</h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          We sent a link to <span className="text-text-primary font-medium">{email}</span>.
          <br />Click it to finish creating your account.
        </p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-4xl tracking-wide mb-1">
          {inviteCode ? "You've been invited" : 'Join SQUAD'}
        </h1>
        <p className="text-text-secondary text-sm">
          {inviteCode
            ? 'Create your account to join the team'
            : 'Run your 5-a-side properly. Free to start.'}
        </p>
      </div>

      {/* OAuth */}
      <div className="space-y-3 mb-6">
        <button
          onClick={() => handleOAuth('google')}
          disabled={!!oauthLoading}
          className="w-full flex items-center justify-center gap-3 bg-bg-elevated border border-bg-border
                     rounded-lg px-4 py-3 text-sm font-medium hover:border-text-secondary
                     transition-colors disabled:opacity-50"
        >
          {oauthLoading === 'google' ? <LoadingSpinner size="sm" /> : (
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          Continue with Google
        </button>

        <button
          onClick={() => handleOAuth('apple')}
          disabled={!!oauthLoading}
          className="w-full flex items-center justify-center gap-3 bg-bg-elevated border border-bg-border
                     rounded-lg px-4 py-3 text-sm font-medium hover:border-text-secondary
                     transition-colors disabled:opacity-50"
        >
          {oauthLoading === 'apple' ? <LoadingSpinner size="sm" /> : (
            <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
            </svg>
          )}
          Continue with Apple
        </button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-bg-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 bg-bg-card text-text-muted text-xs">or sign up with email</span>
        </div>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="label" htmlFor="name">Your name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Marcus Kane"
            className="input"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input"
            required
            autoComplete="email"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !email || !name}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? <LoadingSpinner size="sm" /> : (
            <>Create account <ArrowRight size={16} /></>
          )}
        </button>
      </form>

      <p className="text-center text-text-muted text-xs mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-brand hover:underline">Sign in</Link>
      </p>

      <p className="text-center text-text-muted text-xs mt-3">
        By signing up you agree to our{' '}
        <Link href="/terms" className="hover:text-text-secondary">Terms</Link>
        {' '}and{' '}
        <Link href="/privacy" className="hover:text-text-secondary">Privacy Policy</Link>
      </p>
    </div>
  )
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg">
      <div className="w-full max-w-sm">
        <div className="font-display text-3xl tracking-widest text-brand mb-8">SQUAD</div>
        <Suspense>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  )
}
