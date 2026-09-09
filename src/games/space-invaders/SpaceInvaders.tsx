import { useEffect, useRef, useState } from 'react'
import type { GameComponentProps } from '../../types'
import { playSfx } from '../../lib/sound'

interface Invader {
  x: number
  y: number
  w: number
  h: number
  points: number
  color: string
  alive: boolean
}

interface Bullet {
  x: number
  y: number
  speed: number
  fromPlayer: boolean
}

interface Bunker {
  x: number
  y: number
  w: number
  h: number
  hp: number
}

const CANVAS_WIDTH = 480
const CANVAS_HEIGHT = 520
const INVADER_ROWS = 4
const INVADER_COLS = 7

export function SpaceInvaders({ onScore, soundEnabled }: GameComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle')
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)

  const stateRef = useRef({
    playerX: CANVAS_WIDTH / 2 - 20,
    playerW: 40,
    invaders: [] as Invader[],
    bullets: [] as Bullet[],
    bunkers: [] as Bunker[],
    dirX: 1,
    invaderSpeed: 0.8,
    lastShootTime: 0,
    score: 0,
    lives: 3,
    keys: { left: false, right: false, space: false },
    active: false,
  })

  const initGame = (currentLives = 3) => {
    const invaders: Invader[] = []
    const points = [30, 20, 20, 10]
    const colors = ['#F43F5E', '#A855F7', '#38BDF8', '#34D399']
    const invaderW = 32
    const invaderH = 22

    for (let r = 0; r < INVADER_ROWS; r++) {
      for (let c = 0; c < INVADER_COLS; c++) {
        invaders.push({
          x: 40 + c * (invaderW + 20),
          y: 40 + r * (invaderH + 16),
          w: invaderW,
          h: invaderH,
          points: points[r],
          color: colors[r],
          alive: true,
        })
      }
    }

    const bunkers: Bunker[] = []
    const bunkerW = 54
    const bunkerH = 28
    for (let i = 0; i < 3; i++) {
      bunkers.push({
        x: 60 + i * 150,
        y: CANVAS_HEIGHT - 100,
        w: bunkerW,
        h: bunkerH,
        hp: 6,
      })
    }

    stateRef.current = {
      playerX: CANVAS_WIDTH / 2 - 20,
      playerW: 40,
      invaders,
      bullets: [],
      bunkers,
      dirX: 1,
      invaderSpeed: 0.8,
      lastShootTime: 0,
      score: currentLives === 3 ? 0 : stateRef.current.score,
      lives: currentLives,
      keys: { left: false, right: false, space: false },
      active: true,
    }

    setScore(stateRef.current.score)
    setLives(currentLives)
  }

  const startGame = () => {
    initGame(3)
    setGameState('playing')
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || !stateRef.current.active) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS_WIDTH / rect.width
    const pointerX = (e.clientX - rect.left) * scaleX
    stateRef.current.playerX = Math.max(
      0,
      Math.min(CANVAS_WIDTH - stateRef.current.playerW, pointerX - stateRef.current.playerW / 2)
    )
  }

  const fireBullet = () => {
    const s = stateRef.current
    if (!s.active) return
    const now = Date.now()
    if (now - s.lastShootTime < 280) return
    s.lastShootTime = now

    s.bullets.push({
      x: s.playerX + s.playerW / 2,
      y: CANVAS_HEIGHT - 45,
      speed: -8,
      fromPlayer: true,
    })
    playSfx('click', soundEnabled)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') stateRef.current.keys.left = true
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') stateRef.current.keys.right = true
      if (e.key === ' ' || e.key === 'Spacebar') {
        stateRef.current.keys.space = true
        fireBullet()
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') stateRef.current.keys.left = false
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') stateRef.current.keys.right = false
      if (e.key === ' ' || e.key === 'Spacebar') stateRef.current.keys.space = false
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [soundEnabled])

  useEffect(() => {
    if (gameState !== 'playing') return
    let animId: number

    const updateAndDraw = () => {
      const cvs = canvasRef.current
      if (!cvs) return
      const ctx = cvs.getContext('2d')
      if (!ctx) return

      const s = stateRef.current

      if (s.keys.left) s.playerX = Math.max(0, s.playerX - 5)
      if (s.keys.right) s.playerX = Math.min(CANVAS_WIDTH - s.playerW, s.playerX + 5)

      let hitEdge = false
      let aliveCount = 0

      for (const inv of s.invaders) {
        if (!inv.alive) continue
        aliveCount++
        inv.x += s.dirX * s.invaderSpeed

        if (inv.x <= 10 || inv.x + inv.w >= CANVAS_WIDTH - 10) {
          hitEdge = true
        }

        if (inv.y + inv.h >= CANVAS_HEIGHT - 50) {
          s.active = false
          setGameState('gameover')
          playSfx('gameOver', soundEnabled)
          onScore(s.score)
          return
        }
      }

      if (hitEdge) {
        s.dirX = -s.dirX
        for (const inv of s.invaders) {
          if (inv.alive) inv.y += 14
        }
      }

      if (aliveCount === 0) {
        initGame(s.lives)
        s.invaderSpeed += 0.4
        playSfx('levelUp', soundEnabled)
      }

      if (Math.random() < 0.025 && aliveCount > 0) {
        const aliveInvaders = s.invaders.filter((i) => i.alive)
        const randomInv = aliveInvaders[Math.floor(Math.random() * aliveInvaders.length)]
        s.bullets.push({
          x: randomInv.x + randomInv.w / 2,
          y: randomInv.y + randomInv.h,
          speed: 4.5,
          fromPlayer: false,
        })
      }

      for (let i = s.bullets.length - 1; i >= 0; i--) {
        const b = s.bullets[i]
        b.y += b.speed

        if (b.y < 0 || b.y > CANVAS_HEIGHT) {
          s.bullets.splice(i, 1)
          continue
        }

        if (b.fromPlayer) {
          let hit = false
          for (const inv of s.invaders) {
            if (
              inv.alive &&
              b.x >= inv.x &&
              b.x <= inv.x + inv.w &&
              b.y >= inv.y &&
              b.y <= inv.y + inv.h
            ) {
              inv.alive = false
              hit = true
              s.score += inv.points
              setScore(s.score)
              playSfx('score', soundEnabled)
              break
            }
          }
          if (hit) {
            s.bullets.splice(i, 1)
            continue
          }
        } else {

          const playerY = CANVAS_HEIGHT - 35
          if (
            b.x >= s.playerX &&
            b.x <= s.playerX + s.playerW &&
            b.y >= playerY &&
            b.y <= playerY + 20
          ) {
            s.bullets.splice(i, 1)
            s.lives -= 1
            setLives(s.lives)
            playSfx('wrong', soundEnabled)

            if (s.lives <= 0) {
              s.active = false
              setGameState('gameover')
              playSfx('gameOver', soundEnabled)
              onScore(s.score)
              return
            }
            continue
          }
        }

        for (const bk of s.bunkers) {
          if (
            bk.hp > 0 &&
            b.x >= bk.x &&
            b.x <= bk.x + bk.w &&
            b.y >= bk.y &&
            b.y <= bk.y + bk.h
          ) {
            bk.hp -= 1
            s.bullets.splice(i, 1)
            break
          }
        }
      }

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      ctx.fillStyle = '#090D16'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      for (const inv of s.invaders) {
        if (!inv.alive) continue
        ctx.fillStyle = inv.color
        ctx.shadowColor = inv.color
        ctx.shadowBlur = 6
        ctx.beginPath()
        ctx.roundRect(inv.x, inv.y, inv.w, inv.h, 4)
        ctx.fill()
      }
      ctx.shadowBlur = 0

      for (const bk of s.bunkers) {
        if (bk.hp <= 0) continue
        ctx.fillStyle = `rgba(52, 211, 153, ${bk.hp / 6})`
        ctx.beginPath()
        ctx.roundRect(bk.x, bk.y, bk.w, bk.h, 6)
        ctx.fill()
      }

      for (const b of s.bullets) {
        ctx.fillStyle = b.fromPlayer ? '#38BDF8' : '#F43F5E'
        ctx.fillRect(b.x - 2, b.y, 4, 10)
      }

      const playerY = CANVAS_HEIGHT - 35
      ctx.fillStyle = '#38BDF8'
      ctx.shadowColor = '#38BDF8'
      ctx.shadowBlur = 8
      ctx.beginPath()
      ctx.moveTo(s.playerX + s.playerW / 2, playerY)
      ctx.lineTo(s.playerX + s.playerW, playerY + 20)
      ctx.lineTo(s.playerX, playerY + 20)
      ctx.closePath()
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
        <div>Score: <span className="text-plum">{score}</span></div>
        <div className="flex items-center gap-1 text-rose-500">
          {'❤️'.repeat(lives)}
        </div>
      </div>

      <div className="relative w-full max-w-[480px] aspect-[480/520] overflow-hidden rounded-2xl border-4 border-white/30 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onPointerMove={handlePointerMove}
          onClick={fireBullet}
          className="block h-full w-full touch-none bg-slate-950"
        />

        {gameState === 'playing' && (
          <div className="absolute bottom-3 right-3 flex gap-2 sm:hidden">
            <button
              onClick={fireBullet}
              className="clay-btn bg-rose-500 px-6 py-3 font-black text-white"
            >
              FIRE 🔥
            </button>
          </div>
        )}

        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm">
            <h3 className="mb-2 text-2xl font-black text-white">Space Invaders</h3>
            <p className="mb-6 max-w-xs text-center text-xs text-slate-300">
              Move with Mouse/Touch or Arrow keys. Shoot with Spacebar or Tap!
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
