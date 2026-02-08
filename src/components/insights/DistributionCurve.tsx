import { useMemo } from 'react'
import { generateGaussianCurvePoints } from '../../domain/gaussian'
import { useAnimatedValue } from '../../hooks/useAnimatedValue'
import type { DistributionCurveData } from '../../domain/visualization'
import styles from './DistributionCurve.module.css'

interface DistributionCurveProps {
  data: DistributionCurveData | null
}

const W = 500
const H = 140
const PAD = { top: 22, right: 32, bottom: 30, left: 32 }
const PLOT_W = W - PAD.left - PAD.right
const PLOT_H = H - PAD.top - PAD.bottom

function mapX(x: number, xMin: number, xMax: number): number {
  return PAD.left + ((x - xMin) / (xMax - xMin)) * PLOT_W
}

function mapY(y: number, yMax: number): number {
  return PAD.top + PLOT_H - (y / yMax) * PLOT_H
}

function buildPath(
  points: Array<{ x: number; y: number }>,
  xMin: number,
  xMax: number,
  yMax: number
): string {
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${mapX(p.x, xMin, xMax).toFixed(1)},${mapY(p.y, yMax).toFixed(1)}`)
    .join(' ')
}

function buildFilledPath(
  points: Array<{ x: number; y: number }>,
  filterMin: number,
  filterMax: number,
  xMin: number,
  xMax: number,
  yMax: number
): string {
  const filtered = points.filter((p) => p.x >= filterMin && p.x <= filterMax)
  if (filtered.length < 2) return ''
  const path = filtered
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${mapX(p.x, xMin, xMax).toFixed(1)},${mapY(p.y, yMax).toFixed(1)}`)
    .join(' ')
  const baseline = PAD.top + PLOT_H
  const xStart = mapX(filtered[0].x, xMin, xMax).toFixed(1)
  const xEnd = mapX(filtered[filtered.length - 1].x, xMin, xMax).toFixed(1)
  return `${path} L${xEnd},${baseline} L${xStart},${baseline} Z`
}

export function DistributionCurve({ data }: DistributionCurveProps) {
  const animMean = useAnimatedValue(data?.mean ?? 0)
  const animSigma = useAnimatedValue(data?.sigma ?? 1)

  const mean = data ? animMean : 0
  const sigma = data ? Math.max(animSigma, 0.01) : 1

  const { points, xMin, xMax, yMax } = useMemo(() => {
    const pts = generateGaussianCurvePoints(mean, sigma, 120, 3.5)
    const xMn = mean - 3.5 * sigma
    const xMx = mean + 3.5 * sigma
    const yMx = pts.reduce((max, p) => Math.max(max, p.y), 0) * 1.1
    return { points: pts, xMin: xMn, xMax: xMx, yMax: yMx }
  }, [mean, sigma])

  if (!data) {
    return (
      <div className={styles.empty}>
        <span>Add work items with ranges to see the distribution</span>
      </div>
    )
  }

  const baseline = PAD.top + PLOT_H

  // Confidence region boundaries
  const mu = mean
  const s1 = mean + sigma
  const s2 = mean + 2 * sigma

  // Curve path
  const curvePath = buildPath(points, xMin, xMax, yMax)

  // Filled regions: left of mean, mean to +1σ, +1σ to +2σ
  const fillLeft = buildFilledPath(points, xMin, mu, xMin, xMax, yMax)
  const fill1Sigma = buildFilledPath(points, mu, s1, xMin, xMax, yMax)
  const fill2Sigma = buildFilledPath(points, s1, s2, xMin, xMax, yMax)
  const fillTail = buildFilledPath(points, s2, xMax, xMin, xMax, yMax)

  // Axis ticks — spread across range
  const tickCount = 7
  const tickStep = (xMax - xMin) / (tickCount - 1)
  const ticks = Array.from({ length: tickCount }, (_, i) => xMin + i * tickStep)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={styles.svg}
      role="img"
      aria-label="Portfolio distribution curve showing confidence regions"
    >
      <defs>
        <linearGradient id="curveStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#312E81" />
          <stop offset="50%" stopColor="#4338CA" />
          <stop offset="100%" stopColor="#5B21B6" />
        </linearGradient>
      </defs>

      {/* Filled confidence regions */}
      <path d={fillLeft} fill="#818CF8" opacity="0.12" />
      <path d={fill1Sigma} fill="#4F46E5" opacity="0.18" />
      <path d={fill2Sigma} fill="#4338CA" opacity="0.12" />
      <path d={fillTail} fill="#312E81" opacity="0.06" />

      {/* Main curve */}
      <path d={curvePath} fill="none" stroke="url(#curveStroke)" strokeWidth="2.5" strokeLinecap="round" />

      {/* Vertical marker lines */}
      <line
        x1={mapX(mu, xMin, xMax)} y1={PAD.top}
        x2={mapX(mu, xMin, xMax)} y2={baseline}
        stroke="#4338CA" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6"
      />
      <line
        x1={mapX(s1, xMin, xMax)} y1={PAD.top}
        x2={mapX(s1, xMin, xMax)} y2={baseline}
        stroke="#0F766E" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6"
      />
      <line
        x1={mapX(s2, xMin, xMax)} y1={PAD.top}
        x2={mapX(s2, xMin, xMax)} y2={baseline}
        stroke="#0D9488" strokeWidth="1" strokeDasharray="3 3" opacity="0.4"
      />

      {/* Marker labels */}
      <text x={mapX(mu, xMin, xMax)} y={PAD.top - 6} textAnchor="middle" className={styles.markerLabel}>
        Expected
      </text>
      <text x={mapX(mu, xMin, xMax)} y={PAD.top - 16} textAnchor="middle" className={styles.confidenceLabel}>
        50%
      </text>

      <text x={mapX(s1, xMin, xMax)} y={PAD.top - 6} textAnchor="middle" className={styles.markerLabelTeal}>
        Planning
      </text>
      <text x={mapX(s1, xMin, xMax)} y={PAD.top - 16} textAnchor="middle" className={styles.confidenceLabelTeal}>
        84%
      </text>

      <text x={mapX(s2, xMin, xMax)} y={PAD.top - 6} textAnchor="middle" className={styles.markerLabelDim}>
        Conservative
      </text>
      <text x={mapX(s2, xMin, xMax)} y={PAD.top - 16} textAnchor="middle" className={styles.confidenceLabelDim}>
        97%
      </text>

      {/* Diamond markers at key points */}
      <polygon
        points={`${mapX(mu, xMin, xMax)},${mapY(points.find(p => Math.abs(p.x - mu) < sigma * 0.1)?.y ?? 0, yMax) - 6} ${mapX(mu, xMin, xMax) + 4},${mapY(points.find(p => Math.abs(p.x - mu) < sigma * 0.1)?.y ?? 0, yMax)} ${mapX(mu, xMin, xMax)},${mapY(points.find(p => Math.abs(p.x - mu) < sigma * 0.1)?.y ?? 0, yMax) + 6} ${mapX(mu, xMin, xMax) - 4},${mapY(points.find(p => Math.abs(p.x - mu) < sigma * 0.1)?.y ?? 0, yMax)}`}
        fill="#4338CA"
      />

      {/* X-axis */}
      <line x1={PAD.left} y1={baseline} x2={PAD.left + PLOT_W} y2={baseline} stroke="#A8A29E" strokeWidth="1" />

      {/* Tick marks + labels */}
      {ticks.map((tick, i) => (
        <g key={i}>
          <line
            x1={mapX(tick, xMin, xMax)} y1={baseline}
            x2={mapX(tick, xMin, xMax)} y2={baseline + 4}
            stroke="#A8A29E" strokeWidth="1"
          />
          <text
            x={mapX(tick, xMin, xMax)} y={baseline + 16}
            textAnchor="middle"
            className={styles.tickLabel}
          >
            {tick.toFixed(0)}h
          </text>
        </g>
      ))}

      {/* Value callouts below axis */}
      <text x={mapX(mu, xMin, xMax)} y={baseline + 30} textAnchor="middle" className={styles.valueCallout}>
        {data.markers[0].label}
      </text>
      <text x={mapX(s1, xMin, xMax)} y={baseline + 30} textAnchor="middle" className={styles.valueCalloutTeal}>
        {data.markers[1].label}
      </text>
    </svg>
  )
}
