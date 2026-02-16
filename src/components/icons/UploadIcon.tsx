import type { SVGProps } from 'react'

export function UploadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      {/* Open folder */}
      <path
        d="M2 6V4.5A1.5 1.5 0 0 1 3.5 3H7l2 2h4.5A1.5 1.5 0 0 1 15 6.5V7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Folder front face */}
      <path
        d="M2.5 7h13l1.5 1.5L15.5 17H3L1 8.5 2.5 7Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}
