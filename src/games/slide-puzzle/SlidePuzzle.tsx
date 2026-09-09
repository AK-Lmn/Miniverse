import { useState, useCallback } from 'react'
import type { GameComponentProps } from '../../types'
import { ClayButton } from '../../components/ui/Clay'
import { RotateCcw, Shuffle } from 'lucide-react'

const SIZE  = 4
const TOTAL = SIZE * SIZE

function createSolvedBoard() {
  return Array.from({ length: TOTAL }, (_, i) => (i < TOTAL - 1 ? i + 1 : 0))
}

function isSolved(board: number[]) {
  return board.every((v, i) => v === (i < TOTAL - 1 ? i + 1 : 0))
}

function shuffleBoard(board: number[]): number[] {
  const b = [...board]
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[b[i], b[j]] = [b[j], b[i]]
  }

  const inversions = b
    .filter((v) => v !== 0)
    .reduce((acc, v, i, arr) => acc + arr.slice(i + 1).filter((w) => w !== 0 && w < v).length, 0)
  const blankRow = Math.floor(b.indexOf(0) / SIZE)
  const rowFromBottom = SIZE - blankRow
  const solvable = rowFromBottom % 2 === 0 ? inversions % 2 !== 0 : inversions % 2 === 0
  if (!solvable) {

    const i0 = b.findIndex((v, i) => v !== 0 && i !== b.indexOf(0))
    const i1 = b.findIndex((v, i) => v !== 0 && i !== b.indexOf(0) && i !== i0)
    ;[b[i0], b[i1]] = [b[i1], b[i0]]
  }
  return b
}

export function SlidePuzzle({ onScore }: GameComponentProps) {
  const [board, setBoard]   = useState(() => shuffleBoard(createSolvedBoard()))
  const [moves, setMoves]   = useState(0)
  const [won, setWon]       = useState(false)

  const handleTile = useCallback((idx: number) => {
    if (won) return
    const blankIdx = board.indexOf(0)
    const row = Math.floor(idx / SIZE)
    const col = idx % SIZE
    const bRow = Math.floor(blankIdx / SIZE)
    const bCol = blankIdx % SIZE
    const adjacent = (row === bRow && Math.abs(col - bCol) === 1) ||
                     (col === bCol && Math.abs(row - bRow) === 1)
    if (!adjacent) return
    const next = [...board]
    ;[next[idx], next[blankIdx]] = [next[blankIdx], next[idx]]
    const newMoves = moves + 1
    setBoard(next)
    setMoves(newMoves)
    if (isSolved(next)) {
      setWon(true)
      onScore(Math.max(500 - newMoves * 5, 10))
    }
  }, [board, moves, won, onScore])

  const restart = () => {
    setBoard(shuffleBoard(createSolvedBoard()))
    setMoves(0)
    setWon(false)
  }

  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-4 select-none">
      <div className="flex w-full items-center justify-between">
        <p className="text-sm font-semibold text-ink-soft">Moves: <span className="font-bold text-ink">{moves}</span></p>
        <button onClick={restart} className="clay-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-ink">
          <Shuffle size={13} aria-hidden="true" /> Shuffle
        </button>
      </div>

      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)`, width: '100%' }}
        role="grid"
        aria-label="Slide puzzle grid"
      >
        {board.map((value, idx) => (
          <button
            key={idx}
            onClick={() => handleTile(idx)}
            disabled={value === 0 || won}
            aria-label={value === 0 ? 'Empty tile' : `Tile ${value}`}
            className={`clay-btn flex h-16 items-center justify-center rounded-2xl font-display text-xl font-black transition-all ${
              value === 0 ? 'invisible' : 'text-ink hover:scale-105'
            }`}
          >
            {value !== 0 ? value : ''}
          </button>
        ))}
      </div>

      {won && (
        <div className="flex flex-col items-center gap-3 animate-pop-in">
          <p className="font-display text-xl font-bold text-mint-dark">Solved in {moves} moves! 🎉</p>
          <ClayButton accent="mint" onClick={restart}>
            <RotateCcw size={15} aria-hidden="true" /> Play Again
          </ClayButton>
        </div>
      )}
    </div>
  )
}

export default SlidePuzzle
