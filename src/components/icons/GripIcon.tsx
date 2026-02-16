import type { SVGProps } from 'react'

export function GripIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <circle cx="5.5" cy="3" r="1.25" />
      <circle cx="10.5" cy="3" r="1.25" />
      <circle cx="5.5" cy="8" r="1.25" />
      <circle cx="10.5" cy="8" r="1.25" />
      <circle cx="5.5" cy="13" r="1.25" />
      <circle cx="10.5" cy="13" r="1.25" />
    </svg>
  )
}
