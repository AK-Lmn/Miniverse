import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, Lock, Medal, CalendarDays, Gamepad2 } from 'lucide-react'
import { getGameById } from '../data/games'
import { ClayButton, ClayCard, EmptyState, SectionHeading } from '../components/ui/Clay'
import { getTodaysChallenge } from '../lib/dailyChallenge'
import { achievementsStore, computeAggregateStats, leaderboardStore } from '../lib/storage'
import { ACHIEVEMENTS } from '../lib/achievements'

const MEDAL_CONFIG = [
  { bg: 'bg-butter', text: 'text-amber-700', label: '🥇' },
  { bg: 'bg-lavender', text: 'text-indigo-600', label: '🥈' },
  { bg: 'bg-peach', text: 'text-orange-700', label: '🥉' },
]

export function ChallengesPage() {
  const [unlocked, setUnlocked] = useState<string[]>([])
  const [stats, setStats] = useState(() => computeAggregateStats())
  const challenge = getTodaysChallenge()
  const challengeGame = getGameById(challenge.gameId)
  const [leaderboardGame, setLeaderboardGame] = useState<string>('snake')

  useEffect(() => {
    setUnlocked(achievementsStore.getUnlocked())
    setStats(computeAggregateStats())
  }, [])

  const leaderboard = leaderboardStore.get(leaderboardGame)

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">

      <SectionHeading>Challenges</SectionHeading>
      <p className="-mt-3 mb-8 text-ink-soft">Daily goals, achievements, and your local leaderboard.</p>

      {challengeGame && (
        <section className="mb-12">
          <ClayCard accent="butter" className="flex flex-col gap-5 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/50">
                <CalendarDays size={28} className="text-plum" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-ink-soft">Today's Challenge</p>
                <h3 className="font-display text-xl font-bold text-ink">{challengeGame.name}</h3>
                <p className="text-sm text-ink-soft">{challenge.targetLabel}</p>
                {challenge.bestAttempt !== undefined && (
                  <p className="text-xs text-ink-soft">Best attempt: {challenge.bestAttempt}</p>
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
      <section className="mb-12">
        <SectionHeading>
          Achievements
          <span className="ml-2 rounded-full bg-[var(--color-mint)] px-3 py-0.5 text-sm font-bold text-ink">
            {unlocked.length}/{ACHIEVEMENTS.length}
          </span>
        </SectionHeading>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ACHIEVEMENTS.map((a) => {
            const isUnlocked = unlocked.includes(a.id)
            const progress = a.progress?.(stats)
            const pct = progress
              ? Math.min(100, Math.round((progress.current / progress.target) * 100))
              : 0

            return (
              <ClayCard
                key={a.id}
                accent={isUnlocked ? 'mint' : 'cream'}
                className={`flex items-center gap-4 px-4 py-4 transition-all ${isUnlocked ? '' : 'opacity-65'}`}
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                  style={{ background: isUnlocked ? 'var(--color-mint-dark)' : 'rgba(150,130,180,0.15)' }}
                >
                  {isUnlocked
                    ? <Trophy size={20} className="text-white" aria-hidden="true" />
                    : <Lock size={18} className="text-ink-soft" aria-hidden="true" />
                  }
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-bold text-ink">{a.name}</p>
                  <p className="truncate text-xs text-ink-soft">{a.description}</p>

                  {progress && !isUnlocked && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-ink-soft">{progress.current} / {progress.target}</span>
                        <span className="text-[10px] font-bold text-plum">{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/60">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            background: 'linear-gradient(90deg, var(--color-plum), var(--color-pink-dark))',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </ClayCard>
            )
          })}
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink">Local Leaderboard</h2>
            <div className="mt-0.5 h-1 w-10 rounded-full bg-gradient-to-r from-[var(--color-plum)] to-[var(--color-pink-dark)]" />
          </div>
          <select
            value={leaderboardGame}
            onChange={(e) => setLeaderboardGame(e.target.value)}
            className="clay-inset rounded-full bg-white/70 px-3 py-1.5 text-sm font-semibold text-ink outline-none"
            aria-label="Select game for leaderboard"
          >
            {['snake', 'flappy-bird', 'tetris', '2048', 'whack-a-mole', 'memory-match'].map((id) => (
              <option key={id} value={id}>{getGameById(id)?.name}</option>
            ))}
          </select>
        </div>

        <p className="mb-3 text-xs text-ink-soft">
          Stored locally on your device only — not a global online ranking.
        </p>

        {leaderboard.length ? (
          <ClayCard accent="cream" className="overflow-hidden px-2 py-2">
            {leaderboard.slice(0, 10).map((entry, i) => {
              const medal = MEDAL_CONFIG[i]
              return (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-2xl px-4 py-2.5 transition-colors hover:bg-white/40"
                >
                  <span className="flex items-center gap-3">
                    {medal ? (
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm ${medal.bg}`}
                        aria-hidden="true"
                      >
                        {medal.label}
                      </span>
                    ) : (
                      <span className="w-7 text-center font-display text-sm font-bold text-ink-soft">{i + 1}</span>
                    )}
                    <span className="font-semibold text-ink">{entry.nickname}</span>
                  </span>
                  <span className="font-display font-bold text-ink">{entry.score}</span>
                </div>
              )
            })}
          </ClayCard>
        ) : (
          <EmptyState
            icon={Medal}
            title="No scores yet"
            message="Play this game and submit a high score to appear here."
            action={
              <Link to={`/games/${leaderboardGame}`}>
                <ClayButton accent="mint">
                  <Gamepad2 size={14} aria-hidden="true" />
                  Play Now
                </ClayButton>
              </Link>
            }
          />
        )}
      </section>
    </div>
  )
}
