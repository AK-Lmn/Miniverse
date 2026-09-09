import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Home, Gamepad2, Heart, Trophy, User, Settings, ChevronUp } from 'lucide-react'
import { LogoMark, Wordmark } from '../ui/Logo'
import { SettingsModal } from '../ui/SettingsModal'
import { themeStore } from '../../lib/storage'
import { playSfx } from '../../lib/sound'

const LINKS = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/games', label: 'Games', icon: Gamepad2 },
  { to: '/favorites', label: 'Favorites', icon: Heart },
  { to: '/challenges', label: 'Challenges', icon: Trophy },
  { to: '/profile', label: 'Profile', icon: User },
]

export function Navbar() {
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    themeStore.set(themeStore.get())
  }, [])

  return (
    <>
      <header className="sticky top-2 z-40 px-3 sm:px-6">
        <div className="clay mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2.5 backdrop-blur-xl transition-all" style={{ '--clay-bg': 'color-mix(in srgb, var(--color-cream) 88%, white 12%)' } as React.CSSProperties}>

          <NavLink
            to="/"
            onClick={() => playSfx('click', true)}
            className="flex shrink-0 items-center gap-2.5 transition-transform hover:scale-105 active:scale-95"
            aria-label="MiniVerse home"
          >
            <LogoMark size={34} />
            <Wordmark className="text-xl font-black tracking-tight" />
          </NavLink>

          <nav className="hidden flex-1 items-center justify-center md:flex" aria-label="Main navigation">
            <div className="clay-inset flex items-center gap-1.5 rounded-full p-1">
              {LINKS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => playSfx('click', true)}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold transition-all duration-180 ${
                      isActive
                        ? 'clay bg-[var(--color-lavender)] text-ink scale-102 shadow-sm'
                        : 'text-ink-soft hover:bg-white/50 hover:text-ink active:scale-95'
                    }`
                  }
                >
                  <Icon size={15} aria-hidden="true" strokeWidth={2.2} />
                  {label}
                </NavLink>
              ))}
            </div>
          </nav>

          <button
            onClick={() => {
              playSfx('click', true)
              setSettingsOpen(true)
            }}
            className="clay-btn flex shrink-0 items-center gap-2 px-3 py-1.5 text-xs font-bold text-ink"
            aria-label="Open settings"
            title="Settings"
          >
            <Settings size={15} aria-hidden="true" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </header>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}

export function MobileTabBar() {
  const location = useLocation()
  const isPlayingGame = location.pathname.startsWith('/games/') && location.pathname !== '/games'
  const [collapsed, setCollapsed] = useState(false)

  // Auto-collapse when entering game view
  useEffect(() => {
    if (isPlayingGame) {
      setCollapsed(true)
    } else {
      setCollapsed(false)
    }
  }, [isPlayingGame])

  if (isPlayingGame && collapsed) {
    return (
      <div className="fixed bottom-3 right-3 z-40 md:hidden">
        <button
          onClick={() => {
            playSfx('click', true)
            setCollapsed(false)
          }}
          className="clay-btn flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-ink shadow-lg"
          aria-label="Show navigation dock"
        >
          <Gamepad2 size={14} aria-hidden="true" />
          <span>Menu</span>
          <ChevronUp size={14} aria-hidden="true" />
        </button>
      </div>
    )
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-2 z-40 px-3 md:hidden transition-transform duration-300"
      aria-label="Main navigation"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="clay mx-auto max-w-md backdrop-blur-xl px-2 py-1.5" style={{ '--clay-bg': 'color-mix(in srgb, var(--color-cream) 92%, white 8%)' } as React.CSSProperties}>
        <div className="flex items-stretch justify-around gap-1">
          {LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => playSfx('click', true)}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[10px] font-bold transition-all duration-180 ${
                  isActive
                    ? 'clay bg-[var(--color-lavender)] text-ink scale-105'
                    : 'text-ink-soft hover:text-ink active:scale-95'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} aria-hidden="true" strokeWidth={isActive ? 2.5 : 1.8} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
