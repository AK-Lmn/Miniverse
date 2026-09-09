import type { ReactNode } from 'react'
import { Navbar, MobileTabBar } from '../navigation/Navbar'
import { Footer } from './Footer'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <MobileTabBar />
    </div>
  )
}
