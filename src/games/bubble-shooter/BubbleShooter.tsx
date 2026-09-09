import { useEffect, useRef, useState, useCallback } from 'react'
import type { GameComponentProps } from '../../types'
import { ClayButton } from '../../components/ui/Clay'
import { RotateCcw, Play, Trophy } from 'lucide-react'

const CANVAS_WIDTH = 420
const CANVAS_HEIGHT = 540
const BUBBLE_RADIUS = 18
const BUBBLE_DIAMETER = BUBBLE_RADIUS * 2
const ROW_HEIGHT = Math.floor(BUBBLE_DIAMETER * 0.866) // Hexagonal packing height
const GRID_COLS = 11
const GRID_ROWS = 12

const COLORS = [
  '#F87171', // Red
  '#60A5FA', // Blue
  '#34D399', // Green
  '#FBBF24', // Yellow
  '#A78BFA', // Purple
]

interface Bubble {
  color: string
}

type Grid = (Bubble | null)[][]

interface Projectile {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  active: boolean
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  life: number
}

function getRandomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)]
}

export function BubbleShooter({ onScore }: GameComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover' | 'win'>('idle')
  const [score, setScore] = useState(0)

  const scoreRef = useRef(0)
  const onScoreRef = useRef(onScore)
  onScoreRef.current = onScore

  const gridRef = useRef<Grid>([])
  const projectileRef = useRef<Projectile | null>(null)
  const currentBubbleRef = useRef<string>(getRandomColor())
  const nextBubbleRef = useRef<string>(getRandomColor())
  const particlesRef = useRef<Particle[]>([])
  const aimAngleRef = useRef<number>(-Math.PI / 2)
  const shotsFiredRef = useRef<number>(0)

  // Initialize bubble grid with 5 starting rows
  const initGrid = useCallback(() => {
    const grid: Grid = []
    for (let r = 0; r < GRID_ROWS; r++) {
      grid[r] = []
      const isOffset = r % 2 === 1
      const cols = isOffset ? GRID_COLS - 1 : GRID_COLS
      for (let c = 0; c < cols; c++) {
        if (r < 5) {
          grid[r][c] = { color: getRandomColor() }
        } else {
          grid[r][c] = null
        }
      }
    }
    gridRef.current = grid
  }, [])

  const startGame = useCallback(() => {
    scoreRef.current = 0
    shotsFiredRef.current = 0
    setScore(0)
    initGrid()
    currentBubbleRef.current = getRandomColor()
    nextBubbleRef.current = getRandomColor()
    projectileRef.current = null
    particlesRef.current = []
    setGameState('playing')
  }, [initGrid])

  // Calculate cell center (x, y)
  const getCellCenter = (r: number, c: number) => {
    const isOffset = r % 2 === 1
    const x = isOffset
      ? BUBBLE_RADIUS * 2 + c * BUBBLE_DIAMETER
      : BUBBLE_RADIUS + c * BUBBLE_DIAMETER
    const y = BUBBLE_RADIUS + r * ROW_HEIGHT
    return { x, y }
  }

  // Find nearest valid empty grid cell
  const getNearestCell = (x: number, y: number): { r: number; c: number } | null => {
    let closestDist = Infinity
    let closestCell: { r: number; c: number } | null = null

    for (let r = 0; r < GRID_ROWS; r++) {
      const isOffset = r % 2 === 1
      const cols = isOffset ? GRID_COLS - 1 : GRID_COLS
      for (let c = 0; c < cols; c++) {
        if (gridRef.current[r] && !gridRef.current[r][c]) {
          const center = getCellCenter(r, c)
          const dist = Math.hypot(center.x - x, center.y - y)
          if (dist < closestDist) {
            closestDist = dist
            closestCell = { r, c }
          }
        }
      }
    }
    return closestCell
  }

  // Find neighbors of (r, c) in the hexagonal grid
  const getNeighbors = (r: number, c: number): { r: number; c: number }[] => {
    const isOffset = r % 2 === 1
    const deltas = isOffset
      ? [
          [-1, 0], [-1, 1],
          [0, -1], [0, 1],
          [1, 0], [1, 1],
        ]
      : [
          [-1, -1], [-1, 0],
          [0, -1], [0, 1],
          [1, -1], [1, 0],
        ]

    const neighbors: { r: number; c: number }[] = []
    for (const [dr, dc] of deltas) {
      const nr = r + dr
      const nc = c + dc
      if (nr >= 0 && nr < GRID_ROWS) {
        const rowCols = nr % 2 === 1 ? GRID_COLS - 1 : GRID_COLS
        if (nc >= 0 && nc < rowCols) {
          neighbors.push({ r: nr, c: nc })
        }
      }
    }
    return neighbors
  }

  // Pop matching connected bubbles
  const popMatches = (startR: number, startC: number, color: string) => {
    const grid = gridRef.current
    const matched: { r: number; c: number }[] = []
    const visited = new Set<string>()
    const queue = [{ r: startR, c: startC }]
    visited.add(`${startR},${startC}`)

    while (queue.length > 0) {
      const curr = queue.shift()!
      matched.push(curr)

      for (const n of getNeighbors(curr.r, curr.c)) {
        const key = `${n.r},${n.c}`
        if (!visited.has(key)) {
          visited.add(key)
          const cell = grid[n.r]?.[n.c]
          if (cell && cell.color === color) {
            queue.push(n)
          }
        }
      }
    }

    if (matched.length >= 3) {
      // Pop them!
      for (const m of matched) {
        grid[m.r][m.c] = null
        const center = getCellCenter(m.r, m.c)
        for (let i = 0; i < 8; i++) {
          const angle = Math.random() * Math.PI * 2
          const speed = 1.5 + Math.random() * 3
          particlesRef.current.push({
            x: center.x,
            y: center.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color,
            life: 25,
          })
        }
      }

      const points = matched.length * 30
      scoreRef.current += points

      // Drop floating / unanchored bubbles
      dropFloatingBubbles()
      setScore(scoreRef.current)

      // Check if grid is cleared
      let remaining = 0
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < (r % 2 === 1 ? GRID_COLS - 1 : GRID_COLS); c++) {
          if (grid[r][c]) remaining++
        }
      }
      if (remaining === 0) {
        scoreRef.current += 1000
        setScore(scoreRef.current)
        setGameState('win')
        onScoreRef.current(scoreRef.current)
      }
    }
  }

  // Find bubbles that are connected to the ceiling (r=0)
  const dropFloatingBubbles = () => {
    const grid = gridRef.current
    const connected = new Set<string>()
    const queue: { r: number; c: number }[] = []

    // Seed with row 0
    for (let c = 0; c < GRID_COLS; c++) {
      if (grid[0][c]) {
        queue.push({ r: 0, c })
        connected.add(`0,${c}`)
      }
    }

    while (queue.length > 0) {
      const curr = queue.shift()!
      for (const n of getNeighbors(curr.r, curr.c)) {
        const key = `${n.r},${n.c}`
        if (!connected.has(key) && grid[n.r]?.[n.c]) {
          connected.add(key)
          queue.push(n)
        }
      }
    }

    // Any cell with a bubble that is not connected must drop
    let droppedCount = 0
    for (let r = 0; r < GRID_ROWS; r++) {
      const cols = r % 2 === 1 ? GRID_COLS - 1 : GRID_COLS
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] && !connected.has(`${r},${c}`)) {
          const color = grid[r][c]!.color
          grid[r][c] = null
          droppedCount++
          const center = getCellCenter(r, c)
          particlesRef.current.push({
            x: center.x,
            y: center.y,
            vx: (Math.random() - 0.5) * 2,
            vy: 2 + Math.random() * 4,
            color,
            life: 45,
          })
        }
      }
    }

    if (droppedCount > 0) {
      scoreRef.current += droppedCount * 50
    }
  }

  // Push new row from ceiling every 6 shots
  const advanceCeiling = () => {
    const grid = gridRef.current
    // Shift rows down
    for (let r = GRID_ROWS - 1; r > 0; r--) {
      grid[r] = [...grid[r - 1]]
    }
    // New top row
    grid[0] = []
    for (let c = 0; c < GRID_COLS; c++) {
      grid[0][c] = { color: getRandomColor() }
    }

    // Check if bottom row reached
    const bottomCols = (GRID_ROWS - 1) % 2 === 1 ? GRID_COLS - 1 : GRID_COLS
    for (let c = 0; c < bottomCols; c++) {
      if (grid[GRID_ROWS - 1][c]) {
        setGameState('gameover')
        onScoreRef.current(scoreRef.current)
        break
      }
    }
  }

  // Aim handler
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS_WIDTH / rect.width
    const scaleY = CANVAS_HEIGHT / rect.height
    const mouseX = (e.clientX - rect.left) * scaleX
    const mouseY = (e.clientY - rect.top) * scaleY

    const launcherX = CANVAS_WIDTH / 2
    const launcherY = CANVAS_HEIGHT - 35
    const angle = Math.atan2(mouseY - launcherY, mouseX - launcherX)

    // Restrict shooting angle between -165 deg and -15 deg
    const clamped = Math.max(-Math.PI * 0.92, Math.min(-Math.PI * 0.08, angle))
    aimAngleRef.current = clamped
  }

  // Fire projectile handler
  const handlePointerDown = () => {
    if (gameState !== 'playing' || projectileRef.current) return
    const speed = 12
    const angle = aimAngleRef.current
    projectileRef.current = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 35,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: currentBubbleRef.current,
      active: true,
    }
    currentBubbleRef.current = nextBubbleRef.current
    nextBubbleRef.current = getRandomColor()
  }

  // Main animation loop
  useEffect(() => {
    let animId: number
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const loop = () => {
      // ─── Update logic ──────────────────────────────────────────────
      if (gameState === 'playing') {
        const p = projectileRef.current
        if (p && p.active) {
          p.x += p.vx
          p.y += p.vy

          // Wall bounces
          if (p.x <= BUBBLE_RADIUS) {
            p.x = BUBBLE_RADIUS
            p.vx = -p.vx
          } else if (p.x >= CANVAS_WIDTH - BUBBLE_RADIUS) {
            p.x = CANVAS_WIDTH - BUBBLE_RADIUS
            p.vx = -p.vx
          }

          // Ceiling collision
          let collided = p.y <= BUBBLE_RADIUS

          // Bubble collision check
          if (!collided) {
            for (let r = 0; r < GRID_ROWS; r++) {
              const cols = r % 2 === 1 ? GRID_COLS - 1 : GRID_COLS
              for (let c = 0; c < cols; c++) {
                if (gridRef.current[r]?.[c]) {
                  const center = getCellCenter(r, c)
                  if (Math.hypot(center.x - p.x, center.y - p.y) < BUBBLE_DIAMETER * 0.9) {
                    collided = true
                    break
                  }
                }
              }
              if (collided) break
            }
          }

          if (collided) {
            p.active = false
            const cell = getNearestCell(p.x, p.y)
            if (cell) {
              gridRef.current[cell.r][cell.c] = { color: p.color }
              popMatches(cell.r, cell.c, p.color)

              // Check danger line overflow
              if (cell.r >= GRID_ROWS - 2) {
                setGameState('gameover')
                onScoreRef.current(scoreRef.current)
              }
            }
            projectileRef.current = null

            shotsFiredRef.current++
            if (shotsFiredRef.current % 6 === 0) {
              advanceCeiling()
            }
          }
        }

        // Update Particles
        particlesRef.current.forEach((pt) => {
          pt.x += pt.vx
          pt.y += pt.vy
          pt.life--
        })
        particlesRef.current = particlesRef.current.filter((pt) => pt.life > 0)
      }

      // ─── Render Canvas ──────────────────────────────────────────────
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
      bgGrad.addColorStop(0, '#fbf7f2')
      bgGrad.addColorStop(1, '#eee5d6')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // Danger line at bottom
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)'
      ctx.setLineDash([6, 6])
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, CANVAS_HEIGHT - 65)
      ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 65)
      ctx.stroke()
      ctx.setLineDash([])

      // Draw Grid Bubbles
      for (let r = 0; r < GRID_ROWS; r++) {
        const cols = r % 2 === 1 ? GRID_COLS - 1 : GRID_COLS
        for (let c = 0; c < cols; c++) {
          const bubble = gridRef.current[r]?.[c]
          if (bubble) {
            const { x, y } = getCellCenter(r, c)
            drawClayBubble(ctx, x, y, BUBBLE_RADIUS, bubble.color)
          }
        }
      }

      // Draw Particles
      particlesRef.current.forEach((pt) => {
        ctx.fillStyle = pt.color
        ctx.globalAlpha = Math.max(0, pt.life / 30)
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.globalAlpha = 1

      // Draw Trajectory Guideline
      if (gameState === 'playing' && !projectileRef.current) {
        const launcherX = CANVAS_WIDTH / 2
        const launcherY = CANVAS_HEIGHT - 35
        const angle = aimAngleRef.current
        ctx.strokeStyle = 'rgba(107, 79, 191, 0.35)'
        ctx.setLineDash([4, 6])
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.moveTo(launcherX, launcherY)
        ctx.lineTo(
          launcherX + Math.cos(angle) * 120,
          launcherY + Math.sin(angle) * 120
        )
        ctx.stroke()
        ctx.setLineDash([])
      }

      // Draw Launcher & Next Bubble
      const lx = CANVAS_WIDTH / 2
      const ly = CANVAS_HEIGHT - 35

      // Next bubble preview
      ctx.save()
      ctx.fillStyle = '#7A7092'
      ctx.font = '10px Nunito, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('NEXT', lx - 60, ly - 22)
      drawClayBubble(ctx, lx - 60, ly, BUBBLE_RADIUS * 0.8, nextBubbleRef.current)
      ctx.restore()

      // Current loaded bubble
      if (!projectileRef.current && gameState === 'playing') {
        drawClayBubble(ctx, lx, ly, BUBBLE_RADIUS, currentBubbleRef.current)
      }

      // Flying projectile
      const proj = projectileRef.current
      if (proj && proj.active) {
        drawClayBubble(ctx, proj.x, proj.y, BUBBLE_RADIUS, proj.color)
      }

      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animId)
  }, [gameState])

  // Helper to draw a clay-style shiny bubble
  const drawClayBubble = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    color: string
  ) => {
    ctx.save()
    // Soft outer drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.16)'
    ctx.shadowBlur = 6
    ctx.shadowOffsetY = 3

    // Main circle
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
    ctx.shadowColor = 'transparent'

    // Specular highlight (clay sheen)
    const hlGrad = ctx.createRadialGradient(
      x - radius * 0.35,
      y - radius * 0.35,
      1,
      x - radius * 0.35,
      y - radius * 0.35,
      radius * 0.7
    )
    hlGrad.addColorStop(0, 'rgba(255, 255, 255, 0.75)')
    hlGrad.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.fillStyle = hlGrad
    ctx.beginPath()
    ctx.arc(x - radius * 0.35, y - radius * 0.35, radius * 0.6, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-md mx-auto select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between w-full px-2 text-sm font-bold text-ink">
        <span>
          Score:{' '}
          <span className="font-mono text-base text-[var(--color-plum)]">{score}</span>
        </span>
        <span className="text-xs text-ink-soft">Aim & tap to fire</span>
      </div>

      {/* Canvas */}
      <div className="relative w-full aspect-[420/540] rounded-2xl overflow-hidden shadow-xl border-4 border-[var(--color-lavender-dark)]/40 bg-[var(--color-cream)]">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          className="w-full h-full block cursor-crosshair touch-none"
        />

        {gameState === 'idle' && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center gap-4 text-center p-6 text-white animate-pop-in">
            <h2 className="text-3xl font-black text-[var(--color-lavender)]">BUBBLE SHOOTER</h2>
            <p className="text-sm text-white/80 max-w-xs">
              Match 3 or more bubbles of the same color to pop them. Clear the board before they reach the bottom!
            </p>
            <ClayButton accent="lavender" size="lg" onClick={startGame}>
              <Play size={18} /> Play Game
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
              <RotateCcw size={16} /> Try Again
            </ClayButton>
          </div>
        )}

        {gameState === 'win' && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-center p-6 text-white animate-pop-in">
            <Trophy size={48} className="text-yellow-400 animate-bounce" />
            <h2 className="text-3xl font-black text-emerald-400">BOARD CLEARED!</h2>
            <p className="text-sm text-white/80">
              Amazing job! Final Score:{' '}
              <span className="font-black text-xl text-yellow-400">{score}</span>
            </p>
            <ClayButton accent="mint" onClick={startGame} className="mt-2">
              <RotateCcw size={16} /> Play Again
            </ClayButton>
          </div>
        )}
      </div>
    </div>
  )
}

export default BubbleShooter
