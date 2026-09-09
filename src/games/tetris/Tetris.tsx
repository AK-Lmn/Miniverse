import { useEffect, useRef, useState } from 'react'
import { playSfx } from '../../lib/sound'
import type { GameComponentProps } from '../../types'
import { ClayButton, ClayCard } from '../../components/ui/Clay'

const COLS = 10
const ROWS = 20
const CELL = 18

type Matrix = number[][]

const SHAPES: Record<string, Matrix> = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]],
}
const COLORS: Record<string, string> = {
  I: '#A9D7F5', O: '#F5DD8A', T: '#C9B8F5', S: '#A6E8C6',
  Z: '#F3A8C4', J: '#8FB3EE', L: '#F7B899',
}
const KEYS = Object.keys(SHAPES)

function rotate(m: Matrix): Matrix {
  const rows = m.length
  const cols = m[0].length
  const out: Matrix = Array.from({ length: cols }, () => Array(rows).fill(0))
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out[c][rows - 1 - r] = m[r][c]
  return out
}

function emptyGrid(): number[][] {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0))
}

interface Piece { key: string; shape: Matrix; x: number; y: number }

function randomPiece(): Piece {
  const key = KEYS[Math.floor(Math.random() * KEYS.length)]
  return { key, shape: SHAPES[key], x: Math.floor(COLS / 2) - 1, y: 0 }
}

function collides(grid: number[][], piece: Piece, dx = 0, dy = 0, shape = piece.shape): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue
      const x = piece.x + c + dx
      const y = piece.y + r + dy
      if (x < 0 || x >= COLS || y >= ROWS) return true
      if (y >= 0 && grid[y][x]) return true
    }
  }
  return false
}

export function Tetris({ onScore, soundEnabled }: GameComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState<'ready' | 'playing' | 'paused' | 'over'>('ready')
  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [level, setLevel] = useState(1)
  const [nextKey, setNextKey] = useState('I')

  const gridRef = useRef<number[][]>(emptyGrid())
  const pieceRef = useRef<Piece>(randomPiece())
  const nextRef = useRef<Piece>(randomPiece())
  const colorGridRef = useRef<string[][]>(Array.from({ length: ROWS }, () => Array(COLS).fill('')))
  const rafRef = useRef<number | null>(null)
  const lastTickRef = useRef(0)
  const statusRef = useRef(status)
  statusRef.current = status

  const draw = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#FBF6EF'
    ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL)

    const grid = gridRef.current
    const colors = colorGridRef.current
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c]) {
          ctx.fillStyle = colors[r][c]
          ctx.beginPath()
          ctx.roundRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2, 4)
          ctx.fill()
        }
      }
    }

    const p = pieceRef.current
    ctx.fillStyle = COLORS[p.key]
    p.shape.forEach((row, r) => row.forEach((v, c) => {
      if (!v) return
      const y = p.y + r
      if (y < 0) return
      ctx.beginPath()
      ctx.roundRect((p.x + c) * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2, 4)
      ctx.fill()
    }))

    ctx.strokeStyle = 'rgba(150,130,180,0.12)'
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, ROWS * CELL); ctx.stroke()
    }
  }

  const lockPiece = () => {
    const p = pieceRef.current
    const grid = gridRef.current
    const colors = colorGridRef.current
    p.shape.forEach((row, r) => row.forEach((v, c) => {
      if (!v) return
      const y = p.y + r
      const x = p.x + c
      if (y >= 0) { grid[y][x] = 1; colors[y][x] = COLORS[p.key] }
    }))

    let cleared = 0
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r].every((v) => v)) {
        grid.splice(r, 1)
        colors.splice(r, 1)
        grid.unshift(Array(COLS).fill(0))
        colors.unshift(Array(COLS).fill(''))
        cleared++
        r++
      }
    }
    if (cleared > 0) {
      playSfx(cleared >= 4 ? 'achievement' : 'score', soundEnabled)
      setLines((l) => {
        const nl = l + cleared
        setLevel(1 + Math.floor(nl / 10))
        return nl
      })
      setScore((s) => s + [0, 100, 300, 500, 800][cleared] * level)
    }

    pieceRef.current = nextRef.current
    nextRef.current = randomPiece()
    setNextKey(nextRef.current.key)

    if (collides(grid, pieceRef.current)) {
      setStatus('over')
      playSfx('gameOver', soundEnabled)
    }
  }

  const softDrop = () => {
    const p = pieceRef.current
    if (!collides(gridRef.current, p, 0, 1)) {
      p.y += 1
    } else {
      lockPiece()
    }
    draw()
  }

  const hardDrop = () => {
    const p = pieceRef.current
    while (!collides(gridRef.current, p, 0, 1)) p.y += 1
    lockPiece()
    draw()
  }

  const moveHorizontal = (dx: number) => {
    const p = pieceRef.current
    if (!collides(gridRef.current, p, dx, 0)) { p.x += dx; draw() }
  }

  const rotatePiece = () => {
    const p = pieceRef.current
    const rotated = rotate(p.shape)
    if (!collides(gridRef.current, p, 0, 0, rotated)) {
      p.shape = rotated
      draw()
    } else if (!collides(gridRef.current, { ...p, x: p.x - 1 }, 0, 0, rotated)) {
      p.x -= 1; p.shape = rotated; draw()
    } else if (!collides(gridRef.current, { ...p, x: p.x + 1 }, 0, 0, rotated)) {
      p.x += 1; p.shape = rotated; draw()
    }
  }

  const start = () => {
    gridRef.current = emptyGrid()
    colorGridRef.current = Array.from({ length: ROWS }, () => Array(COLS).fill(''))
    pieceRef.current = randomPiece()
    nextRef.current = randomPiece()
    setNextKey(nextRef.current.key)
    setScore(0)
    setLines(0)
    setLevel(1)
    setStatus('playing')
    lastTickRef.current = 0
    draw()
  }

  useEffect(() => {
    if (status !== 'playing') {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }
    const loop = (t: number) => {
      const speed = Math.max(90, 700 - (level - 1) * 60)
      if (t - lastTickRef.current >= speed) {
        lastTickRef.current = t
        softDrop()
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }

  }, [status, level])

  useEffect(() => {
    if (status === 'over') onScore(score)

  }, [status])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (statusRef.current !== 'playing') return
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' ', 'Spacebar'].includes(e.key)) e.preventDefault()
      if (e.key === 'ArrowLeft') moveHorizontal(-1)
      if (e.key === 'ArrowRight') moveHorizontal(1)
      if (e.key === 'ArrowDown') softDrop()
      if (e.key === 'ArrowUp') rotatePiece()
      if (e.key === ' ') hardDrop()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)

  }, [])

  useEffect(() => { draw() }, [])

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid w-full max-w-xs grid-cols-3 gap-2">
        <ClayCard accent="lavender" className="px-2 py-2 text-center">
          <p className="text-[10px] font-semibold text-ink-soft">Score</p>
          <p className="font-display text-base font-bold text-ink">{score}</p>
        </ClayCard>
        <ClayCard accent="mint" className="px-2 py-2 text-center">
          <p className="text-[10px] font-semibold text-ink-soft">Lines</p>
          <p className="font-display text-base font-bold text-ink">{lines}</p>
        </ClayCard>
        <ClayCard accent="peach" className="px-2 py-2 text-center">
          <p className="text-[10px] font-semibold text-ink-soft">Level</p>
          <p className="font-display text-base font-bold text-ink">{level}</p>
        </ClayCard>
      </div>

      <div className="flex items-start gap-3">
        <div className="clay-inset rounded-2xl p-1 flex justify-center">
          <canvas
            ref={canvasRef}
            width={COLS * CELL}
            height={ROWS * CELL}
            className="rounded-xl block w-full h-auto"
            style={{ maxWidth: '190px', aspectRatio: `${COLS}/${ROWS}` }}
          />
        </div>
        <ClayCard accent="butter" className="hidden px-3 py-3 text-center sm:block">
          <p className="text-[10px] font-semibold text-ink-soft">Next</p>
          <p className="mt-1 text-2xl" style={{ color: COLORS[nextKey] }}>▣</p>
        </ClayCard>
      </div>

      {status !== 'playing' && (
        <ClayButton accent="mint" size="lg" onClick={start}>
          {status === 'over' ? 'Play Again' : 'Start Game'}
        </ClayButton>
      )}
      {status === 'over' && <p className="font-display font-bold text-ink">Game Over — Score {score}</p>}

      <div className="grid grid-cols-4 gap-2 sm:hidden">
        <ClayButton size="sm" onClick={() => moveHorizontal(-1)} aria-label="Left">←</ClayButton>
        <ClayButton size="sm" onClick={rotatePiece} aria-label="Rotate">↻</ClayButton>
        <ClayButton size="sm" onClick={() => moveHorizontal(1)} aria-label="Right">→</ClayButton>
        <ClayButton size="sm" onClick={hardDrop} aria-label="Drop">⬇</ClayButton>
      </div>
      <p className="hidden text-xs text-ink-soft sm:block">← → move · ↑ rotate · ↓ soft drop · Space hard drop</p>
    </div>
  )
}

export default Tetris
