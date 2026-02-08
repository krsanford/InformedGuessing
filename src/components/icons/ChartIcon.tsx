import type { SVGProps } from 'react'

export function ChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <rect x="2" y="10" width="4" height="8" rx="1" fill="currentColor" opacity="0.4" />
      <rect x="8" y="6" width="4" height="12" rx="1" fill="currentColor" opacity="0.65" />
      <rect x="14" y="2" width="4" height="16" rx="1" fill="currentColor" />
    </svg>
  )
}
