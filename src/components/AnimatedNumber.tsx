import { useState, useEffect, useRef } from 'react'

interface AnimatedNumberProps {
  value: number
  decimals?: number
  suffix?: string
}

export function AnimatedNumber({ value, decimals = 1, suffix = '' }: AnimatedNumberProps) {
  const [displayed, setDisplayed] = useState(value)
  const prevRef = useRef(value)

  useEffect(() => {
    // Skip animation if reduced motion preferred or in test environment
    const prefersReduced = typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    const isTest = typeof requestAnimationFrame === 'undefined'

    if (prefersReduced || isTest) {
      setDisplayed(value)
      prevRef.current = value
      return
    }

    const start = prevRef.current
    const end = value
    if (start === end) return

    const duration = 400
    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setDisplayed(start + (end - start) * eased)
      if (progress < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
    prevRef.current = end
  }, [value])

  return <>{displayed.toFixed(decimals)}{suffix}</>
}
