import { useEffect, useRef, useState } from 'react'
import { playSfx } from '../../lib/sound'
import type { GameComponentProps } from '../../types'
import { ClayButton, ClayCard } from '../../components/ui/Clay'

const WIDTH = 320
const HEIGHT = 380
const PADDLE_W = 10
const PADDLE_H = 60
const BALL_R = 7
const WIN_SCORE = 7

export function Pong({ onScore, soundEnabled }: GameComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState<'ready' | 'playing' | 'over'>('ready')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [scores, setScores] = useState({ player: 0, ai: 0 })
  const stateRef = useRef({
    playerY: HEIGHT / 2 - PADDLE_H / 2,
    aiY: HEIGHT / 2 - PADDLE_H / 2,
    ballX: WIDTH / 2,
    ballY: HEIGHT / 2,
    ballVX: 3.4,
    ballVY: 2,
    scores: { player: 0, ai: 0 },
  })
  const rafRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const aiSpeed = difficulty === 'easy' ? 2.4 : difficulty === 'medium' ? 3.6 : 4.8

  const draw = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const s = stateRef.current

    ctx.fillStyle = '#E6DEFB'
    ctx.fillRect(0, 0, WIDTH, HEIGHT)
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'
    ctx.setLineDash([6, 8])
    ctx.beginPath()
    ctx.moveTo(WIDTH / 2, 0)
    ctx.lineTo(WIDTH / 2, HEIGHT)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = '#6A4FA3'
    ctx.beginPath()
    ctx.roundRect(6, s.playerY, PADDLE_W, PADDLE_H, 5)
    ctx.fill()
    ctx.fillStyle = '#F7B899'
    ctx.beginPath()
    ctx.roundRect(WIDTH - 16, s.aiY, PADDLE_W, PADDLE_H, 5)
    ctx.fill()

    ctx.fillStyle = '#453F5C'
    ctx.beginPath()
    ctx.arc(s.ballX, s.ballY, BALL_R, 0, Math.PI * 2)
    ctx.fill()
  }

  const resetBall = (dir: number) => {
    const s = stateRef.current
    s.ballX = WIDTH / 2
    s.ballY = HEIGHT / 2
    s.ballVX = 3.4 * dir
    s.ballVY = (Math.random() - 0.5) * 4
  }

  const start = () => {
    stateRef.current = {
      playerY: HEIGHT / 2 - PADDLE_H / 2,
      aiY: HEIGHT / 2 - PADDLE_H / 2,
      ballX: WIDTH / 2,
      ballY: HEIGHT / 2,
      ballVX: 3.4,
      ballVY: 2,
      scores: { player: 0, ai: 0 },
    }
    setScores({ player: 0, ai: 0 })
    setStatus('playing')
  }

  useEffect(() => {
    if (status !== 'playing') {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }
    const loop = () => {
      const s = stateRef.current
      s.ballX += s.ballVX
      s.ballY += s.ballVY

      if (s.ballY - BALL_R < 0 || s.ballY + BALL_R > HEIGHT) s.ballVY *= -1

      if (s.ballX - BALL_R < 16 && s.ballY > s.playerY && s.ballY < s.playerY + PADDLE_H && s.ballVX < 0) {
        s.ballVX *= -1.05
        s.ballVY += (s.ballY - (s.playerY + PADDLE_H / 2)) * 0.08
        playSfx('click', soundEnabled)
      }
      if (s.ballX + BALL_R > WIDTH - 16 && s.ballY > s.aiY && s.ballY < s.aiY + PADDLE_H && s.ballVX > 0) {
        s.ballVX *= -1.05
        s.ballVY += (s.ballY - (s.aiY + PADDLE_H / 2)) * 0.08
        playSfx('click', soundEnabled)
      }

      const aiCenter = s.aiY + PADDLE_H / 2
      if (aiCenter < s.ballY - 8) s.aiY += aiSpeed
      else if (aiCenter > s.ballY + 8) s.aiY -= aiSpeed
      s.aiY = Math.max(0, Math.min(HEIGHT - PADDLE_H, s.aiY))

      if (s.ballX < 0) {
        s.scores.ai++
        playSfx('wrong', soundEnabled)
        setScores({ ...s.scores })
        resetBall(1)
      } else if (s.ballX > WIDTH) {
        s.scores.player++
        playSfx('score', soundEnabled)
        setScores({ ...s.scores })
        resetBall(-1)
      }

      draw()

      if (s.scores.player >= WIN_SCORE || s.scores.ai >= WIN_SCORE) {
        setStatus('over')
        return
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }

  }, [status, aiSpeed])

  useEffect(() => {
    if (status === 'over') onScore(stateRef.current.scores.player)

  }, [status])

  useEffect(() => { draw() }, [])

  const movePlayer = (clientY: number) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const scale = HEIGHT / rect.height
    const y = (clientY - rect.top) * scale - PADDLE_H / 2
    stateRef.current.playerY = Math.max(0, Math.min(HEIGHT - PADDLE_H, y))
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2">
        {(['easy', 'medium', 'hard'] as const).map((d) => (
          <ClayButton
            key={d}
            size="sm"
            accent={difficulty === d ? 'mint' : 'lavender'}
            onClick={() => setDifficulty(d)}
            disabled={status === 'playing'}
          >
            {d[0].toUpperCase() + d.slice(1)}
          </ClayButton>
        ))}
      </div>

      <div className="flex w-full max-w-sm justify-center gap-8">
        <ClayCard accent="lavender" className="px-5 py-2 text-center">
          <p className="text-xs font-semibold text-ink-soft">You</p>
          <p className="font-display text-xl font-bold text-ink">{scores.player}</p>
        </ClayCard>
        <ClayCard accent="peach" className="px-5 py-2 text-center">
          <p className="text-xs font-semibold text-ink-soft">AI</p>
          <p className="font-display text-xl font-bold text-ink">{scores.ai}</p>
        </ClayCard>
      </div>

      <div
        ref={containerRef}
        className="clay-inset touch-none rounded-3xl p-1 w-full max-w-[300px] flex justify-center"
        onMouseMove={(e) => status === 'playing' && movePlayer(e.clientY)}
        onTouchMove={(e) => { status === 'playing' && movePlayer(e.touches[0].clientY); e.preventDefault() }}
      >
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className="rounded-2xl block w-full h-auto"
          style={{ maxWidth: '280px', aspectRatio: `${WIDTH}/${HEIGHT}` }}
        />
      </div>

      {status !== 'playing' && (
        <ClayButton accent="mint" size="lg" onClick={start}>
          {status === 'over' ? 'Play Again' : 'Start Game'}
        </ClayButton>
      )}
      {status === 'over' && (
        <p className="font-display font-bold text-ink">
          {scores.player > scores.ai ? 'You win! 🎉' : 'AI wins — good try!'}
        </p>
      )}
      <p className="text-xs text-ink-soft">Move your mouse or drag to control the paddle</p>
    </div>
  )
}

export default Pong
