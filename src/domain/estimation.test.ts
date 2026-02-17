import { describe, it, expect } from 'vitest'
import {
  DEFAULT_CONSTANTS,
  calculateExpectedHours,
  calculateRangeSpread,
  calculateVariance,
  calculateWorkItem,
  calculatePortfolio,
  calculateGroupSubtotals,
  validateWorkItem,
  validateConstants,
  type WorkItem,
  type WorkItemGroup,
  type EstimationConstants,
} from './estimation'

// Test data from docs/estimation-math-spec.md "Worksheet Example"
const TEST_WORK_ITEMS: WorkItem[] = [
  { id: 1, title: 'Page 1', notes: '', best_case_hours: 80, worst_case_hours: 120, multiplier: 1, enabled: true },
  { id: 2, title: 'Page 2', notes: '', best_case_hours: 70, worst_case_hours: 200, multiplier: 1, enabled: true },
  { id: 3, title: 'Page 3', notes: '', best_case_hours: 100, worst_case_hours: 320, multiplier: 1, enabled: true },
  { id: 4, title: 'Page 4', notes: '', best_case_hours: 40, worst_case_hours: 80, multiplier: 1, enabled: true },
  { id: 5, title: 'Page 5', notes: '', best_case_hours: 60, worst_case_hours: 90, multiplier: 1, enabled: true },
  { id: 6, title: 'Nav & Footer', notes: '', best_case_hours: 80, worst_case_hours: 160, multiplier: 1, enabled: true },
  { id: 7, title: 'Environment & Language Config', notes: '', best_case_hours: 4, worst_case_hours: 16, multiplier: 1, enabled: true },
  { id: 8, title: 'Translations', notes: '', best_case_hours: 80, worst_case_hours: 100, multiplier: 1, enabled: true },
  { id: 9, title: 'Q&A', notes: '', best_case_hours: 40, worst_case_hours: 100, multiplier: 1, enabled: true },
  { id: 10, title: 'Readme, docs', notes: '', best_case_hours: 16, worst_case_hours: 30, multiplier: 1, enabled: true },
]

describe('estimation - validation', () => {
  describe('validateWorkItem', () => {
    it('accepts valid work item', () => {
      expect(validateWorkItem({ id: 1, title: '', notes: '', best_case_hours: 10, worst_case_hours: 20, multiplier: 1, enabled: true })).toBeNull()
    })

    it('rejects negative best case', () => {
      expect(validateWorkItem({ id: 1, title: '', notes: '', best_case_hours: -5, worst_case_hours: 20, multiplier: 1, enabled: true })).toBe(
        'Best case hours cannot be negative'
      )
    })

    it('rejects worst case less than best case', () => {
      expect(validateWorkItem({ id: 1, title: '', notes: '', best_case_hours: 30, worst_case_hours: 20, multiplier: 1, enabled: true })).toBe(
        'Worst case hours cannot be less than best case hours'
      )
    })

    it('accepts equal best and worst case (zero range)', () => {
      expect(validateWorkItem({ id: 1, title: '', notes: '', best_case_hours: 10, worst_case_hours: 10, multiplier: 1, enabled: true })).toBeNull()
    })
  })

  describe('validateConstants', () => {
    it('accepts valid constants', () => {
      expect(validateConstants(DEFAULT_CONSTANTS)).toBeNull()
    })

    it('rejects expected_case_position < 0', () => {
      const constants = { ...DEFAULT_CONSTANTS, expected_case_position: -0.1 }
      expect(validateConstants(constants)).toBe('Expected case position must be between 0 and 1')
    })

    it('rejects expected_case_position > 1', () => {
      const constants = { ...DEFAULT_CONSTANTS, expected_case_position: 1.1 }
      expect(validateConstants(constants)).toBe('Expected case position must be between 0 and 1')
    })

    it('rejects range_spread_divisor <= 0', () => {
      const constants = { ...DEFAULT_CONSTANTS, range_spread_divisor: 0 }
      expect(validateConstants(constants)).toBe('Range spread divisor must be greater than 0')
    })

    it('rejects billable_hours_per_week <= 0', () => {
      const constants = { ...DEFAULT_CONSTANTS, billable_hours_per_week: -5 }
      expect(validateConstants(constants)).toBe('Billable hours per week must be greater than 0')
    })

    it('rejects duration_scaling_power <= 0', () => {
      const constants = { ...DEFAULT_CONSTANTS, duration_scaling_power: 0 }
      expect(validateConstants(constants)).toBe('Duration scaling power must be greater than 0')
    })
  })
})

describe('estimation - individual work item calculations', () => {
  describe('calculateExpectedHours', () => {
    it('calculates expected hours for Page 1 (80-120)', () => {
      const result = calculateExpectedHours(80, 120, 0.4)
      expect(result).toBeCloseTo(96, 2)
    })

    it('calculates expected hours for Page 2 (70-200)', () => {
      const result = calculateExpectedHours(70, 200, 0.4)
      expect(result).toBeCloseTo(122, 2)
    })

    it('handles best = worst (zero range)', () => {
      const result = calculateExpectedHours(100, 100, 0.4)
      expect(result).toBe(100)
    })

    it('uses expected_case_position correctly', () => {
      // With position 0.0, expected = best
      expect(calculateExpectedHours(10, 20, 0.0)).toBe(10)
      // With position 1.0, expected = worst
      expect(calculateExpectedHours(10, 20, 1.0)).toBe(20)
      // With position 0.5, expected = midpoint
      expect(calculateExpectedHours(10, 20, 0.5)).toBe(15)
    })
  })

  describe('calculateRangeSpread', () => {
    it('calculates range spread for Page 1 (80-120)', () => {
      const result = calculateRangeSpread(80, 120, 2.6)
      expect(result).toBeCloseTo(15.38, 2)
    })

    it('calculates range spread for Page 2 (70-200)', () => {
      const result = calculateRangeSpread(70, 200, 2.6)
      expect(result).toBeCloseTo(50, 2)
    })

    it('returns zero when best = worst', () => {
      const result = calculateRangeSpread(100, 100, 2.6)
      expect(result).toBe(0)
    })
  })

  describe('calculateVariance', () => {
    it('calculates variance correctly', () => {
      expect(calculateVariance(15.38)).toBeCloseTo(236.54, 2)
      expect(calculateVariance(50)).toBeCloseTo(2500, 2)
      expect(calculateVariance(0)).toBe(0)
    })
  })

  describe('calculateWorkItem', () => {
    it('calculates all metrics for Page 1', () => {
      const item = { id: 1, title: '', notes: '', best_case_hours: 80, worst_case_hours: 120, multiplier: 1, enabled: true }
      const result = calculateWorkItem(item, DEFAULT_CONSTANTS)

      expect(result.expected_hours).toBeCloseTo(104, 2)
      expect(result.range_spread_hours).toBeCloseTo(15.38, 2)
      expect(result.variance).toBeCloseTo(236.69, 1) // Variance precision adjusted
    })

    it('calculates all metrics for Page 3', () => {
      const item = { id: 3, title: '', notes: '', best_case_hours: 100, worst_case_hours: 320, multiplier: 1, enabled: true }
      const result = calculateWorkItem(item, DEFAULT_CONSTANTS)

      expect(result.expected_hours).toBeCloseTo(232, 2)
      expect(result.range_spread_hours).toBeCloseTo(84.62, 2)
      expect(result.variance).toBeCloseTo(7159.76, 1) // Variance precision adjusted
    })
  })
})

describe('estimation - portfolio calculations', () => {
  it('matches worked example from spec', () => {
    const result = calculatePortfolio(TEST_WORK_ITEMS, DEFAULT_CONSTANTS)

    // Expected results with position=0.6, divisor=2.6, billable=36, power=3.2
    expect(result.total_expected_hours).toBeCloseTo(957.6, 1)
    expect(result.portfolio_range_spread).toBeCloseTo(108.88, 1)
    expect(result.total_effort_hours).toBeCloseTo(1066.48, 1)
    expect(result.total_effort_staff_weeks).toBeCloseTo(29.62, 1)
    expect(result.duration_weeks).toBe(10)
  })

  it('calculates correct total variance', () => {
    const result = calculatePortfolio(TEST_WORK_ITEMS, DEFAULT_CONSTANTS)
    // Should be sum of individual variances
    expect(result.total_variance).toBeCloseTo(11855.03, 1)
  })

  it('handles single work item portfolio', () => {
    const singleItem = [{ id: 1, title: '', notes: '', best_case_hours: 80, worst_case_hours: 120, multiplier: 1, enabled: true }]
    const result = calculatePortfolio(singleItem, DEFAULT_CONSTANTS)

    expect(result.total_expected_hours).toBeCloseTo(104, 2)
    expect(result.portfolio_range_spread).toBeCloseTo(15.38, 2)
  })

  it('handles empty portfolio', () => {
    const result = calculatePortfolio([], DEFAULT_CONSTANTS)

    expect(result.total_expected_hours).toBe(0)
    expect(result.portfolio_range_spread).toBe(0)
    expect(result.total_effort_hours).toBe(0)
    expect(result.total_effort_staff_weeks).toBe(0)
    expect(result.duration_weeks).toBe(0)
  })

  it('handles zero range items (best = worst)', () => {
    const items = [
      { id: 1, title: '', notes: '', best_case_hours: 100, worst_case_hours: 100, multiplier: 1, enabled: true },
      { id: 2, title: '', notes: '', best_case_hours: 50, worst_case_hours: 50, multiplier: 1, enabled: true },
    ]
    const result = calculatePortfolio(items, DEFAULT_CONSTANTS)

    expect(result.total_expected_hours).toBe(150)
    expect(result.portfolio_range_spread).toBe(0)
    expect(result.total_effort_hours).toBe(150)
  })
})

describe('estimation - root-sum-square effect', () => {
  it('demonstrates portfolio range spread is NOT linear sum', () => {
    // 10 items with same range (10-20)
    const items = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      title: '',
      notes: '',
      best_case_hours: 10,
      worst_case_hours: 20,
      multiplier: 1,
      enabled: true,
    }))

    const result = calculatePortfolio(items, DEFAULT_CONSTANTS)

    // Each item has range spread ≈ 3.85 (10/2.6)
    // Linear sum would be 10 × 3.85 = 38.5
    // Root-sum-square: √(10 × 3.85²) ≈ 12.17
    expect(result.portfolio_range_spread).toBeCloseTo(12.17, 1)
    expect(result.portfolio_range_spread).toBeLessThan(38.5)
  })
})

describe('estimation - edge cases and errors', () => {
  it('skips invalid work item with negative hours', () => {
    const items = [
      { id: 1, title: '', notes: '', best_case_hours: -10, worst_case_hours: 20, multiplier: 1, enabled: true },
      { id: 2, title: '', notes: '', best_case_hours: 80, worst_case_hours: 120, multiplier: 1, enabled: true },
    ]
    const result = calculatePortfolio(items, DEFAULT_CONSTANTS)
    // Only the valid item should contribute
    expect(result.total_expected_hours).toBeCloseTo(104, 2)
  })

  it('skips work item where worst < best', () => {
    const items = [
      { id: 1, title: '', notes: '', best_case_hours: 30, worst_case_hours: 20, multiplier: 1, enabled: true },
      { id: 2, title: '', notes: '', best_case_hours: 80, worst_case_hours: 120, multiplier: 1, enabled: true },
    ]
    const result = calculatePortfolio(items, DEFAULT_CONSTANTS)
    // Only the valid item should contribute
    expect(result.total_expected_hours).toBeCloseTo(104, 2)
  })

  it('throws error for invalid constants', () => {
    const badConstants = { ...DEFAULT_CONSTANTS, expected_case_position: 1.5 }
    expect(() => calculatePortfolio(TEST_WORK_ITEMS, badConstants)).toThrow(
      'Invalid constants: Expected case position must be between 0 and 1'
    )
  })
})

describe('estimation - different constants', () => {
  it('works with different expected_case_position', () => {
    const constants: EstimationConstants = { ...DEFAULT_CONSTANTS, expected_case_position: 0.5 }
    const result = calculatePortfolio(TEST_WORK_ITEMS, constants)

    // With 0.5, expected is midpoint between best and worst
    expect(result.total_expected_hours).toBeGreaterThan(828.4) // Should be higher than 0.4 position
  })

  it('works with different range_spread_divisor', () => {
    const constants: EstimationConstants = { ...DEFAULT_CONSTANTS, range_spread_divisor: 3.0 }
    const result = calculatePortfolio(TEST_WORK_ITEMS, constants)

    // Higher divisor = smaller spread = less buffer
    expect(result.portfolio_range_spread).toBeLessThan(108.88)
  })

  it('works with different billable_hours_per_week', () => {
    const constants: EstimationConstants = { ...DEFAULT_CONSTANTS, billable_hours_per_week: 40 }
    const result = calculatePortfolio(TEST_WORK_ITEMS, constants)

    // More hours per week = fewer weeks needed
    const defaultResult = calculatePortfolio(TEST_WORK_ITEMS, DEFAULT_CONSTANTS)
    expect(result.total_effort_staff_weeks).toBeLessThan(defaultResult.total_effort_staff_weeks)
  })

  it('works with different duration_scaling_power', () => {
    const constants: EstimationConstants = { ...DEFAULT_CONSTANTS, duration_scaling_power: 4.0 }
    const result = calculatePortfolio(TEST_WORK_ITEMS, constants)

    // Higher power = longer duration
    expect(result.duration_weeks).toBeGreaterThan(11)
  })
})

describe('calculatePortfolio with groups', () => {
  it('excludes items in disabled groups', () => {
    const items: WorkItem[] = [
      { id: 1, title: 'A', notes: '', best_case_hours: 10, worst_case_hours: 20, enabled: true, multiplier: 1, groupId: 1 },
      { id: 2, title: 'B', notes: '', best_case_hours: 5, worst_case_hours: 15, enabled: true, multiplier: 1 },
    ]
    const groups: WorkItemGroup[] = [{ id: 1, name: 'G', color: 'indigo', enabled: false, collapsed: false, multiplier: 1 }]
    const result = calculatePortfolio(items, DEFAULT_CONSTANTS, groups)
    const resultOnlyUngrouped = calculatePortfolio([items[1]], DEFAULT_CONSTANTS)
    expect(result.total_expected_hours).toBeCloseTo(resultOnlyUngrouped.total_expected_hours)
  })

  it('includes items in enabled groups', () => {
    const items: WorkItem[] = [
      { id: 1, title: 'A', notes: '', best_case_hours: 10, worst_case_hours: 20, enabled: true, multiplier: 1, groupId: 1 },
    ]
    const groups: WorkItemGroup[] = [{ id: 1, name: 'G', color: 'indigo', enabled: true, collapsed: false, multiplier: 1 }]
    const result = calculatePortfolio(items, DEFAULT_CONSTANTS, groups)
    expect(result.total_expected_hours).toBeGreaterThan(0)
  })

  it('works without groups parameter (backward compatible)', () => {
    const items: WorkItem[] = [
      { id: 1, title: 'A', notes: '', best_case_hours: 10, worst_case_hours: 20, enabled: true, multiplier: 1 },
    ]
    const result = calculatePortfolio(items, DEFAULT_CONSTANTS)
    expect(result.total_expected_hours).toBeGreaterThan(0)
  })

  it('excludes disabled items even in enabled groups', () => {
    const items: WorkItem[] = [
      { id: 1, title: 'A', notes: '', best_case_hours: 10, worst_case_hours: 20, enabled: false, multiplier: 1, groupId: 1 },
    ]
    const groups: WorkItemGroup[] = [{ id: 1, name: 'G', color: 'indigo', enabled: true, collapsed: false, multiplier: 1 }]
    const result = calculatePortfolio(items, DEFAULT_CONSTANTS, groups)
    expect(result.total_expected_hours).toBe(0)
  })
})

describe('calculateGroupSubtotals', () => {
  it('computes subtotals for a specific group', () => {
    const items = [
      { id: 1, title: 'A', notes: '', best_case_hours: 10, worst_case_hours: 20, enabled: true, multiplier: 1, groupId: 1,
        expected_hours: 16, range_spread_hours: 3.846, variance: 14.79 },
      { id: 2, title: 'B', notes: '', best_case_hours: 5, worst_case_hours: 15, enabled: true, multiplier: 1, groupId: 1,
        expected_hours: 11, range_spread_hours: 3.846, variance: 14.79 },
      { id: 3, title: 'C', notes: '', best_case_hours: 8, worst_case_hours: 12, enabled: true, multiplier: 1,
        expected_hours: 10.4, range_spread_hours: 1.538, variance: 2.37 },
    ]
    const subtotals = calculateGroupSubtotals(items, 1)
    expect(subtotals.item_count).toBe(2)
    expect(subtotals.enabled_item_count).toBe(2)
    expect(subtotals.total_expected_hours).toBeCloseTo(27, 0)
  })

  it('excludes disabled items from totals but counts them', () => {
    const items = [
      { id: 1, title: 'A', notes: '', best_case_hours: 10, worst_case_hours: 20, enabled: true, multiplier: 1, groupId: 1,
        expected_hours: 16, range_spread_hours: 3.846, variance: 14.79 },
      { id: 2, title: 'B', notes: '', best_case_hours: 5, worst_case_hours: 15, enabled: false, multiplier: 1, groupId: 1,
        expected_hours: 11, range_spread_hours: 3.846, variance: 14.79 },
    ]
    const subtotals = calculateGroupSubtotals(items, 1)
    expect(subtotals.item_count).toBe(2)
    expect(subtotals.enabled_item_count).toBe(1)
    expect(subtotals.total_expected_hours).toBeCloseTo(16, 0)
  })
})
