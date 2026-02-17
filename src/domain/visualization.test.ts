import { describe, it, expect } from 'vitest'
import {
  computeDistributionData,
  computeUncertaintyBars,
  computeRiskSegments,
  computeDiversificationData,
  computeDurationCurveData,
} from './visualization'
import { DEFAULT_CONSTANTS } from './estimation'
import type { WorkItemCalculated, PortfolioResults, EstimationConstants } from './estimation'

// ============================================================================
// Test Helpers
// ============================================================================

function makeItem(overrides: Partial<WorkItemCalculated> & { id: number }): WorkItemCalculated {
  const best = overrides.best_case_hours ?? 80
  const worst = overrides.worst_case_hours ?? 120
  const expected = overrides.expected_hours ?? best + 0.6 * (worst - best)
  const rangeSpread = overrides.range_spread_hours ?? (worst - best) / 2.6
  const variance = overrides.variance ?? rangeSpread * rangeSpread
  return {
    id: overrides.id,
    title: overrides.title ?? `Task ${overrides.id}`,
    notes: overrides.notes ?? '',
    best_case_hours: best,
    worst_case_hours: worst,
    expected_hours: expected,
    range_spread_hours: rangeSpread,
    variance,
    enabled: overrides.enabled ?? true,
    multiplier: overrides.multiplier ?? 1,
  }
}

function makeResults(overrides: Partial<PortfolioResults> = {}): PortfolioResults {
  return {
    total_expected_hours: overrides.total_expected_hours ?? 500,
    total_variance: overrides.total_variance ?? 2500,
    portfolio_range_spread: overrides.portfolio_range_spread ?? 50,
    total_effort_hours: overrides.total_effort_hours ?? 550,
    total_effort_staff_weeks: overrides.total_effort_staff_weeks ?? 15.28,
    duration_weeks: overrides.duration_weeks ?? 8,
  }
}

// Realistic items based on estimation math (position=0.6, divisor=2.6)
const ITEM_A = makeItem({ id: 1, title: 'Frontend UI', best_case_hours: 80, worst_case_hours: 200 })
// expected = 80 + 0.6*(120) = 152, range_spread = 120/2.6 = 46.15, variance = 2129.98
const ITEM_B = makeItem({ id: 2, title: 'API Layer', best_case_hours: 40, worst_case_hours: 100 })
// expected = 40 + 0.6*(60) = 76, range_spread = 60/2.6 = 23.08, variance = 532.50
const ITEM_C = makeItem({ id: 3, title: 'Database', best_case_hours: 20, worst_case_hours: 60 })
// expected = 20 + 0.6*(40) = 44, range_spread = 40/2.6 = 15.38, variance = 236.69
const ITEM_D = makeItem({ id: 4, title: 'Testing', best_case_hours: 30, worst_case_hours: 30 })
// zero range: expected = 30, range_spread = 0, variance = 0

const TOTAL_VARIANCE_ABC = ITEM_A.variance + ITEM_B.variance + ITEM_C.variance

// ============================================================================
// computeDistributionData
// ============================================================================

describe('computeDistributionData', () => {
  it('returns null when sigma is below threshold (< 0.01)', () => {
    const results = makeResults({ portfolio_range_spread: 0.005 })
    expect(computeDistributionData(results)).toBeNull()
  })

  it('returns null when sigma is exactly zero', () => {
    const results = makeResults({ portfolio_range_spread: 0 })
    expect(computeDistributionData(results)).toBeNull()
  })

  it('returns data when sigma is at the threshold (0.01)', () => {
    const results = makeResults({ portfolio_range_spread: 0.01 })
    expect(computeDistributionData(results)).not.toBeNull()
  })

  it('returns correct mean and sigma from portfolio results', () => {
    const results = makeResults({ total_expected_hours: 500, portfolio_range_spread: 50 })
    const data = computeDistributionData(results)!

    expect(data.mean).toBe(500)
    expect(data.sigma).toBe(50)
  })

  it('computes three markers at 50%, 84%, and 97% confidence', () => {
    const results = makeResults({ total_expected_hours: 400, portfolio_range_spread: 40 })
    const data = computeDistributionData(results)!

    expect(data.markers).toHaveLength(3)

    // 50% marker at mean
    expect(data.markers[0].x).toBe(400)
    expect(data.markers[0].confidence).toBe('50%')
    expect(data.markers[0].label).toBe('400h')

    // 84% marker at mean + sigma
    expect(data.markers[1].x).toBe(440)
    expect(data.markers[1].confidence).toBe('84%')
    expect(data.markers[1].label).toBe('440h')

    // 97% marker at mean + 2*sigma
    expect(data.markers[2].x).toBe(480)
    expect(data.markers[2].confidence).toBe('97%')
    expect(data.markers[2].label).toBe('480h')
  })

  it('rounds marker labels to whole hours', () => {
    const results = makeResults({ total_expected_hours: 123.456, portfolio_range_spread: 7.89 })
    const data = computeDistributionData(results)!

    expect(data.markers[0].label).toBe('123h')
    expect(data.markers[1].label).toBe('131h')
    expect(data.markers[2].label).toBe('139h')
  })

  it('computes xMin and xMax at 3.5 sigma from mean', () => {
    const results = makeResults({ total_expected_hours: 500, portfolio_range_spread: 50 })
    const data = computeDistributionData(results)!

    expect(data.xMin).toBeCloseTo(500 - 3.5 * 50, 5) // 325
    expect(data.xMax).toBeCloseTo(500 + 3.5 * 50, 5) // 675
  })

  it('handles very large values', () => {
    const results = makeResults({ total_expected_hours: 100000, portfolio_range_spread: 5000 })
    const data = computeDistributionData(results)!

    expect(data.mean).toBe(100000)
    expect(data.sigma).toBe(5000)
    expect(data.xMin).toBe(100000 - 3.5 * 5000)
    expect(data.xMax).toBe(100000 + 3.5 * 5000)
  })

  it('handles very small but valid sigma', () => {
    const results = makeResults({ total_expected_hours: 10, portfolio_range_spread: 0.02 })
    const data = computeDistributionData(results)!

    expect(data.sigma).toBe(0.02)
    expect(data.markers[0].x).toBe(10)
  })
})

// ============================================================================
// computeUncertaintyBars
// ============================================================================

describe('computeUncertaintyBars', () => {
  it('returns empty array when totalVariance is zero', () => {
    const result = computeUncertaintyBars([ITEM_A], 0)
    expect(result).toEqual([])
  })

  it('returns empty array when totalVariance is negative', () => {
    const result = computeUncertaintyBars([ITEM_A], -1)
    expect(result).toEqual([])
  })

  it('maps item fields correctly', () => {
    const result = computeUncertaintyBars([ITEM_A], ITEM_A.variance)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(ITEM_A.id)
    expect(result[0].title).toBe('Frontend UI')
    expect(result[0].best).toBe(ITEM_A.best_case_hours)
    expect(result[0].worst).toBe(ITEM_A.worst_case_hours)
    expect(result[0].expected).toBe(ITEM_A.expected_hours)
    expect(result[0].variance).toBe(ITEM_A.variance)
  })

  it('calculates variancePct correctly', () => {
    const items = [ITEM_A, ITEM_B]
    const totalVariance = ITEM_A.variance + ITEM_B.variance
    const result = computeUncertaintyBars(items, totalVariance)

    expect(result[0].variancePct).toBeCloseTo((ITEM_A.variance / totalVariance) * 100, 2)
    expect(result[1].variancePct).toBeCloseTo((ITEM_B.variance / totalVariance) * 100, 2)
  })

  it('variancePct sums to 100 when all items are included', () => {
    const items = [ITEM_A, ITEM_B, ITEM_C]
    const result = computeUncertaintyBars(items, TOTAL_VARIANCE_ABC)

    const totalPct = result.reduce((sum, item) => sum + item.variancePct, 0)
    expect(totalPct).toBeCloseTo(100, 5)
  })

  it('filters out zero-range items (worst <= best)', () => {
    const items = [ITEM_A, ITEM_D] // ITEM_D has best=worst=30
    const result = computeUncertaintyBars(items, ITEM_A.variance)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(ITEM_A.id)
  })

  it('filters out items where worst equals best', () => {
    const zeroRange = makeItem({ id: 99, best_case_hours: 50, worst_case_hours: 50, variance: 0, range_spread_hours: 0 })
    const result = computeUncertaintyBars([zeroRange], 100)
    expect(result).toEqual([])
  })

  it('sorts by variance descending', () => {
    // Provide items in ascending order; result should be descending
    const items = [ITEM_C, ITEM_B, ITEM_A]
    const result = computeUncertaintyBars(items, TOTAL_VARIANCE_ABC)

    expect(result[0].id).toBe(ITEM_A.id) // highest variance
    expect(result[1].id).toBe(ITEM_B.id)
    expect(result[2].id).toBe(ITEM_C.id) // lowest variance
    expect(result[0].variance).toBeGreaterThan(result[1].variance)
    expect(result[1].variance).toBeGreaterThan(result[2].variance)
  })

  it('caps output at 15 items', () => {
    const items = Array.from({ length: 20 }, (_, i) =>
      makeItem({
        id: i + 1,
        best_case_hours: 10,
        worst_case_hours: 20 + i * 5,
        title: `Task ${i + 1}`,
      })
    )
    const totalVariance = items.reduce((sum, item) => sum + item.variance, 0)
    const result = computeUncertaintyBars(items, totalVariance)

    expect(result).toHaveLength(15)
  })

  it('uses "Item N" as fallback title when title is empty', () => {
    const item = makeItem({ id: 7, title: '', best_case_hours: 10, worst_case_hours: 50 })
    const result = computeUncertaintyBars([item], item.variance)

    expect(result[0].title).toBe('Item 7')
  })

  it('keeps original title when title is provided', () => {
    const result = computeUncertaintyBars([ITEM_A], ITEM_A.variance)
    expect(result[0].title).toBe('Frontend UI')
  })

  it('handles single item', () => {
    const result = computeUncertaintyBars([ITEM_B], ITEM_B.variance)

    expect(result).toHaveLength(1)
    expect(result[0].variancePct).toBeCloseTo(100, 5)
  })

  it('returns empty array for empty items list with positive variance', () => {
    const result = computeUncertaintyBars([], 100)
    expect(result).toEqual([])
  })
})

// ============================================================================
// computeRiskSegments
// ============================================================================

describe('computeRiskSegments', () => {
  it('returns empty array when totalVariance is zero', () => {
    const result = computeRiskSegments([ITEM_A], 0)
    expect(result).toEqual([])
  })

  it('returns empty array when totalVariance is negative', () => {
    const result = computeRiskSegments([ITEM_A], -5)
    expect(result).toEqual([])
  })

  it('returns correct segment for single item', () => {
    const result = computeRiskSegments([ITEM_A], ITEM_A.variance)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(ITEM_A.id)
    expect(result[0].title).toBe('Frontend UI')
    expect(result[0].pct).toBeCloseTo(1.0, 5)
    expect(result[0].variance).toBe(ITEM_A.variance)
  })

  it('starts angle at -PI/2 (top of circle)', () => {
    const result = computeRiskSegments([ITEM_A], ITEM_A.variance)

    expect(result[0].startAngle).toBeCloseTo(-Math.PI / 2, 10)
  })

  it('full circle ends at 3*PI/2 for single item (100%)', () => {
    const result = computeRiskSegments([ITEM_A], ITEM_A.variance)

    // startAngle = -PI/2, endAngle = -PI/2 + 1.0 * 2*PI = 3*PI/2
    expect(result[0].endAngle).toBeCloseTo(-Math.PI / 2 + 2 * Math.PI, 10)
  })

  it('computes angles that span the full circle for multiple items', () => {
    const items = [ITEM_A, ITEM_B, ITEM_C]
    const result = computeRiskSegments(items, TOTAL_VARIANCE_ABC)

    // First segment starts at -PI/2
    expect(result[0].startAngle).toBeCloseTo(-Math.PI / 2, 10)

    // Each segment's endAngle equals next segment's startAngle
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].endAngle).toBeCloseTo(result[i + 1].startAngle, 10)
    }

    // Last segment ends at -PI/2 + 2*PI (full circle)
    const lastSegment = result[result.length - 1]
    expect(lastSegment.endAngle).toBeCloseTo(-Math.PI / 2 + 2 * Math.PI, 5)
  })

  it('sorts segments by pct descending', () => {
    const items = [ITEM_C, ITEM_A, ITEM_B] // not sorted by variance
    const result = computeRiskSegments(items, TOTAL_VARIANCE_ABC)

    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].pct).toBeGreaterThanOrEqual(result[i + 1].pct)
    }
  })

  it('filters out items with zero variance', () => {
    const items = [ITEM_A, ITEM_D] // ITEM_D has variance 0
    const result = computeRiskSegments(items, ITEM_A.variance)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(ITEM_A.id)
  })

  it('groups segments below 3% into "Other"', () => {
    // Create one large item and several tiny items
    const bigItem = makeItem({ id: 1, title: 'Big', best_case_hours: 10, worst_case_hours: 100, variance: 1000 })
    const tinyItem1 = makeItem({ id: 2, title: 'Tiny1', best_case_hours: 10, worst_case_hours: 11, variance: 10 })
    const tinyItem2 = makeItem({ id: 3, title: 'Tiny2', best_case_hours: 10, worst_case_hours: 11, variance: 5 })

    const totalVariance = 1000 + 10 + 5

    const result = computeRiskSegments([bigItem, tinyItem1, tinyItem2], totalVariance)

    // tinyItem1: 10/1015 = 0.985% < 3%, tinyItem2: 5/1015 = 0.493% < 3%
    // Both should be grouped into "Other"
    const otherSegment = result.find((s) => s.id === -1)
    expect(otherSegment).toBeDefined()
    expect(otherSegment!.title).toBe('Other')
    expect(otherSegment!.variance).toBe(15)
    expect(otherSegment!.pct).toBeCloseTo(15 / totalVariance, 5)
  })

  it('does not create "Other" when no segments are below 3%', () => {
    // Two roughly equal items, each ~50%
    const item1 = makeItem({ id: 1, title: 'A', variance: 500, best_case_hours: 10, worst_case_hours: 50 })
    const item2 = makeItem({ id: 2, title: 'B', variance: 500, best_case_hours: 10, worst_case_hours: 50 })

    const result = computeRiskSegments([item1, item2], 1000)

    expect(result.find((s) => s.id === -1)).toBeUndefined()
    expect(result).toHaveLength(2)
  })

  it('uses "Item N" as fallback title for items without title', () => {
    const item = makeItem({ id: 42, title: '', best_case_hours: 10, worst_case_hours: 80, variance: 100 })
    const result = computeRiskSegments([item], 100)

    expect(result[0].title).toBe('Item 42')
  })

  it('returns empty array for empty items list', () => {
    const result = computeRiskSegments([], 100)
    expect(result).toEqual([])
  })

  it('handles items that are exactly at the 3% threshold', () => {
    // Item at exactly 3% should be kept, not grouped into "Other"
    const bigItem = makeItem({ id: 1, title: 'Big', variance: 97, best_case_hours: 10, worst_case_hours: 100 })
    const thresholdItem = makeItem({ id: 2, title: 'Threshold', variance: 3, best_case_hours: 10, worst_case_hours: 20 })

    const result = computeRiskSegments([bigItem, thresholdItem], 100)

    // 3/100 = 0.03 = 3%, which is exactly at MIN_SEGMENT_PCT (>= 0.03 is kept)
    expect(result.find((s) => s.id === -1)).toBeUndefined()
    expect(result).toHaveLength(2)
  })

  it('handles item just below 3% threshold', () => {
    const bigItem = makeItem({ id: 1, title: 'Big', variance: 97.1, best_case_hours: 10, worst_case_hours: 100 })
    const tinyItem = makeItem({ id: 2, title: 'Tiny', variance: 2.9, best_case_hours: 10, worst_case_hours: 20 })

    const result = computeRiskSegments([bigItem, tinyItem], 100)

    // 2.9/100 = 0.029 < 0.03, should be grouped into "Other"
    const otherSegment = result.find((s) => s.id === -1)
    expect(otherSegment).toBeDefined()
    expect(otherSegment!.variance).toBeCloseTo(2.9, 5)
  })
})

// ============================================================================
// computeDiversificationData
// ============================================================================

describe('computeDiversificationData', () => {
  it('computes naiveSumSigma as sum of individual range_spread_hours', () => {
    const items = [ITEM_A, ITEM_B, ITEM_C]
    const expectedNaive = ITEM_A.range_spread_hours + ITEM_B.range_spread_hours + ITEM_C.range_spread_hours
    const results = makeResults({ portfolio_range_spread: 50 })

    const data = computeDiversificationData(items, results)

    expect(data.naiveSumSigma).toBeCloseTo(expectedNaive, 5)
  })

  it('uses portfolio_range_spread as actualPortfolioSigma', () => {
    const results = makeResults({ portfolio_range_spread: 42.5 })
    const data = computeDiversificationData([ITEM_A], results)

    expect(data.actualPortfolioSigma).toBe(42.5)
  })

  it('computes benefitPct correctly', () => {
    const items = [ITEM_A, ITEM_B, ITEM_C]
    const naiveSum = items.reduce((sum, item) => sum + item.range_spread_hours, 0)
    const actualSigma = Math.sqrt(TOTAL_VARIANCE_ABC) // root-sum-square is less than naive sum
    const results = makeResults({ portfolio_range_spread: actualSigma })

    const data = computeDiversificationData(items, results)

    const expectedBenefit = ((naiveSum - actualSigma) / naiveSum) * 100
    expect(data.benefitPct).toBeCloseTo(expectedBenefit, 5)
  })

  it('benefitPct is positive when diversification helps (the usual case)', () => {
    const items = [ITEM_A, ITEM_B, ITEM_C]
    const naiveSum = items.reduce((sum, item) => sum + item.range_spread_hours, 0)
    const actualSigma = Math.sqrt(TOTAL_VARIANCE_ABC)
    const results = makeResults({ portfolio_range_spread: actualSigma })

    const data = computeDiversificationData(items, results)

    // Portfolio sigma (root-sum-square) should be less than naive sum
    expect(data.actualPortfolioSigma).toBeLessThan(data.naiveSumSigma)
    expect(data.benefitPct).toBeGreaterThan(0)
  })

  it('returns benefitPct of 0 when naiveSumSigma is 0', () => {
    // All zero-range items
    const items = [
      makeItem({ id: 1, best_case_hours: 50, worst_case_hours: 50, range_spread_hours: 0, variance: 0 }),
      makeItem({ id: 2, best_case_hours: 30, worst_case_hours: 30, range_spread_hours: 0, variance: 0 }),
    ]
    const results = makeResults({ portfolio_range_spread: 0 })

    const data = computeDiversificationData(items, results)

    expect(data.naiveSumSigma).toBe(0)
    expect(data.benefitPct).toBe(0)
  })

  it('handles single item (no diversification benefit)', () => {
    const results = makeResults({ portfolio_range_spread: ITEM_A.range_spread_hours })
    const data = computeDiversificationData([ITEM_A], results)

    // With one item, naiveSum == actualSigma, so benefit = 0
    expect(data.benefitPct).toBeCloseTo(0, 5)
  })

  it('handles empty items list', () => {
    const results = makeResults({ portfolio_range_spread: 0 })
    const data = computeDiversificationData([], results)

    expect(data.naiveSumSigma).toBe(0)
    expect(data.actualPortfolioSigma).toBe(0)
    expect(data.benefitPct).toBe(0)
  })

  it('benefitPct increases with more independent items', () => {
    // 2 identical items
    const twoItems = [
      makeItem({ id: 1, best_case_hours: 10, worst_case_hours: 50 }),
      makeItem({ id: 2, best_case_hours: 10, worst_case_hours: 50 }),
    ]
    const twoActual = Math.sqrt(twoItems[0].variance + twoItems[1].variance)
    const dataTwoItems = computeDiversificationData(
      twoItems,
      makeResults({ portfolio_range_spread: twoActual })
    )

    // 5 identical items
    const fiveItems = Array.from({ length: 5 }, (_, i) =>
      makeItem({ id: i + 1, best_case_hours: 10, worst_case_hours: 50 })
    )
    const fiveActual = Math.sqrt(fiveItems.reduce((s, it) => s + it.variance, 0))
    const dataFiveItems = computeDiversificationData(
      fiveItems,
      makeResults({ portfolio_range_spread: fiveActual })
    )

    expect(dataFiveItems.benefitPct).toBeGreaterThan(dataTwoItems.benefitPct)
  })
})

// ============================================================================
// computeDurationCurveData
// ============================================================================

describe('computeDurationCurveData', () => {
  const constants = DEFAULT_CONSTANTS

  it('returns null when effort is zero', () => {
    const results = makeResults({ total_effort_staff_weeks: 0 })
    expect(computeDurationCurveData(results, constants)).toBeNull()
  })

  it('returns null when effort is negative', () => {
    const results = makeResults({ total_effort_staff_weeks: -5 })
    expect(computeDurationCurveData(results, constants)).toBeNull()
  })

  it('generates exactly 61 curve points (0 to 60 inclusive)', () => {
    const results = makeResults({ total_effort_staff_weeks: 20, duration_weeks: 9 })
    const data = computeDurationCurveData(results, constants)!

    expect(data.curvePoints).toHaveLength(61)
  })

  it('first curve point starts at effort=0 with duration=0', () => {
    const results = makeResults({ total_effort_staff_weeks: 20, duration_weeks: 9 })
    const data = computeDurationCurveData(results, constants)!

    expect(data.curvePoints[0].effort).toBe(0)
    expect(data.curvePoints[0].duration).toBe(0)
  })

  it('last curve point effort equals xMax', () => {
    const results = makeResults({ total_effort_staff_weeks: 20, duration_weeks: 9 })
    const data = computeDurationCurveData(results, constants)!

    expect(data.curvePoints[data.curvePoints.length - 1].effort).toBeCloseTo(data.xMax, 5)
  })

  it('computes currentPoint with correct effort and cube-root duration', () => {
    const effort = 15.28
    const results = makeResults({ total_effort_staff_weeks: effort, duration_weeks: 8 })
    const data = computeDurationCurveData(results, constants)!

    expect(data.currentPoint.effort).toBe(effort)
    expect(data.currentPoint.duration).toBeCloseTo(constants.duration_scaling_power * Math.pow(effort, 1 / 3), 5)
    expect(data.currentPoint.durationCeiled).toBe(8)
  })

  it('currentPoint.durationCeiled comes from results.duration_weeks', () => {
    const results = makeResults({ total_effort_staff_weeks: 25, duration_weeks: 10 })
    const data = computeDurationCurveData(results, constants)!

    expect(data.currentPoint.durationCeiled).toBe(10)
  })

  it('xMax is at least 2x current effort', () => {
    const effort = 30
    const results = makeResults({ total_effort_staff_weeks: effort, duration_weeks: 10 })
    const data = computeDurationCurveData(results, constants)!

    expect(data.xMax).toBe(effort * 2)
  })

  it('xMax is at least 10 even for small efforts', () => {
    const effort = 2
    const results = makeResults({ total_effort_staff_weeks: effort, duration_weeks: 5 })
    const data = computeDurationCurveData(results, constants)!

    // 2 * 2 = 4 < 10, so xMax should be 10
    expect(data.xMax).toBe(10)
  })

  it('xMax uses 2*effort when effort is large enough', () => {
    const effort = 50
    const results = makeResults({ total_effort_staff_weeks: effort, duration_weeks: 12 })
    const data = computeDurationCurveData(results, constants)!

    // 2 * 50 = 100 > 10, so xMax should be 100
    expect(data.xMax).toBe(100)
  })

  it('yMax is k * xMax^(1/3)', () => {
    const effort = 20
    const results = makeResults({ total_effort_staff_weeks: effort, duration_weeks: 9 })
    const data = computeDurationCurveData(results, constants)!

    const expectedYMax = constants.duration_scaling_power * Math.pow(data.xMax, 1 / 3)
    expect(data.yMax).toBeCloseTo(expectedYMax, 5)
  })

  it('curve points follow cube-root scaling', () => {
    const effort = 20
    const results = makeResults({ total_effort_staff_weeks: effort, duration_weeks: 9 })
    const data = computeDurationCurveData(results, constants)!

    // Check several points along the curve
    for (const point of data.curvePoints) {
      const expected = constants.duration_scaling_power * Math.pow(Math.max(point.effort, 0), 1 / 3)
      expect(point.duration).toBeCloseTo(expected, 10)
    }
  })

  it('curve is monotonically non-decreasing', () => {
    const results = makeResults({ total_effort_staff_weeks: 25, duration_weeks: 10 })
    const data = computeDurationCurveData(results, constants)!

    for (let i = 1; i < data.curvePoints.length; i++) {
      expect(data.curvePoints[i].duration).toBeGreaterThanOrEqual(data.curvePoints[i - 1].duration)
    }
  })

  it('works with different duration_scaling_power', () => {
    const customConstants: EstimationConstants = { ...DEFAULT_CONSTANTS, duration_scaling_power: 5.0 }
    const effort = 20
    const results = makeResults({ total_effort_staff_weeks: effort, duration_weeks: 14 })
    const data = computeDurationCurveData(results, customConstants)!

    expect(data.currentPoint.duration).toBeCloseTo(5.0 * Math.pow(effort, 1 / 3), 5)
    expect(data.yMax).toBeCloseTo(5.0 * Math.pow(data.xMax, 1 / 3), 5)
  })

  it('handles very small effort (just above zero)', () => {
    const effort = 0.001
    const results = makeResults({ total_effort_staff_weeks: effort, duration_weeks: 1 })
    const data = computeDurationCurveData(results, constants)!

    expect(data).not.toBeNull()
    expect(data.currentPoint.effort).toBe(effort)
    expect(data.xMax).toBe(10) // Math.max(0.002, 10) = 10
  })

  it('curve points are evenly spaced along effort axis', () => {
    const results = makeResults({ total_effort_staff_weeks: 20, duration_weeks: 9 })
    const data = computeDurationCurveData(results, constants)!

    const step = data.xMax / 60
    for (let i = 0; i <= 60; i++) {
      expect(data.curvePoints[i].effort).toBeCloseTo(i * step, 10)
    }
  })
})
