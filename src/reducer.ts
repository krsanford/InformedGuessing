import { DEFAULT_CONSTANTS } from './domain/estimation'
import { createStaffingRow, resizeRowCells } from './domain/staffing'
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

    case 'STAFFING_INIT_FROM_ESTIMATE':
      return {
        ...state,
        staffing: {
          ...state.staffing,
          week_count: action.weekCount,
          rows: resizeRowCells(state.staffing.rows, action.weekCount),
        },
      }

    default:
      return state
  }
}
