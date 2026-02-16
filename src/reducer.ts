import { DEFAULT_CONSTANTS } from './domain/estimation'
import { createStaffingRow, createPrepopulatedRows, resizeRowCells } from './domain/staffing'
import type { AppState, AppAction, StaffingState } from './types'

const DEFAULT_STAFFING: StaffingState = {
  rows: [],
  week_count: 0,
  nextRowId: 1,
}

export const initialState: AppState = {
  workItems: [
    {
      id: 1,
      title: '',
      notes: '',
      best_case_hours: 0,
      worst_case_hours: 0,
      enabled: true,
      multiplier: 1,
    },
  ],
  constants: DEFAULT_CONSTANTS,
  nextId: 2,
  staffing: DEFAULT_STAFFING,
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_WORK_ITEM':
      return {
        ...state,
        workItems: [
          ...state.workItems,
          {
            id: state.nextId,
            title: '',
            notes: '',
            best_case_hours: 0,
            worst_case_hours: 0,
            enabled: true,
            multiplier: 1,
          },
        ],
        nextId: state.nextId + 1,
      }

    case 'UPDATE_WORK_ITEM':
      return {
        ...state,
        workItems: state.workItems.map((item) =>
          item.id === action.id ? { ...item, ...action.updates } : item
        ),
      }

    case 'REMOVE_WORK_ITEM':
      return {
        ...state,
        workItems: state.workItems.filter((item) => item.id !== action.id),
      }

    case 'TOGGLE_WORK_ITEM':
      return {
        ...state,
        workItems: state.workItems.map((item) =>
          item.id === action.id ? { ...item, enabled: !item.enabled } : item
        ),
      }

    case 'DUPLICATE_WORK_ITEM': {
      const sourceIndex = state.workItems.findIndex((item) => item.id === action.id)
      if (sourceIndex === -1) return state
      const source = state.workItems[sourceIndex]
      const clone = { ...source, id: state.nextId, multiplier: source.multiplier ?? 1 }
      const newItems = [...state.workItems]
      newItems.splice(sourceIndex + 1, 0, clone)
      return { ...state, workItems: newItems, nextId: state.nextId + 1 }
    }

    case 'UPDATE_CONSTANTS':
      return {
        ...state,
        constants: { ...state.constants, ...action.updates },
      }

    case 'RESET_CONSTANTS':
      return {
        ...state,
        constants: DEFAULT_CONSTANTS,
      }

    case 'LOAD_SESSION':
      return {
        ...action.session,
        staffing: action.session.staffing ?? DEFAULT_STAFFING,
      }

    // ========================================================================
    // Staffing Actions
    // ========================================================================

    case 'STAFFING_ADD_ROW':
      return {
        ...state,
        staffing: {
          ...state.staffing,
          rows: [
            ...state.staffing.rows,
            createStaffingRow(state.staffing.nextRowId, state.staffing.week_count),
          ],
          nextRowId: state.staffing.nextRowId + 1,
        },
      }

    case 'DUPLICATE_STAFFING_ROW': {
      const srcIdx = state.staffing.rows.findIndex((r) => r.id === action.rowId)
      if (srcIdx === -1) return state
      const src = state.staffing.rows[srcIdx]
      const dup = { ...src, id: state.staffing.nextRowId, cells: [...src.cells], multiplier: src.multiplier ?? 1 }
      const newRows = [...state.staffing.rows]
      newRows.splice(srcIdx + 1, 0, dup)
      return {
        ...state,
        staffing: { ...state.staffing, rows: newRows, nextRowId: state.staffing.nextRowId + 1 },
      }
    }

    case 'STAFFING_REMOVE_ROW':
      return {
        ...state,
        staffing: {
          ...state.staffing,
          rows: state.staffing.rows.filter((r) => r.id !== action.rowId),
        },
      }

    case 'STAFFING_UPDATE_ROW':
      return {
        ...state,
        staffing: {
          ...state.staffing,
          rows: state.staffing.rows.map((r) =>
            r.id === action.rowId ? { ...r, ...action.updates } : r
          ),
        },
      }

    case 'STAFFING_UPDATE_CELL':
      return {
        ...state,
        staffing: {
          ...state.staffing,
          rows: state.staffing.rows.map((r) =>
            r.id === action.rowId
              ? {
                  ...r,
                  cells: r.cells.map((c, i) =>
                    i === action.weekIndex ? action.value : c
                  ),
                }
              : r
          ),
        },
      }

    case 'STAFFING_TOGGLE_ROW':
      return {
        ...state,
        staffing: {
          ...state.staffing,
          rows: state.staffing.rows.map((r) =>
            r.id === action.rowId ? { ...r, enabled: !r.enabled } : r
          ),
        },
      }

    case 'STAFFING_SET_WEEK_COUNT': {
      const newCount = Math.max(0, action.weekCount)
      return {
        ...state,
        staffing: {
          ...state.staffing,
          week_count: newCount,
          rows: resizeRowCells(state.staffing.rows, newCount),
        },
      }
    }

    case 'STAFFING_INIT_FROM_ESTIMATE': {
      const rows = createPrepopulatedRows(
        state.staffing.nextRowId,
        action.weekCount,
        action.impliedPeople,
        action.totalEffortHours,
        action.hoursPerWeek
      )
      return {
        ...state,
        staffing: {
          ...state.staffing,
          week_count: action.weekCount,
          rows,
          nextRowId: state.staffing.nextRowId + action.impliedPeople,
        },
      }
    }

    default:
      return state
  }
}
