import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { GAMES } from '../data/games'
import { GameCard } from '../components/games/GameCard'
import { EmptyState } from '../components/ui/Clay'
import { ClayButton } from '../components/ui/Clay'
import { favoritesStore } from '../lib/storage'

export function FavoritesPage() {
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    setFavorites(favoritesStore.get())
  }, [])

  const games = GAMES.filter((g) => favorites.includes(g.id))

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">Favorites</h1>
      <p className="mt-1 text-ink-soft">The games you've hearted, all in one place.</p>

      <div className="mt-6">
        {games.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {games.map((g) => <GameCard key={g.id} game={g} />)}
          </div>
        ) : (
          <EmptyState
            emoji="💛"
            title="No favorites yet"
            message="Find a game you love and tap the heart."
            action={
              <Link to="/games">
                <ClayButton accent="mint">Browse Games</ClayButton>
              </Link>
            }
          />
        )}
      </div>
    </div>
  )
}
