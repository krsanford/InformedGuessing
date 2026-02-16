import type { SVGProps } from 'react'

export function DuplicateIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <rect x="6" y="6" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 6V4.5A1.5 1.5 0 0 0 12.5 3H4.5A1.5 1.5 0 0 0 3 4.5v8A1.5 1.5 0 0 0 4.5 14H6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}
