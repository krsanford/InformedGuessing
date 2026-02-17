import { describe, it, expect } from 'vitest'
import {
  parseCellHours,
  isCellAnnotation,
  validateStaffingRow,
  calculateRowTotals,
  calculateWeekTotals,
  calculateStaffingGrid,
  calculateStaffingComparison,
  createStaffingRow,
  createPrepopulatedRows,
  resizeRowCells,
} from './staffing'
import type { StaffingRow } from '../types'

// Test data from docs/staffing-plan-spec.md "Worked Example"
const TEST_ROWS: StaffingRow[] = [
  { id: 1, discipline: 'Scrum Master', hourly_rate: 100, enabled: true, multiplier: 1,
    cells: ['6','6','6','6','6','6','PI Plan','6','6','6','6','6','6','6','6'] },
  { id: 2, discipline: 'Lead Dev', hourly_rate: 175, enabled: true, multiplier: 1,
    cells: ['36','36','36','36','36','36','PI Plan','PTO','PTO','36','36','36','36','36','36'] },
  { id: 3, discipline: 'Associate Dev', hourly_rate: 125, enabled: true, multiplier: 1,
    cells: ['36','36','36','36','36','36','PI Plan','36','36','36','36','36','36','36','36'] },
  { id: 4, discipline: 'QA', hourly_rate: 125, enabled: true, multiplier: 1,
    cells: ['8','8','0','0','0','0','PI Plan','8','8','8','20','20','20','20','20'] },
]

// ============================================================================
// Cell Parsing
// ============================================================================

describe('staffing - cell parsing', () => {
  describe('parseCellHours', () => {
    it('parses numeric string to number', () => {
      expect(parseCellHours('36')).toBe(36)
    })

    it('returns 0 for empty string', () => {
      expect(parseCellHours('')).toBe(0)
    })

    it('returns 0 for annotation text', () => {
      expect(parseCellHours('PTO')).toBe(0)
    })

    it('returns 0 for negative numbers', () => {
      expect(parseCellHours('-5')).toBe(0)
    })

    it('parses decimal values', () => {
      expect(parseCellHours('8.5')).toBe(8.5)
    })

    it('handles whitespace', () => {
      expect(parseCellHours('  36  ')).toBe(36)
    })

    it('returns 0 for PI Plan', () => {
      expect(parseCellHours('PI Plan')).toBe(0)
    })

    it('parses zero as 0', () => {
      expect(parseCellHours('0')).toBe(0)
    })
  })

  describe('isCellAnnotation', () => {
    it('returns false for empty string', () => {
      expect(isCellAnnotation('')).toBe(false)
    })

    it('returns false for numeric string', () => {
      expect(isCellAnnotation('36')).toBe(false)
    })

    it('returns false for zero', () => {
      expect(isCellAnnotation('0')).toBe(false)
    })

    it('returns true for "PTO"', () => {
      expect(isCellAnnotation('PTO')).toBe(true)
    })

    it('returns true for "PI Plan"', () => {
      expect(isCellAnnotation('PI Plan')).toBe(true)
    })

    it('returns true for "Holiday"', () => {
      expect(isCellAnnotation('Holiday')).toBe(true)
    })

    it('returns true for "Ramp Up"', () => {
      expect(isCellAnnotation('Ramp Up')).toBe(true)
    })

    it('returns false for whitespace-only', () => {
      expect(isCellAnnotation('   ')).toBe(false)
    })
  })
})

// ============================================================================
// Validation
// ============================================================================

describe('staffing - validation', () => {
  describe('validateStaffingRow', () => {
    it('accepts valid row', () => {
      expect(validateStaffingRow(TEST_ROWS[0])).toBeNull()
    })

    it('rejects negative hourly rate', () => {
      const row: StaffingRow = { id: 1, discipline: 'Dev', hourly_rate: -50, cells: [], enabled: true, multiplier: 1 }
      expect(validateStaffingRow(row)).toBe('Hourly rate cannot be negative')
    })

    it('accepts zero hourly rate', () => {
      const row: StaffingRow = { id: 1, discipline: 'Intern', hourly_rate: 0, cells: [], enabled: true, multiplier: 1 }
      expect(validateStaffingRow(row)).toBeNull()
    })

    it('accepts empty discipline name', () => {
      const row: StaffingRow = { id: 1, discipline: '', hourly_rate: 100, cells: [], enabled: true, multiplier: 1 }
      expect(validateStaffingRow(row)).toBeNull()
    })
  })
})

// ============================================================================
// Row Calculations
// ============================================================================

describe('staffing - row calculations', () => {
  it('calculates total hours from numeric cells', () => {
    // Associate Dev: 14 weeks × 36h = 504h (week 7 is PI Plan = 0)
    const result = calculateRowTotals(TEST_ROWS[2])
    expect(result.total_hours).toBe(504)
  })

  it('treats annotations as zero hours', () => {
    // Lead Dev: 12 weeks × 36h = 432h (week 7 PI Plan, weeks 8-9 PTO)
    const result = calculateRowTotals(TEST_ROWS[1])
    expect(result.total_hours).toBe(432)
  })

  it('calculates total cost as hours × rate', () => {
    // Lead Dev: 432h × $175 = $75,600
    const result = calculateRowTotals(TEST_ROWS[1])
    expect(result.total_cost).toBe(75600)
  })

  it('calculates Scrum Master totals', () => {
    // SM: 14 weeks × 6h = 84h, $8,400
    const result = calculateRowTotals(TEST_ROWS[0])
    expect(result.total_hours).toBe(84)
    expect(result.total_cost).toBe(8400)
  })

  it('calculates QA totals', () => {
    // QA: 8+8+0+0+0+0+0+8+8+8+20+20+20+20+20 = 140h, $17,500
    const result = calculateRowTotals(TEST_ROWS[3])
    expect(result.total_hours).toBe(140)
    expect(result.total_cost).toBe(17500)
  })

  it('handles row with all empty cells', () => {
    const row: StaffingRow = { id: 1, discipline: 'Empty', hourly_rate: 100, cells: ['', '', ''], enabled: true, multiplier: 1 }
    const result = calculateRowTotals(row)
    expect(result.total_hours).toBe(0)
    expect(result.total_cost).toBe(0)
  })

  it('handles row with zero rate', () => {
    const row: StaffingRow = { id: 1, discipline: 'Intern', hourly_rate: 0, cells: ['36', '36'], enabled: true, multiplier: 1 }
    const result = calculateRowTotals(row)
    expect(result.total_hours).toBe(72)
    expect(result.total_cost).toBe(0)
  })
})

// ============================================================================
// Week (Column) Totals
// ============================================================================

describe('staffing - week totals', () => {
  it('calculates week 1 total across all rows', () => {
    // Week 1: 6 + 36 + 36 + 8 = 86
    const totals = calculateWeekTotals(TEST_ROWS, 15)
    expect(totals[0]).toBe(86)
  })

  it('calculates week 7 total (PI Plan for all)', () => {
    // Week 7: all PI Plan = 0
    const totals = calculateWeekTotals(TEST_ROWS, 15)
    expect(totals[6]).toBe(0)
  })

  it('calculates week 8 total (Lead Dev PTO)', () => {
    // Week 8: 6 + 0(PTO) + 36 + 8 = 50
    const totals = calculateWeekTotals(TEST_ROWS, 15)
    expect(totals[7]).toBe(50)
  })

  it('calculates week 11 total (QA ramped up)', () => {
    // Week 11: 6 + 36 + 36 + 20 = 98
    const totals = calculateWeekTotals(TEST_ROWS, 15)
    expect(totals[10]).toBe(98)
  })

  it('returns empty array for zero weeks', () => {
    const totals = calculateWeekTotals(TEST_ROWS, 0)
    expect(totals).toEqual([])
  })

  it('returns zeros for empty rows', () => {
    const totals = calculateWeekTotals([], 5)
    expect(totals).toEqual([0, 0, 0, 0, 0])
  })
})

// ============================================================================
// Full Grid Calculation
// ============================================================================

describe('staffing - grid calculations', () => {
  it('calculates full grid with worked example data', () => {
    const grid = calculateStaffingGrid(TEST_ROWS, 15)

    // Row totals
    expect(grid.row_totals[0].total_hours).toBe(84)   // Scrum Master
    expect(grid.row_totals[1].total_hours).toBe(432)   // Lead Dev
    expect(grid.row_totals[2].total_hours).toBe(504)   // Associate Dev
    expect(grid.row_totals[3].total_hours).toBe(140)   // QA

    // Row costs
    expect(grid.row_totals[0].total_cost).toBe(8400)   // 84 × $100
    expect(grid.row_totals[1].total_cost).toBe(75600)  // 432 × $175
    expect(grid.row_totals[2].total_cost).toBe(63000)  // 504 × $125
    expect(grid.row_totals[3].total_cost).toBe(17500)  // 140 × $125

    // Grand totals
    expect(grid.grand_total_hours).toBe(1160)
    expect(grid.grand_total_cost).toBe(164500)
  })

  it('handles empty grid', () => {
    const grid = calculateStaffingGrid([], 0)
    expect(grid.row_totals).toEqual([])
    expect(grid.week_totals).toEqual([])
    expect(grid.grand_total_hours).toBe(0)
    expect(grid.grand_total_cost).toBe(0)
  })
})

// ============================================================================
// Estimate Comparison
// ============================================================================

describe('staffing - comparison', () => {
  it('calculates delta hours and percentage', () => {
    const result = calculateStaffingComparison(892, 1160)
    expect(result.delta_hours).toBe(268)
    expect(result.delta_percent).toBeCloseTo(30.04, 1)
  })

  it('handles zero estimated hours', () => {
    const result = calculateStaffingComparison(0, 100)
    expect(result.delta_percent).toBe(0)
    expect(result.delta_hours).toBe(100)
  })

  it('handles equal estimated and staffed', () => {
    const result = calculateStaffingComparison(500, 500)
    expect(result.delta_hours).toBe(0)
    expect(result.delta_percent).toBe(0)
  })

  it('handles staffed less than estimated', () => {
    const result = calculateStaffingComparison(500, 400)
    expect(result.delta_hours).toBe(-100)
    expect(result.delta_percent).toBeCloseTo(-20, 1)
  })
})

// ============================================================================
// Row Management
// ============================================================================

describe('staffing - row management', () => {
  it('creates a row with correct number of empty cells', () => {
    const row = createStaffingRow(1, 15)
    expect(row.id).toBe(1)
    expect(row.discipline).toBe('')
    expect(row.hourly_rate).toBe(0)
    expect(row.cells).toHaveLength(15)
    expect(row.cells.every(c => c === '')).toBe(true)
  })

  it('creates a row with zero weeks', () => {
    const row = createStaffingRow(5, 0)
    expect(row.cells).toHaveLength(0)
  })

  it('resizes rows when week count increases', () => {
    const rows = [createStaffingRow(1, 5)]
    rows[0].cells = ['36', '36', '36', '36', '36']
    const resized = resizeRowCells(rows, 8)
    expect(resized[0].cells).toHaveLength(8)
    expect(resized[0].cells[4]).toBe('36')
    expect(resized[0].cells[5]).toBe('')
    expect(resized[0].cells[7]).toBe('')
  })

  it('resizes rows when week count decreases', () => {
    const rows = [createStaffingRow(1, 8)]
    rows[0].cells[0] = '36'
    rows[0].cells[7] = '24'
    const resized = resizeRowCells(rows, 5)
    expect(resized[0].cells).toHaveLength(5)
    expect(resized[0].cells[0]).toBe('36')
  })

  it('returns same row when week count unchanged', () => {
    const rows = [createStaffingRow(1, 5)]
    const resized = resizeRowCells(rows, 5)
    expect(resized[0]).toBe(rows[0])
  })

  it('preserves existing data when growing', () => {
    const rows: StaffingRow[] = [{
      id: 1, discipline: 'Dev', hourly_rate: 150, enabled: true, multiplier: 1,
      cells: ['36', 'PTO', '36'],
    }]
    const resized = resizeRowCells(rows, 5)
    expect(resized[0].cells).toEqual(['36', 'PTO', '36', '', ''])
    expect(resized[0].discipline).toBe('Dev')
    expect(resized[0].hourly_rate).toBe(150)
  })
})

// ============================================================================
// Pre-populated Rows (createPrepopulatedRows)
// ============================================================================

describe('staffing - createPrepopulatedRows', () => {
  it('creates the correct number of rows for impliedPeople', () => {
    const rows = createPrepopulatedRows(1, 10, 3, 1000, 36)
    expect(rows).toHaveLength(3)
  })

  it('assigns sequential IDs starting from startId', () => {
    const rows = createPrepopulatedRows(5, 10, 3, 1000, 36)
    expect(rows[0].id).toBe(5)
    expect(rows[1].id).toBe(6)
    expect(rows[2].id).toBe(7)
  })

  it('creates rows with correct weekCount cells', () => {
    const rows = createPrepopulatedRows(1, 12, 2, 500, 36)
    expect(rows[0].cells).toHaveLength(12)
    expect(rows[1].cells).toHaveLength(12)
  })

  it('initializes rows as enabled with multiplier 1 and empty discipline/rate', () => {
    const rows = createPrepopulatedRows(1, 5, 2, 200, 36)
    for (const row of rows) {
      expect(row.enabled).toBe(true)
      expect(row.multiplier).toBe(1)
      expect(row.discipline).toBe('')
      expect(row.hourly_rate).toBe(0)
    }
  })

  it('distributes hours evenly across people, week by week', () => {
    // 2 people, 36h/week, 144 total hours = 2 weeks exactly
    const rows = createPrepopulatedRows(1, 5, 2, 144, 36)
    // Week 1: both get 36
    expect(rows[0].cells[0]).toBe('36')
    expect(rows[1].cells[0]).toBe('36')
    // Week 2: both get 36
    expect(rows[0].cells[1]).toBe('36')
    expect(rows[1].cells[1]).toBe('36')
    // Weeks 3-5: empty (all hours allocated)
    expect(rows[0].cells[2]).toBe('')
    expect(rows[1].cells[2]).toBe('')
  })

  it('handles partial last allocation with rounding', () => {
    // 1 person, 36h/week, 50 total hours = 36 + 14
    const rows = createPrepopulatedRows(1, 5, 1, 50, 36)
    expect(rows[0].cells[0]).toBe('36')
    expect(rows[0].cells[1]).toBe('14')
    expect(rows[0].cells[2]).toBe('')
  })

  it('rounds remainder to nearest integer', () => {
    // 1 person, 36h/week, 50.7 total hours → 36 + Math.round(14.7) = 36 + 15
    const rows = createPrepopulatedRows(1, 5, 1, 50.7, 36)
    expect(rows[0].cells[0]).toBe('36')
    expect(rows[0].cells[1]).toBe('15')
  })

  it('fills week-by-week: all people in week 1 before moving to week 2', () => {
    // 3 people, 36h/week, 180 total = fills week 1 fully (3×36=108), then 72 more in week 2
    const rows = createPrepopulatedRows(1, 5, 3, 180, 36)
    // Week 1: all three get 36
    expect(rows[0].cells[0]).toBe('36')
    expect(rows[1].cells[0]).toBe('36')
    expect(rows[2].cells[0]).toBe('36')
    // Week 2: first two get 36, third gets 0 (remaining after p0+p1 is 0)
    expect(rows[0].cells[1]).toBe('36')
    expect(rows[1].cells[1]).toBe('36')
    expect(rows[2].cells[1]).toBe('')
  })

  it('handles zero totalEffortHours', () => {
    const rows = createPrepopulatedRows(1, 5, 2, 0, 36)
    expect(rows).toHaveLength(2)
    expect(rows[0].cells.every(c => c === '')).toBe(true)
    expect(rows[1].cells.every(c => c === '')).toBe(true)
  })

  it('handles single person', () => {
    // 1 person, 36h/week, 108h = exactly 3 weeks
    const rows = createPrepopulatedRows(1, 5, 1, 108, 36)
    expect(rows).toHaveLength(1)
    expect(rows[0].cells[0]).toBe('36')
    expect(rows[0].cells[1]).toBe('36')
    expect(rows[0].cells[2]).toBe('36')
    expect(rows[0].cells[3]).toBe('')
    expect(rows[0].cells[4]).toBe('')
  })

  it('stops allocation when weekCount is exhausted even if hours remain', () => {
    // 1 person, 36h/week, 500h total, only 3 weeks available = 108h allocated, rest lost
    const rows = createPrepopulatedRows(1, 3, 1, 500, 36)
    expect(rows[0].cells).toHaveLength(3)
    expect(rows[0].cells[0]).toBe('36')
    expect(rows[0].cells[1]).toBe('36')
    expect(rows[0].cells[2]).toBe('36')
    // total allocated = 108, not 500
    const totalAllocated = rows[0].cells.reduce((s, c) => s + (c ? parseFloat(c) : 0), 0)
    expect(totalAllocated).toBe(108)
  })

  it('calculates correct totals when used with calculateStaffingGrid', () => {
    // 3 people, 36h/week, 10 weeks, 1000h total
    const rows = createPrepopulatedRows(1, 10, 3, 1000, 36)
    const grid = calculateStaffingGrid(rows, 10)
    // Should allocate all 1000 hours (or as close as rounding allows)
    // 3 people × 36h × ~9.26 weeks = ~1000h
    expect(grid.grand_total_hours).toBeGreaterThanOrEqual(990)
    expect(grid.grand_total_hours).toBeLessThanOrEqual(1000)
  })
})
