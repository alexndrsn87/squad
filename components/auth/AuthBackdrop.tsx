/** Shared immersive backdrop for sign-in / sign-up — pitch plane + lights (CSS 3D). */
export function AuthBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-b from-pitch-deep via-bg to-bg" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_50%_at_50%_-15%,rgba(184,255,60,0.12),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(20,61,40,0.5),transparent_45%)]" />

      {/* Stadium light pools */}
      <div
        className="absolute -left-1/4 top-0 h-[85%] w-[70%] opacity-[0.12] blur-3xl motion-safe:animate-shimmer"
        style={{
          background:
            'conic-gradient(from 200deg at 70% 0%, transparent 40%, rgba(184,255,60,0.4) 50%, transparent 60%)',
        }}
      />
      <div
        className="absolute -right-1/4 top-0 h-[80%] w-[65%] opacity-[0.1] blur-3xl motion-safe:animate-shimmer"
        style={{
          background:
            'conic-gradient(from 340deg at 30% 0%, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)',
          animationDelay: '2s',
        }}
      />

      {/* 3D pitch plane */}
      <div
        className="absolute bottom-0 left-1/2 w-[min(200vw,1100px)] motion-safe:animate-drift"
        style={{
          perspective: '900px',
          transform: 'translateX(-50%)',
        }}
      >
        <div
          className="relative h-[min(52vh,420px)] w-full origin-bottom rounded-t-[3px] border border-white/[0.12] shadow-[0_-30px_120px_rgba(0,0,0,0.75)]"
          style={{
            transform: 'rotateX(72deg)',
            transformStyle: 'preserve-3d',
            background:
              'linear-gradient(180deg, #143d28 0%, #0a1f14 45%, #050a08 100%)',
          }}
        >
          <div
            className="absolute inset-0 opacity-[0.22]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
              backgroundSize: '36px 36px',
            }}
          />
          <div className="absolute left-1/2 top-1/2 h-[min(42vw,320px)] w-[min(42vw,320px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25" />
          <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-white/20" />
          <div className="absolute bottom-3 left-1/2 h-16 w-24 -translate-x-1/2 rounded-sm border border-white/20 bg-white/[0.04]" />
        </div>
      </div>

      <div className="landing-vignette absolute inset-0" />
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  )
}
