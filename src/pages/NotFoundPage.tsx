import { Link } from 'react-router-dom'
import { ClayButton } from '../components/ui/Clay'

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <span className="text-6xl" aria-hidden="true">🛸</span>
      <h1 className="font-display text-2xl font-bold text-ink">Lost in the MiniVerse?</h1>
      <p className="text-ink-soft">Looks like this page wandered off.</p>
      <Link to="/">
        <ClayButton accent="mint" size="lg">Back to Arcade</ClayButton>
      </Link>
    </div>
  )
}
