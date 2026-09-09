import type { ComponentType } from 'react'
import type { LucideIcon } from 'lucide-react'

export type GameCategory =
  | 'Arcade'
  | 'Puzzle'
  | 'Classic'
  | 'Reflex'
  | 'Casual'
  | 'Word'

export type GameDifficulty = 'Easy' | 'Medium' | 'Hard'

export interface GameControls {
  label: string
  keys: string[]
}

export interface GameDefinition {
  id: string
  name: string
  tagline: string
  description: string
  category: GameCategory
  difficulty: GameDifficulty
  estimatedTime: string
  accent: 'lavender' | 'sky' | 'mint' | 'peach' | 'butter' | 'pink'
  emoji: string
  icon?: LucideIcon
  component: ComponentType<GameComponentProps>
  controls: GameControls[]
  howToPlay: string[]
  scoreLabel?: string
  scoreIsTime?: boolean
  lowerScoreIsBetter?: boolean
}

export interface GameComponentProps {
  onScore: (score: number, meta?: Record<string, unknown>) => void
  onGameOver?: () => void
  soundEnabled: boolean
}

export interface PlayRecord {
  gameId: string
  timestamp: number
  score: number
  durationSeconds: number
}

export interface LeaderboardEntry {
  gameId: string
  nickname: string
  score: number
  date: number
}

export interface AchievementDefinition {
  id: string
  name: string
  description: string
  emoji: string
  check: (stats: AggregateStats) => boolean
  progress?: (stats: AggregateStats) => { current: number; target: number }
}

export interface AggregateStats {
  totalGamesPlayed: number
  totalPlayTimeSeconds: number
  gamesPlayedByGame: Record<string, number>
  highScores: Record<string, number>
  bestReactionMs?: number
  bestWpm?: number
  dailyChallengesCompleted: number
  lastPlayed?: PlayRecord
  hasExportedData?: boolean
  themesUsedCount?: number
}

export interface DailyChallengeState {
  date: string
  gameId: string
  targetScore: number
  targetLabel: string
  completed: boolean
  bestAttempt?: number
}
