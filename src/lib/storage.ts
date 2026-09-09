// Clean localStorage abstraction. All app persistence goes through here
// so components never call localStorage directly.

const PREFIX = 'miniverse:'

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // storage full or unavailable — fail silently, app still works in-memory
  }
}

function remove(key: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(PREFIX + key)
}

export const storage = { read, write, remove }

// Typed accessors for each domain of app data

import type {
  PlayRecord,
  LeaderboardEntry,
  AggregateStats,
  DailyChallengeState,
} from '../types'

const KEYS = {
  favorites: 'favorites',
  recentlyPlayed: 'recentlyPlayed',
  playHistory: 'playHistory',
  highScores: 'highScores',
  leaderboard: 'leaderboard',
  achievements: 'achievements',
  dailyChallenge: 'dailyChallenge',
  soundEnabled: 'soundEnabled',
  nickname: 'nickname',
  gameProgress: 'gameProgress:',
  activeTheme: 'activeTheme',
  density: 'density',
  reducedMotion: 'reducedMotion',
} as const

export type DensityMode = 'comfortable' | 'compact'

export type ThemeMode = 'clay-light' | 'cyber-dark' | 'retro-arcade'

export const themeStore = {
  get: (): ThemeMode => read<ThemeMode>(KEYS.activeTheme, 'clay-light'),
  set: (theme: ThemeMode): void => {
    write(KEYS.activeTheme, theme)
    const used = read<string[]>('themesUsed', [])
    if (!used.includes(theme)) {
      write('themesUsed', [...used, theme])
    }
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme)
    }
  },
}

export function exportSaveData(): string {
  if (typeof window === 'undefined') return '{}'
  write('hasExportedData', true)
  const exported: Record<string, unknown> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(PREFIX)) {
      const cleanKey = key.slice(PREFIX.length)
      try {
        exported[cleanKey] = JSON.parse(localStorage.getItem(key) || 'null')
      } catch {
        exported[cleanKey] = localStorage.getItem(key)
      }
    }
  }
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), data: exported }, null, 2)
}

export function importSaveData(jsonString: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    const parsed = JSON.parse(jsonString)
    if (!parsed || typeof parsed !== 'object' || !parsed.data) return false
    const data = parsed.data as Record<string, unknown>
    for (const [key, val] of Object.entries(data)) {
      write(key, val)
    }
    const theme = read<ThemeMode>(KEYS.activeTheme, 'clay-light')
    themeStore.set(theme)
    return true
  } catch {
    return false
  }
}

export const favoritesStore = {
  get: (): string[] => read(KEYS.favorites, []),
  toggle: (gameId: string): string[] => {
    const current = read<string[]>(KEYS.favorites, [])
    const next = current.includes(gameId)
      ? current.filter((id) => id !== gameId)
      : [...current, gameId]
    write(KEYS.favorites, next)
    return next
  },
}

export const recentlyPlayedStore = {
  get: (): string[] => read(KEYS.recentlyPlayed, []),
  add: (gameId: string): string[] => {
    const current = read<string[]>(KEYS.recentlyPlayed, [])
    const next = [gameId, ...current.filter((id) => id !== gameId)].slice(0, 8)
    write(KEYS.recentlyPlayed, next)
    return next
  },
}

export const highScoreStore = {
  getAll: (): Record<string, number> => read(KEYS.highScores, {}),
  get: (gameId: string): number => read<Record<string, number>>(KEYS.highScores, {})[gameId] ?? 0,
  submit: (gameId: string, score: number, lowerIsBetter = false): boolean => {
    const all = read<Record<string, number>>(KEYS.highScores, {})
    const existing = all[gameId]
    const isNew =
      existing === undefined || (lowerIsBetter ? score < existing : score > existing)
    if (isNew) {
      all[gameId] = score
      write(KEYS.highScores, all)
    }
    return isNew
  },
}

export const playHistoryStore = {
  get: (): PlayRecord[] => read(KEYS.playHistory, []),
  add: (record: PlayRecord): PlayRecord[] => {
    const current = read<PlayRecord[]>(KEYS.playHistory, [])
    const next = [record, ...current].slice(0, 500)
    write(KEYS.playHistory, next)
    return next
  },
}

export const leaderboardStore = {
  get: (gameId?: string): LeaderboardEntry[] => {
    const all = read<LeaderboardEntry[]>(KEYS.leaderboard, [])
    return gameId ? all.filter((e) => e.gameId === gameId) : all
  },
  add: (entry: LeaderboardEntry): LeaderboardEntry[] => {
    const all = read<LeaderboardEntry[]>(KEYS.leaderboard, [])
    const next = [...all, entry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 200)
    write(KEYS.leaderboard, next)
    return next
  },
}

export const achievementsStore = {
  getUnlocked: (): string[] => read(KEYS.achievements, []),
  unlock: (id: string): string[] => {
    const current = read<string[]>(KEYS.achievements, [])
    if (current.includes(id)) return current
    const next = [...current, id]
    write(KEYS.achievements, next)
    return next
  },
}

export const dailyChallengeStore = {
  get: (): DailyChallengeState | null => read(KEYS.dailyChallenge, null),
  set: (state: DailyChallengeState): void => write(KEYS.dailyChallenge, state),
}

export const soundStore = {
  get: (): boolean => read(KEYS.soundEnabled, true),
  set: (enabled: boolean): void => write(KEYS.soundEnabled, enabled),
}

export const nicknameStore = {
  get: (): string => read(KEYS.nickname, ''),
  set: (name: string): void => write(KEYS.nickname, name),
}

export const gameProgressStore = {
  get: <T,>(gameId: string, fallback: T): T => read(KEYS.gameProgress + gameId, fallback),
  set: <T,>(gameId: string, value: T): void => write(KEYS.gameProgress + gameId, value),
}

export const densityStore = {
  get: (): DensityMode => read<DensityMode>(KEYS.density, 'comfortable'),
  set: (mode: DensityMode): void => {
    write(KEYS.density, mode)
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-density', mode)
    }
  },
}

export const reducedMotionStore = {
  get: (): boolean => read<boolean>(KEYS.reducedMotion, false),
  set: (enabled: boolean): void => {
    write(KEYS.reducedMotion, enabled)
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-reduced-motion', String(enabled))
    }
  },
}

export function computeAggregateStats(): AggregateStats {
  const history = playHistoryStore.get()
  const highScores = highScoreStore.getAll()
  const gamesPlayedByGame: Record<string, number> = {}
  let totalPlayTimeSeconds = 0
  for (const rec of history) {
    gamesPlayedByGame[rec.gameId] = (gamesPlayedByGame[rec.gameId] ?? 0) + 1
    totalPlayTimeSeconds += rec.durationSeconds
  }
  const reactionHistory = history.filter((h) => h.gameId === 'reaction-test')
  const bestReactionMs = reactionHistory.length
    ? Math.min(...reactionHistory.map((h) => h.score))
    : undefined
  const wpmHistory = history.filter((h) => h.gameId === 'typing-test')
  const bestWpm = wpmHistory.length ? Math.max(...wpmHistory.map((h) => h.score)) : undefined

  const dc = dailyChallengeStore.get()
  const themesUsed = read<string[]>('themesUsed', [])
  const hasExportedData = read<boolean>('hasExportedData', false)

  return {
    totalGamesPlayed: history.length,
    totalPlayTimeSeconds,
    gamesPlayedByGame,
    highScores,
    bestReactionMs,
    bestWpm,
    dailyChallengesCompleted: dc?.completed ? 1 : 0,
    lastPlayed: history[0],
    themesUsedCount: themesUsed.length,
    hasExportedData,
  }
}
