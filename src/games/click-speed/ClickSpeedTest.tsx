import { useEffect, useRef, useState } from 'react'
import { playSfx } from '../../lib/sound'
import type { GameComponentProps } from '../../types'
import { ClayButton, ClayCard } from '../../components/ui/Clay'

const DURATIONS = [5, 10, 30]

export function ClickSpeedTest({ onScore, soundEnabled }: GameComponentProps) {
  const [duration, setDuration] = useState(5)
  const [running, setRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(5)
  const [clicks, setClicks] = useState(0)
  const [lastCps, setLastCps] = useState<number | null>(null)
  const [best, setBest] = useState(0)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
    }
  }, [])

  const start = (d: number) => {
    setDuration(d)
    setTimeLeft(d)
    setClicks(0)
    setLastCps(null)
    setRunning(true)
    if (intervalRef.current) window.clearInterval(intervalRef.current)
    intervalRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0.1) {
          window.clearInterval(intervalRef.current!)
          setRunning(false)
          return 0
        }
        return +(t - 0.1).toFixed(1)
      })
    }, 100)
  }

  useEffect(() => {
    if (!running && lastCps === null && timeLeft === 0 && clicks > 0) {
      const cps = +(clicks / duration).toFixed(2)
      setLastCps(cps)
      setBest((b) => Math.max(b, cps))
      onScore(cps)
    }

  }, [running, timeLeft])

  const handleClick = () => {
    if (!running) return
    setClicks((c) => c + 1)
    playSfx('click', soundEnabled)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-2">
        {DURATIONS.map((d) => (
          <ClayButton
            key={d}
            size="sm"
            accent={duration === d ? 'mint' : 'lavender'}
            onClick={() => !running && start(d)}
            disabled={running}
          >
            {d}s
          </ClayButton>
        ))}
      </div>

      <button
        onClick={running ? handleClick : () => start(duration)}
        className="clay flex h-72 w-full max-w-md select-none flex-col items-center justify-center gap-2 text-center active:scale-[0.99] sm:h-80"
        style={{ ['--clay-bg' as string]: running ? 'var(--color-pink)' : 'var(--color-sky)' }}
      >
        {!running && lastCps === null && (
          <p className="font-display text-2xl font-bold text-ink">Tap to Start ({duration}s)</p>
        )}
        {running && (
          <>
            <p className="font-display text-5xl font-extrabold text-ink">{clicks}</p>
            <p className="text-sm text-ink-soft">{timeLeft.toFixed(1)}s left — keep tapping!</p>
          </>
        )}
        {!running && lastCps !== null && (
          <>
            <p className="font-display text-4xl font-extrabold text-ink animate-score-pop">{lastCps} CPS</p>
            <p className="text-sm text-ink-soft">{clicks} clicks · tap to try again</p>
          </>
        )}
      </button>

      <div className="grid w-full max-w-md grid-cols-3 gap-3">
        <ClayCard accent="lavender" className="px-3 py-3 text-center">
          <p className="text-xs font-semibold text-ink-soft">Clicks</p>
          <p className="font-display text-lg font-bold text-ink">{clicks}</p>
        </ClayCard>
        <ClayCard accent="mint" className="px-3 py-3 text-center">
          <p className="text-xs font-semibold text-ink-soft">CPS</p>
          <p className="font-display text-lg font-bold text-ink">{lastCps ?? '—'}</p>
        </ClayCard>
        <ClayCard accent="peach" className="px-3 py-3 text-center">
          <p className="text-xs font-semibold text-ink-soft">Best CPS</p>
          <p className="font-display text-lg font-bold text-ink">{best || '—'}</p>
        </ClayCard>
      </div>
    </div>
  )
}

export default ClickSpeedTest
