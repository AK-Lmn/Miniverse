import { useEffect, useRef, useState } from 'react'
import type { GameComponentProps } from '../../types'
import { playSfx } from '../../lib/sound'

interface Brick {
  x: number
  y: number
  w: number
  h: number
  color: string
  points: number
  alive: boolean
}

interface PowerUp {
  x: number
  y: number
  type: 'wide' | 'extra-life' | 'fast'
  alive: boolean
}

const CANVAS_WIDTH = 480
const CANVAS_HEIGHT = 520
const BRICK_ROWS = 5
const BRICK_COLS = 8
const PADDLE_HEIGHT = 12

export function Breakout({ onScore, soundEnabled }: GameComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle')
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)

  const stateRef = useRef({
    paddleX: CANVAS_WIDTH / 2 - 40,
    paddleWidth: 80,
    ballX: CANVAS_WIDTH / 2,
    ballY: CANVAS_HEIGHT - 40,
    ballSpeedX: 3.5,
    ballSpeedY: -4.5,
    ballRadius: 7,
    bricks: [] as Brick[],
    powerUps: [] as PowerUp[],
    score: 0,
    lives: 3,
    keys: { left: false, right: false },
    active: false,
  })

  const initBoard = (currentLives = 3) => {
    const bricks: Brick[] = []
    const colors = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6']
    const points = [50, 30, 20, 10, 5]
    const brickW = (CANVAS_WIDTH - 30) / BRICK_COLS
    const brickH = 18

    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        bricks.push({
          x: 15 + c * brickW,
          y: 45 + r * (brickH + 4),
          w: brickW - 4,
          h: brickH,
          color: colors[r % colors.length],
          points: points[r % points.length],
          alive: true,
        })
      }
    }

    stateRef.current = {
      paddleX: CANVAS_WIDTH / 2 - 40,
      paddleWidth: 80,
      ballX: CANVAS_WIDTH / 2,
      ballY: CANVAS_HEIGHT - 40,
      ballSpeedX: (Math.random() > 0.5 ? 1 : -1) * (3 + Math.random()),
      ballSpeedY: -4.5,
      ballRadius: 7,
      bricks,
      powerUps: [],
      score: currentLives === 3 ? 0 : stateRef.current.score,
      lives: currentLives,
      keys: { left: false, right: false },
      active: true,
    }
    setScore(stateRef.current.score)
    setLives(currentLives)
  }

  const startGame = () => {
    initBoard(3)
    setGameState('playing')
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        stateRef.current.keys.left = true
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        stateRef.current.keys.right = true
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        stateRef.current.keys.left = false
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        stateRef.current.keys.right = false
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || !stateRef.current.active) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS_WIDTH / rect.width
    const pointerX = (e.clientX - rect.left) * scaleX
    stateRef.current.paddleX = Math.max(
      0,
      Math.min(CANVAS_WIDTH - stateRef.current.paddleWidth, pointerX - stateRef.current.paddleWidth / 2)
    )
  }

  useEffect(() => {
    if (gameState !== 'playing') return
    let animId: number

    const updateAndDraw = () => {
      const cvs = canvasRef.current
      if (!cvs) return
      const ctx = cvs.getContext('2d')
      if (!ctx) return

      const s = stateRef.current

      if (s.keys.left) {
        s.paddleX = Math.max(0, s.paddleX - 6.5)
      }
      if (s.keys.right) {
        s.paddleX = Math.min(CANVAS_WIDTH - s.paddleWidth, s.paddleX + 6.5)
      }

      s.ballX += s.ballSpeedX
      s.ballY += s.ballSpeedY

      if (s.ballX - s.ballRadius <= 0) {
        s.ballX = s.ballRadius
        s.ballSpeedX = -s.ballSpeedX
        playSfx('click', soundEnabled)
      } else if (s.ballX + s.ballRadius >= CANVAS_WIDTH) {
        s.ballX = CANVAS_WIDTH - s.ballRadius
        s.ballSpeedX = -s.ballSpeedX
        playSfx('click', soundEnabled)
      }

      if (s.ballY - s.ballRadius <= 0) {
        s.ballY = s.ballRadius
        s.ballSpeedY = -s.ballSpeedY
        playSfx('click', soundEnabled)
      }

      const paddleY = CANVAS_HEIGHT - 25
      if (
        s.ballY + s.ballRadius >= paddleY &&
        s.ballY - s.ballRadius <= paddleY + PADDLE_HEIGHT &&
        s.ballX >= s.paddleX &&
        s.ballX <= s.paddleX + s.paddleWidth
      ) {
        s.ballY = paddleY - s.ballRadius
        const hitPos = (s.ballX - (s.paddleX + s.paddleWidth / 2)) / (s.paddleWidth / 2)
        s.ballSpeedX = hitPos * 5.5
        s.ballSpeedY = -Math.abs(s.ballSpeedY)
        playSfx('click', soundEnabled)
      }

      if (s.ballY + s.ballRadius >= CANVAS_HEIGHT) {
        s.lives -= 1
        setLives(s.lives)
        if (s.lives <= 0) {
          s.active = false
          setGameState('gameover')
          playSfx('gameOver', soundEnabled)
          onScore(s.score)
          return
        } else {

          s.ballX = s.paddleX + s.paddleWidth / 2
          s.ballY = CANVAS_HEIGHT - 40
          s.ballSpeedY = -4.5
          s.ballSpeedX = (Math.random() > 0.5 ? 1 : -1) * 3
          playSfx('wrong', soundEnabled)
        }
      }

      let aliveBricksCount = 0
      for (const brick of s.bricks) {
        if (!brick.alive) continue
        aliveBricksCount++

        if (
          s.ballX + s.ballRadius >= brick.x &&
          s.ballX - s.ballRadius <= brick.x + brick.w &&
          s.ballY + s.ballRadius >= brick.y &&
          s.ballY - s.ballRadius <= brick.y + brick.h
        ) {
          brick.alive = false
          s.ballSpeedY = -s.ballSpeedY
          s.score += brick.points
          setScore(s.score)
          playSfx('score', soundEnabled)

          if (Math.random() < 0.15) {
            const types: PowerUp['type'][] = ['wide', 'extra-life', 'fast']
            s.powerUps.push({
              x: brick.x + brick.w / 2,
              y: brick.y + brick.h,
              type: types[Math.floor(Math.random() * types.length)],
              alive: true,
            })
          }
          break
        }
      }

      if (aliveBricksCount === 0) {
        initBoard(s.lives)
        playSfx('levelUp', soundEnabled)
      }

      for (const p of s.powerUps) {
        if (!p.alive) continue
        p.y += 2

        if (
          p.y >= paddleY &&
          p.y <= paddleY + PADDLE_HEIGHT &&
          p.x >= s.paddleX &&
          p.x <= s.paddleX + s.paddleWidth
        ) {
          p.alive = false
          playSfx('correct', soundEnabled)
          if (p.type === 'wide') {
            s.paddleWidth = Math.min(140, s.paddleWidth + 24)
          } else if (p.type === 'extra-life') {
            s.lives = Math.min(5, s.lives + 1)
            setLives(s.lives)
          }
        }
      }

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      ctx.fillStyle = '#0F172A'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      for (const b of s.bricks) {
        if (!b.alive) continue
        ctx.fillStyle = b.color
        ctx.shadowColor = b.color
        ctx.shadowBlur = 6
        ctx.beginPath()
        ctx.roundRect(b.x, b.y, b.w, b.h, 4)
        ctx.fill()
      }
      ctx.shadowBlur = 0

      for (const p of s.powerUps) {
        if (!p.alive) continue
        ctx.fillStyle = p.type === 'wide' ? '#38BDF8' : p.type === 'extra-life' ? '#F43F5E' : '#FBBF24'
        ctx.beginPath()
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.fillStyle = '#38BDF8'
      ctx.shadowColor = '#38BDF8'
      ctx.shadowBlur = 8
      ctx.beginPath()
      ctx.roundRect(s.paddleX, paddleY, s.paddleWidth, PADDLE_HEIGHT, 6)
      ctx.fill()
      ctx.shadowBlur = 0

      ctx.fillStyle = '#F43F5E'
      ctx.shadowColor = '#F43F5E'
      ctx.shadowBlur = 8
      ctx.beginPath()
      ctx.arc(s.ballX, s.ballY, s.ballRadius, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      animId = requestAnimationFrame(updateAndDraw)
    }

    animId = requestAnimationFrame(updateAndDraw)
    return () => cancelAnimationFrame(animId)
  }, [gameState, soundEnabled, onScore])

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full max-w-[480px] items-center justify-between px-2 font-display text-sm font-bold">
        <div className="flex items-center gap-2">
          <span>Score: <span className="text-plum">{score}</span></span>
        </div>
        <div className="flex items-center gap-1 text-rose-500">
          {'❤️'.repeat(lives)}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border-4 border-white/30 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onPointerMove={handlePointerMove}
          className="touch-none bg-slate-900"
        />

        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm">
            <h3 className="mb-2 text-2xl font-black text-white">Breakout</h3>
            <p className="mb-6 max-w-xs text-center text-xs text-slate-300">
              Move paddle with mouse, touch, or Arrow keys to break all bricks!
            </p>
            <button onClick={startGame} className="clay-btn bg-sky-400 px-6 py-2.5 font-bold text-slate-950">
              Start Game
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm">
            <h3 className="mb-1 text-3xl font-black text-rose-500">Game Over</h3>
            <p className="mb-4 text-sm text-slate-300">Final Score: <span className="font-bold text-amber-400">{score}</span></p>
            <button onClick={startGame} className="clay-btn bg-emerald-400 px-6 py-2.5 font-bold text-slate-950">
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
