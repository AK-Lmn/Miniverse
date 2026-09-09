# MiniVerse — Tiny Games. Big Fun.

A modern browser arcade: pick a game, play immediately. MiniVerse is a
collection of quick, polished mini-games with a soft claymorphism design
system, local stats, favorites, achievements, a daily challenge, and a
device-local leaderboard. No backend, no accounts — everything is stored
in `localStorage`.

## Features

- **Claymorphism UI** — soft 3D cards, puffy buttons with real press
  feedback, a cohesive pastel arcade palette.
- **Game library** — search, filter by category/difficulty, sort, favorite,
  and "recently played" tracking.
- **Player profile** — nickname, overview stats, personal records (best
  reaction time, best WPM), favorite game, top high scores.
- **Achievements** — 14 achievements that unlock automatically from real
  play activity, with progress bars and toast notifications.
- **Daily Challenge** — a deterministic, date-based challenge that's the
  same for everyone on a given day, with no backend required.
- **Local leaderboard** — enter a nickname when you set a new high score;
  compare your own runs over time, per game, on this device.
- **Sound** — lightweight Web Audio synthesized effects, no audio files,
  global mute toggle, never autoplays.
- **Accessible & responsive** — keyboard navigation, focus states, ARIA
  labels, `prefers-reduced-motion` support, and real touch controls for
  every game that needs them.

## Game Catalog

| Game | Category | Difficulty | Notes |
|---|---|---|---|
| Flappy Bird | Arcade | Hard | Canvas, keyboard + tap |
| Snake | Arcade | Medium | Canvas, keyboard/swipe, increasing speed |
| Tetris | Classic | Hard | Canvas, full rotation + line clears + levels |
| Pong | Arcade | Medium | Canvas, AI opponent (3 difficulties) |
| 2048 | Puzzle | Medium | Keyboard + swipe |
| Minesweeper | Puzzle | Hard | 3 difficulty boards, flagging |
| Tic Tac Toe | Puzzle | Easy | 2-player, AI easy, unbeatable AI (minimax) |
| Memory Match | Puzzle | Easy | 3 board sizes, move/time scoring |
| Reaction Test | Reflex | Easy | Best/average reaction tracking |
| Click Speed Test | Reflex | Easy | 5/10/30s modes, CPS |
| Typing Test | Word | Medium | 15/30/60s modes, WPM + accuracy |
| Whack-a-Mole | Casual | Easy | 30s rounds, escalating pace |

The architecture (see below) is built so more games are a small, mechanical
addition — the registry, storage, achievements, and daily-challenge systems
all work off `GameDefinition` entries and don't need to change per game.

## Tech Stack

- React 19 + TypeScript
- Vite 8, Tailwind CSS v4 (via `@tailwindcss/vite`)
- React Router (client-side routing)
- lucide-react (icons)
- Web Audio API (sound), Canvas + `requestAnimationFrame` (real-time games)
- `localStorage` for all persistence — no backend

## Installation

```bash
npm install
npm run dev       # start the dev server
npm run build     # type-check + production build to dist/
npm run preview   # serve the production build locally
```

## Architecture

```
src/
├── components/
│   ├── layout/       # Layout, Footer
│   ├── navigation/    # Navbar (desktop) + MobileTabBar
│   ├── ui/            # Clay design-system primitives, Logo
│   └── games/         # GameCard (shared across Home/Library/Favorites)
├── games/             # One folder per game, self-contained component
├── data/games.ts       # The central game registry
├── lib/
│   ├── storage.ts      # Typed localStorage abstraction (all persistence)
│   ├── achievements.ts # Achievement definitions + unlock checking
│   ├── dailyChallenge.ts # Deterministic daily challenge generator
│   └── sound.ts        # Web Audio synthesized sound effects
├── hooks/
│   ├── useGameSession.ts       # Records play history/high scores/achievements
│   └── useAchievementToasts.tsx # Global toast queue for unlocks
├── pages/              # Home, GamesLibrary, Game, Favorites, Challenges, Profile, 404
└── types/index.ts      # Shared TypeScript types
```

### Game architecture

Every game is a self-contained React component implementing:

```ts
interface GameComponentProps {
  onScore: (score: number, meta?: Record<string, unknown>) => void
  soundEnabled: boolean
}
```

A game calls `onScore` once per round/attempt with its numeric result. The
`GamePage` wraps this in `useGameSession`, which:

1. Records the play in history (`playHistoryStore`) with duration.
2. Submits the score to `highScoreStore` (some games are "lower is
   better", e.g. Reaction Test — set via `lowerScoreIsBetter` on the
   registry entry).
3. Checks it against today's Daily Challenge if this is the challenge
   game.
4. Recomputes aggregate stats and checks all achievement conditions,
   unlocking any newly-earned ones and firing a toast.

Adding a game means: build the component, add one entry to
`src/data/games.ts` (name, category, difficulty, controls, how-to-play,
accent color, and the component itself). Everything else — discovery,
search, filtering, routing (`/games/:gameId`), favorites, recently played,
stats, and achievements — works automatically off the registry.

### LocalStorage architecture

All persistence goes through `src/lib/storage.ts`, which wraps
`localStorage` behind typed accessors (`favoritesStore`, `highScoreStore`,
`playHistoryStore`, `leaderboardStore`, `achievementsStore`,
`dailyChallengeStore`, `soundStore`, `nicknameStore`,
`gameProgressStore`). No component calls `localStorage` directly. Keys are
namespaced under `miniverse:` so the app coexists safely with anything
else on the same origin.

## Controls

- **Flappy Bird**: Space or tap to flap.
- **Snake**: Arrow keys / WASD / swipe.
- **Tetris**: ← → move, ↑ rotate, ↓ soft drop, Space hard drop (on-screen
  buttons on mobile).
- **Pong**: mouse or drag to move your paddle.
- **2048**: arrow keys / WASD / swipe.
- **Minesweeper**: tap to reveal, right-click / long-press to flag.
- Everything else is tap/click driven and self-explanatory in-app under
  "How to Play" on each game's page.

## Accessibility

- Semantic HTML, ARIA labels on icon-only buttons and game grids.
- Visible focus rings on all interactive elements.
- `prefers-reduced-motion` disables/shortens animations app-wide.
- Canvas games also expose on-screen button controls so they aren't
  keyboard/mouse-only.

## Future Expansion Ideas

The spec this app was built from called for a much larger catalog
(Breakout, Space Invaders, Asteroids, Sudoku, Connect Four, 15 Puzzle,
Wordle, Hangman, Doodle Jump, endless runner, fruit catcher, basketball,
penalty kick, mini golf, an aim trainer, and color-reaction). The
architecture above is deliberately built so any of these can be added as
a self-contained component plus one registry entry, without touching
routing, storage, achievements, or the daily-challenge system. That's the
natural next step if you want to keep growing the catalog.

## Notes

- This is a local-first app: favorites, high scores, achievements, and the
  leaderboard all live in your browser's `localStorage` only. Clearing
  site data resets everything.
- Not affiliated with any game publisher — all mechanics are original
  implementations inspired by classic genres, and all visual assets
  (logo, icons, illustrations) were created for this project.
