import { useEffect, useState } from 'react'
import { playSfx } from '../../lib/sound'
import type { GameComponentProps } from '../../types'
import { ClayButton, ClayCard } from '../../components/ui/Clay'

type Cell = 'X' | 'O' | null
type Mode = 'pvp' | 'easy' | 'hard'

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

function winner(board: Cell[]): Cell {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a]
  }
  return null
}

function minimax(board: Cell[], player: 'X' | 'O'): { score: number; move?: number } {
  const w = winner(board)
  if (w === 'O') return { score: 1 }
  if (w === 'X') return { score: -1 }
  if (board.every((c) => c !== null)) return { score: 0 }

  const moves = board
    .map((c, i) => (c === null ? i : -1))
    .filter((i) => i !== -1)

  let best = player === 'O' ? -Infinity : Infinity
  let bestMove = moves[0]
  for (const m of moves) {
    const next = [...board]
    next[m] = player
    const result = minimax(next, player === 'O' ? 'X' : 'O')
    if (player === 'O' ? result.score > best : result.score < best) {
      best = result.score
      bestMove = m
    }
  }
  return { score: best, move: bestMove }
}

function aiMove(board: Cell[], mode: Mode): number {
  const empty = board.map((c, i) => (c === null ? i : -1)).filter((i) => i !== -1)
  if (mode === 'easy' && Math.random() < 0.65) {
    return empty[Math.floor(Math.random() * empty.length)]
  }
  return minimax(board, 'O').move ?? empty[0]
}

export function TicTacToe({ onScore, soundEnabled }: GameComponentProps) {
  const [mode, setMode] = useState<Mode>('pvp')
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null))
  const [turn, setTurn] = useState<'X' | 'O'>('X')
  const [scoreX, setScoreX] = useState(0)
  const [scoreO, setScoreO] = useState(0)
  const [draws, setDraws] = useState(0)

  const w = winner(board)
  const isDraw = !w && board.every((c) => c !== null)
  const isOver = !!w || isDraw

  useEffect(() => {
    if (mode !== 'pvp' && turn === 'O' && !isOver) {
      const t = window.setTimeout(() => {
        const move = aiMove(board, mode)
        const next = [...board]
        next[move] = 'O'
        setBoard(next)
        setTurn('X')
      }, 450)
      return () => window.clearTimeout(t)
    }
  }, [turn, mode, board, isOver])

  useEffect(() => {
    if (w) {
      playSfx(w === 'X' ? 'correct' : 'wrong', soundEnabled)
      if (w === 'X') setScoreX((s) => s + 1)
      else setScoreO((s) => s + 1)
      onScore(w === 'X' ? 1 : 0)
    } else if (isDraw) {
      setDraws((d) => d + 1)
      onScore(0.5)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, isDraw])

  const place = (i: number) => {
    if (board[i] || isOver) return
    if (mode !== 'pvp' && turn === 'O') return
    const next = [...board]
    next[i] = turn
    setBoard(next)
    playSfx('click', soundEnabled)
    setTurn(turn === 'X' ? 'O' : 'X')
  }

  const reset = () => {
    setBoard(Array(9).fill(null))
    setTurn('X')
  }

  const changeMode = (m: Mode) => {
    setMode(m)
    setBoard(Array(9).fill(null))
    setTurn('X')
    setScoreX(0)
    setScoreO(0)
    setDraws(0)
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex gap-2">
        <ClayButton size="sm" accent={mode === 'pvp' ? 'mint' : 'lavender'} onClick={() => changeMode('pvp')}>
          2 Players
        </ClayButton>
        <ClayButton size="sm" accent={mode === 'easy' ? 'mint' : 'lavender'} onClick={() => changeMode('easy')}>
          vs AI (Easy)
        </ClayButton>
        <ClayButton size="sm" accent={mode === 'hard' ? 'mint' : 'lavender'} onClick={() => changeMode('hard')}>
          vs AI (Hard)
        </ClayButton>
      </div>

      <div className="grid w-full max-w-xs grid-cols-3 gap-3">
        <ClayCard accent="lavender" className="px-2 py-2 text-center">
          <p className="text-xs font-semibold text-ink-soft">X</p>
          <p className="font-display text-lg font-bold text-ink">{scoreX}</p>
        </ClayCard>
        <ClayCard accent="peach" className="px-2 py-2 text-center">
          <p className="text-xs font-semibold text-ink-soft">Draws</p>
          <p className="font-display text-lg font-bold text-ink">{draws}</p>
        </ClayCard>
        <ClayCard accent="mint" className="px-2 py-2 text-center">
          <p className="text-xs font-semibold text-ink-soft">O</p>
          <p className="font-display text-lg font-bold text-ink">{scoreO}</p>
        </ClayCard>
      </div>

      <p className="font-display font-bold text-ink" aria-live="polite">
        {w ? `${w} wins!` : isDraw ? "It's a draw!" : `${turn}'s turn`}
      </p>

      <div className="grid w-full max-w-xs grid-cols-3 gap-3">
        {board.map((c, i) => (
          <button
            key={i}
            onClick={() => place(i)}
            aria-label={c ? `Cell ${i}: ${c}` : `Empty cell ${i}`}
            className="clay-inset flex aspect-square items-center justify-center rounded-2xl font-display text-4xl font-extrabold text-ink"
            style={{ background: 'var(--color-cream)' }}
          >
            {c && <span className="animate-pop-in">{c}</span>}
          </button>
        ))}
      </div>

      {isOver && (
        <ClayButton accent="mint" size="lg" onClick={reset}>
          Play Again
        </ClayButton>
      )}
    </div>
  )
}

export default TicTacToe
