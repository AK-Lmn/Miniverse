import type { DailyChallengeState } from '../types'
import { dailyChallengeStore } from './storage'

// Games that work well as a "beat this target" daily challenge
const CHALLENGE_POOL: { gameId: string; label: string; targets: number[] }[] = [
  { gameId: 'reaction-test', label: 'Beat {n}ms average reaction', targets: [280, 260, 300, 240] },
  { gameId: 'click-speed', label: 'Reach {n} clicks per second', targets: [6, 7, 5, 8] },
  { gameId: 'snake', label: 'Score {n}+ in Snake', targets: [40, 60, 80, 30] },
  { gameId: '2048', label: 'Score {n}+ points in 2048', targets: [500, 1000, 2000] },
  { gameId: 'flappy-bird', label: 'Score {n}+ in Flappy Bird', targets: [8, 12, 5] },
  { gameId: 'whack-a-mole', label: 'Score {n}+ in Whack-a-Mole', targets: [15, 20, 25] },
  { gameId: 'typing-test', label: 'Type {n}+ WPM', targets: [35, 45, 55] },
]

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

// Simple deterministic hash so the same date always produces the same challenge
function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

export function getTodaysChallenge(): DailyChallengeState {
  const key = todayKey()
  const existing = dailyChallengeStore.get()
  if (existing && existing.date === key) return existing

  const hash = hashString(key)
  const pick = CHALLENGE_POOL[hash % CHALLENGE_POOL.length]
  const target = pick.targets[hash % pick.targets.length]

  const state: DailyChallengeState = {
    date: key,
    gameId: pick.gameId,
    targetScore: target,
    targetLabel: pick.label.replace('{n}', String(target)),
    completed: false,
  }
  dailyChallengeStore.set(state)
  return state
}

export function recordChallengeAttempt(score: number, lowerIsBetter = false): DailyChallengeState {
  const current = getTodaysChallenge()
  const best =
    current.bestAttempt === undefined
      ? score
      : lowerIsBetter
        ? Math.min(current.bestAttempt, score)
        : Math.max(current.bestAttempt, score)

  const passed = lowerIsBetter ? best <= current.targetScore : best >= current.targetScore

  const next: DailyChallengeState = {
    ...current,
    bestAttempt: best,
    completed: current.completed || passed,
  }
  dailyChallengeStore.set(next)
  return next
}
