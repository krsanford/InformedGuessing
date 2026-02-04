import type { WorkItem, EstimationConstants } from './domain/estimation'

export interface AppState {
  workItems: WorkItem[]
  constants: EstimationConstants
  nextId: number
}

export type AppAction =
  | { type: 'ADD_WORK_ITEM' }
  | { type: 'UPDATE_WORK_ITEM'; id: string | number; updates: Partial<Omit<WorkItem, 'id'>> }
  | { type: 'REMOVE_WORK_ITEM'; id: string | number }
  | { type: 'UPDATE_CONSTANTS'; updates: Partial<EstimationConstants> }
  | { type: 'RESET_CONSTANTS' }
  | { type: 'LOAD_SESSION'; session: AppState }
