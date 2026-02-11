import { describe, it, expect } from 'vitest'
import {
  getActivePeoplePerWeek,
  calculateWeeklyCoordination,
  calculateCoordination,
  calculateGapDecomposition,
} from './coordination'
import type { StaffingRow } from '../types'

// Test data from docs/staffing-plan-spec.md and coordination-overhead-spec.md
const TEST_ROWS: StaffingRow[] = [
  { id: 1, discipline: 'Scrum Master', hourly_rate: 100,
    cells: ['6','6','6','6','6','6','PI Plan','6','6','6','6','6','6','6','6'] },
  { id: 2, discipline: 'Lead Dev', hourly_rate: 175,
    cells: ['36','36','36','36','36','36','PI Plan','PTO','PTO','36','36','36','36','36','36'] },
  { id: 3, discipline: 'Associate Dev', hourly_rate: 125,
    cells: ['36','36','36','36','36','36','PI Plan','36','36','36','36','36','36','36','36'] },
  { id: 4, discipline: 'QA', hourly_rate: 125,
    cells: ['8','8','0','0','0','0','PI Plan','8','8','8','20','20','20','20','20'] },
]

const WEEK_COUNT = 15
const ALPHA = 4

// ============================================================================
// Active People Counting
// ============================================================================

describe('coordination - active people counting', () => {
  it('counts active people for weeks with all numeric cells', () => {
    const result = getActivePeoplePerWeek(TEST_ROWS, WEEK_COUNT)
    // Week 0 (W1): SM=6, Lead=36, Assoc=36, QA=8 → all 4 active
    expect(result[0]).toBe(4)
  })

  it('counts zero active people for annotation-only weeks', () => {
    const result = getActivePeoplePerWeek(TEST_ROWS, WEEK_COUNT)
    // Week 6 (W7): all "PI Plan" → 0 active
    expect(result[6]).toBe(0)
  })

  it('excludes people with PTO annotations', () => {
    const result = getActivePeoplePerWeek(TEST_ROWS, WEEK_COUNT)
    // Week 7 (W8): SM=6, Lead=PTO, Assoc=36, QA=8 → 3 active
    expect(result[7]).toBe(3)
  })

  it('excludes people with zero hours', () => {
    const result = getActivePeoplePerWeek(TEST_ROWS, WEEK_COUNT)
    // Week 2 (W3): SM=6, Lead=36, Assoc=36, QA=0 → 3 active
    expect(result[2]).toBe(3)
  })

  it('returns correct array length', () => {
    const result = getActivePeoplePerWeek(TEST_ROWS, WEEK_COUNT)
    expect(result).toHaveLength(WEEK_COUNT)
  })

  it('handles empty rows', () => {
    const result = getActivePeoplePerWeek([], 5)
    expect(result).toEqual([0, 0, 0, 0, 0])
  })
})

// ============================================================================
// Weekly Coordination
// ============================================================================

describe('coordination - weekly coordination', () => {
  it('returns 0 for 0 people', () => {
    expect(calculateWeeklyCoordination(0, ALPHA)).toBe(0)
  })

  it('returns 0 for 1 person (no channels)', () => {
    expect(calculateWeeklyCoordination(1, ALPHA)).toBe(0)
  })

  it('calculates correctly for 2 people', () => {
    // 1 channel × 4 = 4 hours
    expect(calculateWeeklyCoordination(2, ALPHA)).toBe(4)
  })

  it('calculates correctly for 3 people', () => {
    // 3 channels × 4 = 12 hours
    expect(calculateWeeklyCoordination(3, ALPHA)).toBe(12)
  })

  it('calculates correctly for 4 people', () => {
    // 6 channels × 4 = 24 hours
    expect(calculateWeeklyCoordination(4, ALPHA)).toBe(24)
  })

  it('grows quadratically with team size', () => {
    const c4 = calculateWeeklyCoordination(4, ALPHA)
    const c8 = calculateWeeklyCoordination(8, ALPHA)
    // 4 people: 6 channels, 8 people: 28 channels
    // Ratio: 28/6 ≈ 4.67
    expect(c8 / c4).toBeCloseTo(28 / 6, 2)
  })
})

// ============================================================================
// Total Coordination (Worked Example)
// ============================================================================

describe('coordination - total coordination', () => {
  it('computes total coordination hours for worked example with α=4', () => {
    const result = calculateCoordination(TEST_ROWS, WEEK_COUNT, ALPHA)

    // W1-W2 (idx 0-1): 4 people (SM,Lead,Assoc,QA) → 6 channels × 4 = 24h/wk × 2 = 48h
    // W3-W6 (idx 2-5): 3 people (QA=0) → 3 channels × 4 = 12h/wk × 4 = 48h
    // W7 (idx 6): 0 people (PI Plan) → 0h
    // W8-W9 (idx 7-8): 3 people (Lead=PTO) → 3 channels × 4 = 12h/wk × 2 = 24h
    // W10-W15 (idx 9-14): 4 people → 24h/wk × 6 = 144h
    expect(result.total_coordination_hours).toBe(48 + 48 + 0 + 24 + 144)
    expect(result.total_coordination_hours).toBe(264)
  })

  it('computes active people per week correctly', () => {
    const result = calculateCoordination(TEST_ROWS, WEEK_COUNT, ALPHA)
    // Spot check: W1=4, W3=3, W7=0, W8=3, W10=4
    expect(result.active_people_per_week[0]).toBe(4)
    expect(result.active_people_per_week[2]).toBe(3)
    expect(result.active_people_per_week[6]).toBe(0)
    expect(result.active_people_per_week[7]).toBe(3)
    expect(result.active_people_per_week[9]).toBe(4)
  })

  it('computes average active people (excluding zero weeks)', () => {
    const result = calculateCoordination(TEST_ROWS, WEEK_COUNT, ALPHA)
    // 14 active weeks (all except W7 which is PI Plan)
    // W1-W2: 4,4 (all active)
    // W3-W6: 3,3,3,3 (QA=0)
    // W7: 0 (PI Plan)
    // W8-W9: 3,3 (Lead=PTO)
    // W10-W15: 4,4,4,4,4,4
    // Active weeks: 14, sum = 4+4+3+3+3+3+3+3+4+4+4+4+4+4 = 50
    // Average = 50/14 ≈ 3.57
    expect(result.average_active_people).toBeCloseTo(50 / 14, 2)
  })

  it('handles empty grid', () => {
    const result = calculateCoordination([], 5, ALPHA)
    expect(result.total_coordination_hours).toBe(0)
    expect(result.average_active_people).toBe(0)
  })
})

// ============================================================================
// Implied Team Size (incremental coordination)
// ============================================================================

describe('coordination - implied team size', () => {
  it('charges zero coordination when active <= implied', () => {
    // impliedTeamSize=4, all weeks have ≤4 people → no incremental overhead
    const result = calculateCoordination(TEST_ROWS, WEEK_COUNT, ALPHA, 4)
    expect(result.total_coordination_hours).toBe(0)
  })

  it('charges only incremental coordination above implied', () => {
    // impliedTeamSize=3, α=4
    // bakedIn for 3 people = 4 × 3 × 2 / 2 = 12h/wk
    // W1-W2: 4 active → raw=24, incremental=24-12=12/wk × 2 = 24h
    // W3-W6: 3 active → raw=12, incremental=12-12=0/wk × 4 = 0h
    // W7: 0 active → 0h
    // W8-W9: 3 active → raw=12, incremental=0/wk × 2 = 0h
    // W10-W15: 4 active → raw=24, incremental=12/wk × 6 = 72h
    // Total = 24 + 0 + 0 + 0 + 72 = 96h
    const result = calculateCoordination(TEST_ROWS, WEEK_COUNT, ALPHA, 3)
    expect(result.total_coordination_hours).toBe(96)
  })

  it('defaults to full coordination when impliedTeamSize=0', () => {
    const result = calculateCoordination(TEST_ROWS, WEEK_COUNT, ALPHA, 0)
    expect(result.total_coordination_hours).toBe(264)
  })

  it('charges nothing when implied exceeds all active counts', () => {
    const result = calculateCoordination(TEST_ROWS, WEEK_COUNT, ALPHA, 10)
    expect(result.total_coordination_hours).toBe(0)
  })
})

// ============================================================================
// Gap Decomposition
// ============================================================================

describe('coordination - gap decomposition', () => {
  it('computes buffered scenario', () => {
    const gap = calculateGapDecomposition(937, 100, 1200)
    expect(gap.adjusted_effort_hours).toBe(1037)
    expect(gap.effective_productive_hours).toBe(1100)
    expect(gap.remaining_buffer_hours).toBe(163)
    expect(gap.buffer_status).toBe('buffered')
  })

  it('computes tight scenario', () => {
    const gap = calculateGapDecomposition(937, 100, 1037)
    expect(gap.remaining_buffer_hours).toBe(0)
    expect(gap.buffer_status).toBe('tight')
  })

  it('computes short scenario', () => {
    const gap = calculateGapDecomposition(937, 312, 1160)
    expect(gap.adjusted_effort_hours).toBe(1249)
    expect(gap.effective_productive_hours).toBe(848)
    expect(gap.remaining_buffer_hours).toBe(-89)
    expect(gap.buffer_status).toBe('short')
  })

  it('preserves base effort in output', () => {
    const gap = calculateGapDecomposition(937, 312, 1160)
    expect(gap.base_effort_hours).toBe(937)
    expect(gap.coordination_overhead_hours).toBe(312)
    expect(gap.staffed_hours).toBe(1160)
  })
})

