import { useEffect, useRef, useState, useCallback } from 'react'
import type { GameComponentProps } from '../../types'
import { ClayButton } from '../../components/ui/Clay'
import { RotateCcw, RotateCw, Play, ArrowUp, Crosshair } from 'lucide-react'

const CANVAS_WIDTH = 600
const CANVAS_HEIGHT = 420

interface Point {
  x: number
  y: number
}

interface Ship {
  x: number
  y: number
  vx: number
  vy: number
  angle: number
  rotationSpeed: number
  thrusting: boolean
  radius: number
}

interface Bullet {
  x: number
  y: number
  vx: number
  vy: number
  life: number
}

interface Asteroid {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  tier: 3 | 2 | 1 // 3 = Large, 2 = Medium, 1 = Small
  points: Point[]
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}

function generateAsteroidShape(radius: number): Point[] {
  const points: Point[] = []
  const numPoints = 8 + Math.floor(Math.random() * 5)
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2
    const variance = 0.75 + Math.random() * 0.45
    points.push({
      x: Math.cos(angle) * radius * variance,
      y: Math.sin(angle) * radius * variance,
    })
  }
  return points
}

export function Asteroids({ onScore }: GameComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle')
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [wave, setWave] = useState(1)

  const keysPressed = useRef<{ [key: string]: boolean }>({})
  const onScoreRef = useRef(onScore)
  onScoreRef.current = onScore

  // Game state held in refs for 60fps canvas loop
  const shipRef = useRef<Ship>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    rotationSpeed: 0.08,
    thrusting: false,
    radius: 12,
  })

  const bulletsRef = useRef<Bullet[]>([])
  const asteroidsRef = useRef<Asteroid[]>([])
  const particlesRef = useRef<Particle[]>([])
  const invincibleRef = useRef(0)
  const fireCooldownRef = useRef(0)
  const scoreRef = useRef(0)
  const livesRef = useRef(3)
  const waveRef = useRef(1)

  const spawnAsteroids = useCallback((count: number) => {
    const asteroids: Asteroid[] = []
    const ship = shipRef.current

    for (let i = 0; i < count; i++) {
      let x = Math.random() * CANVAS_WIDTH
      let y = Math.random() * CANVAS_HEIGHT

      // Keep distance from player ship on spawn
      while (Math.hypot(x - ship.x, y - ship.y) < 120) {
        x = Math.random() * CANVAS_WIDTH
        y = Math.random() * CANVAS_HEIGHT
      }

      const speed = 0.8 + Math.random() * 1.2
      const angle = Math.random() * Math.PI * 2
      const radius = 32

      asteroids.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius,
        tier: 3,
        points: generateAsteroidShape(radius),
      })
    }
    asteroidsRef.current = asteroids
  }, [])

  const resetShip = useCallback(() => {
    shipRef.current = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      rotationSpeed: 0.08,
      thrusting: false,
      radius: 12,
    }
    invincibleRef.current = 120 // ~2 seconds
  }, [])

  const startGame = useCallback(() => {
    scoreRef.current = 0
    livesRef.current = 3
    waveRef.current = 1
    setScore(0)
    setLives(3)
    setWave(1)
    bulletsRef.current = []
    particlesRef.current = []
    resetShip()
    spawnAsteroids(4)
    setGameState('playing')
  }, [resetShip, spawnAsteroids])

  const spawnParticles = (x: number, y: number, color: string, count = 8) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1 + Math.random() * 3
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 25 + Math.random() * 15,
        color,
      })
    }
  }

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault()
      }
      keysPressed.current[e.code] = true
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Main game loop
  useEffect(() => {
    let animId: number
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const loop = () => {
      if (gameState === 'playing') {
        const ship = shipRef.current
        const keys = keysPressed.current

        // Controls
        if (keys['ArrowLeft'] || keys['KeyA']) {
          ship.angle -= ship.rotationSpeed
        }
        if (keys['ArrowRight'] || keys['KeyD']) {
          ship.angle += ship.rotationSpeed
        }

        const isThrusting = keys['ArrowUp'] || keys['KeyW']
        ship.thrusting = !!isThrusting
        if (isThrusting) {
          const thrust = 0.16
          ship.vx += Math.cos(ship.angle) * thrust
          ship.vy += Math.sin(ship.angle) * thrust

          // Thruster particle
          if (Math.random() < 0.6) {
            const backX = ship.x - Math.cos(ship.angle) * 14
            const backY = ship.y - Math.sin(ship.angle) * 14
            particlesRef.current.push({
              x: backX,
              y: backY,
              vx: -Math.cos(ship.angle) * 2 + (Math.random() - 0.5),
              vy: -Math.sin(ship.angle) * 2 + (Math.random() - 0.5),
              life: 12,
              color: '#F7A87C',
            })
          }
        }

        // Apply friction & movement
        ship.vx *= 0.985
        ship.vy *= 0.985
        ship.x += ship.vx
        ship.y += ship.vy

        // Wrap ship around edges
        if (ship.x < 0) ship.x = CANVAS_WIDTH
        if (ship.x > CANVAS_WIDTH) ship.x = 0
        if (ship.y < 0) ship.y = CANVAS_HEIGHT
        if (ship.y > CANVAS_HEIGHT) ship.y = 0

        // Shooting
        if (fireCooldownRef.current > 0) {
          fireCooldownRef.current--
        }
        if ((keys['Space'] || keys['KeyJ']) && fireCooldownRef.current === 0) {
          fireCooldownRef.current = 14
          const bulletSpeed = 7
          bulletsRef.current.push({
            x: ship.x + Math.cos(ship.angle) * 14,
            y: ship.y + Math.sin(ship.angle) * 14,
            vx: Math.cos(ship.angle) * bulletSpeed + ship.vx * 0.4,
            vy: Math.sin(ship.angle) * bulletSpeed + ship.vy * 0.4,
            life: 55,
          })
        }

        // Update Bullets
        bulletsRef.current.forEach((b) => {
          b.x += b.vx
          b.y += b.vy
          b.life--
          if (b.x < 0) b.x = CANVAS_WIDTH
          if (b.x > CANVAS_WIDTH) b.x = 0
          if (b.y < 0) b.y = CANVAS_HEIGHT
          if (b.y > CANVAS_HEIGHT) b.y = 0
        })
        bulletsRef.current = bulletsRef.current.filter((b) => b.life > 0)

        // Update Asteroids
        asteroidsRef.current.forEach((a) => {
          a.x += a.vx
          a.y += a.vy
          if (a.x < -a.radius) a.x = CANVAS_WIDTH + a.radius
          if (a.x > CANVAS_WIDTH + a.radius) a.x = -a.radius
          if (a.y < -a.radius) a.y = CANVAS_HEIGHT + a.radius
          if (a.y > CANVAS_HEIGHT + a.radius) a.y = -a.radius
        })

        // Bullet - Asteroid Collisions
        const newAsteroids: Asteroid[] = []
        for (let bi = bulletsRef.current.length - 1; bi >= 0; bi--) {
          const b = bulletsRef.current[bi]
          for (let ai = asteroidsRef.current.length - 1; ai >= 0; ai--) {
            const a = asteroidsRef.current[ai]
            const dist = Math.hypot(b.x - a.x, b.y - a.y)
            if (dist < a.radius) {
              // Hit!
              bulletsRef.current.splice(bi, 1)
              asteroidsRef.current.splice(ai, 1)

              spawnParticles(a.x, a.y, '#93CCF5', 12)

              const pts = a.tier === 3 ? 20 : a.tier === 2 ? 50 : 100
              scoreRef.current += pts
              setScore(scoreRef.current)

              // Split asteroid
              if (a.tier > 1) {
                const nextTier = (a.tier - 1) as 2 | 1
                const nextRadius = nextTier === 2 ? 20 : 12
                for (let k = 0; k < 2; k++) {
                  const angle = Math.random() * Math.PI * 2
                  const speed = (0.9 + Math.random() * 1.5) * (4 - nextTier)
                  newAsteroids.push({
                    x: a.x,
                    y: a.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    radius: nextRadius,
                    tier: nextTier,
                    points: generateAsteroidShape(nextRadius),
                  })
                }
              }
              break
            }
          }
        }
        if (newAsteroids.length > 0) {
          asteroidsRef.current.push(...newAsteroids)
        }

        // Check wave clear
        if (asteroidsRef.current.length === 0) {
          waveRef.current++
          setWave(waveRef.current)
          scoreRef.current += 300
          setScore(scoreRef.current)
          spawnAsteroids(Math.min(3 + waveRef.current, 9))
        }

        // Invincibility countdown
        if (invincibleRef.current > 0) {
          invincibleRef.current--
        }

        // Ship - Asteroid Collisions
        if (invincibleRef.current === 0) {
          for (const a of asteroidsRef.current) {
            const dist = Math.hypot(ship.x - a.x, ship.y - a.y)
            if (dist < ship.radius + a.radius * 0.8) {
              spawnParticles(ship.x, ship.y, '#EF4444', 20)
              livesRef.current--
              setLives(livesRef.current)
              if (livesRef.current <= 0) {
                setGameState('gameover')
                onScoreRef.current(scoreRef.current)
              } else {
                resetShip()
              }
              break
            }
          }
        }

        // Update Particles
        particlesRef.current.forEach((p) => {
          p.x += p.vx
          p.y += p.vy
          p.life--
        })
        particlesRef.current = particlesRef.current.filter((p) => p.life > 0)
      }

      // ─── Render Canvas ──────────────────────────────────────────────
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
      grad.addColorStop(0, '#0f172a')
      grad.addColorStop(1, '#1e1b4b')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // Tiny stars background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
      for (let i = 0; i < 40; i++) {
        const sx = ((i * 137.5) % CANVAS_WIDTH)
        const sy = ((i * 249.7) % CANVAS_HEIGHT)
        ctx.fillRect(sx, sy, 1.5, 1.5)
      }

      // Draw Particles
      particlesRef.current.forEach((p) => {
        ctx.fillStyle = p.color
        ctx.globalAlpha = Math.max(0, p.life / 30)
        ctx.beginPath()
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.globalAlpha = 1

      // Draw Asteroids
      asteroidsRef.current.forEach((a) => {
        ctx.save()
        ctx.translate(a.x, a.y)
        ctx.strokeStyle = '#93CCF5'
        ctx.fillStyle = 'rgba(147, 204, 245, 0.12)'
        ctx.lineWidth = 2
        ctx.beginPath()
        a.points.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.x, pt.y)
          else ctx.lineTo(pt.x, pt.y)
        })
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        ctx.restore()
      })

      // Draw Bullets
      ctx.fillStyle = '#FBBF24'
      ctx.shadowColor = '#FBBF24'
      ctx.shadowBlur = 8
      bulletsRef.current.forEach((b) => {
        ctx.beginPath()
        ctx.arc(b.x, b.y, 2.5, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.shadowBlur = 0

      // Draw Player Ship
      if (gameState === 'playing') {
        const ship = shipRef.current
        const blink = invincibleRef.current > 0 && Math.floor(invincibleRef.current / 8) % 2 === 1
        if (!blink) {
          ctx.save()
          ctx.translate(ship.x, ship.y)
          ctx.rotate(ship.angle)

          // Ship body
          ctx.strokeStyle = '#C4AEFE'
          ctx.fillStyle = '#6B4FBF'
          ctx.lineWidth = 2.5
          ctx.beginPath()
          ctx.moveTo(14, 0)
          ctx.lineTo(-11, -9)
          ctx.lineTo(-7, 0)
          ctx.lineTo(-11, 9)
          ctx.closePath()
          ctx.fill()
          ctx.stroke()

          // Thruster flame
          if (ship.thrusting) {
            ctx.fillStyle = '#FB923C'
            ctx.beginPath()
            ctx.moveTo(-7, 0)
            ctx.lineTo(-16, -4)
            ctx.lineTo(-20 - Math.random() * 6, 0)
            ctx.lineTo(-16, 4)
            ctx.closePath()
            ctx.fill()
          }

          ctx.restore()
        }
      }

      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animId)
  }, [gameState, spawnAsteroids, resetShip])

  // Virtual controls handlers for mobile/mouse
  const setKey = (code: string, active: boolean) => {
    keysPressed.current[code] = active
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-2xl mx-auto select-none">
      {/* Top Header stats */}
      <div className="flex items-center justify-between w-full px-2 text-sm font-bold text-ink">
        <div className="flex items-center gap-3">
          <span>Score: <span className="font-mono text-base text-[var(--color-plum)]">{score}</span></span>
          <span>Wave: <span className="font-mono text-base">{wave}</span></span>
        </div>
        <div className="flex items-center gap-1">
          <span>Lives:</span>
          {Array.from({ length: 3 }).map((_, i) => (
            <span
              key={i}
              className={`text-base transition-opacity ${i < lives ? 'opacity-100' : 'opacity-20'}`}
            >
              🚀
            </span>
          ))}
        </div>
      </div>

      {/* Canvas container */}
      <div className="relative w-full aspect-[600/420] rounded-2xl overflow-hidden shadow-xl border-4 border-[var(--color-lavender-dark)]/40 bg-black">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-full block"
        />

        {gameState === 'idle' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 text-center p-6 text-white animate-pop-in">
            <h2 className="text-3xl font-black tracking-tight text-[var(--color-lavender)]">ASTEROIDS</h2>
            <p className="text-sm text-white/80 max-w-xs">
              Pilot your ship, blast incoming space boulders, and dodge debris before your shield gives out!
            </p>
            <ClayButton accent="lavender" size="lg" onClick={startGame}>
              <Play size={18} /> Launch Ship
            </ClayButton>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-center p-6 text-white animate-pop-in">
            <h2 className="text-3xl font-black text-rose-400">GAME OVER</h2>
            <p className="text-sm text-white/80">
              Final Score: <span className="font-black text-xl text-yellow-400">{score}</span>
            </p>
            <ClayButton accent="lavender" onClick={startGame} className="mt-2">
              <RotateCcw size={16} /> Play Again
            </ClayButton>
          </div>
        )}
      </div>

      {/* On-screen controls for touch devices */}
      <div className="grid grid-cols-4 gap-2 w-full max-w-sm mt-1 sm:hidden">
        <button
          type="button"
          onTouchStart={() => setKey('ArrowLeft', true)}
          onTouchEnd={() => setKey('ArrowLeft', false)}
          onMouseDown={() => setKey('ArrowLeft', true)}
          onMouseUp={() => setKey('ArrowLeft', false)}
          className="clay-btn h-12 flex items-center justify-center text-ink"
        >
          <RotateCcw size={20} />
        </button>
        <button
          type="button"
          onTouchStart={() => setKey('ArrowUp', true)}
          onTouchEnd={() => setKey('ArrowUp', false)}
          onMouseDown={() => setKey('ArrowUp', true)}
          onMouseUp={() => setKey('ArrowUp', false)}
          className="clay-btn h-12 flex items-center justify-center text-ink"
        >
          <ArrowUp size={20} />
        </button>
        <button
          type="button"
          onTouchStart={() => setKey('ArrowRight', true)}
          onTouchEnd={() => setKey('ArrowRight', false)}
          onMouseDown={() => setKey('ArrowRight', true)}
          onMouseUp={() => setKey('ArrowRight', false)}
          className="clay-btn h-12 flex items-center justify-center text-ink"
        >
          <RotateCw size={20} />
        </button>
        <button
          type="button"
          onTouchStart={() => setKey('Space', true)}
          onTouchEnd={() => setKey('Space', false)}
          onMouseDown={() => setKey('Space', true)}
          onMouseUp={() => setKey('Space', false)}
          className="clay-btn h-12 flex items-center justify-center text-red-500 font-bold"
        >
          <Crosshair size={20} />
        </button>
      </div>

      <div className="hidden sm:flex items-center gap-4 text-xs font-semibold text-ink-soft">
        <span>Controls: <kbd className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10">A / D</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10">← / →</kbd> Rotate</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10">W</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10">↑</kbd> Thrust</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10">Space</kbd> Fire</span>
      </div>
    </div>
  )
}

export default Asteroids
