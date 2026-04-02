'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HeroScene } from '@/components/home/HeroScene'

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
    <div ref={wrapRef} onMouseMove={onMove} onMouseLeave={onLeave} className={cn(className)}>
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

/** Softer global fill — hero carries the main 3D scene. */
function AmbientLayers() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-b from-pitch-deep via-bg to-bg" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,rgba(20,61,40,0.2),transparent_55%)]" />
      <div className="landing-vignette absolute inset-0 opacity-80" />
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  )
}

const navLinks = [
  { href: '#showcase', label: 'Why SQUAD' },
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

const showcase = [
  {
    title: 'Know your numbers',
    body: 'See who’s in, who’s paid, and who’s on the bench — before you leave for the pitch.',
    stat: 'Live roster',
  },
  {
    title: 'Fairer games',
    body: 'Balanced sides from real match feedback — not who shouted loudest in the chat.',
    stat: 'Smart pick',
  },
  {
    title: 'Less admin',
    body: 'One link for the whole squad. They tap; you don’t chase fifteen “sorry mate” replies.',
    stat: 'Mobile-first',
  },
]

const pricing = [
  {
    name: 'Starter',
    price: '£0',
    per: 'for 6 months',
    footnote: 'Ad-supported · then £2.99/mo',
    badge: 'Intro offer',
    highlight: false,
    features: [
      'Full access — polls, teams, MOTM, kitty basics',
      '1 team · up to 15 players',
      'Lightweight ads help fund your first season',
      '£2.99/mo from month 7 — cancel any time',
    ],
    cta: 'Start with Starter',
  },
  {
    name: 'Basic',
    price: '£5',
    per: '/team/mo',
    highlight: false,
    features: [
      'Unlimited teams',
      'Stripe payment collection',
      'Paid-first selection',
      'Group kitty & chip-ins',
      'Position-aware balancing',
    ],
    cta: 'Go Basic',
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
    cta: 'Go Pro',
  },
]

export default function LandingExperience() {
  const scrolled = useScrolled()
  const reducedMotion = useReducedMotion()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="landing-root relative min-h-screen overflow-x-hidden bg-bg text-text-primary antialiased">
      <AmbientLayers />

      <header
        className={cn(
          'fixed left-0 right-0 top-0 z-50 transition-all duration-300',
          scrolled
            ? 'border-b border-white/[0.06] bg-bg/80 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl md:py-3'
            : 'border-b border-transparent bg-transparent py-3 md:py-4'
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 sm:px-5 md:px-6">
          <Link
            href="/"
            className="shrink-0 font-display text-xl tracking-[0.18em] text-brand transition-transform active:scale-95 sm:text-2xl md:text-3xl md:tracking-[0.2em]"
          >
            SQUAD
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Page sections">
            {navLinks.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="rounded-full px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-white/[0.05] hover:text-text-primary"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/login"
              className="hidden min-h-[44px] items-center rounded-full px-4 text-sm font-medium text-text-secondary transition-colors hover:bg-white/[0.05] hover:text-text-primary sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex min-h-[44px] items-center rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-bg shadow-[0_0_20px_rgba(184,255,60,0.25)] transition-transform active:scale-[0.98] sm:px-5"
            >
              Start free
            </Link>
            <button
              type="button"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.04] text-text-primary lg:hidden"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-sm lg:hidden"
            aria-label="Close menu"
            onClick={closeMenu}
          />
          <div className="fixed right-0 top-0 z-[70] flex h-dvh w-[min(100%,320px)] flex-col border-l border-white/[0.08] bg-bg-elevated/95 px-5 pb-8 pt-20 shadow-2xl backdrop-blur-xl lg:hidden">
            <nav className="flex flex-1 flex-col gap-1" aria-label="Mobile sections">
              {navLinks.map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  onClick={closeMenu}
                  className="min-h-[48px] rounded-xl px-4 py-3 text-base font-medium text-text-primary transition-colors hover:bg-white/[0.06]"
                >
                  {label}
                </a>
              ))}
              <Link
                href="/login"
                onClick={closeMenu}
                className="mt-4 min-h-[48px] rounded-xl border border-white/[0.1] px-4 py-3 text-center text-base font-medium text-text-primary"
              >
                Sign in
              </Link>
            </nav>
          </div>
        </>
      )}

      <main>
        {/* Hero — shop window */}
        <section className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden pb-12 pt-[4.75rem] sm:pb-16 sm:pt-24 md:min-h-0 md:py-28 lg:min-h-[100svh]">
          <HeroScene />

          <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-10 px-4 sm:px-5 md:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12">
            <div className="text-center lg:text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand sm:text-xs">
                5-a-side · 6-a-side · 7-a-side
              </p>
              <h1 className="mt-3 font-display text-[clamp(2.35rem,8.5vw,4.5rem)] leading-[0.96] tracking-wide text-text-primary">
                Know who&apos;s playing.
                <br />
                <span className="text-brand">Get paid. Fair teams.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-text-secondary sm:text-lg lg:mx-0">
                Polls, subs, and lineups in{' '}
                <strong className="font-semibold text-text-primary">one link</strong> your squad will actually use — so
                you spend less time herding and more time on the ball.
              </p>
              <p className="mx-auto mt-4 max-w-lg rounded-xl border border-white/[0.08] bg-bg-elevated/50 px-4 py-3 text-left text-sm leading-relaxed text-text-muted backdrop-blur-sm lg:mx-0">
                <span className="font-semibold text-brand">Starter:</span> 6 months free (ad-supported), then{' '}
                <span className="text-text-secondary">£2.99/mo</span>. Upgrade for Stripe payments &amp; unlimited teams.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
                <Link
                  href="/signup"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-brand px-8 py-3.5 text-base font-semibold text-bg shadow-[0_0_36px_rgba(184,255,60,0.3)] transition-transform active:scale-[0.98]"
                >
                  Create your squad — free
                </Link>
                <a
                  href="#showcase"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/[0.14] bg-white/[0.04] px-7 py-3.5 text-base font-medium text-text-primary transition-colors hover:border-brand/35 hover:bg-white/[0.07]"
                >
                  Why teams switch
                </a>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[400px] lg:mx-0 lg:max-w-none">
              <TiltSurface reducedMotion={reducedMotion} className="relative z-10">
                <div className="overflow-hidden rounded-2xl border border-white/[0.1] bg-gradient-to-br from-bg-card/95 to-bg-elevated/90 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-sm">
                  <div className="border-b border-white/[0.06] bg-pitch-shadow/40 px-5 py-4">
                    <div className="flex items-center justify-between text-xs font-medium text-text-muted">
                      <span>Next kickoff</span>
                      <span className="rounded-full bg-brand/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand">
                        Polling open
                      </span>
                    </div>
                    <p className="mt-1 font-display text-2xl tracking-wide text-text-primary sm:text-3xl">Thu · 19:00</p>
                    <p className="text-xs text-text-secondary">Powerleague · Pitch 3 · £8 each</p>
                  </div>
                  <div className="space-y-3 p-5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">Confirmed</span>
                      <span className="font-semibold text-brand">12 in</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-bg-elevated">
                      <div className="h-full w-[75%] rounded-full bg-gradient-to-r from-brand-dark to-brand shadow-[0_0_12px_rgba(184,255,60,0.4)]" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1 text-center text-[11px]">
                      <div className="rounded-lg border border-white/[0.06] bg-bg/80 py-2.5">
                        <div className="text-text-muted">Maybe</div>
                        <div className="font-semibold text-[#FFB83C]">2</div>
                      </div>
                      <div className="rounded-lg border border-white/[0.06] bg-bg/80 py-2.5">
                        <div className="text-text-muted">Out</div>
                        <div className="font-semibold text-status-out">3</div>
                      </div>
                      <div className="rounded-lg border border-white/[0.06] bg-bg/80 py-2.5">
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
                          />
                        ))}
                      </div>
                      <span className="text-xs text-text-muted">+8 going — sides at 17:00</span>
                    </div>
                  </div>
                </div>
              </TiltSurface>
            </div>
          </div>
        </section>

        {/* Shop window strip */}
        <section
          id="showcase"
          className="scroll-mt-24 border-y border-white/[0.06] bg-bg-card/35 px-4 py-14 sm:px-5 md:px-6 md:py-20"
        >
          <div className="mx-auto max-w-6xl">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-brand">Why organisers use SQUAD</p>
            <h2 className="mt-3 text-center font-display text-3xl tracking-wide text-text-primary sm:text-4xl md:text-5xl">
              Less chat admin. <span className="text-brand">More football.</span>
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {showcase.map(({ title, body, stat }) => (
                <article
                  key={title}
                  className="flex flex-col rounded-2xl border border-white/[0.08] bg-gradient-to-b from-bg-elevated/80 to-bg-card/50 p-6 transition-shadow hover:shadow-[0_16px_48px_rgba(0,0,0,0.25)]"
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand">{stat}</span>
                  <h3 className="mt-2 text-lg font-semibold text-text-primary">{title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-text-secondary">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="flow" className="scroll-mt-24 border-y border-white/[0.06] bg-bg-card/25 px-4 py-14 sm:px-5 md:px-6 md:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 max-w-2xl md:mb-14">
              <h2 className="font-display text-3xl tracking-wide sm:text-4xl md:text-5xl">
                FROM <span className="text-brand">GROUP CHAT</span> TO KICKOFF
              </h2>
              <p className="mt-4 text-base leading-relaxed text-text-secondary sm:text-lg">
                Four steps — your players stay in one place, you stop screenshotting spreadsheets.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
              {flowSteps.map(({ step, title, body }) => (
                <article
                  key={step}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-bg-elevated/80 to-bg-card/60 p-5 transition-all duration-300 hover:border-brand/25 hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)] sm:p-6"
                >
                  <div className="font-display text-4xl text-brand/25 transition-colors group-hover:text-brand/40 sm:text-5xl">
                    {step}
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-text-primary sm:text-lg">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-24 px-4 py-14 sm:px-5 md:px-6 md:py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center font-display text-3xl tracking-wide sm:text-4xl md:text-5xl">
              BUILT FOR <span className="text-brand">KICKABOUTS</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-base text-text-secondary sm:text-lg">
              Everything you need for amateur 5–7-a-side — without enterprise bloat.
            </p>
            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-3 md:gap-5">
              {features.map(({ icon, title, body, grid, large }) => (
                <div
                  key={title}
                  className={cn(
                    'relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-bg-elevated/90 to-bg-card/50 p-5 transition-all duration-300 hover:border-brand/20 hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)] sm:p-6',
                    grid
                  )}
                >
                  {large && (
                    <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand/10 blur-3xl animate-shimmer" />
                  )}
                  <div className={cn('relative text-3xl', large && 'md:text-4xl')}>{icon}</div>
                  <h3 className={cn('relative mt-3 font-semibold text-text-primary sm:mt-4', large && 'text-lg md:text-xl')}>
                    {title}
                  </h3>
                  <p className="relative mt-2 text-sm leading-relaxed text-text-secondary md:text-base">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-24 border-y border-white/[0.06] bg-pitch-shadow/25 px-4 py-14 sm:px-5 md:px-6 md:py-24">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center font-display text-3xl tracking-wide sm:text-4xl md:text-5xl">PRICING</h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-base text-text-secondary">
              Start free on Starter, scale when you need payments and multiple squads.
            </p>
            <div className="mt-10 grid grid-cols-1 gap-5 md:mt-14 md:grid-cols-3 md:items-stretch">
              {pricing.map(({ name, price, per, footnote, badge, highlight, features: feats, cta }) => (
                <TiltSurface
                  key={name}
                  reducedMotion={reducedMotion}
                  className={cn('h-full', highlight && 'md:-mt-2 md:mb-2')}
                >
                  <div
                    className={cn(
                      'flex h-full flex-col rounded-2xl border p-6 sm:p-7',
                      highlight
                        ? 'border-brand/40 bg-gradient-to-b from-brand/10 to-bg-card/90 glow shadow-[0_0_60px_rgba(184,255,60,0.12)]'
                        : 'border-white/[0.08] bg-bg-elevated/60'
                    )}
                  >
                    {badge && (
                      <span className="mb-2 w-fit rounded-full bg-brand/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand">
                        {badge}
                      </span>
                    )}
                    {highlight && (
                      <span className="mb-2 w-fit rounded-full bg-brand/20 px-3 py-1 text-xs font-semibold text-brand">
                        Most popular
                      </span>
                    )}
                    <div className="text-sm font-medium text-text-secondary">{name}</div>
                    <div className="mt-1 flex flex-wrap items-baseline gap-x-1 gap-y-0">
                      <span className="font-display text-4xl tracking-wide text-text-primary sm:text-5xl">{price}</span>
                      <span className="text-sm text-text-muted">{per}</span>
                    </div>
                    {footnote && <p className="mt-2 text-xs leading-snug text-text-muted">{footnote}</p>}
                    <ul className="mt-5 flex flex-1 flex-col gap-2.5 sm:mt-6">
                      {feats.map((f) => (
                        <li key={f} className="flex gap-2 text-sm text-text-secondary">
                          <span className="mt-0.5 shrink-0 text-brand">✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/signup"
                      className={cn(
                        'mt-6 block min-h-[48px] rounded-xl py-3.5 text-center text-sm font-semibold transition-transform active:scale-[0.98] sm:mt-8',
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

        <footer className="border-t border-white/[0.06] px-4 py-10 sm:px-5 md:px-6 md:py-12">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 text-sm text-text-muted md:flex-row">
            <span className="font-display text-lg tracking-[0.2em] text-brand sm:text-xl">SQUAD</span>
            <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
              <Link href="/privacy" className="min-h-[44px] inline-flex items-center transition-colors hover:text-text-secondary">
                Privacy
              </Link>
              <Link href="/terms" className="min-h-[44px] inline-flex items-center transition-colors hover:text-text-secondary">
                Terms
              </Link>
              <a href="mailto:hello@squadapp.co.uk" className="min-h-[44px] inline-flex items-center transition-colors hover:text-text-secondary">
                Contact
              </a>
              <Link href="/login" className="min-h-[44px] inline-flex items-center transition-colors hover:text-text-secondary">
                Sign in
              </Link>
            </div>
            <span>© {new Date().getFullYear()} SQUAD · 🇬🇧</span>
          </div>
        </footer>
      </main>
    </div>
  )
}
