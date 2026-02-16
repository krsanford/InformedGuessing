import type { WorkItem, EstimationConstants } from './domain/estimation'

// ============================================================================
// Staffing Plan Types
// ============================================================================

export interface StaffingRow {
  id: number
  discipline: string
  hourly_rate: number
  cells: string[]
  enabled: boolean
  multiplier: number
}

export interface StaffingState {
  rows: StaffingRow[]
  week_count: number
  nextRowId: number
}

export interface StaffingRowComputed {
  total_hours: number
  total_cost: number
}

export interface StaffingGridComputed {
  row_totals: StaffingRowComputed[]
  week_totals: number[]
  grand_total_hours: number
  grand_total_cost: number
  grand_total_cost_raw: number
}

export interface StaffingComparison {
  estimated_effort_hours: number
  staffed_hours: number
  delta_hours: number
  delta_percent: number
}

// ============================================================================
// App State
// ============================================================================

export interface AppState {
  workItems: WorkItem[]
  constants: EstimationConstants
  nextId: number
  staffing: StaffingState
}

export type AppAction =
  | { type: 'ADD_WORK_ITEM' }
  | { type: 'UPDATE_WORK_ITEM'; id: number; updates: Partial<Omit<WorkItem, 'id'>> }
  | { type: 'REMOVE_WORK_ITEM'; id: number }
  | { type: 'TOGGLE_WORK_ITEM'; id: number }
  | { type: 'UPDATE_CONSTANTS'; updates: Partial<EstimationConstants> }
  | { type: 'RESET_CONSTANTS' }
  | { type: 'LOAD_SESSION'; session: AppState }
  | { type: 'STAFFING_ADD_ROW' }
  | { type: 'STAFFING_REMOVE_ROW'; rowId: number }
  | { type: 'STAFFING_UPDATE_ROW'; rowId: number; updates: Partial<Omit<StaffingRow, 'id' | 'cells'>> }
  | { type: 'STAFFING_UPDATE_CELL'; rowId: number; weekIndex: number; value: string }
  | { type: 'STAFFING_SET_WEEK_COUNT'; weekCount: number }
  | { type: 'STAFFING_TOGGLE_ROW'; rowId: number }
  | { type: 'DUPLICATE_WORK_ITEM'; id: number }
  | { type: 'DUPLICATE_STAFFING_ROW'; rowId: number }
  | { type: 'STAFFING_INIT_FROM_ESTIMATE'; weekCount: number; impliedPeople: number; totalEffortHours: number; hoursPerWeek: number }
