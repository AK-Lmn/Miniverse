import { useCallback, useRef } from 'react'
import {
  playHistoryStore,
  highScoreStore,
  achievementsStore,
  computeAggregateStats,
  recentlyPlayedStore,
} from '../lib/storage'
import { checkNewlyUnlocked } from '../lib/achievements'
import { getTodaysChallenge, recordChallengeAttempt } from '../lib/dailyChallenge'
import { useAchievementToasts } from './useAchievementToasts'
import type { GameDefinition } from '../types'

export function useGameSession(game: GameDefinition) {
  const startRef = useRef<number>(Date.now())
  const { notify } = useAchievementToasts()

  const start = useCallback(() => {
    startRef.current = Date.now()
    recentlyPlayedStore.add(game.id)
  }, [game.id])

  const finish = useCallback(
    (score: number) => {
      const durationSeconds = Math.max(1, Math.round((Date.now() - startRef.current) / 1000))
      playHistoryStore.add({
        gameId: game.id,
        timestamp: Date.now(),
        score,
        durationSeconds,
      })
      const isNewHighScore = highScoreStore.submit(game.id, score, game.lowerScoreIsBetter)

      const challenge = getTodaysChallenge()
      if (challenge.gameId === game.id) {
        recordChallengeAttempt(score, game.lowerScoreIsBetter)
      }

      const stats = computeAggregateStats()
      const unlockedIds = achievementsStore.getUnlocked()
      const newlyUnlocked = checkNewlyUnlocked(stats, unlockedIds)
      for (const a of newlyUnlocked) achievementsStore.unlock(a.id)
      if (newlyUnlocked.length) notify(newlyUnlocked)

      return { isNewHighScore, durationSeconds }
    },
    [game.id, game.lowerScoreIsBetter, notify]
  )

  return { start, finish }
}
