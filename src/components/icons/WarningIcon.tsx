import type { SVGProps } from 'react'

export function WarningIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M8.6 2.6a1.6 1.6 0 0 1 2.8 0l6.3 11.2A1.6 1.6 0 0 1 16.3 16H3.7a1.6 1.6 0 0 1-1.4-2.2L8.6 2.6Z"
        fill="var(--warning, #F59E0B)"
        opacity="0.15"
        stroke="var(--warning, #F59E0B)"
        strokeWidth="1.5"
      />
      <line x1="10" y1="7" x2="10" y2="11" stroke="var(--warning, #F59E0B)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="13.5" r="0.8" fill="var(--warning, #F59E0B)" />
    </svg>
  )
}
