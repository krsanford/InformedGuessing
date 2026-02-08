import { useState } from 'react'
import { useAnimatedValues } from '../../hooks/useAnimatedValue'
import type { RiskSegment } from '../../domain/visualization'
import styles from './RiskDonut.module.css'

interface RiskDonutProps {
  segments: RiskSegment[]
  centerValue: number
  centerLabel: string
}

const SIZE = 200
const CX = SIZE / 2
const CY = SIZE / 2
const R = 70
const STROKE_W = 24
const CIRCUMFERENCE = 2 * Math.PI * R

// Indigo palette cycling for segments
const SEGMENT_COLORS = [
  '#312E81', '#3730A3', '#4338CA', '#4F46E5',
  '#6366F1', '#818CF8', '#A5B4FC', '#C7D2FE',
]

function getSegmentColor(index: number): string {
  return SEGMENT_COLORS[index % SEGMENT_COLORS.length]
}

export function RiskDonut({ segments, centerValue, centerLabel }: RiskDonutProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  // Animate segment lengths
  const targetLengths = segments.map((s) => s.pct * CIRCUMFERENCE)
  const animatedLengths = useAnimatedValues(targetLengths)

  if (segments.length === 0) {
    return (
      <div className={styles.empty}>
        <span>No risk data</span>
      </div>
    )
  }

  // Compute offsets from animated lengths
  let cumulativeOffset = 0
  const segmentData = segments.map((seg, i) => {
    const length = animatedLengths[i] ?? targetLengths[i]
    const offset = cumulativeOffset
    cumulativeOffset += length
    return { ...seg, length, offset }
  })

  const hoveredSegment = hoveredId !== null
    ? segmentData.find((s) => s.id === hoveredId)
    : null

  return (
    <div className={styles.container}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className={styles.svg}
        role="img"
        aria-label="Risk contribution breakdown by work item"
      >
        {/* Background ring */}
        <circle
          cx={CX} cy={CY} r={R}
          fill="none"
          stroke="#E0E7FF"
          strokeWidth={STROKE_W}
          opacity={0.3}
        />

        {/* Segments */}
        {segmentData.map((seg, i) => {
          const isHovered = hoveredId === seg.id
          return (
            <circle
              key={seg.id}
              cx={CX} cy={CY} r={R}
              fill="none"
              stroke={getSegmentColor(i)}
              strokeWidth={isHovered ? STROKE_W + 4 : STROKE_W}
              strokeDasharray={`${seg.length} ${CIRCUMFERENCE - seg.length}`}
              strokeDashoffset={-seg.offset}
              transform={`rotate(-90 ${CX} ${CY})`}
              opacity={hoveredId !== null && !isHovered ? 0.4 : 0.85}
              style={{ transition: 'opacity 150ms ease, stroke-width 150ms ease' }}
              onMouseEnter={() => setHoveredId(seg.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={styles.segment}
            />
          )
        })}

        {/* Center text */}
        <text x={CX} y={CY - 6} textAnchor="middle" dominantBaseline="central" className={styles.centerValue}>
          ±{centerValue.toFixed(1)}h
        </text>
        <text x={CX} y={CY + 12} textAnchor="middle" dominantBaseline="central" className={styles.centerLabel}>
          {centerLabel}
        </text>
      </svg>

      {/* Hover tooltip */}
      {hoveredSegment && (
        <div className={styles.tooltip}>
          <span className={styles.tooltipTitle}>{hoveredSegment.title}</span>
          <span className={styles.tooltipValue}>{(hoveredSegment.pct * 100).toFixed(1)}% of risk</span>
        </div>
      )}

      {/* Legend */}
      <div className={styles.legend}>
        {segmentData.slice(0, 6).map((seg, i) => (
          <div
            key={seg.id}
            className={styles.legendItem}
            onMouseEnter={() => setHoveredId(seg.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <span
              className={styles.legendDot}
              style={{ backgroundColor: getSegmentColor(i) }}
            />
            <span className={styles.legendLabel}>
              {seg.title.length > 14 ? seg.title.slice(0, 13) + '…' : seg.title}
            </span>
            <span className={styles.legendPct}>{(seg.pct * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
