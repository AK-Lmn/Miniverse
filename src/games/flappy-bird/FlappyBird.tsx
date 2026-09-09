import { useEffect, useRef, useState } from 'react'
import { playSfx } from '../../lib/sound'
import type { GameComponentProps } from '../../types'
import { ClayButton, ClayCard } from '../../components/ui/Clay'

const WIDTH = 320
const HEIGHT = 420
const GRAVITY = 0.45
const FLAP = -7.6
const PIPE_GAP = 130
const PIPE_WIDTH = 52
const BIRD_X = 70
const BIRD_R = 12

interface Pipe { x: number; gapY: number; scored: boolean }

export function FlappyBird({ onScore, soundEnabled }: GameComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState<'ready' | 'playing' | 'over'>('ready')
  const [score, setScore] = useState(0)
  const stateRef = useRef({
    y: HEIGHT / 2,
    vel: 0,
    pipes: [] as Pipe[],
    frame: 0,
    speed: 2.2,
  })
  const rafRef = useRef<number | null>(null)

  const draw = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const s = stateRef.current

    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT)
    grad.addColorStop(0, '#D6ECFB')
    grad.addColorStop(1, '#EAF6FD')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, WIDTH, HEIGHT)

    ctx.fillStyle = '#A6E8C6'
    for (const p of s.pipes) {
      ctx.beginPath()
      ctx.roundRect(p.x, 0, PIPE_WIDTH, p.gapY - PIPE_GAP / 2, 10)
      ctx.fill()
      ctx.beginPath()
      ctx.roundRect(p.x, p.gapY + PIPE_GAP / 2, PIPE_WIDTH, HEIGHT - (p.gapY + PIPE_GAP / 2), 10)
      ctx.fill()
    }

    ctx.save()
    ctx.translate(BIRD_X, s.y)
    ctx.rotate(Math.max(-0.5, Math.min(0.9, s.vel / 10)))
    ctx.fillStyle = '#F5DD8A'
    ctx.beginPath()
    ctx.arc(0, 0, BIRD_R, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#453F5C'
    ctx.beginPath()
    ctx.arc(4, -3, 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#F7B899'
    ctx.beginPath()
    ctx.moveTo(10, 0)
    ctx.lineTo(18, -2)
    ctx.lineTo(18, 3)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  const reset = () => {
    stateRef.current = { y: HEIGHT / 2, vel: 0, pipes: [], frame: 0, speed: 2.2 }
    setScore(0)
    setStatus('playing')
    draw()
  }

  const flap = () => {
    if (status === 'ready') { reset(); return }
    if (status === 'over') { reset(); return }
    stateRef.current.vel = FLAP
    playSfx('click', soundEnabled)
  }

  useEffect(() => {
    if (status !== 'playing') {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }
    const loop = () => {
      const s = stateRef.current
      s.frame++
      s.vel += GRAVITY
      s.y += s.vel

      if (s.frame % 95 === 0) {
        const gapY = 90 + Math.random() * (HEIGHT - 180)
        s.pipes.push({ x: WIDTH, gapY, scored: false })
      }
      s.pipes.forEach((p) => { p.x -= s.speed })
      s.pipes = s.pipes.filter((p) => p.x > -PIPE_WIDTH)

      let died = s.y - BIRD_R < 0 || s.y + BIRD_R > HEIGHT
      for (const p of s.pipes) {
        const inX = BIRD_X + BIRD_R > p.x && BIRD_X - BIRD_R < p.x + PIPE_WIDTH
        if (inX) {
          const inGap = s.y - BIRD_R > p.gapY - PIPE_GAP / 2 && s.y + BIRD_R < p.gapY + PIPE_GAP / 2
          if (!inGap) died = true
        }
        if (!p.scored && p.x + PIPE_WIDTH < BIRD_X - BIRD_R) {
          p.scored = true
          setScore((sc) => sc + 1)
          playSfx('score', soundEnabled)
          s.speed = Math.min(4.2, s.speed + 0.06)
        }
      }

      draw()

      if (died) {
        setStatus('over')
        playSfx('gameOver', soundEnabled)
        return
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
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); flap() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)

  }, [status])

  useEffect(() => { draw() }, [])

  return (
    <div className="flex flex-col items-center gap-4">
      <ClayCard accent="lavender" className="px-5 py-2 text-center">
        <p className="text-xs font-semibold text-ink-soft">Score</p>
        <p className="font-display text-xl font-bold text-ink">{score}</p>
      </ClayCard>

      <button
        onClick={flap}
        className="clay-inset touch-none overflow-hidden rounded-3xl p-1"
        aria-label="Flap"
      >
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className="rounded-2xl"
          style={{ width: 'min(85vw, 300px)', height: 'min(112vw, 396px)' }}
        />
      </button>

      {status === 'ready' && <p className="text-sm text-ink-soft">Tap the game or press Space to flap</p>}
      {status === 'over' && (
        <>
          <p className="font-display font-bold text-ink">Game Over — Score {score}</p>
          <ClayButton accent="mint" size="lg" onClick={reset}>Play Again</ClayButton>
        </>
      )}
    </div>
  )
}

export default FlappyBird
