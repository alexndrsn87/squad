'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

const COUNT = 5
const LERP_BASE = 0.06

function MiniBall({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex h-[11px] w-[11px] shrink-0 items-center justify-center rounded-full border border-white/25 bg-gradient-to-br from-zinc-100 to-zinc-400 text-[7px] leading-none shadow-md sm:h-[13px] sm:w-[13px] sm:text-[8px]',
        className
      )}
      aria-hidden
    >
      ⚽
    </span>
  )
}

/** Tiny footballs that trail scroll position with staggered easing (atom trail). */
export function ScrollBallAtoms() {
  const ballRefs = useRef<(HTMLDivElement | null)[]>([])
  const targetRef = useRef(0)
  const atomsRef = useRef<number[]>([0, 0, 0, 0, 0])
  const rafRef = useRef<number>()

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const onScroll = () => {
      const el = document.documentElement
      const max = el.scrollHeight - window.innerHeight
      targetRef.current = max > 0 ? el.scrollTop / max : 0
      if (reduce) {
        atomsRef.current = Array(COUNT).fill(targetRef.current)
        ballRefs.current.forEach((b, i) => {
          if (b) b.style.top = `${atomsRef.current[i] * 100}%`
        })
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    onScroll()

    if (reduce) {
      return () => {
        window.removeEventListener('scroll', onScroll)
        window.removeEventListener('resize', onScroll)
      }
    }

    const tick = () => {
      const t = targetRef.current
      for (let i = 0; i < COUNT; i++) {
        const lag = LERP_BASE + i * 0.045
        atomsRef.current[i] += (t - atomsRef.current[i]) * lag
        const b = ballRefs.current[i]
        if (b) b.style.top = `${atomsRef.current[i] * 100}%`
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div
      className="pointer-events-none fixed bottom-28 right-1 top-24 z-40 w-7 sm:right-2 sm:w-8 md:bottom-32 md:top-28"
      aria-hidden
    >
      <div className="absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 rounded-full bg-gradient-to-b from-brand/50 via-white/15 to-pitch-glow/60 shadow-[0_0_12px_rgba(184,255,60,0.15)]" />
      <div className="absolute bottom-0 left-1/2 top-0 w-2 -translate-x-1/2 rounded-full bg-gradient-to-b from-brand/10 via-transparent to-transparent" />
      {Array.from({ length: COUNT }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            ballRefs.current[i] = el
          }}
          className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ top: '0%' }}
        >
          <MiniBall
            className={
              i === 0 ? 'opacity-100' : i === 1 ? 'opacity-90' : i === 2 ? 'opacity-75' : 'opacity-55'
            }
          />
        </div>
      ))}
    </div>
  )
}
