/**
 * Pure functions for coordination overhead calculations.
 * All formulas must match docs/coordination-overhead-spec.md
 *
 * Brooks's Law: N people create N(N-1)/2 communication channels.
 * Each channel consumes real coordination time (standups, reviews, syncs).
 * This module quantifies that cost from the actual staffing grid.
 */

import type { StaffingRow } from '../types'
import { parseCellHours } from './staffing'

// ============================================================================
// Types
// ============================================================================

export interface CoordinationResult {
  active_people_per_week: number[]
  coordination_hours_per_week: number[]
  total_coordination_hours: number
  average_active_people: number
}

export interface GapDecomposition {
  base_effort_hours: number
  coordination_overhead_hours: number
  adjusted_effort_hours: number
  staffed_hours: number
  effective_productive_hours: number
  remaining_buffer_hours: number
  buffer_status: 'buffered' | 'tight' | 'short'
}

// ============================================================================
// Active People Counting
// ============================================================================

/**
 * Count active people (rows with productive hours > 0) for each week.
 * A person is "active" if their cell parses to a positive number.
 * Annotations ("PTO", "Holiday"), empty cells, and zero all count as inactive.
 */
export function getActivePeoplePerWeek(rows: StaffingRow[], weekCount: number): number[] {
  const result = new Array(weekCount).fill(0)
  for (let w = 0; w < weekCount; w++) {
    for (const row of rows) {
      const hours = parseCellHours(row.cells[w] ?? '')
      if (hours > 0) {
        result[w]++
      }
    }
  }
  return result
}

// ============================================================================
// Coordination Calculations
// ============================================================================

/**
 * Calculate coordination hours for a single week given active people count.
 * Formula: alpha * N * (N - 1) / 2
 */
export function calculateWeeklyCoordination(activePeople: number, alpha: number): number {
  if (activePeople <= 1) return 0
  return alpha * activePeople * (activePeople - 1) / 2
}

/**
 * Calculate full coordination analysis across all weeks of the staffing grid.
 *
 * The cube-root duration formula already bakes in coordination overhead for
 * the "implied" team size (ceil(staff_weeks / duration_weeks)). We only charge
 * the incremental coordination for people beyond that number each week.
 */
export function calculateCoordination(
  rows: StaffingRow[],
  weekCount: number,
  alpha: number,
  impliedTeamSize: number = 0
): CoordinationResult {
  const active_people_per_week = getActivePeoplePerWeek(rows, weekCount)
  const bakedIn = calculateWeeklyCoordination(impliedTeamSize, alpha)
  const coordination_hours_per_week = active_people_per_week.map((n) => {
    const raw = calculateWeeklyCoordination(n, alpha)
    return Math.max(0, raw - bakedIn)
  })
  const total_coordination_hours = coordination_hours_per_week.reduce((sum, h) => sum + h, 0)

  // Average active people across weeks where anyone is active
  const activeWeeks = active_people_per_week.filter((n) => n > 0)
  const average_active_people = activeWeeks.length > 0
    ? activeWeeks.reduce((sum, n) => sum + n, 0) / activeWeeks.length
    : 0

  return {
    active_people_per_week,
    coordination_hours_per_week,
    total_coordination_hours,
    average_active_people,
  }
}

// ============================================================================
// Gap Decomposition
// ============================================================================

/**
 * Decompose the staffing gap into coordination overhead and remaining buffer.
 *
 * adjusted_effort = base_effort + coordination_overhead
 * remaining_buffer = staffed_hours - adjusted_effort
 * buffer_status:
 *   - 'buffered' if remaining > 0
 *   - 'tight' if remaining is 0 (within 1 hour)
 *   - 'short' if remaining < 0
 */
export function calculateGapDecomposition(
  baseEffortHours: number,
  totalCoordinationHours: number,
  staffedHours: number
): GapDecomposition {
  const adjusted_effort_hours = baseEffortHours + totalCoordinationHours
  const effective_productive_hours = staffedHours - totalCoordinationHours
  const remaining_buffer_hours = staffedHours - adjusted_effort_hours

  let buffer_status: GapDecomposition['buffer_status']
  if (remaining_buffer_hours > 1) {
    buffer_status = 'buffered'
  } else if (remaining_buffer_hours >= -1) {
    buffer_status = 'tight'
  } else {
    buffer_status = 'short'
  }

  return {
    base_effort_hours: baseEffortHours,
    coordination_overhead_hours: totalCoordinationHours,
    adjusted_effort_hours,
    staffed_hours: staffedHours,
    effective_productive_hours,
    remaining_buffer_hours,
    buffer_status,
  }
}

