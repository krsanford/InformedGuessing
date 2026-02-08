import { useAnimatedValue } from '../../hooks/useAnimatedValue'
import type { DiversificationData } from '../../domain/visualization'
import styles from './DiversificationBar.module.css'

interface DiversificationBarProps {
  data: DiversificationData
}

const W = 300
const H = 140
const PAD = { top: 20, right: 50, bottom: 12, left: 10 }
const BAR_W = W - PAD.left - PAD.right
const BAR_H = 22
const GAP = 32

export function DiversificationBar({ data }: DiversificationBarProps) {
  const animNaive = useAnimatedValue(data.naiveSumSigma)
  const animActual = useAnimatedValue(data.actualPortfolioSigma)
  const animBenefit = useAnimatedValue(data.benefitPct)

  if (data.naiveSumSigma <= 0) {
    return (
      <div className={styles.empty}>
        <span>Add items with ranges to see the diversification effect</span>
      </div>
    )
  }

  const maxVal = data.naiveSumSigma
  const naiveW = BAR_W
  const actualW = maxVal > 0 ? (animActual / maxVal) * BAR_W : 0

  const bar1Y = PAD.top
  const bar2Y = PAD.top + BAR_H + GAP

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={styles.svg}
      role="img"
      aria-label={`Diversification benefit: ${animBenefit.toFixed(0)}% reduction in portfolio risk`}
    >
      {/* Top bar — naive sum (amber) */}
      <rect
        x={PAD.left} y={bar1Y}
        width={naiveW} height={BAR_H}
        rx={4}
        fill="#D97706"
        opacity={0.2}
      />
      <rect
        x={PAD.left} y={bar1Y}
        width={naiveW} height={BAR_H}
        rx={4}
        fill="none"
        stroke="#D97706"
        strokeWidth={1.5}
        opacity={0.6}
      />
      <text
        x={PAD.left} y={bar1Y - 5}
        className={styles.barLabel}
      >
        If risks added linearly
      </text>
      <text
        x={PAD.left + naiveW + 4} y={bar1Y + BAR_H / 2}
        dominantBaseline="central"
        className={styles.barValue}
        style={{ fill: '#B45309' }}
      >
        ±{animNaive.toFixed(0)}h
      </text>

      {/* Bottom bar — actual portfolio (teal) */}
      <rect
        x={PAD.left} y={bar2Y}
        width={Math.max(actualW, 2)} height={BAR_H}
        rx={4}
        fill="#0F766E"
        opacity={0.25}
      />
      <rect
        x={PAD.left} y={bar2Y}
        width={Math.max(actualW, 2)} height={BAR_H}
        rx={4}
        fill="none"
        stroke="#0F766E"
        strokeWidth={1.5}
        opacity={0.7}
      />
      <text
        x={PAD.left} y={bar2Y - 5}
        className={styles.barLabel}
      >
        Actual portfolio risk
      </text>
      <text
        x={PAD.left + Math.max(actualW, 2) + 4} y={bar2Y + BAR_H / 2}
        dominantBaseline="central"
        className={styles.barValueTeal}
      >
        ±{animActual.toFixed(0)}h
      </text>

      {/* Connecting bracket showing benefit */}
      <line
        x1={PAD.left + actualW + 1} y1={bar2Y + BAR_H + 2}
        x2={PAD.left + naiveW} y2={bar2Y + BAR_H + 2}
        stroke="#4338CA"
        strokeWidth={1}
        strokeDasharray="3 2"
        opacity={0.5}
      />

      {/* Benefit label — centered between bars */}
      <text
        x={W / 2}
        y={(bar1Y + BAR_H + bar2Y) / 2 + 2}
        textAnchor="middle"
        dominantBaseline="central"
        className={styles.benefitLabel}
      >
        {animBenefit.toFixed(0)}% diversification benefit
      </text>

      {/* Arrow */}
      <line
        x1={W / 2} y1={(bar1Y + BAR_H + bar2Y) / 2 + 8}
        x2={W / 2} y2={bar2Y - 3}
        stroke="#4338CA"
        strokeWidth={1}
        opacity={0.3}
        markerEnd="url(#arrowDown)"
      />

      <defs>
        <marker id="arrowDown" viewBox="0 0 6 6" refX="3" refY="6" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,0 L3,6 L6,0" fill="none" stroke="#4338CA" strokeWidth="1" opacity="0.4" />
        </marker>
      </defs>
    </svg>
  )
}
