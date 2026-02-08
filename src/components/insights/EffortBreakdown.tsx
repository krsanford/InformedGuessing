import { useAnimatedValue } from '../../hooks/useAnimatedValue'
import type { PortfolioResults } from '../../domain/estimation'
import styles from './EffortBreakdown.module.css'

interface EffortBreakdownProps {
  results: PortfolioResults
}

const W = 440
const H = 100
const PAD = { top: 26, right: 16, bottom: 24, left: 16 }
const BAR_H = 28
const BAR_Y = PAD.top

export function EffortBreakdown({ results }: EffortBreakdownProps) {
  const expected = results.total_expected_hours
  const sigma = results.portfolio_range_spread
  const planning = expected + sigma
  const conservative = expected + 2 * sigma

  const animExpected = useAnimatedValue(expected)
  const animPlanning = useAnimatedValue(planning)
  const animConservative = useAnimatedValue(conservative)

  if (conservative <= 0) return null

  const maxVal = conservative
  const barW = W - PAD.left - PAD.right

  function scaleX(val: number): number {
    return PAD.left + (val / maxVal) * barW
  }

  const expW = scaleX(animExpected) - PAD.left
  const planW = scaleX(animPlanning) - PAD.left
  const consW = scaleX(animConservative) - PAD.left

  const bracketY = BAR_Y + BAR_H + 6

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={styles.svg}
      role="img"
      aria-label={`Effort breakdown: ${expected.toFixed(0)}h expected, ${planning.toFixed(0)}h planning, ${conservative.toFixed(0)}h conservative`}
    >
      {/* Conservative layer (+2σ) — lightest */}
      <rect
        x={PAD.left} y={BAR_Y}
        width={Math.max(consW, 2)} height={BAR_H}
        rx={4}
        fill="#A5B4FC"
        opacity={0.3}
      />

      {/* Planning layer (+1σ) */}
      <rect
        x={PAD.left} y={BAR_Y}
        width={Math.max(planW, 2)} height={BAR_H}
        rx={4}
        fill="#6366F1"
        opacity={0.3}
      />

      {/* Expected layer (base) — darkest */}
      <rect
        x={PAD.left} y={BAR_Y}
        width={Math.max(expW, 2)} height={BAR_H}
        rx={4}
        fill="#4338CA"
        opacity={0.5}
      />

      {/* Border on full bar */}
      <rect
        x={PAD.left} y={BAR_Y}
        width={Math.max(consW, 2)} height={BAR_H}
        rx={4}
        fill="none"
        stroke="#4338CA"
        strokeWidth={1}
        opacity={0.3}
      />

      {/* Segment divider lines */}
      <line
        x1={PAD.left + expW} y1={BAR_Y}
        x2={PAD.left + expW} y2={BAR_Y + BAR_H}
        stroke="#4338CA" strokeWidth={1.5} opacity={0.6}
      />
      <line
        x1={PAD.left + planW} y1={BAR_Y}
        x2={PAD.left + planW} y2={BAR_Y + BAR_H}
        stroke="#6366F1" strokeWidth={1} opacity={0.5}
        strokeDasharray="3 2"
      />

      {/* Top labels */}
      <text x={PAD.left + expW / 2} y={BAR_Y - 6} textAnchor="middle" className={styles.segLabel}>
        Expected
      </text>
      {planW - expW > 30 && (
        <text x={PAD.left + (expW + planW) / 2} y={BAR_Y - 6} textAnchor="middle" className={styles.segLabelBuffer}>
          +1σ buffer
        </text>
      )}
      {consW - planW > 30 && (
        <text x={PAD.left + (planW + consW) / 2} y={BAR_Y - 6} textAnchor="middle" className={styles.segLabelDim}>
          +2σ buffer
        </text>
      )}

      {/* Bottom value callouts with confidence % */}
      <text x={PAD.left + expW} y={bracketY + 10} textAnchor="middle" className={styles.valueLabel}>
        {animExpected.toFixed(0)}h
      </text>
      <text x={PAD.left + expW} y={bracketY + 20} textAnchor="middle" className={styles.confLabel}>
        50%
      </text>

      <text x={PAD.left + planW} y={bracketY + 10} textAnchor="middle" className={styles.valueLabelTeal}>
        {animPlanning.toFixed(0)}h
      </text>
      <text x={PAD.left + planW} y={bracketY + 20} textAnchor="middle" className={styles.confLabelTeal}>
        84%
      </text>

      <text x={PAD.left + consW} y={bracketY + 10} textAnchor="middle" className={styles.valueLabelDim}>
        {animConservative.toFixed(0)}h
      </text>
      <text x={PAD.left + consW} y={bracketY + 20} textAnchor="middle" className={styles.confLabelDim}>
        97%
      </text>

      {/* Tick marks down from bar to labels */}
      <line x1={PAD.left + expW} y1={BAR_Y + BAR_H} x2={PAD.left + expW} y2={bracketY + 2} stroke="#4338CA" strokeWidth={0.75} opacity={0.4} />
      <line x1={PAD.left + planW} y1={BAR_Y + BAR_H} x2={PAD.left + planW} y2={bracketY + 2} stroke="#0F766E" strokeWidth={0.75} opacity={0.4} />
      <line x1={PAD.left + consW} y1={BAR_Y + BAR_H} x2={PAD.left + consW} y2={bracketY + 2} stroke="#78716C" strokeWidth={0.75} opacity={0.3} />
    </svg>
  )
}
