import { Link } from 'react-router-dom'
import { Heart, Clock, Sparkles } from 'lucide-react'
import type { GameDefinition } from '../../types'
import { favoritesStore, highScoreStore, soundStore } from '../../lib/storage'
import { playSfx } from '../../lib/sound'
import { ClayCartridge, ClayStamp } from '../ui/Clay'
import { useEffect, useState } from 'react'

const DIFFICULTY_CLASS: Record<string, string> = {
  Easy: 'diff-easy',
  Medium: 'diff-medium',
  Hard: 'diff-hard',
}

export function GameCard({ game }: { game: GameDefinition }) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [highScore, setHighScore] = useState(0)

  useEffect(() => {
    setIsFavorite(favoritesStore.get().includes(game.id))
    setHighScore(highScoreStore.get(game.id))
  }, [game.id])

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    playSfx('click', soundStore.get())
    const next = favoritesStore.toggle(game.id)
    setIsFavorite(next.includes(game.id))
  }

  const handleCardClick = () => {
    playSfx('cartridge', soundStore.get())
  }

  const Icon = game.icon

  return (
    <Link
      to={`/games/${game.id}`}
      onClick={handleCardClick}
      className="group block outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-plum)] rounded-3xl"
    >
      <ClayCartridge
        accent={game.accent}
        className="relative flex flex-col gap-3 p-4 transition-all duration-200"
      >
        {/* Top Cartridge Grip Stamp & Favorite */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 opacity-70">
            <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-ink)]/30" />
            <ClayStamp className="text-[10px] tracking-widest text-ink-soft">
              {game.category}
            </ClayStamp>
          </div>

          <button
            onClick={toggleFavorite}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-pressed={isFavorite}
            className="clay-btn z-10 flex h-7 w-7 items-center justify-center rounded-full p-0 shadow-sm"
          >
            <Heart
              size={13}
              fill={isFavorite ? 'var(--color-pink-dark)' : 'none'}
              color={isFavorite ? 'var(--color-pink-dark)' : 'var(--color-ink-soft)'}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* Cartridge Sticker Well (Recessed Screen/Label) */}
        <div className="clay-inset flex items-center gap-3 rounded-2xl bg-white/50 p-2.5 dark:bg-black/20">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform group-hover:scale-110"
            style={{ background: `color-mix(in srgb, var(--color-${game.accent}) 70%, white 30%)` }}
          >
            {Icon
              ? <Icon size={24} className="text-plum" aria-hidden="true" />
              : <span className="text-2xl" aria-hidden="true">{game.emoji}</span>
            }
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-base font-extrabold leading-tight text-ink group-hover:text-plum transition-colors">
              {game.name}
            </h3>
            <p className="truncate text-xs font-semibold text-ink-soft">{game.tagline}</p>
          </div>
        </div>

        {/* Footer info: Difficulty pill + time + score */}
        <div className="flex items-center justify-between pt-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${DIFFICULTY_CLASS[game.difficulty] ?? ''}`}>
              {game.difficulty}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold text-ink-soft dark:bg-black/30">
              <Clock size={10} aria-hidden="true" />
              {game.estimatedTime}
            </span>
          </div>

          {highScore > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-ink-soft">
              <Sparkles size={11} className="text-plum" aria-hidden="true" />
              <span className="font-extrabold text-ink">{highScore}</span>
            </span>
          )}
        </div>
      </ClayCartridge>
    </Link>
  )
}
