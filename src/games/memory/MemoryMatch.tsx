import { useEffect, useMemo, useState } from 'react'
import { playSfx } from '../../lib/sound'
import type { GameComponentProps } from '../../types'
import { ClayButton, ClayCard } from '../../components/ui/Clay'

const EMOJI_SET = ['🍓', '🍋', '🍇', '🍊', '🍉', '🍑', '🍒', '🥝', '🍍', '🥥', '🍌', '🫐']

type BoardSize = 12 | 16 | 24

interface Card {
  id: number
  symbol: string
  flipped: boolean
  matched: boolean
}

function buildDeck(size: BoardSize): Card[] {
  const pairCount = size / 2
  const symbols = EMOJI_SET.slice(0, pairCount)
  const deck = [...symbols, ...symbols]
    .sort(() => Math.random() - 0.5)
    .map((symbol, id) => ({ id, symbol, flipped: false, matched: false }))
  return deck
}

export function MemoryMatch({ onScore, soundEnabled }: GameComponentProps) {
  const [size, setSize] = useState<BoardSize>(12)
  const [cards, setCards] = useState<Card[]>(() => buildDeck(12))
  const [selected, setSelected] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [best, setBest] = useState<Record<number, number>>({})

  const allMatched = useMemo(() => cards.every((c) => c.matched), [cards])
  const cols = size === 12 ? 4 : size === 16 ? 4 : 6

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => window.clearInterval(id)
  }, [running])

  useEffect(() => {
    if (allMatched && cards.length > 0 && running) {
      setRunning(false)
      playSfx('achievement', soundEnabled)
      setBest((b) => {
        const prevBest = b[size]
        const isBest = prevBest === undefined || moves < prevBest
        return isBest ? { ...b, [size]: moves } : b
      })
      // Fewer moves & less time = higher score
      const score = Math.max(0, 1000 - moves * 10 - seconds * 2)
      onScore(score)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMatched])

  const newGame = (nextSize: BoardSize = size) => {
    setSize(nextSize)
    setCards(buildDeck(nextSize))
    setSelected([])
    setMoves(0)
    setSeconds(0)
    setRunning(true)
  }

  const flip = (id: number) => {
    if (selected.length === 2) return
    const card = cards.find((c) => c.id === id)
    if (!card || card.flipped || card.matched) return
    if (!running) setRunning(true)

    const nextSelected = [...selected, id]
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, flipped: true } : c)))
    setSelected(nextSelected)

    if (nextSelected.length === 2) {
      setMoves((m) => m + 1)
      const [a] = nextSelected
      const cardA = cards.find((c) => c.id === a)!
      const cardB = card
      if (cardA.symbol === cardB.symbol) {
        playSfx('correct', soundEnabled)
        window.setTimeout(() => {
          setCards((cs) => cs.map((c) => (c.id === a || c.id === id ? { ...c, matched: true } : c)))
          setSelected([])
        }, 300)
      } else {
        window.setTimeout(() => {
          setCards((cs) => cs.map((c) => (c.id === a || c.id === id ? { ...c, flipped: false } : c)))
          setSelected([])
        }, 700)
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex gap-2">
        {([12, 16, 24] as BoardSize[]).map((s) => (
          <ClayButton key={s} size="sm" accent={size === s ? 'mint' : 'lavender'} onClick={() => newGame(s)}>
            {s} cards
          </ClayButton>
        ))}
      </div>

      <div className="grid w-full max-w-md grid-cols-3 gap-3">
        <ClayCard accent="lavender" className="px-3 py-3 text-center">
          <p className="text-xs font-semibold text-ink-soft">Moves</p>
          <p className="font-display text-lg font-bold text-ink">{moves}</p>
        </ClayCard>
        <ClayCard accent="peach" className="px-3 py-3 text-center">
          <p className="text-xs font-semibold text-ink-soft">Time</p>
          <p className="font-display text-lg font-bold text-ink">{seconds}s</p>
        </ClayCard>
        <ClayCard accent="mint" className="px-3 py-3 text-center">
          <p className="text-xs font-semibold text-ink-soft">Best Moves</p>
          <p className="font-display text-lg font-bold text-ink">{best[size] ?? '—'}</p>
        </ClayCard>
      </div>

      <div
        className="grid w-full max-w-md gap-2 sm:gap-3"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
      >
        {cards.map((c) => (
          <button
            key={c.id}
            onClick={() => flip(c.id)}
            aria-label={c.flipped || c.matched ? c.symbol : 'Hidden card'}
            className={`clay-inset flex aspect-square items-center justify-center rounded-2xl text-2xl transition-transform sm:text-3xl ${
              c.matched ? 'opacity-50' : ''
            }`}
            style={{ background: c.flipped || c.matched ? 'var(--color-butter)' : 'var(--color-lavender)' }}
          >
            {(c.flipped || c.matched) && <span className="animate-pop-in">{c.symbol}</span>}
          </button>
        ))}
      </div>

      {allMatched && (
        <ClayButton accent="mint" size="lg" onClick={() => newGame()}>
          Play Again
        </ClayButton>
      )}
    </div>
  )
}

export default MemoryMatch
