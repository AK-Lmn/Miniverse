import { useEffect, useState, useRef } from 'react'
import { X, Sun, Moon, Sparkles, Volume2, VolumeX, User, Minimize2, Maximize2, Zap } from 'lucide-react'
import { ClayButton, ClayToggle } from './Clay'
import {
  themeStore, type ThemeMode,
  soundStore,
  nicknameStore,
  densityStore, type DensityMode,
  reducedMotionStore,
} from '../../lib/storage'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const THEMES: { id: ThemeMode; label: string; icon: typeof Sun; color: string }[] = [
  { id: 'clay-light',   label: 'Clay Light',   icon: Sun,      color: 'text-amber-500' },
  { id: 'cyber-dark',   label: 'Cyber Dark',   icon: Moon,     color: 'text-indigo-400' },
  { id: 'retro-arcade', label: 'Retro Arcade', icon: Sparkles, color: 'text-cyan-400' },
]

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [theme, setTheme]         = useState<ThemeMode>('clay-light')
  const [sound, setSound]         = useState(true)
  const [nickname, setNickname]   = useState('')
  const [density, setDensity]     = useState<DensityMode>('comfortable')
  const [reducedMotion, setRM]    = useState(false)
  const dialogRef                 = useRef<HTMLDivElement>(null)

  // Load from storage on open
  useEffect(() => {
    if (!isOpen) return
    setTheme(themeStore.get())
    setSound(soundStore.get())
    setNickname(nicknameStore.get())
    setDensity(densityStore.get())
    setRM(reducedMotionStore.get())
  }, [isOpen])

  // Trap focus & close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleTheme = (t: ThemeMode) => {
    setTheme(t)
    themeStore.set(t)
  }

  const handleSound = (v: boolean) => {
    setSound(v)
    soundStore.set(v)
  }

  const handleNickname = (v: string) => {
    setNickname(v)
    nicknameStore.set(v)
  }

  const handleDensity = (v: boolean) => {
    const next: DensityMode = v ? 'compact' : 'comfortable'
    setDensity(next)
    densityStore.set(next)
  }

  const handleReducedMotion = (v: boolean) => {
    setRM(v)
    reducedMotionStore.set(v)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="clay animate-pop-in w-full max-w-md" style={{ '--clay-bg': 'var(--color-cream)' } as React.CSSProperties}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/30 px-6 py-4">
            <h2 className="font-display text-xl font-bold text-ink">Settings</h2>
            <button
              onClick={onClose}
              className="clay-btn flex h-8 w-8 items-center justify-center rounded-full p-0"
              aria-label="Close settings"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="flex flex-col gap-6 px-6 py-6">
            {/* Theme */}
            <div>
              <label className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ink-soft">
                <Sun size={13} aria-hidden="true" /> Theme
              </label>
              <div className="grid grid-cols-3 gap-2">
                {THEMES.map(({ id, label, icon: Icon, color }) => (
                  <button
                    key={id}
                    onClick={() => handleTheme(id)}
                    className={`clay-btn flex flex-col items-center gap-1.5 px-2 py-3 text-xs font-bold text-ink transition-all ${
                      theme === id ? 'ring-2 ring-[var(--color-plum)]' : ''
                    }`}
                    aria-pressed={theme === id}
                  >
                    <Icon size={18} className={color} aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Nickname */}
            <div>
              <label htmlFor="settings-nickname" className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ink-soft">
                <User size={13} aria-hidden="true" /> Nickname
              </label>
              <input
                id="settings-nickname"
                value={nickname}
                onChange={(e) => handleNickname(e.target.value)}
                placeholder="Enter a nickname…"
                maxLength={16}
                className="clay-inset w-full rounded-2xl bg-white/60 px-4 py-2.5 font-display font-bold text-ink outline-none placeholder:font-normal"
              />
            </div>

            {/* Toggles */}
            <div className="flex flex-col gap-4">
              {/* Sound */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                  {sound ? <Volume2 size={16} aria-hidden="true" /> : <VolumeX size={16} aria-hidden="true" />}
                  Sound Effects
                </span>
                <ClayToggle checked={sound} onChange={handleSound} label="Toggle sound" />
              </div>

              {/* Compact density */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                  {density === 'compact' ? <Minimize2 size={16} aria-hidden="true" /> : <Maximize2 size={16} aria-hidden="true" />}
                  Compact Cards
                </span>
                <ClayToggle checked={density === 'compact'} onChange={handleDensity} label="Toggle compact card density" />
              </div>

              {/* Reduced motion */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Zap size={16} aria-hidden="true" />
                  Reduced Motion
                </span>
                <ClayToggle checked={reducedMotion} onChange={handleReducedMotion} label="Toggle reduced motion" />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-white/30 px-6 py-4">
            <ClayButton accent="mint" className="w-full justify-center" onClick={onClose}>
              Done
            </ClayButton>
          </div>
        </div>
      </div>
    </>
  )
}
