import { useEffect, useRef, useState } from 'react'
import { Gamepad2, Clock, Trophy, Zap, Keyboard, Download, Upload, Check, AlertCircle, Star } from 'lucide-react'
import { ClayCard, ClayButton, SectionHeading } from '../components/ui/Clay'
import { computeAggregateStats, nicknameStore, exportSaveData, importSaveData, achievementsStore } from '../lib/storage'
import { checkNewlyUnlocked } from '../lib/achievements'
import { useAchievementToasts } from '../hooks/useAchievementToasts'
import { getGameById } from '../data/games'

export function ProfilePage() {
  const [nickname, setNickname] = useState('')
  const [stats, setStats] = useState(() => computeAggregateStats())
  const [importStatus, setImportStatus] = useState<'success' | 'error' | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { notify } = useAchievementToasts()

  useEffect(() => {
    setNickname(nicknameStore.get())
    setStats(computeAggregateStats())
  }, [])

  const handleNicknameChange = (value: string) => {
    setNickname(value)
    nicknameStore.set(value)
  }

  const handleExportData = () => {
    const jsonStr = exportSaveData()
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `miniverse-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)

    const updatedStats = computeAggregateStats()
    setStats(updatedStats)
    const newlyUnlocked = checkNewlyUnlocked(updatedStats, achievementsStore.getUnlocked())
    if (newlyUnlocked.length > 0) {
      newlyUnlocked.forEach((ach) => achievementsStore.unlock(ach.id))
      notify(newlyUnlocked)
    }
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (content && importSaveData(content)) {
        setImportStatus('success')
        setStats(computeAggregateStats())
        setNickname(nicknameStore.get())
        setTimeout(() => setImportStatus(null), 3000)
      } else {
        setImportStatus('error')
        setTimeout(() => setImportStatus(null), 3000)
      }
    }
    reader.readAsText(file)
  }

  const favoriteGameId = Object.entries(stats.gamesPlayedByGame).sort((a, b) => b[1] - a[1])[0]?.[0]
  const favoriteGame = favoriteGameId ? getGameById(favoriteGameId) : undefined

  const topScores = Object.entries(stats.highScores)
    .map(([id, score]) => ({ game: getGameById(id), score }))
    .filter((s) => s.game)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)

  const STAT_CARDS = [
    { accent: 'sky' as const,     Icon: Gamepad2, value: String(stats.totalGamesPlayed),                          label: 'Games Played' },
    { accent: 'mint' as const,    Icon: Trophy,   value: String(Object.keys(stats.highScores).length),            label: 'High Scores' },
    { accent: 'peach' as const,   Icon: Clock,    value: `${Math.round(stats.totalPlayTimeSeconds / 60)}m`,       label: 'Play Time' },
    { accent: 'pink' as const,    Icon: Gamepad2, value: String(Object.keys(stats.gamesPlayedByGame).length),     label: 'Unique Games' },
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <SectionHeading>Your Profile</SectionHeading>
      <p className="-mt-3 mb-8 text-ink-soft">Local stats — no account needed, everything lives on this device.</p>

      {/* ── Identity card ─────────────────────────────────────── */}
      <ClayCard accent="lavender" className="mb-10 flex flex-col items-center gap-5 px-6 py-6 sm:flex-row sm:gap-8">
        {/* Avatar placeholder */}
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-[var(--color-plum)] to-[var(--color-pink-dark)] text-3xl font-black text-white shadow-lg">
          {nickname ? nickname[0].toUpperCase() : '?'}
        </div>

        {/* Nickname input */}
        <div className="flex-1">
          <label htmlFor="nickname" className="text-xs font-bold uppercase tracking-widest text-ink-soft">
            Nickname
          </label>
          <input
            id="nickname"
            value={nickname}
            onChange={(e) => handleNicknameChange(e.target.value)}
            placeholder="Enter a nickname…"
            maxLength={16}
            className="clay-inset mt-2 block w-full rounded-2xl bg-white/60 px-4 py-2.5 font-display font-bold text-ink outline-none placeholder:font-normal"
          />
        </div>

        {/* Favorite game */}
        {favoriteGame && (
          <div className="flex items-center gap-3 rounded-2xl bg-white/40 px-4 py-3">
            {favoriteGame.icon
              ? <favoriteGame.icon size={26} className="text-plum shrink-0" aria-hidden="true" />
              : <span className="text-3xl shrink-0" aria-hidden="true">{favoriteGame.emoji}</span>
            }
            <div>
              <p className="text-xs font-semibold text-ink-soft">Favorite Game</p>
              <p className="font-display font-bold text-ink">{favoriteGame.name}</p>
            </div>
          </div>
        )}
      </ClayCard>

      {/* ── Stats bento ───────────────────────────────────────── */}
      <section className="mb-10">
        <SectionHeading>Overview</SectionHeading>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {STAT_CARDS.map(({ accent, Icon, value, label }) => (
            <ClayCard key={label} accent={accent} className="flex flex-col items-center gap-2 px-4 py-6 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/50">
                <Icon className="text-plum" size={20} aria-hidden="true" />
              </div>
              <p className="font-display text-3xl font-black text-ink">{value}</p>
              <p className="text-xs font-semibold text-ink-soft">{label}</p>
            </ClayCard>
          ))}
        </div>
      </section>

      {/* ── Records ───────────────────────────────────────────── */}
      <section className="mb-10">
        <SectionHeading>Records</SectionHeading>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ClayCard accent="butter" className="flex items-center gap-4 px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/50">
              <Zap className="text-plum" size={20} aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold text-ink-soft">Best Reaction Time</p>
              <p className="font-display text-xl font-bold text-ink">
                {stats.bestReactionMs !== undefined ? `${stats.bestReactionMs}ms` : '—'}
              </p>
            </div>
          </ClayCard>
          <ClayCard accent="lavender" className="flex items-center gap-4 px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/50">
              <Keyboard className="text-plum" size={20} aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold text-ink-soft">Best Typing Speed</p>
              <p className="font-display text-xl font-bold text-ink">
                {stats.bestWpm !== undefined ? `${stats.bestWpm} WPM` : '—'}
              </p>
            </div>
          </ClayCard>
        </div>
      </section>

      {/* ── Top High Scores ───────────────────────────────────── */}
      <section className="mb-10">
        <SectionHeading>Top High Scores</SectionHeading>
        {topScores.length ? (
          <ClayCard accent="cream" className="overflow-hidden px-2 py-2">
            {topScores.map(({ game, score }, i) => {
              if (!game) return null
              const Icon = game.icon
              return (
                <div
                  key={game.id}
                  className="flex items-center justify-between rounded-2xl px-4 py-2.5 transition-colors hover:bg-white/40"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-6 text-center text-xs font-bold text-ink-soft">{i + 1}</span>
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: `var(--color-${game.accent})` }}
                    >
                      {Icon
                        ? <Icon size={16} className="text-plum" aria-hidden="true" />
                        : <span className="text-sm" aria-hidden="true">{game.emoji}</span>
                      }
                    </div>
                    <span className="font-display font-bold text-ink">{game.name}</span>
                  </span>
                  <span className="font-display font-bold text-ink">{score}</span>
                </div>
              )
            })}
          </ClayCard>
        ) : (
          <p className="text-ink-soft">Play a few games to start setting high scores.</p>
        )}
      </section>

      {/* ── Data & Backup ─────────────────────────────────────── */}
      <section>
        <SectionHeading>Data &amp; Backup</SectionHeading>
        <ClayCard accent="mint" className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <h3 className="font-display text-lg font-bold text-ink">Save Data Backup</h3>
            <p className="mt-1 text-xs text-ink-soft">
              Export high scores, favorites, and achievements to JSON — or restore from a backup file.
            </p>
            {importStatus === 'success' && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                <Check size={14} aria-hidden="true" /> Save data restored successfully!
              </p>
            )}
            {importStatus === 'error' && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-rose-500">
                <AlertCircle size={14} aria-hidden="true" /> Invalid JSON — import failed.
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <ClayButton accent="lavender" size="sm" onClick={handleExportData}>
              <Download size={14} aria-hidden="true" />
              Export Save
            </ClayButton>
            <ClayButton
              accent="sky"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={14} aria-hidden="true" />
              Restore Backup
            </ClayButton>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
              aria-label="Upload backup JSON file"
            />
          </div>
        </ClayCard>
      </section>

      {/* Achievements summary */}
      <div className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-ink-soft">
        <Star size={13} className="text-plum" aria-hidden="true" />
        MiniVerse v1.0 · All data stored locally on your device
        <Star size={13} className="text-plum" aria-hidden="true" />
      </div>
    </div>
  )
}
