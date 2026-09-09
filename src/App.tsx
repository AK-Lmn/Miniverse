import { useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { AchievementToastProvider } from './hooks/useAchievementToasts'
import { SplashScreen } from './components/ui/SplashScreen'
import { HomePage } from './pages/HomePage'
import { GamesLibraryPage } from './pages/GamesLibraryPage'
import { GamePage } from './pages/GamePage'
import { FavoritesPage } from './pages/FavoritesPage'
import { ChallengesPage } from './pages/ChallengesPage'
import { ProfilePage } from './pages/ProfilePage'
import { NotFoundPage } from './pages/NotFoundPage'

const SESSION_KEY = 'mv_splash_shown'

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <div
      key={location.pathname}
      className="animate-slide-up"
      style={{ animationDuration: '280ms' }}
    >
      <Routes location={location}>
        <Route path="/" element={<HomePage />} />
        <Route path="/games" element={<GamesLibraryPage />} />
        <Route path="/games/:gameId" element={<GamePage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/challenges" element={<ChallengesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  )
}

export default function App() {

  const [showSplash, setShowSplash] = useState(() => {
    if (typeof sessionStorage === 'undefined') return false
    const shown = sessionStorage.getItem(SESSION_KEY)
    if (!shown) {
      sessionStorage.setItem(SESSION_KEY, '1')
      return true
    }
    return false
  })

  const handleSplashDone = () => setShowSplash(false)

  return (
    <AchievementToastProvider>
      {showSplash && <SplashScreen onDone={handleSplashDone} />}
      <Layout>
        <AnimatedRoutes />
      </Layout>
    </AchievementToastProvider>
  )
}
