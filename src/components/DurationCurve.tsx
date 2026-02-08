import { useAnimatedValue } from '../hooks/useAnimatedValue'
import type { DurationCurveData } from '../domain/visualization'
import styles from './DurationCurve.module.css'

interface DurationCurveProps {
  data: DurationCurveData | null
}

const W = 180
const H = 100
const PAD = { top: 14, right: 12, bottom: 22, left: 28 }
const PLOT_W = W - PAD.left - PAD.right
const PLOT_H = H - PAD.top - PAD.bottom

export function DurationCurve({ data }: DurationCurveProps) {
  const animEffort = useAnimatedValue(data?.currentPoint.effort ?? 0, 300)
  const animDuration = useAnimatedValue(data?.currentPoint.duration ?? 0, 300)

  if (!data) {
    return <div className={styles.empty}>No data</div>
  }

  const { curvePoints, currentPoint, xMax, yMax } = data

  function mapX(x: number): number {
    return PAD.left + (x / xMax) * PLOT_W
  }
  function mapY(y: number): number {
    return PAD.top + PLOT_H - (y / yMax) * PLOT_H
  }

  // Curve path
  const curvePath = curvePoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${mapX(p.effort).toFixed(1)},${mapY(p.duration).toFixed(1)}`)
    .join(' ')

  // Current point position (animated)
  const px = mapX(animEffort)
  const py = mapY(animDuration)

  // Ceiling line
  const ceilY = mapY(currentPoint.durationCeiled)

  // Axis ticks
  const xTicks = [0, Math.round(xMax / 2), Math.round(xMax)]
  const yTicks = [0, Math.round(yMax / 2), Math.round(yMax)]

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={styles.svg}
      role="img"
      aria-label={`Duration curve: ${currentPoint.effort.toFixed(1)} staff-weeks → ${currentPoint.durationCeiled} weeks`}
    >
      {/* Grid */}
      {xTicks.map((t, i) => (
        <line key={`x${i}`} x1={mapX(t)} y1={PAD.top} x2={mapX(t)} y2={PAD.top + PLOT_H} stroke="#E0E7FF" strokeWidth="0.5" />
      ))}
      {yTicks.map((t, i) => (
        <line key={`y${i}`} x1={PAD.left} y1={mapY(t)} x2={PAD.left + PLOT_W} y2={mapY(t)} stroke="#E0E7FF" strokeWidth="0.5" />
      ))}

      {/* Cube-root curve */}
      <path d={curvePath} fill="none" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />

      {/* Ceiling line (dashed amber) */}
      <line
        x1={PAD.left} y1={ceilY}
        x2={PAD.left + PLOT_W} y2={ceilY}
        stroke="#D97706" strokeWidth="0.75" strokeDasharray="3 2" opacity="0.5"
      />
      <text x={PAD.left + PLOT_W + 2} y={ceilY} dominantBaseline="central" className={styles.ceilLabel}>
        {currentPoint.durationCeiled}w
      </text>

      {/* Crosshair lines at current point */}
      <line x1={px} y1={PAD.top} x2={px} y2={PAD.top + PLOT_H} stroke="#0F766E" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.4" />
      <line x1={PAD.left} y1={py} x2={PAD.left + PLOT_W} y2={py} stroke="#0F766E" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.4" />

      {/* Current point dot */}
      <circle cx={px} cy={py} r={3.5} fill="#0F766E" stroke="white" strokeWidth="1.5" />

      {/* Axes */}
      <line x1={PAD.left} y1={PAD.top + PLOT_H} x2={PAD.left + PLOT_W} y2={PAD.top + PLOT_H} stroke="#A8A29E" strokeWidth="0.75" />
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + PLOT_H} stroke="#A8A29E" strokeWidth="0.75" />

      {/* X-axis labels */}
      {xTicks.filter(t => t > 0).map((t, i) => (
        <text key={`xl${i}`} x={mapX(t)} y={PAD.top + PLOT_H + 12} textAnchor="middle" className={styles.tickLabel}>
          {t}sw
        </text>
      ))}

      {/* Y-axis labels */}
      {yTicks.filter(t => t > 0).map((t, i) => (
        <text key={`yl${i}`} x={PAD.left - 4} y={mapY(t)} textAnchor="end" dominantBaseline="central" className={styles.tickLabel}>
          {t}w
        </text>
      ))}

      {/* Axis titles */}
      <text x={PAD.left + PLOT_W / 2} y={H - 2} textAnchor="middle" className={styles.axisTitle}>
        effort (staff-weeks)
      </text>
    </svg>
  )
}
