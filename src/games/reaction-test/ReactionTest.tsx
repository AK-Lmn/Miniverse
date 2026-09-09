import { useCallback, useEffect, useRef, useState } from 'react'
import { playSfx } from '../../lib/sound'
import type { GameComponentProps } from '../../types'
import { ClayButton, ClayCard } from '../../components/ui/Clay'

type Phase = 'idle' | 'waiting' | 'ready' | 'too-soon' | 'result'

export function ReactionTest({ onScore, soundEnabled }: GameComponentProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [results, setResults] = useState<number[]>([])
  const [lastResult, setLastResult] = useState<number | null>(null)
  const startTimeRef = useRef(0)
  const timeoutRef = useRef<number | null>(null)

  const clearTimer = () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
  }

  const begin = useCallback(() => {
    clearTimer()
    setPhase('waiting')
    const delay = 1200 + Math.random() * 2800
    timeoutRef.current = window.setTimeout(() => {
      startTimeRef.current = performance.now()
      setPhase('ready')
    }, delay)
  }, [])

  useEffect(() => () => clearTimer(), [])

  const handleTap = () => {
    if (phase === 'idle' || phase === 'result' || phase === 'too-soon') {
      begin()
      return
    }
    if (phase === 'waiting') {
      clearTimer()
      setPhase('too-soon')
      playSfx('wrong', soundEnabled)
      return
    }
    if (phase === 'ready') {
      const reaction = Math.round(performance.now() - startTimeRef.current)
      setLastResult(reaction)
      setResults((r) => [...r, reaction].slice(-10))
      setPhase('result')
      playSfx('correct', soundEnabled)
      onScore(reaction)
    }
  }

  const best = results.length ? Math.min(...results) : null
  const avg = results.length ? Math.round(results.reduce((a, b) => a + b, 0) / results.length) : null

  const bg =
    phase === 'ready' ? 'var(--color-mint-dark)' : phase === 'too-soon' ? 'var(--color-peach-dark)' : 'var(--color-sky)'

  return (
    <div className="flex flex-col items-center gap-6">
      <button
        onClick={handleTap}
        className="clay flex h-72 w-full max-w-md flex-col items-center justify-center gap-2 text-center transition-colors sm:h-80"
        style={{ ['--clay-bg' as string]: bg }}
      >
        {phase === 'idle' && <p className="font-display text-2xl font-bold text-ink">Tap to Start</p>}
        {phase === 'waiting' && <p className="font-display text-2xl font-bold text-ink">Wait for green…</p>}
        {phase === 'ready' && <p className="font-display text-3xl font-bold text-ink">TAP NOW!</p>}
        {phase === 'too-soon' && (
          <>
            <p className="font-display text-2xl font-bold text-ink">Too soon!</p>
            <p className="text-sm text-ink-soft">Tap to try again</p>
          </>
        )}
        {phase === 'result' && lastResult !== null && (
          <>
            <p className="font-display text-4xl font-extrabold text-ink animate-score-pop">{lastResult}ms</p>
            <p className="text-sm text-ink-soft">Tap to go again</p>
          </>
        )}
      </button>

      <div className="grid w-full max-w-md grid-cols-3 gap-3">
        <ClayCard accent="lavender" className="px-3 py-3 text-center">
          <p className="text-xs font-semibold text-ink-soft">Last</p>
          <p className="font-display text-lg font-bold text-ink">{lastResult ?? '—'}</p>
        </ClayCard>
        <ClayCard accent="mint" className="px-3 py-3 text-center">
          <p className="text-xs font-semibold text-ink-soft">Best</p>
          <p className="font-display text-lg font-bold text-ink">{best ?? '—'}</p>
        </ClayCard>
        <ClayCard accent="peach" className="px-3 py-3 text-center">
          <p className="text-xs font-semibold text-ink-soft">Average</p>
          <p className="font-display text-lg font-bold text-ink">{avg ?? '—'}</p>
        </ClayCard>
      </div>

      {phase === 'idle' && (
        <ClayButton accent="mint" size="lg" onClick={handleTap}>
          Start Test
        </ClayButton>
      )}
    </div>
  )
}

export default ReactionTest
