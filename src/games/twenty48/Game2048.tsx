import { useCallback, useEffect, useRef, useState } from 'react'
import { playSfx } from '../../lib/sound'
import type { GameComponentProps } from '../../types'
import { ClayButton, ClayCard } from '../../components/ui/Clay'

type Board = number[][]
const SIZE = 4

function emptyBoard(): Board {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0))
}

function addRandomTile(board: Board): Board {
  const empties: [number, number][] = []
  board.forEach((row, r) => row.forEach((v, c) => { if (v === 0) empties.push([r, c]) }))
  if (!empties.length) return board
  const [r, c] = empties[Math.floor(Math.random() * empties.length)]
  const next = board.map((row) => [...row])
  next[r][c] = Math.random() < 0.9 ? 2 : 4
  return next
}

function slideRow(row: number[]): { row: number[]; gained: number; moved: boolean } {
  const filtered = row.filter((v) => v !== 0)
  const result: number[] = []
  let gained = 0
  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] === filtered[i + 1]) {
      const merged = filtered[i] * 2
      result.push(merged)
      gained += merged
      i++
    } else {
      result.push(filtered[i])
    }
  }
  while (result.length < SIZE) result.push(0)
  const moved = row.some((v, i) => v !== result[i])
  return { row: result, gained, moved }
}

function rotateLeft(board: Board): Board {
  const next = emptyBoard()
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) next[SIZE - 1 - c][r] = board[r][c]
  return next
}

function move(board: Board, dir: 'left' | 'right' | 'up' | 'down') {
  let b = board
  let rotations = 0
  if (dir === 'up') rotations = 3
  else if (dir === 'right') rotations = 2
  else if (dir === 'down') rotations = 1
  for (let i = 0; i < rotations; i++) b = rotateLeft(b)

  let gained = 0
  let moved = false
  const next = b.map((row) => {
    const res = slideRow(row)
    gained += res.gained
    if (res.moved) moved = true
    return res.row
  })

  let result = next
  for (let i = 0; i < (4 - rotations) % 4; i++) result = rotateLeft(result)
  return { board: result, gained, moved }
}

function canMove(board: Board): boolean {
  for (const dir of ['left', 'right', 'up', 'down'] as const) {
    if (move(board, dir).moved) return true
  }
  return false
}

const TILE_COLORS: Record<number, string> = {
  2: '#F1E9DB', 4: '#FCEEC2', 8: '#F7B899', 16: '#F5A876',
  32: '#F5896A', 64: '#EF6C5B', 128: '#F5DD8A', 256: '#EAD15C',
  512: '#C9B8F5', 1024: '#A488EE', 2048: '#6A4FA3',
}

export function Game2048({ onScore, soundEnabled }: GameComponentProps) {
  const [board, setBoard] = useState<Board>(() => addRandomTile(addRandomTile(emptyBoard())))
  const [score, setScore] = useState(0)
  const [over, setOver] = useState(false)
  const [won, setWon] = useState(false)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const handleMove = useCallback(
    (dir: 'left' | 'right' | 'up' | 'down') => {
      if (over) return
      setBoard((prev) => {
        const result = move(prev, dir)
        if (!result.moved) return prev
        const withTile = addRandomTile(result.board)
        setScore((s) => {
          const ns = s + result.gained
          if (result.gained > 0) playSfx('click', soundEnabled)
          return ns
        })
        if (!won && withTile.some((row) => row.some((v) => v >= 2048))) {
          setWon(true)
          playSfx('achievement', soundEnabled)
        }
        if (!canMove(withTile)) {
          setOver(true)
          playSfx('gameOver', soundEnabled)
        }
        return withTile
      })
    },
    [over, won, soundEnabled]
  )

  useEffect(() => {
    if (over) onScore(score)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, 'left' | 'right' | 'up' | 'down'> = {
        ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
        a: 'left', d: 'right', w: 'up', s: 'down',
      }
      if (map[e.key]) {
        e.preventDefault()
        handleMove(map[e.key])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleMove])

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return
    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = e.changedTouches[0].clientY - touchStart.current.y
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return
    if (Math.abs(dx) > Math.abs(dy)) handleMove(dx > 0 ? 'right' : 'left')
    else handleMove(dy > 0 ? 'down' : 'up')
    touchStart.current = null
  }

  const restart = () => {
    setBoard(addRandomTile(addRandomTile(emptyBoard())))
    setScore(0)
    setOver(false)
    setWon(false)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full max-w-sm items-center justify-between gap-3">
        <ClayCard accent="lavender" className="flex-1 px-4 py-2 text-center">
          <p className="text-xs font-semibold text-ink-soft">Score</p>
          <p className="font-display text-xl font-bold text-ink">{score}</p>
        </ClayCard>
        <ClayButton size="sm" accent="peach" onClick={restart}>New Game</ClayButton>
      </div>

      <div
        className="clay-inset grid grid-cols-4 gap-2 rounded-3xl p-2 touch-none select-none"
        style={{ width: 'min(88vw, 360px)', height: 'min(88vw, 360px)' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {board.flatMap((row, r) =>
          row.map((v, c) => (
            <div
              key={`${r}-${c}`}
              className="flex items-center justify-center rounded-xl font-display font-extrabold transition-all"
              style={{
                background: v ? TILE_COLORS[v] ?? '#4E3980' : 'rgba(255,255,255,0.5)',
                color: v >= 8 ? '#FBF6EF' : '#453F5C',
                fontSize: v >= 1024 ? '1.1rem' : v >= 128 ? '1.3rem' : '1.6rem',
              }}
            >
              {v !== 0 && <span className="animate-pop-in">{v}</span>}
            </div>
          ))
        )}
      </div>

      <p className="text-xs text-ink-soft">Arrow keys / WASD, or swipe on mobile</p>

      {over && (
        <ClayCard accent="peach" className="px-6 py-4 text-center">
          <p className="font-display text-lg font-bold text-ink">Game Over — Score {score}</p>
        </ClayCard>
      )}
    </div>
  )
}

export default Game2048
