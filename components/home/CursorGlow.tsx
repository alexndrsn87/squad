'use client'

import { useEffect, useRef } from 'react'

/** Soft glow that eases toward the pointer — desktop / fine pointer only. */
export function CursorGlow() {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const target = useRef({ x: 0, y: 0 })
  const current = useRef({ x: 0, y: 0 })
  const visible = useRef(false)
  const raf = useRef<number>()

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduce) return

    const setVis = (v: boolean) => {
      visible.current = v
      const o = outerRef.current
      const i = innerRef.current
      if (o) o.style.opacity = v ? '1' : '0'
      if (i) i.style.opacity = v ? '1' : '0'
    }

    const onMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY }
      setVis(true)
    }
    const onLeave = () => setVis(false)

    window.addEventListener('mousemove', onMove, { passive: true })
    document.documentElement.addEventListener('mouseleave', onLeave)

    const tick = () => {
      const t = 0.14
      current.current.x += (target.current.x - current.current.x) * t
      current.current.y += (target.current.y - current.current.y) * t
      const { x, y } = current.current
      const ox = outerRef.current
      const ix = innerRef.current
      if (ox) {
        ox.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
      }
      if (ix) {
        ix.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
      }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('mousemove', onMove)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [])

  return (
    <>
      <div
        ref={outerRef}
        className="pointer-events-none fixed left-0 top-0 z-[100] h-[120px] w-[120px] rounded-full opacity-0 mix-blend-screen will-change-transform"
        style={{
          background: 'radial-gradient(circle, rgba(184,255,60,0.22) 0%, rgba(184,255,60,0.06) 40%, transparent 70%)',
          transition: 'opacity 0.25s ease',
        }}
        aria-hidden
      />
      <div
        ref={innerRef}
        className="pointer-events-none fixed left-0 top-0 z-[101] h-2 w-2 rounded-full border border-brand/50 bg-brand/30 opacity-0 shadow-[0_0_12px_rgba(184,255,60,0.5)] will-change-transform backdrop-blur-[1px]"
        style={{ transition: 'opacity 0.2s ease' }}
        aria-hidden
      />
    </>
  )
}
