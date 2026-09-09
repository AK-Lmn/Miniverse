import { useState, useEffect, useCallback } from 'react'
import type { GameComponentProps } from '../../types'
import { ClayButton } from '../../components/ui/Clay'
import { RotateCcw } from 'lucide-react'

const COLORS = [
  { id: 'red',    label: 'RED',    bg: '#FF6B6B', text: '#fff' },
  { id: 'green',  label: 'GREEN',  bg: '#6BCB77', text: '#fff' },
  { id: 'blue',   label: 'BLUE',   bg: '#4D96FF', text: '#fff' },
  { id: 'yellow', label: 'YELLOW', bg: '#FFD93D', text: '#333' },
]

type Phase = 'idle' | 'playing' | 'correct' | 'wrong' | 'done'

function pickRound() {
  const textColor   = COLORS[Math.floor(Math.random() * COLORS.length)]
  const inkColor    = COLORS[Math.floor(Math.random() * COLORS.length)]
  return { textColor, inkColor, answer: inkColor.id }
}

const ROUNDS = 10
const TIME_PER_ROUND = 3000 // ms

export function ColorMatch({ onScore }: GameComponentProps) {
  const [phase, setPhase]       = useState<Phase>('idle')
  const [round, setRound]       = useState(0)
  const [score, setScore]       = useState(0)
  const [current, setCurrent]   = useState(() => pickRound())
  const [timeLeft, setTimeLeft] = useState(TIME_PER_ROUND)
  const [flash, setFlash]       = useState<'correct' | 'wrong' | null>(null)

  // Timer per round
  useEffect(() => {
    if (phase !== 'playing') return
    if (timeLeft <= 0) {
      handleAnswer(null)
      return
    }
    const t = setTimeout(() => setTimeLeft((p) => p - 100), 100)
    return () => clearTimeout(t)
  }, [phase, timeLeft])

  const handleAnswer = useCallback((colorId: string | null) => {
    if (phase !== 'playing') return
    const correct = colorId === current.answer
    setFlash(correct ? 'correct' : 'wrong')
    const newScore = correct ? score + 1 : score

    setTimeout(() => {
      setFlash(null)
      const nextRound = round + 1
      if (nextRound >= ROUNDS) {
        setPhase('done')
        onScore(newScore)
      } else {
        setRound(nextRound)
        setCurrent(pickRound())
        setTimeLeft(TIME_PER_ROUND)
        setScore(newScore)
      }
    }, 400)
  }, [phase, current, round, score, onScore])

  const start = () => {
    setCurrent(pickRound())
    setRound(0)
    setScore(0)
    setTimeLeft(TIME_PER_ROUND)
    setPhase('playing')
  }

  const pct = (timeLeft / TIME_PER_ROUND) * 100

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6 select-none">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-soft">Color Match</p>
        <p className="mt-1 text-sm text-ink-soft">Tap the pad that matches the <em>ink color</em> of the word</p>
      </div>

      {phase === 'idle' && (
        <ClayButton accent="mint" size="lg" onClick={start}>Start Game</ClayButton>
      )}

      {(phase === 'playing' || phase === 'done') && (
        <>
          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-white/50 overflow-hidden">
            <div
              className="h-2 rounded-full transition-none"
              style={{ width: `${pct}%`, background: 'var(--color-plum)' }}
            />
          </div>

          <p className="text-xs font-semibold text-ink-soft">Round {round + 1} / {ROUNDS} · Score: {score}</p>

          {/* Stimulus */}
          <div
            className="flex h-24 w-64 items-center justify-center rounded-3xl shadow-lg"
            style={{
              background: flash === 'correct' ? '#6BCB7740' : flash === 'wrong' ? '#FF6B6B40' : 'var(--color-cream)',
              transition: 'background 200ms',
            }}
          >
            <span
              className="font-display text-5xl font-black"
              style={{ color: current.inkColor.bg }}
              aria-label={`The word says ${current.textColor.label} but is written in ${current.inkColor.label} ink`}
            >
              {current.textColor.label}
            </span>
          </div>

          {/* Color pads */}
          {phase === 'playing' && (
            <div className="grid grid-cols-2 gap-3 w-full">
              {COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleAnswer(c.id)}
                  className="clay-btn flex h-16 items-center justify-center rounded-2xl font-display text-lg font-bold transition-transform active:scale-95"
                  style={{ background: c.bg, color: c.text, border: 'none' }}
                  aria-label={`Pick ${c.label}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {phase === 'done' && (
            <div className="flex flex-col items-center gap-3">
              <p className="font-display text-3xl font-black text-ink">{score}/{ROUNDS}</p>
              <p className="text-ink-soft text-sm">
                {score >= 8 ? 'Incredible reflexes! 🎉' : score >= 5 ? 'Not bad! Keep training.' : 'Color confusion got you!'}
              </p>
              <ClayButton accent="mint" onClick={start}>
                <RotateCcw size={15} aria-hidden="true" /> Play Again
              </ClayButton>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ColorMatch
