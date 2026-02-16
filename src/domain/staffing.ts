/**
 * Pure functions for staffing plan calculations.
 * All formulas must match docs/staffing-plan-spec.md
 */

import type { StaffingRow, StaffingRowComputed, StaffingGridComputed, StaffingComparison } from '../types'

// ============================================================================
// Constants
// ============================================================================

export const COST_ROUNDING_INCREMENT = 5000

// ============================================================================
// Cell Parsing
// ============================================================================

/**
 * Parse a cell value into hours.
 * Numeric strings → that number (must be ≥ 0).
 * Empty string → 0.
 * Non-numeric strings (e.g. "PTO", "Holiday") → 0.
 */
export function parseCellHours(cellValue: string): number {
  const trimmed = cellValue.trim()
  if (trimmed === '') return 0
  const num = parseFloat(trimmed)
  if (isNaN(num) || num < 0) return 0
  return num
}

/**
 * Determine whether a cell is an annotation (non-numeric, non-empty).
 * Used by the UI to apply annotation styling.
 */
export function isCellAnnotation(cellValue: string): boolean {
  const trimmed = cellValue.trim()
  if (trimmed === '') return false
  return isNaN(parseFloat(trimmed))
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate a staffing row. Returns error message or null.
 */
export function validateStaffingRow(row: StaffingRow): string | null {
  if (row.hourly_rate < 0) {
    return 'Hourly rate cannot be negative'
  }
  return null
}

// ============================================================================
// Row Calculations
// ============================================================================

/**
 * Calculate total hours and total cost for a single row.
 * total_hours = sum of parseCellHours for each cell
 * total_cost = total_hours × hourly_rate
 */
export function calculateRowTotals(row: StaffingRow): StaffingRowComputed {
  const total_hours = row.cells.reduce((sum, cell) => sum + parseCellHours(cell), 0)
  const total_cost = total_hours * row.hourly_rate
  return { total_hours, total_cost }
}

// ============================================================================
// Grid Calculations
// ============================================================================

/**
 * Calculate totals for each week column across all rows.
 * Returns array of length weekCount, each entry is sum of that column.
 */
export function calculateWeekTotals(rows: StaffingRow[], weekCount: number): number[] {
  const totals = new Array(weekCount).fill(0)
  for (const row of rows) {
    for (let w = 0; w < weekCount; w++) {
      totals[w] += parseCellHours(row.cells[w] ?? '')
    }
  }
  return totals
}

/**
 * Round a cost value UP to the nearest increment (default $5,000).
 * Formula: ⌈raw / increment⌉ × increment
 */
export function roundUpToCost(rawCost: number, increment: number = COST_ROUNDING_INCREMENT): number {
  if (rawCost <= 0) return 0
  return Math.ceil(rawCost / increment) * increment
}

/**
 * Calculate the full grid: all row totals, week totals, grand totals.
 */
export function calculateStaffingGrid(rows: StaffingRow[], weekCount: number): StaffingGridComputed {
  const enabledRows = rows.filter((r) => r.enabled)
  const row_totals = rows.map((row) => {
    if (!row.enabled) return { total_hours: 0, total_cost: 0 }
    const base = calculateRowTotals(row)
    const n = row.multiplier ?? 1
    return n === 1 ? base : { total_hours: base.total_hours * n, total_cost: base.total_cost * n }
  })
  const week_totals = calculateWeekTotals(enabledRows, weekCount)
  const grand_total_hours = row_totals.reduce((sum, r) => sum + r.total_hours, 0)
  const grand_total_cost_raw = row_totals.reduce((sum, r) => sum + r.total_cost, 0)
  const grand_total_cost = roundUpToCost(grand_total_cost_raw)

  return {
    row_totals,
    week_totals,
    grand_total_hours,
    grand_total_cost,
    grand_total_cost_raw,
  }
}

// ============================================================================
// Comparison with Estimate
// ============================================================================

/**
 * Compare estimated effort hours (from portfolio) with staffed hours.
 * delta_percent = (staffed - estimated) / estimated × 100
 */
export function calculateStaffingComparison(
  estimatedEffortHours: number,
  staffedHours: number
): StaffingComparison {
  const delta_hours = staffedHours - estimatedEffortHours
  const delta_percent = estimatedEffortHours > 0
    ? (delta_hours / estimatedEffortHours) * 100
    : 0

  return {
    estimated_effort_hours: estimatedEffortHours,
    staffed_hours: staffedHours,
    delta_hours,
    delta_percent,
  }
}

// ============================================================================
// Row Management Helpers
// ============================================================================

/**
 * Create a new row with the given id and weekCount empty cells.
 */
export function createStaffingRow(id: number, weekCount: number): StaffingRow {
  return {
    id,
    discipline: '',
    hourly_rate: 0,
    cells: new Array(weekCount).fill(''),
    enabled: true,
    multiplier: 1,
  }
}

/**
 * Create pre-populated rows that allocate totalEffortHours across
 * impliedPeople at hoursPerWeek, filling week-by-week until hours are exhausted.
 */
export function createPrepopulatedRows(
  startId: number,
  weekCount: number,
  impliedPeople: number,
  totalEffortHours: number,
  hoursPerWeek: number
): StaffingRow[] {
  const rows: StaffingRow[] = []
  for (let p = 0; p < impliedPeople; p++) {
    rows.push({
      id: startId + p,
      discipline: '',
      hourly_rate: 0,
      cells: new Array(weekCount).fill(''),
      enabled: true,
      multiplier: 1,
    })
  }

  let remaining = totalEffortHours
  for (let w = 0; w < weekCount && remaining > 0; w++) {
    for (let p = 0; p < impliedPeople && remaining > 0; p++) {
      if (remaining >= hoursPerWeek) {
        rows[p].cells[w] = String(hoursPerWeek)
        remaining -= hoursPerWeek
      } else {
        rows[p].cells[w] = String(Math.round(remaining))
        remaining = 0
      }
    }
  }

  return rows
}

/**
 * Resize all rows' cell arrays to match a new week count.
 * If growing, pad with empty strings.
 * If shrinking, truncate from the end.
 */
export function resizeRowCells(rows: StaffingRow[], newWeekCount: number): StaffingRow[] {
  return rows.map((row) => {
    if (row.cells.length === newWeekCount) return row
    if (row.cells.length < newWeekCount) {
      return {
        ...row,
        cells: [...row.cells, ...new Array(newWeekCount - row.cells.length).fill('')],
      }
    }
    return {
      ...row,
      cells: row.cells.slice(0, newWeekCount),
    }
  })
}
