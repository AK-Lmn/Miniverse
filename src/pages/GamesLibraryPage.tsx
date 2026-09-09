import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Heart, Clock, SlidersHorizontal } from 'lucide-react'
import { GAMES, CATEGORIES } from '../data/games'
import { GameCard } from '../components/games/GameCard'
import { ClayButton, ClaySelect, EmptyState, SectionHeading } from '../components/ui/Clay'
import { favoritesStore, recentlyPlayedStore, highScoreStore } from '../lib/storage'
import type { GameDifficulty } from '../types'

type SortMode = 'name' | 'difficulty' | 'highscore'

const DIFFICULTIES: GameDifficulty[] = ['Easy', 'Medium', 'Hard']
const DIFFICULTY_RANK: Record<GameDifficulty, number> = { Easy: 0, Medium: 1, Hard: 2 }

export function GamesLibraryPage() {
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(params.get('category') ?? 'All')
  const [difficulty, setDifficulty] = useState<GameDifficulty | 'All'>('All')
  const [sort, setSort] = useState<SortMode>('name')
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [onlyRecent, setOnlyRecent] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const [recent, setRecent] = useState<string[]>([])

  useEffect(() => {
    setFavorites(favoritesStore.get())
    setRecent(recentlyPlayedStore.get())
  }, [])

  useEffect(() => {
    const c = params.get('category')
    if (c) setCategory(c)
  }, [params])

  const filtered = useMemo(() => {
    let list = GAMES.filter((g) => {
      const matchesQuery =
        !query ||
        g.name.toLowerCase().includes(query.toLowerCase()) ||
        g.description.toLowerCase().includes(query.toLowerCase())
      const matchesCategory = category === 'All' || g.category === category
      const matchesDifficulty = difficulty === 'All' || g.difficulty === difficulty
      const matchesFav = !onlyFavorites || favorites.includes(g.id)
      const matchesRecent = !onlyRecent || recent.includes(g.id)
      return matchesQuery && matchesCategory && matchesDifficulty && matchesFav && matchesRecent
    })

    if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    if (sort === 'difficulty') list = [...list].sort((a, b) => DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty])
    if (sort === 'highscore') list = [...list].sort((a, b) => highScoreStore.get(b.id) - highScoreStore.get(a.id))

    return list
  }, [query, category, difficulty, sort, onlyFavorites, onlyRecent, favorites, recent])

  const setCategoryFilter = (c: string) => {
    setCategory(c)
    setParams(c === 'All' ? {} : { category: c })
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <SectionHeading>Game Library</SectionHeading>
      <p className="mb-6 -mt-3 text-ink-soft">Browse {GAMES.length} games — search, filter, and find your next favorite.</p>

      <div className="clay flex items-center gap-2.5 px-4 py-3" style={{ '--clay-bg': 'white' } as React.CSSProperties}>
        <Search size={18} className="shrink-0 text-ink-soft" aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search games…"
          aria-label="Search games"
          className="w-full bg-transparent text-ink outline-none placeholder:text-ink-soft/60"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="shrink-0 rounded-full bg-ink-soft/20 px-2 py-0.5 text-xs font-bold text-ink-soft hover:bg-ink-soft/30"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <ClayButton
          size="sm"
          accent={category === 'All' ? 'mint' : 'cream'}
          onClick={() => setCategoryFilter('All')}
        >
          All
        </ClayButton>
        {CATEGORIES.map((c) => (
          <ClayButton
            key={c}
            size="sm"
            accent={category === c ? 'mint' : 'lavender'}
            onClick={() => setCategoryFilter(c)}
          >
            {c}
          </ClayButton>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <SlidersHorizontal size={14} className="text-ink-soft" aria-hidden="true" />
        <span className="text-xs font-bold text-ink-soft">Difficulty:</span>
        <ClayButton
          size="sm"
          accent={difficulty === 'All' ? 'peach' : 'cream'}
          onClick={() => setDifficulty('All')}
        >
          All
        </ClayButton>
        {DIFFICULTIES.map((d) => (
          <ClayButton
            key={d}
            size="sm"
            accent={difficulty === d ? 'peach' : 'cream'}
            onClick={() => setDifficulty(d)}
          >
            {d}
          </ClayButton>
        ))}

        <span className="ml-1 text-xs font-bold text-ink-soft">Sort:</span>
        <ClaySelect
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
          aria-label="Sort games"
          className="py-1"
        >
          <option value="name">Name</option>
          <option value="difficulty">Difficulty</option>
          <option value="highscore">High Score</option>
        </ClaySelect>

        <ClayButton
          size="sm"
          accent={onlyFavorites ? 'pink' : 'cream'}
          onClick={() => setOnlyFavorites((v) => !v)}
        >
          <Heart size={13} fill={onlyFavorites ? 'var(--color-pink-dark)' : 'none'} aria-hidden="true" />
          Favorites
        </ClayButton>
        <ClayButton
          size="sm"
          accent={onlyRecent ? 'sky' : 'cream'}
          onClick={() => setOnlyRecent((v) => !v)}
        >
          <Clock size={13} aria-hidden="true" />
          Recent
        </ClayButton>
      </div>

      <p className="mt-4 text-xs font-semibold text-ink-soft">
        {filtered.length} {filtered.length === 1 ? 'game' : 'games'} found
      </p>

      <div className="mt-3">
        {filtered.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((g) => <GameCard key={g.id} game={g} />)}
          </div>
        ) : (
          <EmptyState
            icon={Search}
            title="Nothing found"
            message="Try a different game name, category, or keyword."
          />
        )}
      </div>
    </div>
  )
}
