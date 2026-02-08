import { useMemo } from 'react'
import type { UncertaintyBarItem } from '../../domain/visualization'
import styles from './UncertaintyBars.module.css'

interface UncertaintyBarsProps {
  items: UncertaintyBarItem[]
}

const W = 500
const ROW_H = 28
const PAD = { top: 8, right: 16, bottom: 28, left: 120 }
const BAR_H = 14
const PLOT_W = W - PAD.left - PAD.right

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(Math.max(t, 0), 1)
}

// Interpolate color from teal (#0F766E) to amber (#D97706) based on variance %
function riskColor(variancePct: number): string {
  const t = Math.min(variancePct / 40, 1) // 40%+ = fully amber
  const r = Math.round(lerp(15, 217, t))
  const g = Math.round(lerp(118, 119, t))
  const b = Math.round(lerp(110, 6, t))
  return `rgb(${r},${g},${b})`
}

export function UncertaintyBars({ items }: UncertaintyBarsProps) {
  const { globalMin, globalMax, svgH } = useMemo(() => {
    if (items.length === 0) return { globalMin: 0, globalMax: 100, svgH: 60 }
    const mins = items.map((i) => i.best)
    const maxs = items.map((i) => i.worst)
    const gMin = Math.min(...mins)
    const gMax = Math.max(...maxs)
    const padding = (gMax - gMin) * 0.05 || 10
    return {
      globalMin: Math.max(0, gMin - padding),
      globalMax: gMax + padding,
      svgH: PAD.top + items.length * ROW_H + PAD.bottom,
    }
  }, [items])

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <span>No uncertainty ranges to display</span>
      </div>
    )
  }

  function mapX(value: number): number {
    return PAD.left + ((value - globalMin) / (globalMax - globalMin)) * PLOT_W
  }

  // Axis ticks
  const range = globalMax - globalMin
  const roughStep = range / 5
  const mag = Math.pow(10, Math.floor(Math.log10(roughStep)))
  const step = Math.ceil(roughStep / mag) * mag
  const ticks: number[] = []
  let tick = Math.ceil(globalMin / step) * step
  while (tick <= globalMax) {
    ticks.push(tick)
    tick += step
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${svgH}`}
      className={styles.svg}
      role="img"
      aria-label="Uncertainty ranges for each work item"
    >
      {/* Grid lines */}
      {ticks.map((t, i) => (
        <line
          key={i}
          x1={mapX(t)} y1={PAD.top}
          x2={mapX(t)} y2={svgH - PAD.bottom}
          stroke="#E0E7FF" strokeWidth="0.5"
        />
      ))}

      {/* Items */}
      {items.map((item, idx) => {
        const y = PAD.top + idx * ROW_H
        const barY = y + (ROW_H - BAR_H) / 2
        const x1 = mapX(item.best)
        const x2 = mapX(item.worst)
        const xExp = mapX(item.expected)
        const barWidth = Math.max(x2 - x1, 2)
        const color = riskColor(item.variancePct)

        return (
          <g key={item.id}>
            {/* Row background on hover */}
            <rect
              x={0} y={y}
              width={W} height={ROW_H}
              fill="transparent"
              className={styles.rowHover}
            />

            {/* Item label */}
            <text
              x={PAD.left - 8}
              y={y + ROW_H / 2}
              textAnchor="end"
              dominantBaseline="central"
              className={styles.itemLabel}
            >
              {item.title.length > 16 ? item.title.slice(0, 15) + '…' : item.title}
            </text>

            {/* Range bar */}
            <rect
              x={x1} y={barY}
              width={barWidth} height={BAR_H}
              rx={3}
              fill={color}
              opacity={0.25}
            />
            <rect
              x={x1} y={barY}
              width={barWidth} height={BAR_H}
              rx={3}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
              opacity={0.7}
            />

            {/* Expected diamond marker */}
            <polygon
              points={`${xExp},${barY - 1} ${xExp + 4},${barY + BAR_H / 2} ${xExp},${barY + BAR_H + 1} ${xExp - 4},${barY + BAR_H / 2}`}
              fill={color}
              opacity={0.9}
            />

            {/* Variance % badge */}
            <text
              x={x2 + 6}
              y={y + ROW_H / 2}
              dominantBaseline="central"
              className={styles.pctLabel}
            >
              {item.variancePct.toFixed(0)}%
            </text>
          </g>
        )
      })}

      {/* X-axis */}
      <line
        x1={PAD.left} y1={svgH - PAD.bottom}
        x2={PAD.left + PLOT_W} y2={svgH - PAD.bottom}
        stroke="#A8A29E" strokeWidth="1"
      />
      {ticks.map((t, i) => (
        <g key={i}>
          <line
            x1={mapX(t)} y1={svgH - PAD.bottom}
            x2={mapX(t)} y2={svgH - PAD.bottom + 4}
            stroke="#A8A29E" strokeWidth="1"
          />
          <text
            x={mapX(t)} y={svgH - PAD.bottom + 16}
            textAnchor="middle"
            className={styles.tickLabel}
          >
            {t}h
          </text>
        </g>
      ))}
    </svg>
  )
}
