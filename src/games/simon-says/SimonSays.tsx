import { useState, useRef, useCallback } from 'react'
import type { GameComponentProps } from '../../types'
import { ClayButton } from '../../components/ui/Clay'
import { RotateCcw } from 'lucide-react'

const PADS = [
  { id: 0, label: 'Green',  bg: '#6BCB77', activeBg: '#22c55e' },
  { id: 1, label: 'Red',    bg: '#FF6B6B', activeBg: '#ef4444' },
  { id: 2, label: 'Yellow', bg: '#FFD93D', activeBg: '#eab308' },
  { id: 3, label: 'Blue',   bg: '#4D96FF', activeBg: '#3b82f6' },
]

type Phase = 'idle' | 'showing' | 'input' | 'win' | 'lose'

export function SimonSays({ onScore }: GameComponentProps) {
  const [phase, setPhase]         = useState<Phase>('idle')
  const [sequence, setSequence]   = useState<number[]>([])
  const [inputIdx, setInputIdx]   = useState(0)
  const [lit, setLit]             = useState<number | null>(null)
  const [round, setRound]         = useState(0)
  const phaseRef                  = useRef(phase)
  phaseRef.current                = phase

  const lightPad = (padId: number, duration = 500) =>
    new Promise<void>((resolve) => {
      setLit(padId)
      setTimeout(() => { setLit(null); setTimeout(resolve, 150) }, duration)
    })

  const playSequence = useCallback(async (seq: number[]) => {
    setPhase('showing')
    await new Promise((r) => setTimeout(r, 600))
    for (const padId of seq) {
      await lightPad(padId, 500)
    }
    setPhase('input')
    setInputIdx(0)
  }, [])

  const startGame = () => {
    const first = Math.floor(Math.random() * 4)
    setSequence([first])
    setRound(1)
    playSequence([first])
  }

  const handlePad = async (padId: number) => {
    if (phase !== 'input') return
    await lightPad(padId, 200)

    const expected = sequence[inputIdx]
    if (padId !== expected) {
      setPhase('lose')
      onScore(round - 1)
      return
    }

    const nextIdx = inputIdx + 1
    if (nextIdx === sequence.length) {

      const nextSeq = [...sequence, Math.floor(Math.random() * 4)]
      setSequence(nextSeq)
      setRound((r) => r + 1)
      setTimeout(() => playSequence(nextSeq), 800)
    } else {
      setInputIdx(nextIdx)
    }
  }

  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-5 select-none">
      <div className="text-center">
        <p className="font-display text-xl font-bold text-ink">Simon Says</p>
        {phase === 'showing' && <p className="text-sm text-ink-soft animate-pulse">Watch the sequence…</p>}
        {phase === 'input'   && <p className="text-sm text-ink-soft">Your turn! Repeat it.</p>}
        {phase !== 'idle'    && phase !== 'lose' && phase !== 'win' &&
          <p className="mt-1 text-xs font-semibold text-plum">Round {round}</p>
        }
      </div>

      <div className="grid grid-cols-2 gap-3">
        {PADS.map((pad) => (
          <button
            key={pad.id}
            onClick={() => handlePad(pad.id)}
            disabled={phase !== 'input'}
            aria-label={pad.label}
            className="h-28 w-28 rounded-3xl transition-all duration-100 active:scale-95 disabled:cursor-default"
            style={{
              background: lit === pad.id ? pad.activeBg : pad.bg,
              boxShadow: lit === pad.id
                ? `0 0 30px ${pad.activeBg}, 0 0 8px ${pad.activeBg}`
                : '6px 6px 14px rgba(0,0,0,0.15), -4px -4px 10px rgba(255,255,255,0.5)',
              transform: lit === pad.id ? 'scale(1.06)' : undefined,
            }}
          />
        ))}
      </div>

      {phase === 'idle' && (
        <ClayButton accent="mint" size="lg" onClick={startGame}>Start Game</ClayButton>
      )}

      {phase === 'lose' && (
        <div className="flex flex-col items-center gap-3">
          <p className="font-display text-lg font-bold text-rose-500">Wrong! You reached round {round - 1}</p>
          <ClayButton accent="peach" onClick={startGame}>
            <RotateCcw size={15} aria-hidden="true" /> Try Again
          </ClayButton>
        </div>
      )}
    </div>
  )
}

export default SimonSays
