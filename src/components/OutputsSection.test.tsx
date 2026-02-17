import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OutputsSection } from './OutputsSection'
import type { PortfolioResults } from '../domain/estimation'
import type { GapDecomposition } from '../domain/coordination'
import type { StaffingGridComputed } from '../types'

// Mock AnimatedNumber to render its value immediately (no rAF needed)
vi.mock('./AnimatedNumber', () => ({
  AnimatedNumber: ({ value, decimals = 1, suffix = '' }: { value: number; decimals?: number; suffix?: string }) => (
    <>{value.toFixed(decimals)}{suffix}</>
  ),
}))

// ---------------------------------------------------------------------------
// Test Data Factories
// ---------------------------------------------------------------------------

function makeResults(overrides: Partial<PortfolioResults> = {}): PortfolioResults {
  return {
    total_expected_hours: 160,
    total_variance: 400,
    portfolio_range_spread: 20,
    total_effort_hours: 180,
    total_effort_staff_weeks: 5,
    duration_weeks: 7,
    ...overrides,
  }
}

function makeStaffingComputed(overrides: Partial<StaffingGridComputed> = {}): StaffingGridComputed {
  return {
    row_totals: [{ total_hours: 200, total_cost: 30000 }],
    week_totals: [40, 40, 40, 40, 40],
    grand_total_hours: 200,
    grand_total_cost: 30000,
    ...overrides,
  }
}

function makeGapDecomposition(overrides: Partial<GapDecomposition> = {}): GapDecomposition {
  return {
    base_effort_hours: 180,
    coordination_overhead_hours: 20,
    adjusted_effort_hours: 200,
    staffed_hours: 220,
    effective_productive_hours: 200,
    remaining_buffer_hours: 20,
    buffer_status: 'buffered',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('OutputsSection', () => {
  // ---- Empty State ----

  describe('when results is null', () => {
    it('shows the empty-state message', () => {
      render(
        <OutputsSection
          results={null}
          staffingComputed={null}
          staffingWeeks={0}
          staffingPeople={0}
          gapDecomposition={null}
        />
      )

      expect(screen.getByText('add items to see results')).toBeInTheDocument()
    })

    it('does not show Estimate or Plan panels', () => {
      render(
        <OutputsSection
          results={null}
          staffingComputed={null}
          staffingWeeks={0}
          staffingPeople={0}
          gapDecomposition={null}
        />
      )

      expect(screen.queryByText('Estimate')).not.toBeInTheDocument()
      expect(screen.queryByText('Plan')).not.toBeInTheDocument()
    })
  })

  // ---- Results provided, no staffing ----

  describe('when results are provided but no staffing', () => {
    it('shows Estimate and Plan panel labels', () => {
      render(
        <OutputsSection
          results={makeResults()}
          staffingComputed={null}
          staffingWeeks={0}
          staffingPeople={0}
          gapDecomposition={null}
        />
      )

      expect(screen.getByText('Estimate')).toBeInTheDocument()
      expect(screen.getByText('Plan')).toBeInTheDocument()
    })

    it('shows Duration in weeks', () => {
      render(
        <OutputsSection
          results={makeResults({ duration_weeks: 7 })}
          staffingComputed={null}
          staffingWeeks={0}
          staffingPeople={0}
          gapDecomposition={null}
        />
      )

      // The Duration metric labels appear for both Estimate and Plan
      const durationLabels = screen.getAllByText('Duration')
      expect(durationLabels).toHaveLength(2)

      // Estimate Duration: "7 wk"
      expect(screen.getByText('7')).toBeInTheDocument()
    })

    it('shows Effort metric using total_effort_hours when no gapDecomposition', () => {
      render(
        <OutputsSection
          results={makeResults({ total_effort_hours: 180 })}
          staffingComputed={null}
          staffingWeeks={0}
          staffingPeople={0}
          gapDecomposition={null}
        />
      )

      expect(screen.getByText('Effort')).toBeInTheDocument()
      // AnimatedNumber renders Math.ceil(180) = 180 with 0 decimals = "180"
      expect(screen.getByText('180')).toBeInTheDocument()
    })

    it('shows dashes for Plan metrics when staffing is absent', () => {
      const { container } = render(
        <OutputsSection
          results={makeResults()}
          staffingComputed={null}
          staffingWeeks={0}
          staffingPeople={0}
          gapDecomposition={null}
        />
      )

      // Plan side should have 4 dashes (Duration, Team, Hours, Cost)
      const dashes = container.querySelectorAll('span')
      const dashTexts = Array.from(dashes).filter((el) => el.textContent === '—')
      expect(dashTexts.length).toBe(4)
    })
  })

  // ---- Results provided with staffing ----

  describe('when results and staffing are provided', () => {
    it('shows staffing Duration in weeks', () => {
      render(
        <OutputsSection
          results={makeResults()}
          staffingComputed={makeStaffingComputed()}
          staffingWeeks={5}
          staffingPeople={2}
          gapDecomposition={null}
        />
      )

      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('shows staffing Hours from grand_total_hours', () => {
      render(
        <OutputsSection
          results={makeResults()}
          staffingComputed={makeStaffingComputed({ grand_total_hours: 200 })}
          staffingWeeks={5}
          staffingPeople={2}
          gapDecomposition={null}
        />
      )

      expect(screen.getByText('Hours')).toBeInTheDocument()
      // AnimatedNumber renders Math.ceil(200) = 200, decimals=0 -> "200"
      expect(screen.getByText('200')).toBeInTheDocument()
    })

    it('shows Cost formatted as currency', () => {
      render(
        <OutputsSection
          results={makeResults()}
          staffingComputed={makeStaffingComputed({ grand_total_hours: 200, grand_total_cost: 30000 })}
          staffingWeeks={5}
          staffingPeople={2}
          gapDecomposition={null}
        />
      )

      expect(screen.getByText('Cost')).toBeInTheDocument()
      expect(screen.getByText('$30,000')).toBeInTheDocument()
    })

    it('shows dashes when staffingComputed has grand_total_hours = 0', () => {
      const { container } = render(
        <OutputsSection
          results={makeResults()}
          staffingComputed={makeStaffingComputed({ grand_total_hours: 0 })}
          staffingWeeks={5}
          staffingPeople={2}
          gapDecomposition={null}
        />
      )

      // Plan metrics should all be dashes since hasStaffing = false
      const dashes = Array.from(container.querySelectorAll('span')).filter(
        (el) => el.textContent === '—'
      )
      expect(dashes.length).toBe(4)
    })
  })

  // ---- Team size display (singular vs plural) ----

  describe('team size label', () => {
    it('shows "person" for singular estimate team', () => {
      // duration_weeks = 10, total_effort_staff_weeks = 5
      // estimateTeam = Math.ceil(5 / 10) = 1
      render(
        <OutputsSection
          results={makeResults({ duration_weeks: 10, total_effort_staff_weeks: 5 })}
          staffingComputed={null}
          staffingWeeks={0}
          staffingPeople={0}
          gapDecomposition={null}
        />
      )

      expect(screen.getByText('person')).toBeInTheDocument()
    })

    it('shows "people" for plural estimate team', () => {
      // duration_weeks = 5, total_effort_staff_weeks = 10
      // estimateTeam = Math.ceil(10 / 5) = 2
      render(
        <OutputsSection
          results={makeResults({ duration_weeks: 5, total_effort_staff_weeks: 10 })}
          staffingComputed={null}
          staffingWeeks={0}
          staffingPeople={0}
          gapDecomposition={null}
        />
      )

      expect(screen.getByText('people')).toBeInTheDocument()
    })

    it('does not show Team metric when duration_weeks is 0', () => {
      render(
        <OutputsSection
          results={makeResults({ duration_weeks: 0, total_effort_staff_weeks: 0 })}
          staffingComputed={null}
          staffingWeeks={0}
          staffingPeople={0}
          gapDecomposition={null}
        />
      )

      // Only the Plan "Team" label should be present, not the Estimate one
      const teamLabels = screen.getAllByText('Team')
      expect(teamLabels).toHaveLength(1) // only Plan side
    })

    it('shows "person" for singular staffing people', () => {
      render(
        <OutputsSection
          results={makeResults()}
          staffingComputed={makeStaffingComputed()}
          staffingWeeks={5}
          staffingPeople={1}
          gapDecomposition={null}
        />
      )

      // The Plan side should show "person" for staffingPeople=1
      const personTexts = screen.getAllByText('person')
      expect(personTexts.length).toBeGreaterThanOrEqual(1)
    })

    it('shows "people" for plural staffing people', () => {
      render(
        <OutputsSection
          results={makeResults()}
          staffingComputed={makeStaffingComputed()}
          staffingWeeks={5}
          staffingPeople={3}
          gapDecomposition={null}
        />
      )

      const peopleTexts = screen.getAllByText('people')
      expect(peopleTexts.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ---- Cost formatting ----

  describe('cost formatting', () => {
    it('formats small costs correctly', () => {
      render(
        <OutputsSection
          results={makeResults()}
          staffingComputed={makeStaffingComputed({ grand_total_hours: 10, grand_total_cost: 500 })}
          staffingWeeks={1}
          staffingPeople={1}
          gapDecomposition={null}
        />
      )

      expect(screen.getByText('$500')).toBeInTheDocument()
    })

    it('formats large costs with comma separators', () => {
      render(
        <OutputsSection
          results={makeResults()}
          staffingComputed={makeStaffingComputed({ grand_total_hours: 1000, grand_total_cost: 150000 })}
          staffingWeeks={10}
          staffingPeople={3}
          gapDecomposition={null}
        />
      )

      expect(screen.getByText('$150,000')).toBeInTheDocument()
    })

    it('formats million-dollar costs', () => {
      render(
        <OutputsSection
          results={makeResults()}
          staffingComputed={makeStaffingComputed({ grand_total_hours: 5000, grand_total_cost: 1250000 })}
          staffingWeeks={20}
          staffingPeople={5}
          gapDecomposition={null}
        />
      )

      expect(screen.getByText('$1,250,000')).toBeInTheDocument()
    })
  })

  // ---- Gap decomposition affecting effort ----

  describe('gap decomposition', () => {
    it('uses adjusted_effort_hours when gapDecomposition is provided', () => {
      render(
        <OutputsSection
          results={makeResults({ total_effort_hours: 180 })}
          staffingComputed={makeStaffingComputed({ grand_total_hours: 250 })}
          staffingWeeks={5}
          staffingPeople={2}
          gapDecomposition={makeGapDecomposition({ adjusted_effort_hours: 210 })}
        />
      )

      // Estimate Effort uses Math.ceil(210) = 210 (from gapDecomposition), not 180 (from results)
      expect(screen.getByText('210')).toBeInTheDocument()
    })

    it('uses total_effort_hours when gapDecomposition is null', () => {
      render(
        <OutputsSection
          results={makeResults({ total_effort_hours: 180 })}
          staffingComputed={null}
          staffingWeeks={0}
          staffingPeople={0}
          gapDecomposition={null}
        />
      )

      // AnimatedNumber renders Math.ceil(180) = 180, decimals=0
      expect(screen.getByText('180')).toBeInTheDocument()
    })

    it('rounds up non-integer adjusted_effort_hours', () => {
      render(
        <OutputsSection
          results={makeResults({ total_effort_hours: 180.3 })}
          staffingComputed={null}
          staffingWeeks={0}
          staffingPeople={0}
          gapDecomposition={makeGapDecomposition({ adjusted_effort_hours: 199.1 })}
        />
      )

      // AnimatedNumber renders Math.ceil(199.1) = 200, decimals=0
      expect(screen.getByText('200')).toBeInTheDocument()
    })
  })

  // ---- Detail line (expected ± spread) ----

  describe('effort detail line', () => {
    it('shows expected hours, spread, and staff-weeks', () => {
      const { container } = render(
        <OutputsSection
          results={makeResults({
            total_expected_hours: 160,
            portfolio_range_spread: 20,
            total_effort_staff_weeks: 5,
          })}
          staffingComputed={null}
          staffingWeeks={0}
          staffingPeople={0}
          gapDecomposition={null}
        />
      )

      // The detail line contains "160.0 ±20.0 (5.0 staff-wk)" as mixed text nodes
      const detailSpan = container.querySelector('[data-tip="Expected ± uncertainty range, and total person-weeks of effort"]')
      expect(detailSpan).not.toBeNull()
      const text = detailSpan!.textContent!
      expect(text).toContain('160.0')
      expect(text).toContain('20.0')
      expect(text).toContain('5.0')
      expect(text).toContain('staff-wk')
    })
  })

  // ---- aria-live for accessibility ----

  describe('accessibility', () => {
    it('has aria-live="polite" on the container', () => {
      const { container } = render(
        <OutputsSection
          results={null}
          staffingComputed={null}
          staffingWeeks={0}
          staffingPeople={0}
          gapDecomposition={null}
        />
      )

      const bar = container.firstElementChild as HTMLElement
      expect(bar.getAttribute('aria-live')).toBe('polite')
    })
  })
})
