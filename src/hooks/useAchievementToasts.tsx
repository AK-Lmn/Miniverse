import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { AchievementDefinition } from '../types'
import { playSfx } from '../lib/sound'
import { soundStore } from '../lib/storage'

interface ToastContextValue {
  notify: (achievements: AchievementDefinition[]) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function AchievementToastProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<AchievementDefinition[]>([])
  const [active, setActive] = useState<AchievementDefinition | null>(null)

  const notify = useCallback((achievements: AchievementDefinition[]) => {
    if (!achievements.length) return
    playSfx('achievement', soundStore.get())
    setQueue((q) => [...q, ...achievements])
  }, [])

  useEffect(() => {
    if (active || !queue.length) return
    const [next, ...rest] = queue
    setActive(next)
    setQueue(rest)
    const t = window.setTimeout(() => setActive(null), 3400)
    return () => window.clearTimeout(t)
  }, [active, queue])

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4"
      >
        {active && (
          <div
            key={active.id}
            className="clay animate-pop-in pointer-events-auto flex items-center gap-3 px-5 py-3"
            style={{ ['--clay-bg' as string]: 'var(--color-butter)' }}
            role="status"
          >
            <span className="text-3xl" aria-hidden="true">{active.emoji}</span>
            <div>
              <p className="font-display text-sm font-bold text-ink">Achievement Unlocked!</p>
              <p className="text-sm text-ink-soft">{active.name}</p>
            </div>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}

export function useAchievementToasts() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useAchievementToasts must be used within AchievementToastProvider')
  return ctx
}
