import { useEffect, useState } from 'react'
import { LogoMark, Wordmark } from './Logo'

/**
 * Shown once per browser session (sessionStorage flag).
 * Animates the logo in with a bounce + glow ring, then fades out.
 */
export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'enter' | 'exit'>('enter')

  useEffect(() => {
    // Auto-dismiss after 1.8s
    const exitTimer = setTimeout(() => setPhase('exit'), 1500)
    const doneTimer = setTimeout(() => onDone(), 2000)
    return () => {
      clearTimeout(exitTimer)
      clearTimeout(doneTimer)
    }
  }, [onDone])

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse 80% 70% at 50% 40%, rgba(200,174,255,0.35) 0%, transparent 65%), var(--color-cream)',
        opacity: phase === 'exit' ? 0 : 1,
        transition: 'opacity 500ms ease',
        pointerEvents: phase === 'exit' ? 'none' : 'all',
      }}
    >
      {/* Glow ring */}
      <div
        style={{
          position: 'absolute',
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(107,79,191,0.30) 0%, transparent 70%)',
          animation: 'glow-pulse 1.8s ease-in-out infinite',
        }}
      />

      {/* Logo container — bounces in */}
      <div
        style={{
          animation: 'pop-in 600ms cubic-bezier(0.34,1.56,0.64,1) both',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <LogoMark size={72} />
        <Wordmark className="text-4xl font-black tracking-tight" />
        <p
          style={{
            animation: 'pop-in 500ms 400ms cubic-bezier(0.34,1.56,0.64,1) both',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '1.1rem',
            color: 'var(--color-ink-soft)',
          }}
        >
          Tiny Games. Big Fun.
        </p>
      </div>
    </div>
  )
}
