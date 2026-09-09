import { useEffect, useState } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { ArrowLeft, Heart, Volume2, VolumeX, Share2, Trophy, Sparkles } from 'lucide-react'
import { getGameById, GAMES } from '../data/games'
import { ClayButton, ClayCard } from '../components/ui/Clay'
import { useGameSession } from '../hooks/useGameSession'
import { favoritesStore, highScoreStore, soundStore, leaderboardStore, nicknameStore } from '../lib/storage'
import { playSfx } from '../lib/sound'
import { ShareCardModal } from '../components/ui/ShareCardModal'

export function GamePage() {
  const { gameId } = useParams()
  const game = gameId ? getGameById(gameId) : undefined
  const sessionGame = game ?? GAMES[0]

  const [isFavorite, setIsFavorite] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [highScore, setHighScore] = useState(0)
  const [lastResult, setLastResult] = useState<{ score: number; isNewHighScore: boolean } | null>(null)
  const [nicknameInput, setNicknameInput] = useState(nicknameStore.get())
  const [submittedToLeaderboard, setSubmittedToLeaderboard] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)

  const session = useGameSession(sessionGame)

  useEffect(() => {
    if (!game) return
    setIsFavorite(favoritesStore.get().includes(game.id))
    setHighScore(highScoreStore.get(game.id))
    setSoundEnabled(soundStore.get())
    session.start()
    setLastResult(null)
    setSubmittedToLeaderboard(false)
    setIsShareOpen(false)

  }, [game?.id])

  if (!game) return <Navigate to="/404" replace />

  const handleScore = (score: number) => {
    const result = session.finish(score)
    setLastResult({ score, isNewHighScore: result.isNewHighScore })
    setSubmittedToLeaderboard(false)
    if (result.isNewHighScore) setHighScore(score)
    session.start()
  }

  const submitToLeaderboard = () => {
    if (!lastResult) return
    const name = nicknameInput.trim() || 'Player'
    nicknameStore.set(name)
    leaderboardStore.add({ gameId: game.id, nickname: name, score: lastResult.score, date: Date.now() })
    setSubmittedToLeaderboard(true)
  }

  const toggleFavorite = () => setIsFavorite(favoritesStore.toggle(game.id).includes(game.id))
  const toggleSound = () => {
    const next = !soundEnabled
    setSoundEnabled(next)
    soundStore.set(next)
  }

  const sendVirtualKey = (key: string, code: string) => {
    playSfx('click', soundEnabled)
    window.dispatchEvent(new KeyboardEvent('keydown', { key, code, bubbles: true }))
    setTimeout(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { key, code, bubbles: true }))
    }, 60)
  }

  const Icon = game.icon
  const Component = game.component
  const related = GAMES.filter((g) => g.category === game.category && g.id !== game.id).slice(0, 4)
  const nextGame = related[0] ?? GAMES.find((g) => g.id !== game.id)

  return (
    <div className="mx-auto max-w-3xl px-3 py-4 sm:px-6 sm:py-6">

      {/* Top Header Navigation */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          to="/games"
          onClick={() => playSfx('cartridge', soundEnabled)}
          className="clay-btn flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-ink"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          <span>Cartridges</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
            className="clay-btn flex h-8 w-8 items-center justify-center rounded-full p-0"
            title={soundEnabled ? 'Mute' : 'Unmute'}
          >
            {soundEnabled
              ? <Volume2 size={15} aria-hidden="true" />
              : <VolumeX size={15} aria-hidden="true" />
            }
          </button>
          <button
            onClick={toggleFavorite}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-pressed={isFavorite}
            className="clay-btn flex h-8 w-8 items-center justify-center rounded-full p-0"
          >
            <Heart
              size={15}
              fill={isFavorite ? 'var(--color-pink-dark)' : 'none'}
              color={isFavorite ? 'var(--color-pink-dark)' : 'var(--color-ink-soft)'}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* HANDHELD CONSOLE CHASSIS */}
      <div
        className="clay relative overflow-hidden rounded-[36px] p-4 sm:p-7 shadow-2xl transition-all"
        style={{
          ['--clay-bg' as string]: `color-mix(in srgb, var(--color-${game.accent}) 55%, var(--color-cream) 45%)`,
        }}
      >
        {/* Top Console Hardware Bar */}
        <div className="mb-4 flex items-center justify-between px-2">
          {/* Left Speaker Grill */}
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="speaker-grill-dot" />
            <span className="speaker-grill-dot" />
            <span className="speaker-grill-dot" />
          </div>

          {/* Console Molded Stamp */}
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
            {Icon ? (
              <Icon size={14} className="text-plum" aria-hidden="true" />
            ) : (
              <span className="text-xs" aria-hidden="true">{game.emoji}</span>
            )}
            <span className="clay-stamp text-[10px] sm:text-xs font-black tracking-widest text-ink/70">
              MINIVERSE · {game.name}
            </span>
          </div>

          {/* Right Speaker Grill */}
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="speaker-grill-dot" />
            <span className="speaker-grill-dot" />
            <span className="speaker-grill-dot" />
          </div>
        </div>

        {/* Recessed Screen Well */}
        <div
          className="clay-inset relative flex w-full flex-col items-center justify-center rounded-[28px] p-2.5 sm:p-6 overflow-hidden"
          style={{ background: 'color-mix(in srgb, var(--color-cream) 70%, white 30%)' }}
        >
          {/* Game Component Canvas */}
          <Component key={game.id} onScore={handleScore} soundEnabled={soundEnabled} />
        </div>

        {/* Console Lower Deck: Integrated Molded Clay Controls */}
        <div className="mt-6 flex flex-col items-center gap-4">

          <div className="flex w-full max-w-md items-center justify-between px-3 sm:px-6">

            {/* Tactile Molded D-Pad */}
            <div className="flex flex-col items-center">
              <div className="relative flex h-28 w-28 items-center justify-center rounded-full clay-inset p-1 bg-[var(--color-ink)]/[0.04]">
                {/* Molded Cross Guide Channel */}
                <div className="pointer-events-none absolute h-24 w-7 rounded-full bg-[var(--color-ink)]/[0.05]" />
                <div className="pointer-events-none absolute h-7 w-24 rounded-full bg-[var(--color-ink)]/[0.05]" />

                {/* D-Pad Up */}
                <button
                  onClick={() => sendVirtualKey('ArrowUp', 'ArrowUp')}
                  aria-label="D-pad Up"
                  className="clay-btn absolute top-1 flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-ink active:scale-90"
                >
                  ▲
                </button>

                {/* D-Pad Left */}
                <button
                  onClick={() => sendVirtualKey('ArrowLeft', 'ArrowLeft')}
                  aria-label="D-pad Left"
                  className="clay-btn absolute left-1 flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-ink active:scale-90"
                >
                  ◀
                </button>

                {/* Molded Center Pivot Dimple */}
                <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-ink)]/15 shadow-inner">
                  <div className="h-2 w-2 rounded-full bg-[var(--color-ink)]/25 shadow-sm" />
                </div>

                {/* D-Pad Right */}
                <button
                  onClick={() => sendVirtualKey('ArrowRight', 'ArrowRight')}
                  aria-label="D-pad Right"
                  className="clay-btn absolute right-1 flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-ink active:scale-90"
                >
                  ▶
                </button>

                {/* D-Pad Down */}
                <button
                  onClick={() => sendVirtualKey('ArrowDown', 'ArrowDown')}
                  aria-label="D-pad Down"
                  className="clay-btn absolute bottom-1 flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-ink active:scale-90"
                >
                  ▼
                </button>
              </div>
              <span className="clay-stamp mt-1.5 text-[9px] text-ink-soft/70">D-PAD</span>
            </div>

            {/* Center Console Rocker Buttons */}
            <div className="flex flex-col items-center gap-1.5 pt-4">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    playSfx('cartridge', soundEnabled)
                    session.start()
                    setLastResult(null)
                  }}
                  className="clay-btn h-5 w-12 rounded-full text-[9px] font-extrabold uppercase text-ink-soft shadow-inner active:scale-95"
                >
                  Reset
                </button>
                <button
                  onClick={() => sendVirtualKey('Space', 'Space')}
                  className="clay-btn h-5 w-12 rounded-full text-[9px] font-extrabold uppercase text-ink-soft shadow-inner active:scale-95"
                >
                  Action
                </button>
              </div>
              <span className="clay-stamp text-[8px] text-ink-soft/60">SELECT · START</span>
            </div>

            {/* Tactile Molded Action Buttons (B & A) */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => sendVirtualKey('Enter', 'Enter')}
                  aria-label="Action Button B"
                  className="clay-btn flex h-12 w-12 items-center justify-center rounded-full text-base font-black text-ink active:scale-90"
                  style={{ '--clay-bg': 'var(--color-peach)' } as React.CSSProperties}
                >
                  B
                </button>
                <button
                  onClick={() => sendVirtualKey(' ', 'Space')}
                  aria-label="Action Button A (Space)"
                  className="clay-btn flex h-12 w-12 items-center justify-center rounded-full text-base font-black text-ink active:scale-90"
                  style={{ '--clay-bg': 'var(--color-mint)' } as React.CSSProperties}
                >
                  A
                </button>
              </div>
              <span className="clay-stamp mt-2 text-[9px] text-ink-soft/70">ACTION</span>
            </div>
          </div>
        </div>
      </div>

      {/* POST-GAME SCORE CARD & NEXT CARTRIDGE FUNNEL */}
      {lastResult && (
        <div className="mt-6 animate-slide-up">
          <ClayCard
            accent={lastResult.isNewHighScore ? 'mint' : 'cream'}
            className="flex flex-col items-center gap-4 px-6 py-6 text-center"
          >
            {lastResult.isNewHighScore && (
              <div className="flex items-center gap-2 text-sm font-extrabold text-ink">
                <Sparkles size={16} className="text-plum animate-jiggle" aria-hidden="true" />
                New High Score!
                <Sparkles size={16} className="text-plum animate-jiggle" aria-hidden="true" />
              </div>
            )}
            <p className="animate-score-pop font-display text-5xl font-black text-ink" aria-live="polite">
              {lastResult.score}
            </p>
            <p className="text-sm font-bold text-ink-soft">{game.scoreLabel ?? 'Score'}</p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {lastResult.isNewHighScore && !submittedToLeaderboard && (
                <div className="flex items-center gap-2">
                  <input
                    value={nicknameInput}
                    onChange={(e) => setNicknameInput(e.target.value)}
                    placeholder="Your nickname"
                    maxLength={16}
                    aria-label="Nickname for leaderboard"
                    className="clay-inset rounded-full bg-white/70 px-3 py-1.5 text-sm text-ink outline-none font-bold"
                  />
                  <ClayButton size="sm" accent="mint" onClick={submitToLeaderboard}>
                    <Trophy size={14} aria-hidden="true" />
                    Save Record
                  </ClayButton>
                </div>
              )}
              <ClayButton
                size="sm"
                accent="lavender"
                onClick={() => setIsShareOpen(true)}
              >
                <Share2 size={14} aria-hidden="true" />
                Share Card
              </ClayButton>

              {/* Next Game Recommendation CTA (High-impact retention loop) */}
              {nextGame && (
                <Link to={`/games/${nextGame.id}`}>
                  <ClayButton size="sm" accent="peach">
                    Next: {nextGame.name} →
                  </ClayButton>
                </Link>
              )}
            </div>

            {submittedToLeaderboard && (
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                ✓ Recorded to local device hall of fame 🏆
              </p>
            )}
          </ClayCard>
        </div>
      )}

      <ShareCardModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={game.name}
        score={lastResult?.score ?? highScore}
        scoreLabel={game.scoreLabel ?? 'Score'}
        nickname={nicknameInput}
        gameEmoji={game.emoji}
      />

      {/* How to Play Box */}
      <ClayCard accent="cream" className="mt-6 px-6 py-5">
        <h2 className="font-display text-base font-extrabold text-ink">How to Play</h2>
        <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm font-semibold text-ink-soft">
          {game.howToPlay.map((line, i) => <li key={i}>{line}</li>)}
        </ul>
      </ClayCard>

      {/* More Cartridges Carousel */}
      {related.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 font-display text-lg font-extrabold text-ink">More {game.category} Cartridges</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {related.map((g) => {
              const RelIcon = g.icon
              return (
                <Link
                  key={g.id}
                  to={`/games/${g.id}`}
                  onClick={() => playSfx('cartridge', soundEnabled)}
                  className="clay flex flex-col items-center gap-2 p-3 text-center transition-transform hover:-translate-y-1 active:scale-95"
                  style={{ ['--clay-bg' as string]: `var(--color-${g.accent})` }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/50 dark:bg-black/20">
                    {RelIcon
                      ? <RelIcon size={20} className="text-plum" aria-hidden="true" />
                      : <span className="text-xl" aria-hidden="true">{g.emoji}</span>
                    }
                  </div>
                  <span className="font-display text-xs font-bold text-ink">{g.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
