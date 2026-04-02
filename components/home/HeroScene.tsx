/** Full-bleed hero visuals: 3D-style pitch, lights, floating ball — mobile scales down. */
export function HeroScene() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden md:-top-6"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_70%_at_50%_0%,rgba(184,255,60,0.16),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_100%_30%,rgba(20,61,40,0.55),transparent)] motion-safe:animate-float" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_0%_60%,rgba(184,255,60,0.08),transparent)] motion-safe:animate-float-delayed" />

      <div
        className="absolute -left-[20%] top-[-5%] h-[100%] w-[80%] opacity-[0.15] blur-[100px] motion-safe:animate-shimmer"
        style={{
          background:
            'conic-gradient(from 220deg at 60% 10%, transparent 35%, rgba(184,255,60,0.5) 48%, transparent 58%)',
        }}
      />
      <div
        className="absolute -right-[25%] top-[5%] h-[90%] w-[70%] opacity-[0.12] blur-[90px] motion-safe:animate-shimmer"
        style={{
          background:
            'conic-gradient(from 40deg at 40% 15%, transparent 38%, rgba(255,255,255,0.35) 50%, transparent 62%)',
          animationDelay: '3s',
        }}
      />

      {/* Large pitch — bottom anchor */}
      <div
        className="absolute -bottom-4 left-1/2 w-[min(220vw,1200px)] max-md:scale-[1.08] motion-safe:animate-drift"
        style={{ perspective: '1000px', transform: 'translateX(-50%)' }}
      >
        <div
          className="relative h-[min(48vh,380px)] w-full origin-bottom rounded-t-md border border-white/[0.14] shadow-[0_-40px_140px_rgba(0,0,0,0.85)] md:h-[min(52vh,440px)]"
          style={{
            transform: 'rotateX(74deg)',
            transformStyle: 'preserve-3d',
            background:
              'linear-gradient(185deg, #1a4d32 0%, #0f2e1d 38%, #050a08 100%)',
          }}
        >
          <div
            className="absolute inset-0 opacity-[0.28]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
          <div className="absolute left-1/2 top-1/2 h-[min(55vw,380px)] w-[min(55vw,380px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.18] shadow-[inset_0_0_60px_rgba(0,0,0,0.25)]" />
          <div className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          <div className="absolute bottom-4 left-1/2 h-[min(18vw,88px)] w-[min(34vw,140px)] -translate-x-1/2 rounded border border-white/25 bg-white/[0.06]" />
        </div>
      </div>

      {/* Hero ball — right side desktop, centered above fold mobile */}
      <div className="absolute left-1/2 top-[8%] -translate-x-1/2 md:left-auto md:right-[6%] md:top-[20%] md:translate-x-0 lg:right-[10%]">
        <div className="relative h-24 w-24 motion-safe:animate-float md:h-40 md:w-40">
          <div
            className="absolute inset-0 motion-safe:animate-spin-y rounded-full shadow-[0_24px_80px_rgba(0,0,0,0.5),inset_-10px_-10px_24px_rgba(0,0,0,0.4),inset_6px_6px_16px_rgba(255,255,255,0.18)]"
            style={{
              background:
                'radial-gradient(circle at 28% 22%, #ffffff 0%, #e2e2e2 18%, #0d0d0d 19%, #0d0d0d 24%, #efefef 25%, #efefef 30%, #0d0d0d 31%, #f2f2f2 36%, #1f1f1f 100%)',
              transform: 'rotateX(22deg) rotateY(-18deg)',
            }}
          />
          <div className="absolute -inset-3 rounded-full border-2 border-brand/25 opacity-70 motion-safe:animate-pulse-slow" />
          <div
            className="absolute -inset-6 rounded-full border border-white/10 opacity-40 motion-safe:animate-spin-y md:-inset-8"
            style={{ animationDuration: '22s' }}
          />
        </div>
      </div>

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
