import { useEffect, useRef, useState } from 'react'
import { X, Copy, Download, Check } from 'lucide-react'

interface ShareCardModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  score: number | string
  scoreLabel?: string
  nickname?: string
  gameEmoji?: string
}

export function ShareCardModal({
  isOpen,
  onClose,
  title,
  score,
  scoreLabel = 'Score',
  nickname = 'Player',
  gameEmoji = '🎮',
}: ShareCardModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [copied, setCopied] = useState(false)

  const shareText = `🎮 MiniVerse — Tiny Games. Big Fun.\n${gameEmoji} ${title}\n⭐ ${scoreLabel}: ${score}\n👤 Player: ${nickname || 'MiniVerse Player'}\nCan you beat my score?`

  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Draw high-resolution share card
      ctx.clearRect(0, 0, 600, 400)

      // Background Gradient
      const grad = ctx.createLinearGradient(0, 0, 600, 400)
      grad.addColorStop(0, '#1E103E')
      grad.addColorStop(0.5, '#2D1557')
      grad.addColorStop(1, '#0F0926')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 600, 400)

      // Decorative border & neon glow
      ctx.strokeStyle = '#38BDF8'
      ctx.lineWidth = 6
      ctx.shadowColor = '#38BDF8'
      ctx.shadowBlur = 12
      ctx.strokeRect(20, 20, 560, 360)
      ctx.shadowBlur = 0

      // Title & Logo
      ctx.fillStyle = '#A7F3D0'
      ctx.font = 'bold 24px sans-serif'
      ctx.fillText('MINIVERSE ARCADE', 50, 70)

      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 36px sans-serif'
      ctx.fillText(`${gameEmoji} ${title}`, 50, 130)

      // Score Container
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
      ctx.beginPath()
      ctx.roundRect(50, 170, 500, 120, 16)
      ctx.fill()

      ctx.fillStyle = '#94A3B8'
      ctx.font = '18px sans-serif'
      ctx.fillText(scoreLabel.toUpperCase(), 80, 215)

      ctx.fillStyle = '#FACC15'
      ctx.font = 'bold 48px sans-serif'
      ctx.fillText(String(score), 80, 268)

      // Footer
      ctx.fillStyle = '#CBD5E1'
      ctx.font = '16px sans-serif'
      ctx.fillText(`Player: ${nickname || 'MiniVerse Gamer'}`, 50, 345)

      ctx.fillStyle = '#F472B6'
      ctx.font = 'bold 16px sans-serif'
      ctx.fillText('miniverse.app', 450, 345)
    }, 50)

    return () => clearTimeout(timer)
  }, [isOpen, title, score, scoreLabel, nickname, gameEmoji])

  if (!isOpen) return null

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard fallback
    }
  }

  const handleDownloadImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const image = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `miniverse-${title.toLowerCase().replace(/\s+/g, '-')}-score.png`
    link.href = image
    link.click()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm animate-pop-in">
      <div className="clay relative w-full max-w-lg overflow-hidden bg-cream p-6 text-ink shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-ink-soft hover:bg-black/10"
        >
          <X size={20} />
        </button>

        <h3 className="mb-4 text-xl font-bold font-display">Share Your Score</h3>

        <div className="mb-6 flex justify-center">
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            className="w-full max-w-[420px] rounded-xl border border-white/30 shadow-lg"
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            onClick={handleCopyText}
            className="clay-btn flex items-center gap-2 bg-lavender px-4 py-2 text-sm font-bold text-ink"
          >
            {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy Share Text'}
          </button>

          <button
            onClick={handleDownloadImage}
            className="clay-btn flex items-center gap-2 bg-sky-400 px-4 py-2 text-sm font-bold text-slate-950"
          >
            <Download size={16} />
            Download Card
          </button>
        </div>
      </div>
    </div>
  )
}
