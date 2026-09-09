import { Link } from 'react-router-dom'
import { Heart, Clock } from 'lucide-react'
import type { GameDefinition } from '../../types'
import { favoritesStore, highScoreStore } from '../../lib/storage'
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
    const next = favoritesStore.toggle(game.id)
    setIsFavorite(next.includes(game.id))
  }

  const Icon = game.icon

  return (
    <Link
      to={`/games/${game.id}`}
      className="clay group relative flex flex-col gap-3 p-4 transition-all duration-200 hover:-translate-y-1.5 hover:shadow-xl"
      style={{ ['--clay-bg' as string]: `var(--color-${game.accent})` }}
    >
      {/* Favorite button */}
      <button
        onClick={toggleFavorite}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        aria-pressed={isFavorite}
        className="absolute right-3 top-3 z-10 rounded-full bg-white/70 p-1.5 shadow-sm transition-transform hover:scale-110 active:scale-95"
      >
        <Heart
          size={15}
          fill={isFavorite ? 'var(--color-pink-dark)' : 'none'}
          color={isFavorite ? 'var(--color-pink-dark)' : 'var(--color-ink-soft)'}
        />
      </button>

      {/* Icon + title */}
      <div className="flex items-center gap-3">
        <div
          className="clay-inset flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: `color-mix(in srgb, var(--color-${game.accent}) 60%, white 40%)` }}
        >
          {Icon
            ? <Icon size={28} className="text-plum" aria-hidden="true" />
            : <span className="text-3xl" aria-hidden="true">{game.emoji}</span>
          }
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display font-bold leading-snug text-ink">{game.name}</h3>
          <p className="truncate text-xs text-ink-soft">{game.tagline}</p>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${DIFFICULTY_CLASS[game.difficulty] ?? ''}`}>
          {game.difficulty}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-white/55 px-2 py-0.5 text-[10px] font-semibold text-ink-soft">
          <Clock size={10} aria-hidden="true" />
          {game.estimatedTime}
        </span>
      </div>

      {/* High score */}
      {highScore > 0 && (
        <p className="text-[11px] font-semibold text-ink-soft">
          Best: <span className="font-bold text-ink">{highScore}</span>
        </p>
      )}
    </Link>
  )
}
