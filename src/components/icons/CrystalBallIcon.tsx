import type { SVGProps } from 'react'

export function CrystalBallIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      {/* Ball */}
      <circle cx="24" cy="20" r="16" fill="url(#ballGradient)" opacity="0.9" />
      <circle cx="24" cy="20" r="16" stroke="var(--primary-300, #A5B4FC)" strokeWidth="1.5" fill="none" />

      {/* Sparkles inside */}
      <line x1="18" y1="14" x2="20" y2="16" stroke="var(--primary-200, #C7D2FE)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="28" y1="12" x2="26" y2="14" stroke="var(--primary-200, #C7D2FE)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="22" y1="22" x2="24" y2="20" stroke="var(--primary-200, #C7D2FE)" strokeWidth="1" strokeLinecap="round" />
      <circle cx="30" cy="18" r="1" fill="var(--primary-200, #C7D2FE)" />
      <circle cx="16" cy="24" r="0.8" fill="var(--primary-300, #A5B4FC)" />

      {/* Highlight arc */}
      <path d="M16 12 A12 12 0 0 1 28 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />

      {/* Base/stand */}
      <path d="M16 36 L18 33 Q24 31 30 33 L32 36 Z" fill="var(--neutral-300, #D6D3D1)" />
      <ellipse cx="24" cy="36.5" rx="9" ry="2" fill="var(--neutral-400, #A8A29E)" />

      <defs>
        <radialGradient id="ballGradient" cx="0.35" cy="0.35" r="0.65">
          <stop offset="0%" stopColor="var(--primary-100, #E0E7FF)" />
          <stop offset="50%" stopColor="var(--primary-300, #A5B4FC)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--primary-600, #4F46E5)" stopOpacity="0.3" />
        </radialGradient>
      </defs>
    </svg>
  )
}
