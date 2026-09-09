export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <defs>
        <filter id="console-shadow" x="-15%" y="-10%" width="135%" height="135%">
          <feDropShadow dx="2" dy="3.5" stdDeviation="2.5" floodColor="#4E3B70" floodOpacity="0.22" />
          <feDropShadow dx="-1" dy="-1" stdDeviation="1.5" floodColor="#ffffff" floodOpacity="0.8" />
        </filter>

        <radialGradient id="console-body" cx="30%" cy="25%" r="75%">
          <stop offset="0%" stopColor="#EDE4FC" />
          <stop offset="50%" stopColor="#CBB7F7" />
          <stop offset="100%" stopColor="#9C7DE8" />
        </radialGradient>

        <linearGradient id="screen-well" x1="12" y1="10" x2="36" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2D2146" />
          <stop offset="100%" stopColor="#1A122E" />
        </linearGradient>

        <linearGradient id="game-pixel" x1="16" y1="14" x2="32" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#76D9A6" />
          <stop offset="100%" stopColor="#82C4F3" />
        </linearGradient>
      </defs>

      {/* Console Chassis */}
      <rect x="5" y="4" width="38" height="40" rx="12" fill="url(#console-body)" filter="url(#console-shadow)" />

      {/* Top Specular Highlight Bevel */}
      <path
        d="M17 5.5C10 5.5 6.5 9 6.5 16C6.5 11 10 7.5 17 7.5H31C38 7.5 41.5 11 41.5 16C41.5 9 38 5.5 31 5.5H17Z"
        fill="#FFFFFF"
        opacity="0.75"
      />

      {/* Recessed Screen Well */}
      <rect x="11" y="10" width="26" height="17" rx="6" fill="url(#screen-well)" />
      <rect x="11" y="10" width="26" height="17" rx="6" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

      {/* Pixel Glint inside screen (Play Icon) */}
      <path d="M22 15L28 18.5L22 22V15Z" fill="url(#game-pixel)" />

      {/* Lower Controls: Clay D-Pad */}
      <path d="M17 31V37M14 34H20" stroke="#3D2B60" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M17 31V37M14 34H20" stroke="#5C448A" strokeWidth="2.5" strokeLinecap="round" />

      {/* Lower Controls: Candy Action Buttons */}
      <circle cx="33" cy="32" r="2.8" fill="#F59A68" />
      <circle cx="33" cy="31.3" r="1" fill="#FFFFFF" opacity="0.6" />

      <circle cx="28" cy="36" r="2.8" fill="#76D9A6" />
      <circle cx="28" cy="35.3" r="1" fill="#FFFFFF" opacity="0.6" />
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
