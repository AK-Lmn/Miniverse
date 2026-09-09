import { useEffect, useRef, useState } from 'react'
import { playSfx } from '../../lib/sound'
import type { GameComponentProps } from '../../types'
import { ClayButton, ClayCard } from '../../components/ui/Clay'

const COLS = 18
const ROWS = 18
const CELL = 18

type Point = { x: number; y: number }
type Dir = 'up' | 'down' | 'left' | 'right'

const OPPOSITE: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' }

function randomFood(snake: Point[]): Point {
  let food: Point
  do {
    food = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }
  } while (snake.some((s) => s.x === food.x && s.y === food.y))
  return food
}

export function Snake({ onScore, soundEnabled }: GameComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState<'ready' | 'playing' | 'over'>('ready')
  const [score, setScore] = useState(0)
  const stateRef = useRef({
    snake: [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }] as Point[],
    dir: 'right' as Dir,
    nextDir: 'right' as Dir,
    food: { x: 12, y: 9 } as Point,
    speed: 140,
  })
  const rafRef = useRef<number | null>(null)
  const lastTickRef = useRef(0)

  const draw = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { snake, food } = stateRef.current

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#F1E9DB'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = '#F7B899'
    ctx.beginPath()
    ctx.roundRect(food.x * CELL + 2, food.y * CELL + 2, CELL - 4, CELL - 4, 6)
    ctx.fill()

    snake.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? '#6A4FA3' : '#C9B8F5'
      ctx.beginPath()
      ctx.roundRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2, 5)
      ctx.fill()
    })
  }

  const resetGame = () => {
    stateRef.current = {
      snake: [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }],
      dir: 'right',
      nextDir: 'right',
      food: randomFood([{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }]),
      speed: 140,
    }
    setScore(0)
    setStatus('playing')
    lastTickRef.current = 0
    draw()
  }

  const tick = () => {
    const s = stateRef.current
    s.dir = s.nextDir
    const head = { ...s.snake[0] }
    if (s.dir === 'up') head.y -= 1
    if (s.dir === 'down') head.y += 1
    if (s.dir === 'left') head.x -= 1
    if (s.dir === 'right') head.x += 1

    const hitWall = head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS
    const hitSelf = s.snake.some((seg) => seg.x === head.x && seg.y === head.y)

    if (hitWall || hitSelf) {
      setStatus('over')
      playSfx('gameOver', soundEnabled)
      return
    }

    const ateFood = head.x === s.food.x && head.y === s.food.y
    const newSnake = [head, ...s.snake]
    if (ateFood) {
      s.food = randomFood(newSnake)
      s.speed = Math.max(70, s.speed - 3)
      playSfx('score', soundEnabled)
      setScore((sc) => sc + 10)
    } else {
      newSnake.pop()
    }
    s.snake = newSnake
    draw()
  }

  useEffect(() => {
    if (status !== 'playing') {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }
    const loop = (t: number) => {
      if (t - lastTickRef.current >= stateRef.current.speed) {
        lastTickRef.current = t
        tick()
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }

  }, [status])

  useEffect(() => {
    if (status === 'over') onScore(score)

  }, [status])

  useEffect(() => {
    const keyMap: Record<string, Dir> = {
      ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down',
      ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right',
    }
    const onKey = (e: KeyboardEvent) => {
      const dir = keyMap[e.key]
      if (!dir) return
      e.preventDefault()
      if (status !== 'playing') return
      if (dir !== OPPOSITE[stateRef.current.dir]) stateRef.current.nextDir = dir
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [status])

  useEffect(() => { draw() }, [])

  const setDir = (dir: Dir) => {
    if (status !== 'playing') return
    if (dir !== OPPOSITE[stateRef.current.dir]) stateRef.current.nextDir = dir
  }

  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return
    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = e.changedTouches[0].clientY - touchStart.current.y
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return
    if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? 'right' : 'left')
    else setDir(dy > 0 ? 'down' : 'up')
    touchStart.current = null
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <ClayCard accent="lavender" className="px-5 py-2 text-center">
        <p className="text-xs font-semibold text-ink-soft">Score</p>
        <p className="font-display text-xl font-bold text-ink">{score}</p>
      </ClayCard>

      <div className="clay-inset touch-none rounded-3xl p-2" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <canvas
          ref={canvasRef}
          width={COLS * CELL}
          height={ROWS * CELL}
          className="rounded-2xl"
          style={{ width: 'min(90vw, 340px)', height: 'min(90vw, 340px)' }}
          role="img"
          aria-label="Snake game board"
        />
      </div>

      {status === 'ready' && (
        <ClayButton accent="mint" size="lg" onClick={resetGame}>Start Game</ClayButton>
      )}
      {status === 'over' && (
        <ClayButton accent="mint" size="lg" onClick={resetGame}>Play Again</ClayButton>
      )}

      <div className="grid grid-cols-3 gap-2 sm:hidden">
        <span />
        <ClayButton size="sm" onClick={() => setDir('up')} aria-label="Move up">↑</ClayButton>
        <span />
        <ClayButton size="sm" onClick={() => setDir('left')} aria-label="Move left">←</ClayButton>
        <ClayButton size="sm" onClick={() => setDir('down')} aria-label="Move down">↓</ClayButton>
        <ClayButton size="sm" onClick={() => setDir('right')} aria-label="Move right">→</ClayButton>
      </div>
      <p className="hidden text-xs text-ink-soft sm:block">Arrow keys or WASD to move</p>
    </div>
  )
}

export default Snake
