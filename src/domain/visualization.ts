/**
 * Pure data transforms that convert estimation results into visualization props.
 * No React dependency — components consume these pre-computed structures.
 */
import type { WorkItemCalculated, PortfolioResults, EstimationConstants } from './estimation'

// ============================================================================
// Distribution Curve
// ============================================================================

export interface DistributionMarker {
  x: number
  label: string
  confidence: string
}

export interface DistributionCurveData {
  mean: number
  sigma: number
  markers: DistributionMarker[]
  xMin: number
  xMax: number
}

export function computeDistributionData(results: PortfolioResults): DistributionCurveData | null {
  const { total_expected_hours: mean, portfolio_range_spread: sigma } = results
  if (sigma < 0.01) return null // no meaningful uncertainty

  return {
    mean,
    sigma,
    markers: [
      { x: mean, label: `${mean.toFixed(0)}h`, confidence: '50%' },
      { x: mean + sigma, label: `${(mean + sigma).toFixed(0)}h`, confidence: '84%' },
      { x: mean + 2 * sigma, label: `${(mean + 2 * sigma).toFixed(0)}h`, confidence: '97%' },
    ],
    xMin: mean - 3.5 * sigma,
    xMax: mean + 3.5 * sigma,
  }
}

// ============================================================================
// Uncertainty Bars
// ============================================================================

export interface UncertaintyBarItem {
  id: number
  title: string
  best: number
  worst: number
  expected: number
  variance: number
  variancePct: number
}

export function computeUncertaintyBars(
  items: WorkItemCalculated[],
  totalVariance: number
): UncertaintyBarItem[] {
  if (totalVariance <= 0) return []

  return items
    .map((item) => ({
      id: item.id,
      title: item.title || `Item ${item.id}`,
      best: item.best_case_hours,
      worst: item.worst_case_hours,
      expected: item.expected_hours,
      variance: item.variance,
      variancePct: (item.variance / totalVariance) * 100,
    }))
    .filter((item) => item.worst > item.best) // skip zero-range items
    .sort((a, b) => b.variance - a.variance)
    .slice(0, 15) // cap for readability
}

// ============================================================================
// Risk Donut
// ============================================================================

export interface RiskSegment {
  id: number
  title: string
  variance: number
  pct: number
  startAngle: number
  endAngle: number
}

const MIN_SEGMENT_PCT = 0.03 // group segments below 3% into "Other"

export function computeRiskSegments(
  items: WorkItemCalculated[],
  totalVariance: number
): RiskSegment[] {
  if (totalVariance <= 0) return []

  const raw = items
    .map((item) => ({
      id: item.id,
      title: item.title || `Item ${item.id}`,
      variance: item.variance,
      pct: item.variance / totalVariance,
    }))
    .filter((s) => s.variance > 0)
    .sort((a, b) => b.pct - a.pct)

  // Group small segments into "Other"
  const significant: typeof raw = []
  let otherPct = 0
  let otherVariance = 0
  for (const seg of raw) {
    if (seg.pct >= MIN_SEGMENT_PCT) {
      significant.push(seg)
    } else {
      otherPct += seg.pct
      otherVariance += seg.variance
    }
  }
  if (otherPct > 0) {
    significant.push({ id: -1, title: 'Other', variance: otherVariance, pct: otherPct })
  }

  // Compute angles
  let angle = -Math.PI / 2 // start at top
  return significant.map((seg) => {
    const startAngle = angle
    const endAngle = angle + seg.pct * 2 * Math.PI
    angle = endAngle
    return { ...seg, startAngle, endAngle }
  })
}

// ============================================================================
// Diversification Bar
// ============================================================================

export interface DiversificationData {
  naiveSumSigma: number
  actualPortfolioSigma: number
  benefitPct: number
}

export function computeDiversificationData(
  items: WorkItemCalculated[],
  results: PortfolioResults
): DiversificationData {
  const naiveSumSigma = items.reduce((sum, item) => sum + item.range_spread_hours, 0)
  const actualPortfolioSigma = results.portfolio_range_spread

  return {
    naiveSumSigma,
    actualPortfolioSigma,
    benefitPct: naiveSumSigma > 0 ? ((naiveSumSigma - actualPortfolioSigma) / naiveSumSigma) * 100 : 0,
  }
}

// ============================================================================
// Duration Curve
// ============================================================================

export interface DurationCurveData {
  curvePoints: Array<{ effort: number; duration: number }>
  currentPoint: { effort: number; duration: number; durationCeiled: number }
  xMax: number
  yMax: number
}

export function computeDurationCurveData(
  results: PortfolioResults,
  constants: EstimationConstants
): DurationCurveData | null {
  const { total_effort_staff_weeks: effort, duration_weeks: durationCeiled } = results
  if (effort <= 0) return null

  const k = constants.duration_scaling_power
  const duration = k * Math.pow(effort, 1 / 3)

  // Curve extends to 2× current effort for context
  const xMax = Math.max(effort * 2, 10)
  const numPoints = 60
  const curvePoints: Array<{ effort: number; duration: number }> = []
  for (let i = 0; i <= numPoints; i++) {
    const x = (i / numPoints) * xMax
    curvePoints.push({ effort: x, duration: k * Math.pow(Math.max(x, 0), 1 / 3) })
  }

  const yMax = k * Math.pow(xMax, 1 / 3)

  return {
    curvePoints,
    currentPoint: { effort, duration, durationCeiled },
    xMax,
    yMax,
  }
}
