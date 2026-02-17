/**
 * Pure functions for estimation math.
 * All formulas must match docs/estimation-math-spec.md
 */

// ============================================================================
// Types
// ============================================================================

export interface EstimationConstants {
  expected_case_position: number; // 0-1, default 0.6
  range_spread_divisor: number; // >0, default 2.6
  billable_hours_per_week: number; // >0, default 36
  duration_scaling_power: number; // >0, default 3.2
  coordination_cost_per_pair: number; // 0.5-8, default 1
}

export interface WorkItem {
  id: number;
  title: string
  notes: string
  best_case_hours: number;
  worst_case_hours: number;
  enabled: boolean;
  multiplier: number;
  groupId?: number;
}

export const GROUP_COLOR_PALETTE = [
  { key: 'indigo', value: '#4338CA' },
  { key: 'amber',  value: '#D97706' },
  { key: 'teal',   value: '#0F766E' },
  { key: 'rose',   value: '#E11D48' },
  { key: 'sky',    value: '#0284C7' },
  { key: 'lime',   value: '#65A30D' },
] as const

export type GroupColorKey = typeof GROUP_COLOR_PALETTE[number]['key']

export interface WorkItemGroup {
  id: number
  name: string
  color: GroupColorKey
  enabled: boolean
  collapsed: boolean
  multiplier: number
}

export interface GroupSubtotals {
  total_expected_hours: number
  total_variance: number
  portfolio_range_spread: number
  item_count: number
  enabled_item_count: number
}

export interface WorkItemCalculated extends WorkItem {
  expected_hours: number;
  range_spread_hours: number;
  variance: number;
}

export interface PortfolioResults {
  total_expected_hours: number;
  total_variance: number;
  portfolio_range_spread: number;
  total_effort_hours: number;
  total_effort_staff_weeks: number;
  duration_weeks: number;
}

// ============================================================================
// Default Constants
// ============================================================================

export const DEFAULT_CONSTANTS: EstimationConstants = {
  expected_case_position: 0.6,
  range_spread_divisor: 2.6,
  billable_hours_per_week: 36,
  duration_scaling_power: 3.2,
  coordination_cost_per_pair: 1,
};

// ============================================================================
// Validation
// ============================================================================

export function validateWorkItem(item: WorkItem): string | null {
  if (item.best_case_hours < 0) {
    return 'Best case hours cannot be negative';
  }
  if (item.worst_case_hours < item.best_case_hours) {
    return 'Worst case hours cannot be less than best case hours';
  }
  return null;
}

export function validateConstants(constants: EstimationConstants): string | null {
  if (constants.expected_case_position < 0 || constants.expected_case_position > 1) {
    return 'Expected case position must be between 0 and 1';
  }
  if (constants.range_spread_divisor <= 0) {
    return 'Range spread divisor must be greater than 0';
  }
  if (constants.billable_hours_per_week <= 0) {
    return 'Billable hours per week must be greater than 0';
  }
  if (constants.duration_scaling_power <= 0) {
    return 'Duration scaling power must be greater than 0';
  }
  if (constants.coordination_cost_per_pair < 0.5 || constants.coordination_cost_per_pair > 8) {
    return 'Coordination cost per pair must be between 0.5 and 8';
  }
  return null;
}

// ============================================================================
// Individual Work Item Calculations
// ============================================================================

/**
 * Calculate expected hours for a work item
 * Formula: expected = best + expected_case_position × (worst - best)
 */
export function calculateExpectedHours(
  best_case_hours: number,
  worst_case_hours: number,
  expected_case_position: number
): number {
  return best_case_hours + expected_case_position * (worst_case_hours - best_case_hours);
}

/**
 * Calculate range spread for a work item
 * Formula: range_spread = (worst - best) / range_spread_divisor
 */
export function calculateRangeSpread(
  best_case_hours: number,
  worst_case_hours: number,
  range_spread_divisor: number
): number {
  return (worst_case_hours - best_case_hours) / range_spread_divisor;
}

/**
 * Calculate variance for a work item
 * Formula: variance = range_spread²
 */
export function calculateVariance(range_spread_hours: number): number {
  return range_spread_hours * range_spread_hours;
}

/**
 * Calculate all metrics for a single work item
 */
export function calculateWorkItem(
  item: WorkItem,
  constants: EstimationConstants
): WorkItemCalculated {
  const expected_hours = calculateExpectedHours(
    item.best_case_hours,
    item.worst_case_hours,
    constants.expected_case_position
  );

  const range_spread_hours = calculateRangeSpread(
    item.best_case_hours,
    item.worst_case_hours,
    constants.range_spread_divisor
  );

  const variance = calculateVariance(range_spread_hours);

  return {
    ...item,
    expected_hours,
    range_spread_hours,
    variance,
  };
}

// ============================================================================
// Portfolio Aggregation
// ============================================================================

/**
 * Calculate total expected hours across all work items
 * Formula: Σ expected_hours_i
 */
export function calculateTotalExpectedHours(items: WorkItemCalculated[]): number {
  return items.reduce((sum, item) => sum + item.expected_hours, 0);
}

/**
 * Calculate total variance across all work items
 * Formula: Σ variance_i
 */
export function calculateTotalVariance(items: WorkItemCalculated[]): number {
  return items.reduce((sum, item) => sum + item.variance, 0);
}

/**
 * Calculate portfolio range spread
 * Formula: √(total_variance)
 */
export function calculatePortfolioRangeSpread(total_variance: number): number {
  return Math.sqrt(total_variance);
}

// ============================================================================
// Effort Estimation
// ============================================================================

/**
 * Calculate total effort with range spread buffer
 * Formula: total_expected_hours + portfolio_range_spread
 */
export function calculateTotalEffortHours(
  total_expected_hours: number,
  portfolio_range_spread: number
): number {
  return total_expected_hours + portfolio_range_spread;
}

/**
 * Convert total effort hours to staff weeks
 * Formula: total_effort_hours / billable_hours_per_week
 */
export function calculateTotalEffortStaffWeeks(
  total_effort_hours: number,
  billable_hours_per_week: number
): number {
  return total_effort_hours / billable_hours_per_week;
}

// ============================================================================
// Duration Estimation
// ============================================================================

/**
 * Calculate project duration in calendar weeks
 * Formula: min(⌈k × E^(1/3)⌉, ⌈E⌉)
 * Cube-root scaling for larger projects, but never exceeds
 * one-person sequential duration (staff-weeks rounded up).
 */
export function calculateDurationWeeks(
  total_effort_staff_weeks: number,
  duration_scaling_power: number
): number {
  if (total_effort_staff_weeks === 0) {
    return 0;
  }
  const scaled = duration_scaling_power * Math.pow(total_effort_staff_weeks, 1 / 3);
  const singlePerson = Math.ceil(total_effort_staff_weeks);
  return Math.min(Math.ceil(scaled), singlePerson);
}

// ============================================================================
// Complete Portfolio Calculation
// ============================================================================

/**
 * Calculate subtotals for a specific group
 */
export function calculateGroupSubtotals(
  items: WorkItemCalculated[],
  groupId: number,
  groupMultiplier: number = 1
): GroupSubtotals {
  const groupItems = items.filter((item) => item.groupId === groupId)
  const enabledItems = groupItems.filter((item) => item.enabled)
  const total_expected_hours = enabledItems.reduce((s, i) => s + i.expected_hours * (i.multiplier ?? 1), 0) * groupMultiplier
  const total_variance = enabledItems.reduce((s, i) => s + i.variance * (i.multiplier ?? 1), 0) * groupMultiplier
  return {
    total_expected_hours,
    total_variance,
    portfolio_range_spread: Math.sqrt(total_variance),
    item_count: groupItems.length,
    enabled_item_count: enabledItems.length,
  }
}

/**
 * Calculate all portfolio results from work items and constants
 */
export function calculatePortfolio(
  items: WorkItem[],
  constants: EstimationConstants,
  groups?: WorkItemGroup[]
): PortfolioResults {
  // Validate constants
  const constantsError = validateConstants(constants);
  if (constantsError) {
    throw new Error(`Invalid constants: ${constantsError}`);
  }

  // Build group lookup for enabled check
  const groupMap = new Map<number, WorkItemGroup>()
  if (groups) {
    for (const g of groups) groupMap.set(g.id, g)
  }

  // Calculate valid work items, skip invalid ones
  // Multiplier scales as N independent copies: expected×N, variance×N
  const calculatedItems: WorkItemCalculated[] = items
    .filter((item) => {
      if (!item.enabled) return false
      if (item.groupId != null) {
        const group = groupMap.get(item.groupId)
        if (group && !group.enabled) return false
      }
      return validateWorkItem(item) === null
    })
    .map((item) => {
      const calc = calculateWorkItem(item, constants);
      const groupMult = item.groupId != null ? (groupMap.get(item.groupId)?.multiplier ?? 1) : 1
      const n = (item.multiplier ?? 1) * groupMult;
      return n === 1 ? calc : {
        ...calc,
        expected_hours: calc.expected_hours * n,
        variance: calc.variance * n,
      };
    });

  // Portfolio aggregation
  const total_expected_hours = calculateTotalExpectedHours(calculatedItems);
  const total_variance = calculateTotalVariance(calculatedItems);
  const portfolio_range_spread = calculatePortfolioRangeSpread(total_variance);

  // Effort estimation
  const total_effort_hours = calculateTotalEffortHours(
    total_expected_hours,
    portfolio_range_spread
  );
  const total_effort_staff_weeks = calculateTotalEffortStaffWeeks(
    total_effort_hours,
    constants.billable_hours_per_week
  );

  // Duration estimation
  const duration_weeks = calculateDurationWeeks(
    total_effort_staff_weeks,
    constants.duration_scaling_power
  );

  return {
    total_expected_hours,
    total_variance,
    portfolio_range_spread,
    total_effort_hours,
    total_effort_staff_weeks,
    duration_weeks,
  };
}
