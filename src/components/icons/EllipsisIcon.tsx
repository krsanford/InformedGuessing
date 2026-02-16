import type { SVGProps } from 'react'

export function EllipsisIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <circle cx="4" cy="10" r="1.75" />
      <circle cx="10" cy="10" r="1.75" />
      <circle cx="16" cy="10" r="1.75" />
    </svg>
  )
}
