import { describe, it, expect } from 'vitest'
import {
  DEFAULT_CONSTANTS,
  calculateExpectedHours,
  calculateRangeSpread,
  calculateVariance,
  calculateWorkItem,
  calculatePortfolio,
  validateWorkItem,
  validateConstants,
  type WorkItem,
  type EstimationConstants,
} from './estimation'

// Test data from docs/estimation-math-spec.md "Worksheet Example"
const TEST_WORK_ITEMS: WorkItem[] = [
  { id: 1, title: 'Page 1', notes: '', best_case_hours: 80, worst_case_hours: 120 },
  { id: 2, title: 'Page 2', notes: '', best_case_hours: 70, worst_case_hours: 200 },
  { id: 3, title: 'Page 3', notes: '', best_case_hours: 100, worst_case_hours: 320 },
  { id: 4, title: 'Page 4', notes: '', best_case_hours: 40, worst_case_hours: 80 },
  { id: 5, title: 'Page 5', notes: '', best_case_hours: 60, worst_case_hours: 90 },
  { id: 6, title: 'Nav & Footer', notes: '', best_case_hours: 80, worst_case_hours: 160 },
  { id: 7, title: 'Environment & Language Config', notes: '', best_case_hours: 4, worst_case_hours: 16 },
  { id: 8, title: 'Translations', notes: '', best_case_hours: 80, worst_case_hours: 100 },
  { id: 9, title: 'Q&A', notes: '', best_case_hours: 40, worst_case_hours: 100 },
  { id: 10, title: 'Readme, docs', notes: '', best_case_hours: 16, worst_case_hours: 30 },
]

describe('estimation - validation', () => {
  describe('validateWorkItem', () => {
    it('accepts valid work item', () => {
      expect(validateWorkItem({ id: 1, title: '', notes: '', best_case_hours: 10, worst_case_hours: 20 })).toBeNull()
    })

    it('rejects negative best case', () => {
      expect(validateWorkItem({ id: 1, title: '', notes: '', best_case_hours: -5, worst_case_hours: 20 })).toBe(
        'Best case hours cannot be negative'
      )
    })

    it('rejects worst case less than best case', () => {
      expect(validateWorkItem({ id: 1, title: '', notes: '', best_case_hours: 30, worst_case_hours: 20 })).toBe(
        'Worst case hours cannot be less than best case hours'
      )
    })

    it('accepts equal best and worst case (zero range)', () => {
      expect(validateWorkItem({ id: 1, title: '', notes: '', best_case_hours: 10, worst_case_hours: 10 })).toBeNull()
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
      const item = { id: 1, title: '', notes: '', best_case_hours: 80, worst_case_hours: 120 }
      const result = calculateWorkItem(item, DEFAULT_CONSTANTS)

      expect(result.expected_hours).toBeCloseTo(96, 2)
      expect(result.range_spread_hours).toBeCloseTo(15.38, 2)
      expect(result.variance).toBeCloseTo(236.69, 1) // Variance precision adjusted
    })

    it('calculates all metrics for Page 3', () => {
      const item = { id: 3, title: '', notes: '', best_case_hours: 100, worst_case_hours: 320 }
      const result = calculateWorkItem(item, DEFAULT_CONSTANTS)

      expect(result.expected_hours).toBeCloseTo(188, 2)
      expect(result.range_spread_hours).toBeCloseTo(84.62, 2)
      expect(result.variance).toBeCloseTo(7159.76, 1) // Variance precision adjusted
    })
  })
})

describe('estimation - portfolio calculations', () => {
  it('matches worked example from spec', () => {
    const result = calculatePortfolio(TEST_WORK_ITEMS, DEFAULT_CONSTANTS)

    // Expected results from docs/estimation-math-spec.md
    expect(result.total_expected_hours).toBeCloseTo(828.4, 1)
    expect(result.portfolio_range_spread).toBeCloseTo(108.88, 1)
    expect(result.total_effort_hours).toBeCloseTo(937.28, 1)
    expect(result.total_effort_staff_weeks).toBeCloseTo(26.03, 1)
    expect(result.duration_weeks).toBe(11)
  })

  it('calculates correct total variance', () => {
    const result = calculatePortfolio(TEST_WORK_ITEMS, DEFAULT_CONSTANTS)
    // Should be sum of individual variances
    expect(result.total_variance).toBeCloseTo(11855.03, 1)
  })

  it('handles single work item portfolio', () => {
    const singleItem = [{ id: 1, title: '', notes: '', best_case_hours: 80, worst_case_hours: 120 }]
    const result = calculatePortfolio(singleItem, DEFAULT_CONSTANTS)

    expect(result.total_expected_hours).toBeCloseTo(96, 2)
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
      { id: 1, title: '', notes: '', best_case_hours: 100, worst_case_hours: 100 },
      { id: 2, title: '', notes: '', best_case_hours: 50, worst_case_hours: 50 },
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
  it('throws error for invalid work item', () => {
    const items = [{ id: 1, title: '', notes: '', best_case_hours: -10, worst_case_hours: 20 }]
    expect(() => calculatePortfolio(items, DEFAULT_CONSTANTS)).toThrow(
      'Invalid work item 1: Best case hours cannot be negative'
    )
  })

  it('throws error for worst < best', () => {
    const items = [{ id: 1, title: '', notes: '', best_case_hours: 30, worst_case_hours: 20 }]
    expect(() => calculatePortfolio(items, DEFAULT_CONSTANTS)).toThrow(
      'Invalid work item 1: Worst case hours cannot be less than best case hours'
    )
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
    expect(result.total_effort_staff_weeks).toBeLessThan(26.03)
  })

  it('works with different duration_scaling_power', () => {
    const constants: EstimationConstants = { ...DEFAULT_CONSTANTS, duration_scaling_power: 4.0 }
    const result = calculatePortfolio(TEST_WORK_ITEMS, constants)

    // Higher power = longer duration
    expect(result.duration_weeks).toBeGreaterThan(11)
  })
})
