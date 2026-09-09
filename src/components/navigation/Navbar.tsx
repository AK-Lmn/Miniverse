import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Gamepad2, Heart, Trophy, User, Settings } from 'lucide-react'
import { LogoMark, Wordmark } from '../ui/Logo'
import { SettingsModal } from '../ui/SettingsModal'
import { themeStore } from '../../lib/storage'

const LINKS = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/games', label: 'Games', icon: Gamepad2 },
  { to: '/favorites', label: 'Favorites', icon: Heart },
  { to: '/challenges', label: 'Challenges', icon: Trophy },
  { to: '/profile', label: 'Profile', icon: User },
]

export function Navbar() {
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Apply stored theme on mount
  useEffect(() => {
    themeStore.set(themeStore.get())
  }, [])

  return (
    <>
      <header className="sticky top-0 z-40">
        <div className="border-b border-white/30 bg-[var(--color-cream)]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">

            {/* Logo */}
            <NavLink to="/" className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-80" aria-label="MiniVerse home">
              <LogoMark size={32} />
              <Wordmark className="text-xl font-extrabold tracking-tight" />
            </NavLink>

            {/* Desktop nav */}
            <nav className="hidden flex-1 items-center justify-center md:flex" aria-label="Main navigation">
              <div className="clay-inset flex items-center gap-1 rounded-full px-1.5 py-1.5">
                {LINKS.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? 'clay bg-[var(--color-lavender)] text-ink shadow-sm'
                          : 'text-ink-soft hover:bg-white/40 hover:text-ink'
                      }`
                    }
                  >
                    <Icon size={15} aria-hidden="true" />
                    {label}
                  </NavLink>
                ))}
              </div>
            </nav>

            {/* Settings button */}
            <button
              onClick={() => setSettingsOpen(true)}
              className="clay-btn flex shrink-0 items-center gap-2 px-3 py-1.5 text-xs font-bold text-ink"
              aria-label="Open settings"
              title="Settings"
            >
              <Settings size={15} aria-hidden="true" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>
      </header>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}

export function MobileTabBar() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 md:hidden"
      aria-label="Main navigation"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="border-t border-white/30 bg-[var(--color-cream)]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-stretch justify-around px-1 py-1">
          {LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 rounded-2xl px-1 py-2 text-[10px] font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-[var(--color-lavender)] text-ink'
                    : 'text-ink-soft hover:text-ink'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} aria-hidden="true" strokeWidth={isActive ? 2.5 : 1.8} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
