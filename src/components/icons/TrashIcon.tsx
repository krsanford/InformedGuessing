import type { SVGProps } from 'react'

export function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path d="M3 5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 5V3.5A1.5 1.5 0 0 1 8.5 2h3A1.5 1.5 0 0 1 13 3.5V5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 5l1 12a1.5 1.5 0 0 0 1.5 1.5h5A1.5 1.5 0 0 0 14 17l1-12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="8.5" y1="8.5" x2="8.5" y2="14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11.5" y1="8.5" x2="11.5" y2="14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
