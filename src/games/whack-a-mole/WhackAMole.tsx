import { useEffect, useRef, useState } from 'react'
import { playSfx } from '../../lib/sound'
import type { GameComponentProps } from '../../types'
import { ClayButton, ClayCard } from '../../components/ui/Clay'

const GRID = 9
const ROUND_SECONDS = 30

export function WhackAMole({ onScore, soundEnabled }: GameComponentProps) {
  const [running, setRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS)
  const [activeHole, setActiveHole] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [misses, setMisses] = useState(0)
  const moleTimerRef = useRef<number | null>(null)
  const clockRef = useRef<number | null>(null)

  const clearTimers = () => {
    if (moleTimerRef.current) window.clearTimeout(moleTimerRef.current)
    if (clockRef.current) window.clearInterval(clockRef.current)
  }

  useEffect(() => clearTimers, [])

  const popMole = () => {
    setActiveHole(Math.floor(Math.random() * GRID))
    const nextDelay = 500 + Math.random() * 500
    moleTimerRef.current = window.setTimeout(popMole, nextDelay)
  }

  const start = () => {
    clearTimers()
    setScore(0)
    setMisses(0)
    setTimeLeft(ROUND_SECONDS)
    setRunning(true)
    popMole()
    clockRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearTimers()
          setRunning(false)
          setActiveHole(null)
          return 0
        }
        return t - 1
      })
    }, 1000)
  }

  useEffect(() => {
    if (!running && timeLeft === 0 && score + misses > 0) {
      onScore(score)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, timeLeft])

  const whack = (i: number) => {
    if (!running) return
    if (i === activeHole) {
      setScore((s) => s + 1)
      setActiveHole(null)
      playSfx('score', soundEnabled)
    } else {
      setMisses((m) => m + 1)
      playSfx('wrong', soundEnabled)
    }
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="grid w-full max-w-md grid-cols-3 gap-3">
        <ClayCard accent="lavender" className="px-3 py-3 text-center">
          <p className="text-xs font-semibold text-ink-soft">Score</p>
          <p className="font-display text-lg font-bold text-ink">{score}</p>
        </ClayCard>
        <ClayCard accent="peach" className="px-3 py-3 text-center">
          <p className="text-xs font-semibold text-ink-soft">Time</p>
          <p className="font-display text-lg font-bold text-ink">{timeLeft}s</p>
        </ClayCard>
        <ClayCard accent="mint" className="px-3 py-3 text-center">
          <p className="text-xs font-semibold text-ink-soft">Misses</p>
          <p className="font-display text-lg font-bold text-ink">{misses}</p>
        </ClayCard>
      </div>

      <div className="grid w-full max-w-md grid-cols-3 gap-3">
        {Array.from({ length: GRID }).map((_, i) => (
          <button
            key={i}
            onClick={() => whack(i)}
            disabled={!running}
            aria-label={activeHole === i ? 'Whack the mole' : 'Empty hole'}
            className="clay-inset relative flex aspect-square items-center justify-center rounded-3xl bg-mint text-4xl disabled:opacity-70"
          >
            {activeHole === i && <span className="animate-pop-in" aria-hidden="true">🐹</span>}
          </button>
        ))}
      </div>

      {!running && (
        <ClayButton accent="mint" size="lg" onClick={start}>
          {timeLeft === 0 && score + misses > 0 ? 'Play Again' : 'Start Game'}
        </ClayButton>
      )}
    </div>
  )
}

export default WhackAMole
