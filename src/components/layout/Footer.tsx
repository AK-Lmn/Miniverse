import { Link } from 'react-router-dom'
import { LogoMark, Wordmark } from '../ui/Logo'
import { Gamepad2, Heart } from 'lucide-react'

const CATEGORIES = ['Arcade', 'Puzzle', 'Classic', 'Reflex', 'Casual', 'Word']

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/30 bg-[var(--color-cream-dark)]/50 pb-24 pt-10 md:pb-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          {/* Brand */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2">
              <LogoMark size={26} />
              <Wordmark className="text-lg" />
            </div>
            <p className="mt-2 text-sm text-ink-soft">
              Tiny games. Big fun. Quick, polished browser games — no downloads, no accounts.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h4 className="flex items-center gap-1.5 font-display text-sm font-bold text-ink">
              <Gamepad2 size={14} aria-hidden="true" />
              Categories
            </h4>
            <ul className="mt-2 space-y-1 text-sm text-ink-soft">
              {CATEGORIES.map((c) => (
                <li key={c}>
                  <Link to={`/games?category=${encodeURIComponent(c)}`} className="transition-colors hover:text-plum">
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-display text-sm font-bold text-ink">About</h4>
            <ul className="mt-2 space-y-1 text-sm text-ink-soft">
              <li>MiniVerse v1.0</li>
              <li className="max-w-[200px]">
                All scores &amp; favorites are stored locally on your device only.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-ink-soft/60">
          Made with <Heart size={11} className="text-pink-400" aria-hidden="true" /> for fun. Original mechanics, original pixels.
        </div>
      </div>
    </footer>
  )
}
