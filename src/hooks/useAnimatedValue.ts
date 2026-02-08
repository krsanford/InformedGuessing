import { useState, useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export function useAnimatedValue(target: number, duration = 400): number {
  const [current, setCurrent] = useState(target)
  const prevRef = useRef(target)
  const rafRef = useRef<number>()
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (reduced || typeof requestAnimationFrame === 'undefined') {
      setCurrent(target)
      prevRef.current = target
      return
    }

    const start = prevRef.current
    if (start === target) return

    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOutCubic(progress)
      setCurrent(start + (target - start) * eased)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    prevRef.current = target

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration, reduced])

  return current
}

export function useAnimatedValues(targets: number[], duration = 400): number[] {
  const [current, setCurrent] = useState(targets)
  const prevRef = useRef(targets)
  const rafRef = useRef<number>()
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (reduced || typeof requestAnimationFrame === 'undefined') {
      setCurrent(targets)
      prevRef.current = targets
      return
    }

    const starts = prevRef.current
    // Pad starts to match targets length if array grew
    const paddedStarts = targets.map((_, i) => starts[i] ?? 0)

    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOutCubic(progress)
      setCurrent(targets.map((t, i) => paddedStarts[i] + (t - paddedStarts[i]) * eased))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    prevRef.current = targets

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [targets.join(','), duration, reduced])

  return current
}
