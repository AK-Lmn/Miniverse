export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="44" height="44" rx="16" fill="#C9B8F5" />
      <rect x="2" y="2" width="44" height="44" rx="16" fill="url(#mv-grad)" fillOpacity="0.5" />
      <circle cx="17" cy="19" r="5.5" fill="#FBF6EF" />
      <circle cx="31" cy="19" r="5.5" fill="#FBF6EF" />
      <circle cx="17" cy="19" r="2.4" fill="#453F5C" />
      <circle cx="31" cy="19" r="2.4" fill="#453F5C" />
      <path d="M14 31C14 31 18 36 24 36C30 36 34 31 34 31" stroke="#453F5C" strokeWidth="3.2" strokeLinecap="round" />
      <defs>
        <linearGradient id="mv-grad" x1="2" y1="2" x2="46" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F7B899" />
          <stop offset="1" stopColor="#A9D7F5" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-display font-extrabold tracking-tight ${className}`}>
      Mini<span className="text-plum">Verse</span>
    </span>
  )
}
