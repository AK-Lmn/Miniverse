import { useEffect, useRef, useState } from 'react'
import { Flag } from 'lucide-react'
import { playSfx } from '../../lib/sound'
import { highScoreStore } from '../../lib/storage'
import type { GameComponentProps } from '../../types'
import { ClayButton, ClayCard } from '../../components/ui/Clay'

interface Level {
  name: 'beginner' | 'intermediate' | 'expert'
  rows: number
  cols: number
  mines: number
}

const LEVELS: Level[] = [
  { name: 'beginner', rows: 9, cols: 9, mines: 10 },
  { name: 'intermediate', rows: 12, cols: 12, mines: 24 },
  { name: 'expert', rows: 14, cols: 12, mines: 36 },
]

interface CellState {
  mine: boolean
  revealed: boolean
  flagged: boolean
  adjacent: number
}

function buildBoard(level: Level, safeIndex: number): CellState[] {
  const total = level.rows * level.cols
  const board: CellState[] = Array.from({ length: total }, () => ({
    mine: false,
    revealed: false,
    flagged: false,
    adjacent: 0,
  }))

  let placed = 0
  while (placed < level.mines) {
    const idx = Math.floor(Math.random() * total)
    if (idx === safeIndex || board[idx].mine) continue
    board[idx].mine = true
    placed++
  }

  const neighbors = (i: number) => {
    const r = Math.floor(i / level.cols)
    const c = i % level.cols
    const out: number[] = []
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue
        const nr = r + dr
        const nc = c + dc
        if (nr >= 0 && nr < level.rows && nc >= 0 && nc < level.cols) out.push(nr * level.cols + nc)
      }
    }
    return out
  }

  board.forEach((cell, i) => {
    if (!cell.mine) cell.adjacent = neighbors(i).filter((n) => board[n].mine).length
  })

  return board
}

export function Minesweeper({ onScore, soundEnabled }: GameComponentProps) {
  const [level, setLevel] = useState<Level>(LEVELS[0])
  const [board, setBoard] = useState<CellState[] | null>(null)
  const [status, setStatus] = useState<'ready' | 'playing' | 'won' | 'lost'>('ready')
  const [seconds, setSeconds] = useState(0)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => () => { if (intervalRef.current) window.clearInterval(intervalRef.current) }, [])

  const reset = (lvl: Level) => {
    setLevel(lvl)
    setBoard(null)
    setStatus('ready')
    setSeconds(0)
    if (intervalRef.current) window.clearInterval(intervalRef.current)
  }

  const neighbors = (i: number, lvl: Level) => {
    const r = Math.floor(i / lvl.cols)
    const c = i % lvl.cols
    const out: number[] = []
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue
        const nr = r + dr
        const nc = c + dc
        if (nr >= 0 && nr < lvl.rows && nc >= 0 && nc < lvl.cols) out.push(nr * lvl.cols + nc)
      }
    }
    return out
  }

  const floodReveal = (b: CellState[], start: number, lvl: Level) => {
    const stack = [start]
    const seen = new Set<number>()
    while (stack.length) {
      const i = stack.pop()!
      if (seen.has(i) || b[i].revealed || b[i].flagged) continue
      seen.add(i)
      b[i].revealed = true
      if (b[i].adjacent === 0 && !b[i].mine) {
        for (const n of neighbors(i, lvl)) stack.push(n)
      }
    }
  }

  const reveal = (i: number) => {
    if (status === 'won' || status === 'lost') return
    if (board && board[i].flagged) return

    if (status === 'ready') {
      const fresh = buildBoard(level, i)
      floodReveal(fresh, i, level)
      if (fresh[i].mine) {
        // extremely unlucky safe-index edge case guard; rebuild without mine there
        fresh[i].mine = false
      }
      setBoard(fresh)
      setStatus('playing')
      intervalRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000)
      return
    }

    if (!board) return
    const next = board.map((c) => ({ ...c }))
    if (next[i].mine) {
      next.forEach((c) => { if (c.mine) c.revealed = true })
      setBoard(next)
      setStatus('lost')
      if (intervalRef.current) window.clearInterval(intervalRef.current)
      playSfx('wrong', soundEnabled)
      onScore(0)
      return
    }
    floodReveal(next, i, level)
    setBoard(next)

    const won = next.every((c) => c.mine || c.revealed)
    if (won) {
      setStatus('won')
      if (intervalRef.current) window.clearInterval(intervalRef.current)
      playSfx('achievement', soundEnabled)
      if (level.name === 'expert') highScoreStore.submit('minesweeper-expert', 1)
      onScore(1)
    }
  }

  const toggleFlag = (e: React.MouseEvent, i: number) => {
    e.preventDefault()
    if (!board || status === 'won' || status === 'lost') return
    if (board[i].revealed) return
    const next = board.map((c) => ({ ...c }))
    next[i].flagged = !next[i].flagged
    setBoard(next)
    playSfx('click', soundEnabled)
  }

  const flagsUsed = board?.filter((c) => c.flagged).length ?? 0
  const numberColors = ['', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#F59E0B', '#06B6D4', '#EC4899', '#78716C']

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap justify-center gap-2">
        {LEVELS.map((lvl) => (
          <ClayButton
            key={lvl.name}
            size="sm"
            accent={level.name === lvl.name ? 'mint' : 'lavender'}
            onClick={() => reset(lvl)}
          >
            {lvl.name[0].toUpperCase() + lvl.name.slice(1)}
          </ClayButton>
        ))}
      </div>

      <div className="grid w-full max-w-md grid-cols-3 gap-3">
        <ClayCard accent="peach" className="px-3 py-2 text-center">
          <p className="text-xs font-semibold text-ink-soft">Mines Left</p>
          <p className="font-display text-lg font-bold text-ink">{level.mines - flagsUsed}</p>
        </ClayCard>
        <ClayCard accent="lavender" className="px-3 py-2 text-center">
          <p className="text-xs font-semibold text-ink-soft">Time</p>
          <p className="font-display text-lg font-bold text-ink">{seconds}s</p>
        </ClayCard>
        <ClayCard accent="mint" className="px-3 py-2 text-center">
          <p className="text-xs font-semibold text-ink-soft">Status</p>
          <p className="font-display text-sm font-bold text-ink">
            {status === 'won' ? '🎉 Won' : status === 'lost' ? '💥 Lost' : status === 'playing' ? 'Playing' : 'Tap to begin'}
          </p>
        </ClayCard>
      </div>

      <div
        className="clay-inset grid gap-[3px] rounded-2xl p-2"
        style={{ gridTemplateColumns: `repeat(${level.cols}, minmax(0,1fr))`, maxWidth: '100%', overflowX: 'auto' }}
      >
        {(board ?? Array.from({ length: level.rows * level.cols }, () => ({ mine: false, revealed: false, flagged: false, adjacent: 0 }))).map(
          (cell, i) => (
            <button
              key={i}
              onClick={() => reveal(i)}
              onContextMenu={(e) => toggleFlag(e, i)}
              aria-label={cell.revealed ? (cell.mine ? 'Mine' : `${cell.adjacent} adjacent mines`) : cell.flagged ? 'Flagged' : 'Hidden cell'}
              className="flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold sm:h-7 sm:w-7"
              style={{
                background: cell.revealed ? (cell.mine ? 'var(--color-peach-dark)' : 'var(--color-cream)') : 'var(--color-lavender)',
                color: cell.adjacent ? numberColors[cell.adjacent] : undefined,
              }}
            >
              {cell.revealed ? (cell.mine ? '💣' : cell.adjacent || '') : cell.flagged ? <Flag size={12} /> : ''}
            </button>
          )
        )}
      </div>
      <p className="text-xs text-ink-soft">Tap to reveal · Right-click / long-press to flag</p>

      {(status === 'won' || status === 'lost') && (
        <ClayButton accent="mint" size="lg" onClick={() => reset(level)}>
          Play Again
        </ClayButton>
      )}
    </div>
  )
}

export default Minesweeper
