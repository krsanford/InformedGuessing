import type { SVGProps } from 'react'

export function EmptyStateIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      {/* Clipboard body */}
      <rect x="50" y="30" width="100" height="120" rx="12" fill="var(--neutral-100, #F5F5F4)" stroke="var(--neutral-300, #D6D3D1)" strokeWidth="2" strokeDasharray="6 4" />

      {/* Clipboard clip */}
      <rect x="78" y="22" width="44" height="16" rx="8" fill="var(--neutral-200, #E7E5E4)" stroke="var(--neutral-300, #D6D3D1)" strokeWidth="1.5" />
      <rect x="90" y="26" width="20" height="8" rx="4" fill="var(--surface-card-solid, white)" />

      {/* Plus icon in center */}
      <line x1="100" y1="75" x2="100" y2="105" stroke="var(--primary-400, #818CF8)" strokeWidth="3" strokeLinecap="round" />
      <line x1="85" y1="90" x2="115" y2="90" stroke="var(--primary-400, #818CF8)" strokeWidth="3" strokeLinecap="round" />

      {/* Sparkles */}
      <circle cx="42" cy="50" r="3" fill="var(--accent-300, #FDBA74)" opacity="0.6">
        <animate attributeName="opacity" values="0.6;0.2;0.6" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="158" cy="65" r="2.5" fill="var(--primary-300, #A5B4FC)" opacity="0.5">
        <animate attributeName="opacity" values="0.5;0.15;0.5" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="35" cy="110" r="2" fill="var(--primary-200, #C7D2FE)" opacity="0.4">
        <animate attributeName="opacity" values="0.4;0.1;0.4" dur="3.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="165" cy="120" r="3.5" fill="var(--accent-200, #FED7AA)" opacity="0.5">
        <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2.8s" repeatCount="indefinite" />
      </circle>
    </svg>
  )
}
