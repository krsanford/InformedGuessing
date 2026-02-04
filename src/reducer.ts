import { DEFAULT_CONSTANTS } from './domain/estimation'
import type { AppState, AppAction } from './types'

export const initialState: AppState = {
  workItems: [],
  constants: DEFAULT_CONSTANTS,
  nextId: 1,
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
      return action.session

    default:
      return state
  }
}
