import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'

const ACCENT_VARS: Record<string, string> = {
  lavender: 'var(--color-lavender)',
  sky: 'var(--color-sky)',
  mint: 'var(--color-mint)',
  peach: 'var(--color-peach)',
  butter: 'var(--color-butter)',
  pink: 'var(--color-pink)',
  cream: 'var(--color-cream)',
}

/* ─── ClayCard ─────────────────────────────────────────────────── */
interface ClayCardProps extends HTMLAttributes<HTMLDivElement> {
  accent?: keyof typeof ACCENT_VARS
  children: ReactNode
}

export function ClayCard({ accent = 'cream', className = '', style, children, ...rest }: ClayCardProps) {
  return (
    <div
      className={`clay ${className}`}
      style={{ ['--clay-bg' as string]: ACCENT_VARS[accent], ...style }}
      {...rest}
    >
      {children}
    </div>
  )
}

/* ─── ClayButton ───────────────────────────────────────────────── */
interface ClayButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  accent?: keyof typeof ACCENT_VARS
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES: Record<string, string> = {
  sm: 'px-3.5 py-1.5 text-sm gap-1.5',
  md: 'px-5 py-2.5 text-base gap-2',
  lg: 'px-7 py-3.5 text-lg gap-2.5',
}

export function ClayButton({
  accent = 'lavender',
  size = 'md',
  className = '',
  style,
  children,
  ...rest
}: ClayButtonProps) {
  return (
    <button
      className={`clay-btn inline-flex items-center justify-center font-display font-semibold text-ink ${SIZE_CLASSES[size]} ${className} disabled:opacity-50 disabled:pointer-events-none`}
      style={{ ['--clay-bg' as string]: ACCENT_VARS[accent], ...style }}
      {...rest}
    >
      {children}
    </button>
  )
}

/* ─── ClayInput ────────────────────────────────────────────────── */
interface ClayInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  id?: string
}

export function ClayInput({ label, id, className = '', ...rest }: ClayInputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-xs font-bold uppercase tracking-wide text-ink-soft">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`clay-inset w-full rounded-2xl bg-white/60 px-4 py-2.5 text-ink outline-none placeholder:text-ink-soft/60 ${className}`}
        {...rest}
      />
    </div>
  )
}

/* ─── ClaySelect ───────────────────────────────────────────────── */
interface ClaySelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  id?: string
}

export function ClaySelect({ label, id, className = '', children, ...rest }: ClaySelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-xs font-bold uppercase tracking-wide text-ink-soft">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`clay-inset rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-ink outline-none ${className}`}
        {...rest}
      >
        {children}
      </select>
    </div>
  )
}

/* ─── ClayBadge ────────────────────────────────────────────────── */
export function ClayBadge({
  children,
  accent = 'lavender',
  className = '',
}: {
  children: ReactNode
  accent?: keyof typeof ACCENT_VARS
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold text-ink ${className}`}
      style={{ background: ACCENT_VARS[accent] }}
    >
      {children}
    </span>
  )
}

/* ─── ClayToggle ───────────────────────────────────────────────── */
export function ClayToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="clay-inset relative h-8 w-14 rounded-full transition-colors"
      style={{ background: checked ? 'var(--color-mint-dark)' : 'var(--color-cream-dark)' }}
    >
      <span
        className="absolute top-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform"
        style={{ transform: checked ? 'translateX(28px)' : 'translateX(4px)' }}
      />
    </button>
  )
}

/* ─── SectionHeading ───────────────────────────────────────────── */
export function SectionHeading({
  children,
  action,
}: {
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="mb-5 flex items-end justify-between">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-display text-2xl font-bold text-ink">{children}</h2>
        <div className="h-1 w-10 rounded-full bg-gradient-to-r from-[var(--color-plum)] to-[var(--color-pink-dark)]" />
      </div>
      {action}
    </div>
  )
}

/* ─── EmptyState ───────────────────────────────────────────────── */
export function EmptyState({
  icon: Icon,
  emoji,
  title,
  message,
  action,
}: {
  icon?: LucideIcon
  emoji?: string
  title: string
  message: string
  action?: ReactNode
}) {
  return (
    <div className="clay animate-pop-in mx-auto flex max-w-md flex-col items-center gap-4 px-8 py-14 text-center">
      {Icon ? (
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-lavender)] to-[var(--color-pink)]">
          <Icon size={32} className="text-plum" />
        </div>
      ) : (
        <span className="text-5xl" aria-hidden="true">{emoji}</span>
      )}
      <h3 className="font-display text-xl font-bold text-ink">{title}</h3>
      <p className="text-ink-soft">{message}</p>
      {action}
    </div>
  )
}
