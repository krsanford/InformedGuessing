import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InsightsPanel } from './InsightsPanel'
import { EffortBreakdown } from './EffortBreakdown'
import { UncertaintyBars } from './UncertaintyBars'
import { DiversificationBar } from './DiversificationBar'
import { DurationCurve } from '../DurationCurve'
import type {
  WorkItemCalculated,
  PortfolioResults,
  EstimationConstants,
} from '../../domain/estimation'
import { DEFAULT_CONSTANTS } from '../../domain/estimation'
import type { UncertaintyBarItem, DiversificationData, DurationCurveData } from '../../domain/visualization'

// ---------------------------------------------------------------------------
// Helpers — realistic test data
// ---------------------------------------------------------------------------

function makeItem(overrides: Partial<WorkItemCalculated> & { id: number }): WorkItemCalculated {
  const best = overrides.best_case_hours ?? 40
  const worst = overrides.worst_case_hours ?? 80
  const pos = DEFAULT_CONSTANTS.expected_case_position
  const div = DEFAULT_CONSTANTS.range_spread_divisor
  const expected = best + pos * (worst - best)
  const spread = (worst - best) / div
  return {
    title: `Item ${overrides.id}`,
    notes: '',
    best_case_hours: best,
    worst_case_hours: worst,
    enabled: true,
    multiplier: 1,
    expected_hours: expected,
    range_spread_hours: spread,
    variance: spread * spread,
    ...overrides,
  }
}

/** Two items with different best/worst so hasRanges is true. */
const ITEMS_WITH_RANGES: WorkItemCalculated[] = [
  makeItem({ id: 1, title: 'Backend API', best_case_hours: 40, worst_case_hours: 100 }),
  makeItem({ id: 2, title: 'Frontend UI', best_case_hours: 20, worst_case_hours: 60 }),
]

/** Items where best === worst (no ranges). */
const ITEMS_NO_RANGES: WorkItemCalculated[] = [
  makeItem({ id: 1, best_case_hours: 50, worst_case_hours: 50, expected_hours: 50, range_spread_hours: 0, variance: 0 }),
]

function buildResults(items: WorkItemCalculated[]): PortfolioResults {
  const total_expected_hours = items.reduce((s, i) => s + i.expected_hours, 0)
  const total_variance = items.reduce((s, i) => s + i.variance, 0)
  const portfolio_range_spread = Math.sqrt(total_variance)
  const total_effort_hours = total_expected_hours + portfolio_range_spread
  const total_effort_staff_weeks = total_effort_hours / DEFAULT_CONSTANTS.billable_hours_per_week
  const k = DEFAULT_CONSTANTS.duration_scaling_power
  const scaled = k * Math.pow(total_effort_staff_weeks, 1 / 3)
  const duration_weeks = Math.min(Math.ceil(scaled), Math.ceil(total_effort_staff_weeks))
  return {
    total_expected_hours,
    total_variance,
    portfolio_range_spread,
    total_effort_hours,
    total_effort_staff_weeks,
    duration_weeks,
  }
}

const RESULTS_WITH_RANGES = buildResults(ITEMS_WITH_RANGES)

// ---------------------------------------------------------------------------
// InsightsPanel
// ---------------------------------------------------------------------------

describe('InsightsPanel', () => {
  const constants: EstimationConstants = { ...DEFAULT_CONSTANTS }

  it('renders nothing visible when results is null', () => {
    const { container } = render(
      <InsightsPanel items={[]} results={null} constants={constants} />
    )
    // The component returns a <details> even when disabled, but the viz grid is not rendered
    expect(container.querySelector('svg')).toBeNull()
  })

  it('shows "add estimates to unlock" hint when items have no ranges', () => {
    const results = buildResults(ITEMS_NO_RANGES)
    render(
      <InsightsPanel items={ITEMS_NO_RANGES} results={results} constants={constants} />
    )
    expect(screen.getByText('add estimates to unlock')).toBeInTheDocument()
  })

  it('renders all 4 viz cards when data has ranges', () => {
    render(
      <InsightsPanel items={ITEMS_WITH_RANGES} results={RESULTS_WITH_RANGES} constants={constants} />
    )

    expect(screen.getByText('Effort Breakdown')).toBeInTheDocument()
    expect(screen.getByText('Uncertainty Ranges')).toBeInTheDocument()
    expect(screen.getByText('Diversification Effect')).toBeInTheDocument()
    expect(screen.getByText('Duration Scaling')).toBeInTheDocument()
  })

  it('each viz card has a details/summary for explanation', () => {
    render(
      <InsightsPanel items={ITEMS_WITH_RANGES} results={RESULTS_WITH_RANGES} constants={constants} />
    )

    expect(screen.getByText('How to use this')).toBeInTheDocument()
    expect(screen.getByText('Take action')).toBeInTheDocument()
    expect(screen.getByText('Why this matters')).toBeInTheDocument()
    expect(screen.getByText('What this means')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// EffortBreakdown
// ---------------------------------------------------------------------------

describe('EffortBreakdown', () => {
  it('renders an SVG with role="img" and aria-label', () => {
    render(<EffortBreakdown results={RESULTS_WITH_RANGES} />)

    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
    expect(svg.tagName.toLowerCase()).toBe('svg')
    expect(svg.getAttribute('aria-label')).toMatch(/effort breakdown/i)
  })

  it('returns null when conservative <= 0', () => {
    const zeroResults: PortfolioResults = {
      total_expected_hours: 0,
      total_variance: 0,
      portfolio_range_spread: 0,
      total_effort_hours: 0,
      total_effort_staff_weeks: 0,
      duration_weeks: 0,
    }
    const { container } = render(<EffortBreakdown results={zeroResults} />)
    expect(container.querySelector('svg')).toBeNull()
  })

  it('shows expected, planning, and conservative hour values in aria-label', () => {
    render(<EffortBreakdown results={RESULTS_WITH_RANGES} />)
    const svg = screen.getByRole('img')
    const label = svg.getAttribute('aria-label')!
    expect(label).toMatch(/expected/)
    expect(label).toMatch(/planning/)
    expect(label).toMatch(/conservative/)
  })
})

// ---------------------------------------------------------------------------
// UncertaintyBars
// ---------------------------------------------------------------------------

describe('UncertaintyBars', () => {
  const sampleItems: UncertaintyBarItem[] = [
    { id: 1, title: 'Backend API', best: 40, worst: 100, expected: 76, variance: 533, variancePct: 70 },
    { id: 2, title: 'Frontend UI', best: 20, worst: 60, expected: 44, variance: 237, variancePct: 30 },
  ]

  it('shows empty message when items array is empty', () => {
    render(<UncertaintyBars items={[]} />)
    expect(screen.getByText('No uncertainty ranges to display')).toBeInTheDocument()
  })

  it('renders an SVG with items', () => {
    render(<UncertaintyBars items={sampleItems} />)
    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
    expect(svg.tagName.toLowerCase()).toBe('svg')
    expect(svg.getAttribute('aria-label')).toMatch(/uncertainty ranges/i)
  })

  it('truncates long titles to 16 chars', () => {
    const longTitleItems: UncertaintyBarItem[] = [
      { id: 1, title: 'Very Long Work Item Title That Exceeds Limit', best: 10, worst: 50, expected: 34, variance: 100, variancePct: 100 },
    ]
    render(<UncertaintyBars items={longTitleItems} />)
    // The component truncates to 15 chars + ellipsis
    expect(screen.getByText(/Very Long Work\s…/)).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// DiversificationBar
// ---------------------------------------------------------------------------

describe('DiversificationBar', () => {
  const sampleData: DiversificationData = {
    naiveSumSigma: 40,
    actualPortfolioSigma: 28,
    benefitPct: 30,
  }

  it('shows empty message when naiveSumSigma <= 0', () => {
    const zeroData: DiversificationData = {
      naiveSumSigma: 0,
      actualPortfolioSigma: 0,
      benefitPct: 0,
    }
    render(<DiversificationBar data={zeroData} />)
    expect(screen.getByText('Add items with ranges to see the diversification effect')).toBeInTheDocument()
  })

  it('renders SVG with diversification benefit in aria-label', () => {
    render(<DiversificationBar data={sampleData} />)
    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
    expect(svg.tagName.toLowerCase()).toBe('svg')
    expect(svg.getAttribute('aria-label')).toMatch(/diversification benefit/i)
  })

  it('shows the "diversification benefit" label text', () => {
    render(<DiversificationBar data={sampleData} />)
    expect(screen.getByText(/diversification benefit/i)).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// DurationCurve
// ---------------------------------------------------------------------------

describe('DurationCurve', () => {
  const sampleData: DurationCurveData = {
    curvePoints: Array.from({ length: 10 }, (_, i) => ({
      effort: i * 2,
      duration: 3.2 * Math.pow(i * 2, 1 / 3),
    })),
    currentPoint: { effort: 5, duration: 5.47, durationCeiled: 6 },
    xMax: 20,
    yMax: 8.68,
  }

  it('shows "No data" when data is null', () => {
    render(<DurationCurve data={null} />)
    expect(screen.getByText('No data')).toBeInTheDocument()
  })

  it('renders SVG with curve when data is provided', () => {
    render(<DurationCurve data={sampleData} />)
    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
    expect(svg.tagName.toLowerCase()).toBe('svg')
    expect(svg.getAttribute('aria-label')).toMatch(/duration curve/i)
  })
})
