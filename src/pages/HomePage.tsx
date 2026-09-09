import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Gamepad2, Trophy, Clock,
  Zap, Star, Puzzle, Dices, Bird, Grid2x2, Swords,
} from 'lucide-react'
import { GAMES, CATEGORIES, getGameById } from '../data/games'
import { GameCard } from '../components/games/GameCard'
import { ClayButton, ClayCard, EmptyState, SectionHeading } from '../components/ui/Clay'
import { recentlyPlayedStore, computeAggregateStats } from '../lib/storage'
import { getTodaysChallenge } from '../lib/dailyChallenge'

const FEATURED_IDS = ['flappy-bird', 'snake', 'tetris', '2048', 'minesweeper', 'memory-match']

const HERO_ICONS = [
  { Icon: Bird,    cls: 'left-[6%]  top-12  text-4xl text-plum/60    animate-float-slow',   delay: '0s' },
  { Icon: Swords,  cls: 'right-[8%] top-8   text-4xl text-mint-dark/60 animate-float-slower', delay: '1.5s' },
  { Icon: Puzzle,  cls: 'left-[14%] bottom-10 text-3xl text-peach-dark/60 animate-float-mid', delay: '0.8s' },
  { Icon: Star,    cls: 'right-[5%] bottom-14 text-4xl text-butter-dark/60 animate-float-slow', delay: '2s' },
  { Icon: Grid2x2, cls: 'left-[50%] top-4  text-3xl text-sky-dark/50  animate-float-slower', delay: '1s' },
  { Icon: Dices,   cls: 'right-[28%] bottom-4 text-3xl text-lavender-dark/60 animate-float-mid', delay: '0.3s' },
]

const CATEGORY_ICONS: Record<string, typeof Gamepad2> = {
  Arcade: Gamepad2, Puzzle, Classic: Dices, Reflex: Zap, Casual: Star, Word: Star,
}

export function HomePage() {
  const [recent, setRecent] = useState<string[]>([])
  const [stats, setStats] = useState(() => computeAggregateStats())
  const challenge = getTodaysChallenge()
  const challengeGame = getGameById(challenge.gameId)

  useEffect(() => {
    setRecent(recentlyPlayedStore.get())
    setStats(computeAggregateStats())
  }, [])

  const featured = FEATURED_IDS.map((id) => getGameById(id)).filter(Boolean)
  const popular = [...GAMES]
    .sort((a, b) => (stats.gamesPlayedByGame[b.id] ?? 0) - (stats.gamesPlayedByGame[a.id] ?? 0))
    .slice(0, 6)

  return (
    <div>

      <section className="clay-hero relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pt-24">

        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {HERO_ICONS.map(({ Icon, cls, delay }, i) => (
            <Icon
              key={i}
              size={36}
              className={`absolute ${cls}`}
              style={{ animationDelay: delay }}
            />
          ))}
        </div>

        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">

          <span className="clay animate-pop-in rounded-full px-5 py-1.5 text-xs font-bold text-plum" style={{ '--clay-bg': 'var(--color-lavender)' } as React.CSSProperties}>
            ✦ {GAMES.length} games · no download needed
          </span>

          <h1 className="animate-slide-up font-display text-5xl font-black leading-tight tracking-tight sm:text-7xl" style={{ animationDelay: '60ms' }}>
            Mini<span className="gradient-text">Verse</span>
          </h1>

          <p className="animate-slide-up font-display text-xl font-bold text-ink-soft sm:text-2xl" style={{ animationDelay: '120ms' }}>
            Tiny Games.&ensp;Big Fun.
          </p>

          <p className="animate-slide-up max-w-lg text-ink-soft" style={{ animationDelay: '180ms' }}>
            A collection of quick, polished games you can play anytime — right in your browser.
            No downloads, no accounts, just play.
          </p>

          <div className="animate-slide-up mt-1 flex flex-wrap justify-center gap-3" style={{ animationDelay: '240ms' }}>
            <Link to={`/games/${GAMES[0].id}`}>
              <ClayButton accent="mint" size="lg">
                <Gamepad2 size={20} aria-hidden="true" />
                Play Now
              </ClayButton>
            </Link>
            <Link to="/games">
              <ClayButton accent="lavender" size="lg">
                Explore Games
                <ArrowRight size={18} aria-hidden="true" />
              </ClayButton>
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-16 px-4 pb-20 pt-10 sm:px-6">

        {challengeGame && (
          <section>
            <ClayCard
              accent="butter"
              className="flex flex-col items-center gap-5 px-6 py-6 sm:flex-row sm:justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/50">
                  {challengeGame.icon
                    ? <challengeGame.icon size={28} className="text-plum" aria-hidden="true" />
                    : <span className="text-3xl" aria-hidden="true">{challengeGame.emoji}</span>
                  }
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-ink-soft">
                    📅 Today&apos;s Challenge
                  </p>
                  <h3 className="font-display text-xl font-bold text-ink">{challengeGame.name}</h3>
                  <p className="text-sm text-ink-soft">{challenge.targetLabel}</p>
                  {challenge.bestAttempt !== undefined && (
                    <p className="text-xs text-ink-soft">Best: {challenge.bestAttempt}</p>
                  )}
                </div>
              </div>
              <Link to={`/games/${challengeGame.id}`} className="shrink-0">
                <ClayButton accent={challenge.completed ? 'mint' : 'peach'} size="lg">
                  {challenge.completed ? '✓ Completed' : 'Take the Challenge'}
                </ClayButton>
              </Link>
            </ClayCard>
          </section>
        )}

        <section>
          <SectionHeading
            action={
              <Link to="/games" className="flex items-center gap-1 text-sm font-semibold text-plum transition-opacity hover:opacity-70">
                See all <ArrowRight size={14} aria-hidden="true" />
              </Link>
            }
          >
            Featured Games
          </SectionHeading>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
            {featured.slice(0, 6).map((g) => g && <GameCard key={g.id} game={g} />)}
          </div>
        </section>

        <section>
          <SectionHeading>Continue Playing</SectionHeading>
          {recent.length ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {recent.map((id) => {
                const g = getGameById(id)
                return g ? <GameCard key={g.id} game={g} /> : null
              })}
            </div>
          ) : (
            <EmptyState
              icon={Gamepad2}
              title="Nothing played yet"
              message="Jump into a game and it'll appear here so you can pick right back up."
              action={
                <Link to="/games">
                  <ClayButton accent="mint">Browse Games</ClayButton>
                </Link>
              }
            />
          )}
        </section>

        <section>
          <SectionHeading>Categories</SectionHeading>
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map((cat) => {
              const CatIcon = CATEGORY_ICONS[cat] ?? Gamepad2
              return (
                <Link
                  key={cat}
                  to={`/games?category=${encodeURIComponent(cat)}`}
                  className="clay-btn inline-flex items-center gap-2 px-5 py-2.5 font-display text-sm font-bold text-ink"
                  style={{ '--clay-bg': 'var(--color-lavender)' } as React.CSSProperties}
                >
                  <CatIcon size={16} aria-hidden="true" />
                  {cat}
                </Link>
              )
            })}
          </div>
        </section>

        <section>
          <SectionHeading
            action={
              <Link to="/games" className="flex items-center gap-1 text-sm font-semibold text-plum transition-opacity hover:opacity-70">
                All games <ArrowRight size={14} aria-hidden="true" />
              </Link>
            }
          >
            Popular Games
          </SectionHeading>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
            {popular.map((g) => <GameCard key={g.id} game={g} />)}
          </div>
        </section>

        <section>
          <SectionHeading>Your Stats</SectionHeading>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <ClayCard accent="lavender" className="flex flex-col items-center gap-2 px-4 py-6 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/50">
                <Gamepad2 className="text-plum" size={20} aria-hidden="true" />
              </div>
              <p className="font-display text-3xl font-black text-ink">{stats.totalGamesPlayed}</p>
              <p className="text-xs font-semibold text-ink-soft">Games Played</p>
            </ClayCard>

            <ClayCard accent="mint" className="flex flex-col items-center gap-2 px-4 py-6 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/50">
                <Trophy className="text-plum" size={20} aria-hidden="true" />
              </div>
              <p className="font-display text-3xl font-black text-ink">{Object.keys(stats.highScores).length}</p>
              <p className="text-xs font-semibold text-ink-soft">High Scores</p>
            </ClayCard>

            <ClayCard accent="peach" className="flex flex-col items-center gap-2 px-4 py-6 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/50">
                <Clock className="text-plum" size={20} aria-hidden="true" />
              </div>
              <p className="font-display text-3xl font-black text-ink">{Math.round(stats.totalPlayTimeSeconds / 60)}m</p>
              <p className="text-xs font-semibold text-ink-soft">Play Time</p>
            </ClayCard>

            <Link to="/profile" className="block">
              <ClayCard accent="pink" className="flex h-full flex-col items-center justify-center gap-2 px-4 py-6 text-center transition-transform hover:-translate-y-1">
                <ArrowRight size={22} className="text-plum" aria-hidden="true" />
                <p className="font-display font-bold text-ink">Full Profile</p>
              </ClayCard>
            </Link>
          </div>
        </section>

        <section className="text-center">
          <ClayCard accent="lavender" className="mx-auto flex max-w-xl flex-col items-center gap-5 px-8 py-12">
            <Gamepad2 size={32} className="text-plum" aria-hidden="true" />
            <h2 className="font-display text-2xl font-bold text-ink">What are you playing next?</h2>
            <Link to="/games">
              <ClayButton accent="mint" size="lg">
                Explore All Games
                <ArrowRight size={18} aria-hidden="true" />
              </ClayButton>
            </Link>
          </ClayCard>
        </section>
      </div>
    </div>
  )
}
