import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { playSfx } from '../../lib/sound'
import { soundStore } from '../../lib/storage'

const ACCENT_VARS: Record<string, string> = {
  lavender: 'var(--color-lavender)',
  sky: 'var(--color-sky)',
  mint: 'var(--color-mint)',
  peach: 'var(--color-peach)',
  butter: 'var(--color-butter)',
  pink: 'var(--color-pink)',
  cream: 'var(--color-cream)',
}

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

export function ClayCartridge({ accent = 'cream', className = '', style, children, ...rest }: ClayCardProps) {
  return (
    <div
      className={`clay-cartridge ${className}`}
      style={{ ['--clay-bg' as string]: ACCENT_VARS[accent], ...style }}
      {...rest}
    >
      {/* Top cartridge grip notch */}
      <div className="pointer-events-none absolute -top-1.5 left-1/2 flex -translate-x-1/2 items-center gap-1">
        <div className="h-1.5 w-3 rounded-t bg-black/10 dark:bg-white/10" />
        <div className="h-1.5 w-6 rounded-t bg-black/15 dark:bg-white/15" />
        <div className="h-1.5 w-3 rounded-t bg-black/10 dark:bg-white/10" />
      </div>
      {children}
    </div>
  )
}

export function ClayStamp({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`clay-stamp ${className}`}>{children}</span>
}

interface ClayButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  accent?: keyof typeof ACCENT_VARS
  size?: 'sm' | 'md' | 'lg'
  disableSound?: boolean
}

const SIZE_CLASSES: Record<string, string> = {
  sm: 'px-3.5 py-1.5 text-sm gap-1.5',
  md: 'px-5 py-2.5 text-base gap-2',
  lg: 'px-7 py-3.5 text-lg gap-2.5',
}

export function ClayButton({
  accent = 'lavender',
  size = 'md',
  disableSound = false,
  className = '',
  style,
  onClick,
  children,
  ...rest
}: ClayButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disableSound) {
      playSfx('click', soundStore.get())
    }
    onClick?.(e)
  }

  return (
    <button
      onClick={handleClick}
      className={`clay-btn inline-flex items-center justify-center font-display font-semibold text-ink ${SIZE_CLASSES[size]} ${className} disabled:opacity-50 disabled:pointer-events-none`}
      style={{ ['--clay-bg' as string]: ACCENT_VARS[accent], ...style }}
      {...rest}
    >
      {children}
    </button>
  )
}

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
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => {
        playSfx('click', soundStore.get())
        onChange(!checked)
      }}
      className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full p-1 transition-colors duration-200 ease-in-out clay-inset ${
        checked ? '!bg-emerald-500' : '!bg-slate-600/50 dark:!bg-slate-800'
      }`}
      style={{
        boxShadow: checked
          ? 'inset 2px 2px 6px rgba(0, 0, 0, 0.3), 0 0 10px rgba(16, 185, 129, 0.4)'
          : undefined,
      }}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out ${
          checked ? 'translate-x-6' : 'translate-x-0'
        }`}
        style={{
          boxShadow: '0 2px 5px rgba(0, 0, 0, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
        }}
      />
    </button>
  )
}

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
