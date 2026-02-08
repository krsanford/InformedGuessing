import type { SVGProps } from 'react'

export function GearIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path
        d="M10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8.5 1.5h3l.4 2.1a6.5 6.5 0 0 1 1.8 1l2-.7 1.5 2.6-1.6 1.4a6.5 6.5 0 0 1 0 2.1l1.6 1.4-1.5 2.6-2-.7a6.5 6.5 0 0 1-1.8 1l-.4 2.1h-3l-.4-2.1a6.5 6.5 0 0 1-1.8-1l-2 .7-1.5-2.6 1.6-1.4a6.5 6.5 0 0 1 0-2.1L2.8 6.5l1.5-2.6 2 .7a6.5 6.5 0 0 1 1.8-1L8.5 1.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}
