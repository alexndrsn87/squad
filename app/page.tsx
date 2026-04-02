import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SQUAD — The smarter way to run your 5-a-side',
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg text-text-primary font-body">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <span className="font-display text-3xl tracking-widest text-brand">SQUAD</span>
        <div className="flex items-center gap-3">
          <span className="text-xl leading-none select-none" title="Deploy pipeline check" aria-hidden>
            🍌
          </span>
          <Link href="/login" className="btn-ghost text-sm">Sign in</Link>
          <Link href="/signup" className="btn-primary text-sm">Start free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 md:py-32 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-medium mb-6">
          ⚽ Built for 5, 6 & 7-a-side
        </div>
        <h1 className="font-display text-6xl md:text-8xl tracking-wide leading-none mb-6">
          RUN YOUR<br />
          <span className="text-brand">SQUAD</span><br />
          PROPERLY.
        </h1>
        <p className="text-text-secondary text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
          Availability polling. Automatic payment collection. Balanced teams based on actual performance. No more chasing.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/signup" className="btn-primary text-base px-8 py-3">
            Start free — 1 team, no card needed
          </Link>
          <Link href="#how-it-works" className="btn-secondary text-base px-6 py-3">
            See how it works
          </Link>
        </div>
        <p className="text-text-muted text-xs mt-6">Basic from £5/team/month · Cancel any time</p>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 py-20 bg-bg-card border-y border-bg-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl tracking-wide text-center mb-12">
            HOW IT <span className="text-brand">WORKS</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Create your team', body: 'Set up your squad in 60 seconds. Share an invite link and players join themselves.' },
              { step: '02', title: 'Schedule a game', body: 'Pick a date and cost. SQUAD opens the availability poll automatically 72h before.' },
              { step: '03', title: 'Players respond & pay', body: 'Everyone marks in/out and pays online. No chasing. Paid players go first.' },
              { step: '04', title: 'Teams picked for you', body: 'SQUAD balances the teams using performance data. You just turn up and play.' },
            ].map(({ step, title, body }) => (
              <div key={step} className="text-center">
                <div className="font-display text-5xl text-brand/30 mb-3">{step}</div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <h2 className="font-display text-4xl md:text-5xl tracking-wide text-center mb-12">
          EVERYTHING YOU <span className="text-brand">NEED</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: '📅', title: 'Availability polling', body: 'Auto-opens 72h before. Players tap in/out from their phone.' },
            { icon: '💳', title: 'Payment collection', body: 'Stripe-powered. Apple Pay, Google Pay. Paid players get selection priority.' },
            { icon: '⚖️', title: 'Balanced teams', body: 'Our algorithm uses weighted performance scores. No more lopsided games.' },
            { icon: '🏆', title: 'MOTM voting', body: 'Players vote after each game. Winners shown. Scores kept invisible.' },
            { icon: '💰', title: 'Group kitty', body: 'Everyone tops up. Cover venue fees and kit purchases together.' },
            { icon: '🔄', title: 'Priority rotation', body: "Pay but don't get a spot? You get a credit and go first next week." },
            { icon: '📱', title: 'Works on any device', body: 'Mobile-first. No app download required. Share a link, done.' },
            { icon: '👕', title: 'Kit shop', body: 'Buy balls, bibs, gloves. Pay from the kitty. Delivered to you.' },
            { icon: '🔔', title: 'Smart notifications', body: 'Reminders, team reveals, rating prompts. Sent at the right time.' },
          ].map(({ icon, title, body }) => (
            <div key={title} className="card hover:border-brand/20 transition-colors">
              <div className="text-2xl mb-3">{icon}</div>
              <h3 className="font-semibold text-sm mb-1.5">{title}</h3>
              <p className="text-text-secondary text-xs leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-20 bg-bg-card border-y border-bg-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl tracking-wide text-center mb-4">
            PRICING
          </h2>
          <p className="text-text-secondary text-center mb-12">Charge your players. Recover the cost. SQUAD runs itself.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                name: 'Free', price: '£0', per: '', highlight: false,
                features: ['1 team · up to 15 players', 'Availability polling', 'Random team selection', 'MOTM voting', 'Email notifications'],
                cta: 'Start free',
              },
              {
                name: 'Basic', price: '£5', per: '/team/mo', highlight: false,
                features: ['Unlimited teams', 'Payment collection', 'Paid-first selection', 'Group kitty', 'Chip-in for kit', 'Position-aware balancing', 'No ads'],
                cta: 'Start Basic',
              },
              {
                name: 'Pro', price: '£7', per: '/team/mo', highlight: true,
                features: ['Everything in Basic', 'AI-weighted algorithm', 'Form + ability scoring', 'Balance confidence score', 'Advanced auto-generation', 'Priority support'],
                cta: 'Start Pro',
              },
            ].map(({ name, price, per, highlight, features, cta }) => (
              <div
                key={name}
                className={`rounded-2xl border p-6 flex flex-col ${
                  highlight
                    ? 'border-brand bg-brand/5 glow'
                    : 'border-bg-border bg-bg-elevated'
                }`}
              >
                {highlight && (
                  <div className="text-center mb-3">
                    <span className="badge bg-brand/20 text-brand text-xs">Most popular</span>
                  </div>
                )}
                <div className="font-semibold mb-1">{name}</div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="font-display text-4xl tracking-wide">{price}</span>
                  <span className="text-text-muted text-sm">{per}</span>
                </div>
                <ul className="space-y-2 flex-1 mb-6">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="text-brand mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={highlight ? 'btn-primary text-center' : 'btn-secondary text-center'}
                >
                  {cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 border-t border-bg-border">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-text-muted text-xs">
          <span className="font-display text-xl tracking-widest text-brand">SQUAD</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-text-secondary">Privacy</Link>
            <Link href="/terms" className="hover:text-text-secondary">Terms</Link>
            <a href="mailto:hello@squadapp.co.uk" className="hover:text-text-secondary">Contact</a>
          </div>
          <span>© {new Date().getFullYear()} SQUAD. Made in 🇬🇧</span>
        </div>
      </footer>
    </div>
  )
}
