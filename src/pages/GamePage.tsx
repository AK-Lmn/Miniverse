import { useEffect, useState } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { ArrowLeft, Heart, Volume2, VolumeX, Share2, Trophy, Sparkles } from 'lucide-react'
import { getGameById, GAMES } from '../data/games'
import { ClayButton, ClayCard } from '../components/ui/Clay'
import { useGameSession } from '../hooks/useGameSession'
import { favoritesStore, highScoreStore, soundStore, leaderboardStore, nicknameStore } from '../lib/storage'
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const Icon = game.icon
  const Component = game.component
  const related = GAMES.filter((g) => g.category === game.category && g.id !== game.id).slice(0, 4)

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">

      {/* ── Breadcrumb header ─────────────────────────────────── */}
      <div className="mb-5 flex items-center justify-between">
        <Link
          to="/games"
          className="flex items-center gap-1.5 rounded-full text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Games
        </Link>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleSound}
            aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
            className="clay-btn flex h-9 w-9 items-center justify-center rounded-full p-0"
            title={soundEnabled ? 'Mute' : 'Unmute'}
          >
            {soundEnabled
              ? <Volume2 size={16} aria-hidden="true" />
              : <VolumeX size={16} aria-hidden="true" />
            }
          </button>
          <button
            onClick={toggleFavorite}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-pressed={isFavorite}
            className="clay-btn flex h-9 w-9 items-center justify-center rounded-full p-0"
          >
            <Heart
              size={16}
              fill={isFavorite ? 'var(--color-pink-dark)' : 'none'}
              color={isFavorite ? 'var(--color-pink-dark)' : 'var(--color-ink-soft)'}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* ── Game title + meta ─────────────────────────────────── */}
      <div className="mb-4 flex items-center gap-4">
        <div
          className="clay-inset flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: `var(--color-${game.accent})` }}
        >
          {Icon
            ? <Icon size={28} className="text-plum" aria-hidden="true" />
            : <span className="text-3xl" aria-hidden="true">{game.emoji}</span>
          }
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{game.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-ink-soft">
            <span className="rounded-full bg-white/60 px-2.5 py-0.5">{game.category}</span>
            <span className="rounded-full bg-white/60 px-2.5 py-0.5">{game.difficulty}</span>
            {highScore > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-white/60 px-2.5 py-0.5">
                <Trophy size={11} aria-hidden="true" /> Best: {highScore}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Game canvas ───────────────────────────────────────── */}
      <ClayCard
        accent={game.accent}
        className="flex flex-col items-center px-4 py-6 sm:px-8 sm:py-8"
        style={{ boxShadow: '0 0 0 2px rgba(107,79,191,0.12), 10px 10px 22px rgba(130,110,170,0.18), -10px -10px 22px rgba(255,255,255,0.90)' }}
      >
        <Component key={game.id} onScore={handleScore} soundEnabled={soundEnabled} />
      </ClayCard>

      {/* ── Score result panel ────────────────────────────────── */}
      {lastResult && (
        <div className="mt-4 animate-slide-up">
          <ClayCard
            accent={lastResult.isNewHighScore ? 'mint' : 'cream'}
            className="flex flex-col items-center gap-4 px-5 py-5 text-center"
          >
            {lastResult.isNewHighScore && (
              <div className="flex items-center gap-2 text-sm font-bold text-ink">
                <Sparkles size={16} className="text-plum animate-jiggle" aria-hidden="true" />
                New High Score!
                <Sparkles size={16} className="text-plum animate-jiggle" aria-hidden="true" />
              </div>
            )}
            <p className="animate-score-pop font-display text-4xl font-black text-ink" aria-live="polite">
              {lastResult.score}
            </p>
            <p className="text-sm text-ink-soft">{game.scoreLabel ?? 'Score'}</p>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {lastResult.isNewHighScore && !submittedToLeaderboard && (
                <div className="flex items-center gap-2">
                  <input
                    value={nicknameInput}
                    onChange={(e) => setNicknameInput(e.target.value)}
                    placeholder="Your nickname"
                    maxLength={16}
                    aria-label="Nickname for leaderboard"
                    className="clay-inset rounded-full bg-white/70 px-3 py-1.5 text-sm text-ink outline-none"
                  />
                  <ClayButton size="sm" accent="mint" onClick={submitToLeaderboard}>
                    <Trophy size={14} aria-hidden="true" />
                    Leaderboard
                  </ClayButton>
                </div>
              )}
              <ClayButton
                size="sm"
                accent="lavender"
                onClick={() => setIsShareOpen(true)}
              >
                <Share2 size={14} aria-hidden="true" />
                Share Score
              </ClayButton>
            </div>
            {submittedToLeaderboard && (
              <p className="text-xs text-ink-soft">Added to the local leaderboard 🏆</p>
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

      {/* ── How to play ───────────────────────────────────────── */}
      <ClayCard accent="cream" className="mt-6 px-6 py-5">
        <h2 className="font-display text-base font-bold text-ink">How to Play</h2>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-ink-soft">
          {game.howToPlay.map((line, i) => <li key={i}>{line}</li>)}
        </ul>
      </ClayCard>

      {/* ── Related games ─────────────────────────────────────── */}
      {related.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 font-display text-base font-bold text-ink">More {game.category} Games</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {related.map((g) => {
              const RelIcon = g.icon
              return (
                <Link
                  key={g.id}
                  to={`/games/${g.id}`}
                  className="clay flex min-w-[130px] flex-col items-center gap-2 px-4 py-4 text-center transition-transform hover:-translate-y-1"
                  style={{ ['--clay-bg' as string]: `var(--color-${g.accent})` }}
                >
                  {RelIcon
                    ? <RelIcon size={24} className="text-plum" aria-hidden="true" />
                    : <span className="text-2xl" aria-hidden="true">{g.emoji}</span>
                  }
                  <span className="font-display text-sm font-bold text-ink">{g.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
