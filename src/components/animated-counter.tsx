'use client'

import * as React from 'react'

interface AnimatedCounterProps {
  /** Target value to count up to. */
  value: number
  /** Duration of the count animation in ms. Default 1500. */
  duration?: number
  /** Optional prefix string (e.g. "$"). */
  prefix?: string
  /** Optional suffix string (e.g. "+"). */
  suffix?: string
  /** Number of decimal places. Default 0. */
  decimals?: number
  className?: string
}

/**
 * A count-up animation that triggers when the element scrolls into view.
 * Uses IntersectionObserver + requestAnimationFrame — no animation library needed.
 */
export function AnimatedCounter({
  value,
  duration = 1500,
  prefix = '',
  suffix = '',
  decimals = 0,
  className,
}: AnimatedCounterProps) {
  const [display, setDisplay] = React.useState(0)
  const ref = React.useRef<HTMLSpanElement>(null)
  const startedRef = React.useRef(false)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !startedRef.current) {
          startedRef.current = true
          const start = performance.now()
          const tick = (now: number) => {
            const elapsed = now - start
            const progress = Math.min(elapsed / duration, 1)
            // easeOutCubic
            const eased = 1 - Math.pow(1 - progress, 3)
            setDisplay(value * eased)
            if (progress < 1) requestAnimationFrame(tick)
            else setDisplay(value)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [value, duration])

  const formatted = display.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
