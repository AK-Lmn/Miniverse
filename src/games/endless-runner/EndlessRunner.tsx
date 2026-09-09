import { useEffect, useRef, useState, useCallback } from 'react'
import type { GameComponentProps } from '../../types'
import { ClayButton } from '../../components/ui/Clay'

const W = 400, H = 220
const GROUND = H - 40
const GRAVITY = 0.55
const JUMP_V  = -11
const BASE_SPEED = 4

interface Obstacle { x: number; w: number; h: number }

function useAnimFrame(cb: (dt: number) => void, running: boolean) {
  const ref = useRef<number>(0)
  const last = useRef<number>(0)
  useEffect(() => {
    if (!running) return
    const loop = (ts: number) => {
      const dt = last.current ? Math.min(ts - last.current, 50) : 16
      last.current = ts
      cb(dt)
      ref.current = requestAnimationFrame(loop)
    }
    ref.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(ref.current)
  }, [running, cb])
}

export function EndlessRunner({ onScore }: GameComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [phase, setPhase]     = useState<'idle' | 'playing' | 'dead'>('idle')
  const [score, setScore]     = useState(0)

  const playerY   = useRef(GROUND)
  const velY      = useRef(0)
  const onGround  = useRef(true)
  const obstacles = useRef<Obstacle[]>([])
  const speed     = useRef(BASE_SPEED)
  const ticks     = useRef(0)
  const scoreRef  = useRef(0)
  const phaseRef  = useRef(phase)
  phaseRef.current = phase

  const jump = useCallback(() => {
    if (phaseRef.current === 'idle') {
      setPhase('playing')
      return
    }
    if (phaseRef.current === 'dead') return
    if (onGround.current) {
      velY.current = JUMP_V
      onGround.current = false
    }
  }, [])

  const restart = () => {
    playerY.current  = GROUND
    velY.current     = 0
    onGround.current = true
    obstacles.current = []
    speed.current    = BASE_SPEED
    ticks.current    = 0
    scoreRef.current = 0
    setScore(0)
    setPhase('playing')
  }

  useAnimFrame(useCallback((dt: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    ticks.current++

    velY.current += GRAVITY * (dt / 16)
    playerY.current += velY.current * (dt / 16)
    if (playerY.current >= GROUND) {
      playerY.current = GROUND
      velY.current = 0
      onGround.current = true
    }

    speed.current = BASE_SPEED + ticks.current / 300

    const gap = Math.max(60, 140 - ticks.current / 10)
    if (ticks.current % Math.round(gap) === 0) {
      const h = 20 + Math.random() * 25
      obstacles.current.push({ x: W, w: 16, h })
    }

    obstacles.current = obstacles.current
      .map((o) => ({ ...o, x: o.x - speed.current * (dt / 16) }))
      .filter((o) => o.x + o.w > -10)

    scoreRef.current = Math.floor(ticks.current / 6)

    const px = 60, pw = 24, ph = 28
    const py = playerY.current - ph
    for (const o of obstacles.current) {
      if (px + pw - 4 > o.x && px + 4 < o.x + o.w &&
          py + ph - 2 > GROUND - o.h && py < GROUND) {
        setPhase('dead')
        setScore(scoreRef.current)
        onScore(scoreRef.current)
        return
      }
    }

    ctx.clearRect(0, 0, W * dpr, H * dpr)
    ctx.save()
    ctx.scale(dpr, dpr)

    ctx.fillStyle = 'rgba(150,130,180,0.18)'
    ctx.fillRect(0, GROUND + 2, W, 4)

    const accent = getComputedStyle(document.documentElement).getPropertyValue('--color-plum').trim() || '#6B4FBF'
    ctx.fillStyle = accent
    ctx.beginPath()
    ctx.roundRect(px, playerY.current - ph, pw, ph, 6)
    ctx.fill()

    ctx.fillStyle = 'white'
    ctx.beginPath()
    ctx.arc(px + pw - 6, playerY.current - ph + 8, 3.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#333'
    ctx.beginPath()
    ctx.arc(px + pw - 5, playerY.current - ph + 8, 1.8, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#F7A87C'
    for (const o of obstacles.current) {
      ctx.beginPath()
      ctx.roundRect(o.x, GROUND - o.h, o.w, o.h, 4)
      ctx.fill()
    }

    ctx.fillStyle = 'var(--color-ink-soft, #7A7092)'
    ctx.font = 'bold 14px system-ui'
    ctx.textAlign = 'right'
    ctx.fillText(`${scoreRef.current}`, W - 10, 20)

    ctx.restore()
  }, [onScore]), phase === 'playing')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); jump() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [jump])

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      <canvas
        ref={canvasRef}
        width={W * dpr}
        height={H * dpr}
        style={{ width: W, height: H, borderRadius: 16, background: 'var(--color-cream)', cursor: 'pointer' }}
        onClick={phase === 'idle' ? () => setPhase('playing') : phase === 'playing' ? jump : undefined}
        aria-label="Endless runner game"
      />
      {phase === 'idle' && (
        <p className="text-sm font-semibold text-ink-soft">Press Space / tap to start jumping</p>
      )}
      {phase === 'dead' && (
        <div className="flex flex-col items-center gap-3">
          <p className="font-display text-lg font-bold text-rose-500">Game Over — Score: {score}</p>
          <ClayButton accent="mint" onClick={restart}>Try Again</ClayButton>
        </div>
      )}
      {phase === 'playing' && (
        <p className="text-xs text-ink-soft">Space / tap to jump</p>
      )}
    </div>
  )
}

export default EndlessRunner
