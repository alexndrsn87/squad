'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

function useScrolled() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return scrolled
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const fn = () => setReduced(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])
  return reduced
}

function TiltSurface({
  children,
  className,
  reducedMotion = false,
}: {
  children: React.ReactNode
  className?: string
  reducedMotion?: boolean
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const raf = useRef<number | undefined>(undefined)

  const onMove = useCallback(
    (e: React.MouseEvent) => {
      if (reducedMotion) return
      const el = wrapRef.current
      if (!el) return
      if (raf.current) cancelAnimationFrame(raf.current)
      raf.current = requestAnimationFrame(() => {
        const inner = el.querySelector('[data-tilt-inner]') as HTMLElement | null
        if (!inner) return
        const r = el.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width - 0.5
        const py = (e.clientY - r.top) / r.height - 0.5
        inner.style.transform = `perspective(1400px) rotateX(${py * -12}deg) rotateY(${px * 12}deg) scale3d(1.01,1.01,1.01)`
      })
    },
    [reducedMotion]
  )

  const onLeave = useCallback(() => {
    const el = wrapRef.current
    if (!el) return
    const inner = el.querySelector('[data-tilt-inner]') as HTMLElement | null
    if (inner) inner.style.transform = 'perspective(1400px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)'
  }, [])

  return (
    <div
      ref={wrapRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn(className)}
    >
      <div
        data-tilt-inner
        className="h-full transition-transform duration-200 ease-out will-change-transform [transform-style:preserve-3d]"
        style={{ transform: 'perspective(1400px) rotateX(0deg) rotateY(0deg)' }}
      >
        {children}
      </div>
    </div>
  )
}

function AmbientLayers() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-b from-pitch-deep via-bg to-bg" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_-10%,rgba(184,255,60,0.14),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_90%_60%,rgba(20,61,40,0.45),transparent)] animate-float" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_45%_35%_at_10%_70%,rgba(184,255,60,0.06),transparent)] animate-float-delayed" />
      <div className="landing-pitch-grid absolute inset-0 animate-grid-pulse opacity-90" />
      <div className="landing-vignette absolute inset-0" />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  )
}

const navLinks = [
  { href: '#flow', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
]

const flowSteps = [
  {
    step: '01',
    title: 'Create your team',
    body: 'Name your squad, pick 5/6/7-a-side, share one invite link. Players join in seconds.',
  },
  {
    step: '02',
    title: 'Schedule & poll',
    body: 'Set kickoff and pitch fee. Availability opens automatically 72 hours before.',
  },
  {
    step: '03',
    title: 'Pay & confirm',
    body: 'In, out, or maybe from any phone. Paid players get priority when spots are tight.',
  },
  {
    step: '04',
    title: 'Balanced sides',
    body: 'Teams are generated fairly from form and feedback — no more walkover Wednesdays.',
  },
]

const features = [
  {
    icon: '📅',
    title: 'Smart availability',
    body: 'One tap in/out. Reminders land when people actually check their phones.',
    grid: 'md:col-start-1 md:row-start-1',
  },
  {
    icon: '⚖️',
    title: 'Fair lineups',
    body: 'Position prefs + hidden skill weighting keep games competitive without the ego leaderboard.',
    large: true,
    grid: 'md:col-start-2 md:row-span-2 md:col-span-2 md:row-start-1',
  },
  {
    icon: '💳',
    title: 'Payments built in',
    body: 'Stripe, Apple Pay, Google Pay. Kitty for kit and subs — less “who owes what”.',
    grid: 'md:col-start-1 md:row-start-2',
  },
  {
    icon: '🏆',
    title: 'MOTM & ratings',
    body: 'Quick votes after the whistle. Wins the banter, feeds the balancer.',
    grid: 'md:col-start-1 md:row-start-3',
  },
  {
    icon: '📱',
    title: 'No app required',
    body: 'Works in the browser. Your squad already lives on WhatsApp — SQUAD handles the boring bits.',
    grid: 'md:col-start-2 md:col-span-2 md:row-start-3',
  },
]

const pricing = [
  {
    name: 'Free',
    price: '£0',
    per: '',
    highlight: false,
    features: [
      '1 team · up to 15 players',
      'Availability polling',
      'Random team selection',
      'MOTM voting',
      'Email notifications',
    ],
    cta: 'Start free',
  },
  {
    name: 'Basic',
    price: '£5',
    per: '/team/mo',
    highlight: false,
    features: [
      'Unlimited teams',
      'Payment collection',
      'Paid-first selection',
      'Group kitty & chip-ins',
      'Position-aware balancing',
    ],
    cta: 'Start Basic',
  },
  {
    name: 'Pro',
    price: '£7',
    per: '/team/mo',
    highlight: true,
    features: [
      'Everything in Basic',
      'Weighted algorithm & form',
      'Balance confidence',
      'Advanced auto lineups',
      'Priority support',
    ],
    cta: 'Start Pro',
  },
]

export default function LandingExperience() {
  const scrolled = useScrolled()
  const reducedMotion = useReducedMotion()

  return (
    <div className="landing-root relative min-h-screen overflow-x-hidden bg-bg text-text-primary antialiased">
      <AmbientLayers />

      <header
        className={cn(
          'fixed left-0 right-0 top-0 z-50 transition-all duration-300',
          scrolled
            ? 'border-b border-white/[0.06] bg-bg/75 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent py-5'
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 md:px-6">
          <Link
            href="/"
            className="font-display text-2xl tracking-[0.2em] text-brand transition-transform hover:scale-[1.02] md:text-3xl"
          >
            SQUAD
          </Link>

          <nav
            className="flex max-w-[42vw] items-center gap-0.5 overflow-x-auto md:max-w-none md:gap-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Page sections"
          >
            {navLinks.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="shrink-0 rounded-full px-2.5 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-white/[0.04] hover:text-text-primary md:px-3 md:text-sm"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost hidden text-sm sm:inline-flex">
              Sign in
            </Link>
            <Link href="/signup" className="btn-primary text-sm shadow-[0_0_24px_rgba(184,255,60,0.2)]">
              Start free
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative px-5 pb-16 pt-28 md:px-6 md:pb-24 md:pt-32">
          <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
            <div className="animate-slide-up">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-brand">
                <span className="text-base" aria-hidden>
                  ⚽
                </span>
                5-a-side · 6-a-side · 7-a-side
              </p>
              <h1 className="font-display text-[clamp(2.75rem,8vw,5.5rem)] leading-[0.92] tracking-wide">
                RUN THE
                <br />
                <span className="bg-gradient-to-r from-brand via-[#d4ff70] to-brand bg-clip-text text-transparent">
                  BEAUTIFUL GAME
                </span>
                <br />
                <span className="text-text-primary">WITHOUT THE CHAOS.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-text-secondary md:text-lg">
                One calm hub for polls, subs, and fair teams. Fewer screenshots in the group chat — more
                minutes on the pitch.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/signup"
                  className="btn-primary inline-flex items-center gap-2 px-7 py-3 text-base shadow-[0_0_32px_rgba(184,255,60,0.25)]"
                >
                  Create your squad
                  <span aria-hidden>→</span>
                </Link>
                <a
                  href="#flow"
                  className="btn-secondary inline-flex items-center px-6 py-3 text-base border-white/10 bg-white/[0.03] hover:border-brand/30"
                >
                  See the flow
                </a>
              </div>

              <ul className="mt-10 flex flex-wrap gap-6 text-sm text-text-muted" aria-label="What SQUAD handles">
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-status-in shadow-[0_0_10px_rgba(184,255,60,0.6)]" />
                  Live availability
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-status-in shadow-[0_0_10px_rgba(184,255,60,0.6)]" />
                  Matchday payments
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-status-in shadow-[0_0_10px_rgba(184,255,60,0.6)]" />
                  Auto-balanced XIs
                </li>
              </ul>
            </div>

            <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
              <div className="pointer-events-none absolute -left-8 top-1/2 hidden h-64 w-64 -translate-y-1/2 rounded-full bg-brand/10 blur-3xl lg:block" />
              <div className="pointer-events-none absolute -right-4 top-0 h-40 w-40 rounded-full bg-pitch-glow/40 blur-2xl" />

              <div className="relative perspective-[1200px]">
                <div
                  className="absolute -right-2 top-8 z-0 hidden h-28 w-28 items-center justify-center md:flex perspective-[600px]"
                  aria-hidden
                >
                  <div className="preserve-3d animate-spin-y">
                    <span className="block text-5xl drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)] [transform:rotateX(14deg)]">
                      ⚽
                    </span>
                  </div>
                </div>

                <TiltSurface reducedMotion={reducedMotion} className="relative z-10">
                  <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-bg-card/95 to-bg-elevated/90 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-sm">
                    <div className="border-b border-white/[0.06] bg-pitch-shadow/30 px-5 py-3">
                      <div className="flex items-center justify-between text-xs font-medium text-text-muted">
                        <span>Next kickoff</span>
                        <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand">
                          Polling open
                        </span>
                      </div>
                      <p className="mt-1 font-display text-2xl tracking-wide text-text-primary">Thu · 19:00</p>
                      <p className="text-xs text-text-secondary">Powerleague · Pitch 3 · £8 each</p>
                    </div>
                    <div className="space-y-3 p-5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">Confirmed</span>
                        <span className="font-semibold text-brand">12 in</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-bg-elevated">
                        <div className="h-full w-[75%] rounded-full bg-gradient-to-r from-brand-dark to-brand shadow-[0_0_12px_rgba(184,255,60,0.4)]" />
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[11px]">
                        <div className="rounded-lg border border-white/[0.06] bg-bg/80 py-2">
                          <div className="text-text-muted">Maybe</div>
                          <div className="font-semibold text-[#FFB83C]">2</div>
                        </div>
                        <div className="rounded-lg border border-white/[0.06] bg-bg/80 py-2">
                          <div className="text-text-muted">Out</div>
                          <div className="font-semibold text-status-out">3</div>
                        </div>
                        <div className="rounded-lg border border-white/[0.06] bg-bg/80 py-2">
                          <div className="text-text-muted">Paid</div>
                          <div className="font-semibold text-brand">9</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 border-t border-white/[0.06] pt-4">
                        <div className="flex -space-x-2">
                          {[0, 1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className="h-9 w-9 rounded-full border-2 border-bg-card bg-gradient-to-br from-bg-elevated to-pitch-shadow ring-1 ring-white/10"
                              style={{ transform: `translateZ(${i * 6}px)` }}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-text-muted">+8 going — sides drop at 17:00</span>
                      </div>
                    </div>
                  </div>
                </TiltSurface>

                <div
                  className="preserve-3d absolute -bottom-6 -left-4 z-20 hidden w-[55%] rounded-xl border border-brand/20 bg-bg-elevated/95 p-4 shadow-xl backdrop-blur md:block animate-drift"
                  style={{ transform: 'rotateY(-8deg) rotateX(4deg) translateZ(40px)' }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand">Live preview</p>
                  <p className="mt-1 text-sm text-text-secondary">Drag-friendly cards, real data when you sign in.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Flow */}
        <section id="flow" className="scroll-mt-24 border-y border-white/[0.06] bg-bg-card/40 px-5 py-20 md:px-6 md:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 max-w-2xl">
              <h2 className="font-display text-4xl tracking-wide md:text-5xl">
                FROM <span className="text-brand">WHATSAPP</span> TO WHISTLE
              </h2>
              <p className="mt-4 text-lg text-text-secondary">
                Four straightforward steps — your players stay in one loop, you stay out of spreadsheets.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {flowSteps.map(({ step, title, body }) => (
                <article
                  key={step}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-bg-elevated/80 to-bg-card/60 p-6 transition-all duration-300 hover:border-brand/25 hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
                >
                  <div className="font-display text-5xl text-brand/25 transition-colors group-hover:text-brand/40">
                    {step}
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-text-primary">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">{body}</p>
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brand/5 blur-2xl transition-opacity group-hover:opacity-100" />
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Bento features */}
        <section id="features" className="scroll-mt-24 px-5 py-20 md:px-6 md:py-28">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center font-display text-4xl tracking-wide md:text-5xl">
              BUILT FOR <span className="text-brand">KICKABOUTS</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-text-secondary">
              Tools that feel like part of the matchday — not another corporate dashboard.
            </p>
            <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-3">
              {features.map(({ icon, title, body, grid, large }) => (
                <div
                  key={title}
                  className={cn(
                    'relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-bg-elevated/90 to-bg-card/50 p-6 transition-all duration-300 hover:border-brand/20 hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)]',
                    grid
                  )}
                >
                  {large && (
                    <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand/10 blur-3xl animate-shimmer" />
                  )}
                  <div className={cn('relative text-3xl', large && 'md:text-4xl')}>{icon}</div>
                  <h3 className={cn('relative mt-4 font-semibold text-text-primary', large && 'text-xl')}>{title}</h3>
                  <p className="relative mt-2 text-sm leading-relaxed text-text-secondary md:text-base">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-24 border-y border-white/[0.06] bg-pitch-shadow/20 px-5 py-20 md:px-6 md:py-28">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center font-display text-4xl tracking-wide md:text-5xl">PRICING</h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-text-secondary">
              Let subs cover the fee — you keep the squad organised and the games competitive.
            </p>
            <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3 md:items-stretch">
              {pricing.map(({ name, price, per, highlight, features: feats, cta }) => (
                <TiltSurface
                  key={name}
                  reducedMotion={reducedMotion}
                  className={cn('h-full', highlight && 'md:-mt-2 md:mb-2')}
                >
                  <div
                    className={cn(
                      'flex h-full flex-col rounded-2xl border p-7',
                      highlight
                        ? 'border-brand/40 bg-gradient-to-b from-brand/10 to-bg-card/90 glow shadow-[0_0_60px_rgba(184,255,60,0.12)]'
                        : 'border-white/[0.08] bg-bg-elevated/60'
                    )}
                  >
                    {highlight && (
                      <span className="mb-3 w-fit rounded-full bg-brand/20 px-3 py-1 text-xs font-semibold text-brand">
                        Most popular
                      </span>
                    )}
                    <div className="text-sm font-medium text-text-secondary">{name}</div>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="font-display text-5xl tracking-wide text-text-primary">{price}</span>
                      <span className="text-sm text-text-muted">{per}</span>
                    </div>
                    <ul className="mt-6 flex flex-1 flex-col gap-2.5">
                      {feats.map((f) => (
                        <li key={f} className="flex gap-2 text-sm text-text-secondary">
                          <span className="mt-0.5 text-brand">✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/signup"
                      className={cn(
                        'mt-8 block text-center py-3 text-sm font-semibold rounded-xl transition-transform active:scale-[0.98]',
                        highlight ? 'btn-primary' : 'btn-secondary border-white/10'
                      )}
                    >
                      {cta}
                    </Link>
                  </div>
                </TiltSurface>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/[0.06] px-5 py-12 md:px-6">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 text-sm text-text-muted md:flex-row">
            <span className="font-display text-xl tracking-[0.2em] text-brand">SQUAD</span>
            <div className="flex flex-wrap justify-center gap-8">
              <Link href="/privacy" className="transition-colors hover:text-text-secondary">
                Privacy
              </Link>
              <Link href="/terms" className="transition-colors hover:text-text-secondary">
                Terms
              </Link>
              <a href="mailto:hello@squadapp.co.uk" className="transition-colors hover:text-text-secondary">
                Contact
              </a>
              <Link href="/login" className="transition-colors hover:text-text-secondary">
                Sign in
              </Link>
            </div>
            <span>© {new Date().getFullYear()} SQUAD · Made in 🇬🇧</span>
          </div>
        </footer>
      </main>
    </div>
  )
}
