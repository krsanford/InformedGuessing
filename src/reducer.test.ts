import { describe, it, expect } from 'vitest'
import { appReducer, initialState } from './reducer'
import { DEFAULT_CONSTANTS } from './domain/estimation'
import type { AppState } from './types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convenience: produce a state that already has two work items and some staffing rows. */
function stateWithTwoItems(): AppState {
  return {
    workItems: [
      { id: 1, title: 'Item A', notes: '', best_case_hours: 10, worst_case_hours: 20, enabled: true, multiplier: 1 },
      { id: 2, title: 'Item B', notes: '', best_case_hours: 5, worst_case_hours: 15, enabled: true, multiplier: 1 },
    ],
    constants: DEFAULT_CONSTANTS,
    nextId: 3,
    staffing: {
      rows: [
        { id: 1, discipline: 'Dev', hourly_rate: 100, cells: ['36', '36'], enabled: true, multiplier: 1 },
        { id: 2, discipline: 'QA', hourly_rate: 80, cells: ['20', '20'], enabled: true, multiplier: 1 },
      ],
      week_count: 2,
      nextRowId: 3,
    },
    groups: [],
    nextGroupId: 1,
  }
}

/** Convenience: produce a state with three work items for reorder tests. */
function stateWithThreeItems(): AppState {
  return {
    workItems: [
      { id: 1, title: 'First', notes: '', best_case_hours: 1, worst_case_hours: 2, enabled: true, multiplier: 1 },
      { id: 2, title: 'Second', notes: '', best_case_hours: 3, worst_case_hours: 4, enabled: true, multiplier: 1 },
      { id: 3, title: 'Third', notes: '', best_case_hours: 5, worst_case_hours: 6, enabled: true, multiplier: 1 },
    ],
    constants: DEFAULT_CONSTANTS,
    nextId: 4,
    staffing: { rows: [], week_count: 0, nextRowId: 1 },
    groups: [],
    nextGroupId: 1,
  }
}

/** Convenience: produce a state with three staffing rows for reorder tests. */
function stateWithThreeStaffingRows(): AppState {
  return {
    ...initialState,
    staffing: {
      rows: [
        { id: 1, discipline: 'Dev', hourly_rate: 100, cells: [], enabled: true, multiplier: 1 },
        { id: 2, discipline: 'QA', hourly_rate: 80, cells: [], enabled: true, multiplier: 1 },
        { id: 3, discipline: 'PM', hourly_rate: 90, cells: [], enabled: true, multiplier: 1 },
      ],
      week_count: 0,
      nextRowId: 4,
    },
  }
}

// ===========================================================================
// Tests
// ===========================================================================

describe('appReducer', () => {
  // -------------------------------------------------------------------------
  // Initial state sanity
  // -------------------------------------------------------------------------
  describe('initialState', () => {
    it('has one empty work item with id 1', () => {
      expect(initialState.workItems).toHaveLength(1)
      expect(initialState.workItems[0]).toEqual({
        id: 1,
        title: '',
        notes: '',
        best_case_hours: 0,
        worst_case_hours: 0,
        enabled: true,
        multiplier: 1,
      })
    })

    it('has nextId set to 2', () => {
      expect(initialState.nextId).toBe(2)
    })

    it('uses DEFAULT_CONSTANTS', () => {
      expect(initialState.constants).toEqual(DEFAULT_CONSTANTS)
    })

    it('has empty staffing state', () => {
      expect(initialState.staffing).toEqual({
        rows: [],
        week_count: 0,
        nextRowId: 1,
      })
    })
  })

  // -------------------------------------------------------------------------
  // 1. ADD_WORK_ITEM
  // -------------------------------------------------------------------------
  describe('ADD_WORK_ITEM', () => {
    it('appends a new blank work item with the current nextId', () => {
      const state = appReducer(initialState, { type: 'ADD_WORK_ITEM' })
      expect(state.workItems).toHaveLength(2)
      expect(state.workItems[1]).toEqual({
        id: 2,
        title: '',
        notes: '',
        best_case_hours: 0,
        worst_case_hours: 0,
        enabled: true,
        multiplier: 1,
      })
    })

    it('increments nextId', () => {
      const state = appReducer(initialState, { type: 'ADD_WORK_ITEM' })
      expect(state.nextId).toBe(3)
    })

    it('preserves existing work items', () => {
      const state = appReducer(initialState, { type: 'ADD_WORK_ITEM' })
      expect(state.workItems[0]).toEqual(initialState.workItems[0])
    })

    it('does not mutate constants or staffing', () => {
      const state = appReducer(initialState, { type: 'ADD_WORK_ITEM' })
      expect(state.constants).toBe(initialState.constants)
      expect(state.staffing).toBe(initialState.staffing)
    })
  })

  // -------------------------------------------------------------------------
  // 2. UPDATE_WORK_ITEM
  // -------------------------------------------------------------------------
  describe('UPDATE_WORK_ITEM', () => {
    it('updates a matching work item with partial updates', () => {
      const state = appReducer(initialState, {
        type: 'UPDATE_WORK_ITEM',
        id: 1,
        updates: { title: 'Backend API', best_case_hours: 10 },
      })
      expect(state.workItems[0].title).toBe('Backend API')
      expect(state.workItems[0].best_case_hours).toBe(10)
      // unchanged fields preserved
      expect(state.workItems[0].worst_case_hours).toBe(0)
      expect(state.workItems[0].enabled).toBe(true)
    })

    it('does not modify non-matching items', () => {
      const base = stateWithTwoItems()
      const state = appReducer(base, {
        type: 'UPDATE_WORK_ITEM',
        id: 1,
        updates: { title: 'Changed' },
      })
      expect(state.workItems[1]).toEqual(base.workItems[1])
    })

    it('returns unchanged state when id not found', () => {
      const state = appReducer(initialState, {
        type: 'UPDATE_WORK_ITEM',
        id: 999,
        updates: { title: 'Ghost' },
      })
      // workItems array is still a new reference (map always returns new array),
      // but contents are identical
      expect(state.workItems).toHaveLength(1)
      expect(state.workItems[0]).toEqual(initialState.workItems[0])
    })
  })

  // -------------------------------------------------------------------------
  // 3. REMOVE_WORK_ITEM
  // -------------------------------------------------------------------------
  describe('REMOVE_WORK_ITEM', () => {
    it('removes the item with the given id', () => {
      const base = stateWithTwoItems()
      const state = appReducer(base, { type: 'REMOVE_WORK_ITEM', id: 1 })
      expect(state.workItems).toHaveLength(1)
      expect(state.workItems[0].id).toBe(2)
    })

    it('allows removing down to zero items', () => {
      const state = appReducer(initialState, { type: 'REMOVE_WORK_ITEM', id: 1 })
      expect(state.workItems).toHaveLength(0)
    })

    it('is a no-op for a non-existent id', () => {
      const base = stateWithTwoItems()
      const state = appReducer(base, { type: 'REMOVE_WORK_ITEM', id: 999 })
      expect(state.workItems).toHaveLength(2)
    })

    it('does not change nextId', () => {
      const base = stateWithTwoItems()
      const state = appReducer(base, { type: 'REMOVE_WORK_ITEM', id: 1 })
      expect(state.nextId).toBe(base.nextId)
    })
  })

  // -------------------------------------------------------------------------
  // 4. TOGGLE_WORK_ITEM
  // -------------------------------------------------------------------------
  describe('TOGGLE_WORK_ITEM', () => {
    it('flips enabled from true to false', () => {
      const state = appReducer(initialState, { type: 'TOGGLE_WORK_ITEM', id: 1 })
      expect(state.workItems[0].enabled).toBe(false)
    })

    it('flips enabled from false to true', () => {
      const base: AppState = {
        ...initialState,
        workItems: [{ ...initialState.workItems[0], enabled: false }],
      }
      const state = appReducer(base, { type: 'TOGGLE_WORK_ITEM', id: 1 })
      expect(state.workItems[0].enabled).toBe(true)
    })

    it('does not change other items', () => {
      const base = stateWithTwoItems()
      const state = appReducer(base, { type: 'TOGGLE_WORK_ITEM', id: 1 })
      expect(state.workItems[1].enabled).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // 5. DUPLICATE_WORK_ITEM
  // -------------------------------------------------------------------------
  describe('DUPLICATE_WORK_ITEM', () => {
    it('inserts a clone immediately after the source item', () => {
      const base = stateWithTwoItems()
      const state = appReducer(base, { type: 'DUPLICATE_WORK_ITEM', id: 1 })
      expect(state.workItems).toHaveLength(3)
      expect(state.workItems[0].id).toBe(1) // original
      expect(state.workItems[1].id).toBe(3) // clone gets nextId
      expect(state.workItems[2].id).toBe(2) // existing item pushed down
    })

    it('clone copies title, hours, enabled, and notes from source', () => {
      const base = stateWithTwoItems()
      const state = appReducer(base, { type: 'DUPLICATE_WORK_ITEM', id: 1 })
      const clone = state.workItems[1]
      expect(clone.title).toBe('Item A')
      expect(clone.best_case_hours).toBe(10)
      expect(clone.worst_case_hours).toBe(20)
      expect(clone.enabled).toBe(true)
    })

    it('clone gets a new unique id (nextId) and nextId increments', () => {
      const base = stateWithTwoItems()
      const state = appReducer(base, { type: 'DUPLICATE_WORK_ITEM', id: 1 })
      expect(state.workItems[1].id).toBe(base.nextId)
      expect(state.nextId).toBe(base.nextId + 1)
    })

    it('defaults multiplier to 1 when source has no multiplier', () => {
      const base: AppState = {
        ...initialState,
        workItems: [
          { id: 1, title: 'X', notes: '', best_case_hours: 1, worst_case_hours: 2, enabled: true, multiplier: undefined as unknown as number },
        ],
      }
      const state = appReducer(base, { type: 'DUPLICATE_WORK_ITEM', id: 1 })
      expect(state.workItems[1].multiplier).toBe(1)
    })

    it('returns unchanged state when source id does not exist', () => {
      const base = stateWithTwoItems()
      const state = appReducer(base, { type: 'DUPLICATE_WORK_ITEM', id: 999 })
      expect(state).toBe(base) // exact same reference
    })
  })

  // -------------------------------------------------------------------------
  // 6. UPDATE_CONSTANTS
  // -------------------------------------------------------------------------
  describe('UPDATE_CONSTANTS', () => {
    it('merges partial constant updates', () => {
      const state = appReducer(initialState, {
        type: 'UPDATE_CONSTANTS',
        updates: { expected_case_position: 0.5, billable_hours_per_week: 40 },
      })
      expect(state.constants.expected_case_position).toBe(0.5)
      expect(state.constants.billable_hours_per_week).toBe(40)
      // others unchanged
      expect(state.constants.range_spread_divisor).toBe(DEFAULT_CONSTANTS.range_spread_divisor)
      expect(state.constants.duration_scaling_power).toBe(DEFAULT_CONSTANTS.duration_scaling_power)
      expect(state.constants.coordination_cost_per_pair).toBe(DEFAULT_CONSTANTS.coordination_cost_per_pair)
    })

    it('does not touch workItems or staffing', () => {
      const base = stateWithTwoItems()
      const state = appReducer(base, {
        type: 'UPDATE_CONSTANTS',
        updates: { range_spread_divisor: 3 },
      })
      expect(state.workItems).toBe(base.workItems)
      expect(state.staffing).toBe(base.staffing)
    })
  })

  // -------------------------------------------------------------------------
  // 7. RESET_CONSTANTS
  // -------------------------------------------------------------------------
  describe('RESET_CONSTANTS', () => {
    it('resets constants to DEFAULT_CONSTANTS', () => {
      const modified: AppState = {
        ...initialState,
        constants: {
          expected_case_position: 0.3,
          range_spread_divisor: 4,
          billable_hours_per_week: 20,
          duration_scaling_power: 5,
          coordination_cost_per_pair: 2,
        },
      }
      const state = appReducer(modified, { type: 'RESET_CONSTANTS' })
      expect(state.constants).toEqual(DEFAULT_CONSTANTS)
    })

    it('is a no-op if constants were already default', () => {
      const state = appReducer(initialState, { type: 'RESET_CONSTANTS' })
      expect(state.constants).toEqual(DEFAULT_CONSTANTS)
    })
  })

  // -------------------------------------------------------------------------
  // 8. LOAD_SESSION
  // -------------------------------------------------------------------------
  describe('LOAD_SESSION', () => {
    it('replaces state entirely with the provided session', () => {
      const session: AppState = {
        workItems: [
          { id: 10, title: 'Loaded', notes: 'n', best_case_hours: 1, worst_case_hours: 2, enabled: true, multiplier: 1 },
        ],
        constants: { ...DEFAULT_CONSTANTS, expected_case_position: 0.7 },
        nextId: 11,
        staffing: { rows: [], week_count: 5, nextRowId: 1 },
        groups: [],
        nextGroupId: 1,
      }
      const state = appReducer(initialState, { type: 'LOAD_SESSION', session })
      expect(state.workItems).toEqual(session.workItems)
      expect(state.constants).toEqual(session.constants)
      expect(state.nextId).toBe(11)
      expect(state.staffing.week_count).toBe(5)
    })

    it('provides default staffing when session has no staffing property', () => {
      const sessionWithoutStaffing = {
        workItems: [],
        constants: DEFAULT_CONSTANTS,
        nextId: 1,
      } as unknown as AppState // simulate legacy session without staffing
      const state = appReducer(initialState, { type: 'LOAD_SESSION', session: sessionWithoutStaffing })
      expect(state.staffing).toEqual({ rows: [], week_count: 0, nextRowId: 1 })
    })

    it('keeps staffing when session includes it', () => {
      const session: AppState = {
        workItems: [],
        constants: DEFAULT_CONSTANTS,
        nextId: 1,
        staffing: {
          rows: [{ id: 1, discipline: 'Dev', hourly_rate: 150, cells: ['40'], enabled: true, multiplier: 1 }],
          week_count: 1,
          nextRowId: 2,
        },
        groups: [],
        nextGroupId: 1,
      }
      const state = appReducer(initialState, { type: 'LOAD_SESSION', session })
      expect(state.staffing.rows).toHaveLength(1)
      expect(state.staffing.rows[0].discipline).toBe('Dev')
    })
  })

  // -------------------------------------------------------------------------
  // 9. STAFFING_ADD_ROW
  // -------------------------------------------------------------------------
  describe('STAFFING_ADD_ROW', () => {
    it('adds an empty row with the current nextRowId', () => {
      const base = stateWithTwoItems()
      const state = appReducer(base, { type: 'STAFFING_ADD_ROW' })
      expect(state.staffing.rows).toHaveLength(3)
      const newRow = state.staffing.rows[2]
      expect(newRow.id).toBe(3) // base.staffing.nextRowId
      expect(newRow.discipline).toBe('')
      expect(newRow.hourly_rate).toBe(0)
      expect(newRow.cells).toEqual(['', '']) // matches week_count of 2
      expect(newRow.enabled).toBe(true)
      expect(newRow.multiplier).toBe(1)
    })

    it('increments nextRowId', () => {
      const base = stateWithTwoItems()
      const state = appReducer(base, { type: 'STAFFING_ADD_ROW' })
      expect(state.staffing.nextRowId).toBe(4)
    })

    it('creates row with zero cells when week_count is 0', () => {
      const state = appReducer(initialState, { type: 'STAFFING_ADD_ROW' })
      expect(state.staffing.rows[0].cells).toEqual([])
    })
  })

  // -------------------------------------------------------------------------
  // 10. DUPLICATE_STAFFING_ROW
  // -------------------------------------------------------------------------
  describe('DUPLICATE_STAFFING_ROW', () => {
    it('inserts a clone immediately after the source row', () => {
      const base = stateWithTwoItems()
      const state = appReducer(base, { type: 'DUPLICATE_STAFFING_ROW', rowId: 1 })
      expect(state.staffing.rows).toHaveLength(3)
      expect(state.staffing.rows[0].id).toBe(1) // original
      expect(state.staffing.rows[1].id).toBe(3) // clone
      expect(state.staffing.rows[2].id).toBe(2) // existing pushed down
    })

    it('clone copies discipline, hourly_rate, cells, and enabled', () => {
      const base = stateWithTwoItems()
      const state = appReducer(base, { type: 'DUPLICATE_STAFFING_ROW', rowId: 1 })
      const clone = state.staffing.rows[1]
      expect(clone.discipline).toBe('Dev')
      expect(clone.hourly_rate).toBe(100)
      expect(clone.cells).toEqual(['36', '36'])
      expect(clone.enabled).toBe(true)
    })

    it('clone cells are a new array (not same reference as source)', () => {
      const base = stateWithTwoItems()
      const state = appReducer(base, { type: 'DUPLICATE_STAFFING_ROW', rowId: 1 })
      expect(state.staffing.rows[1].cells).not.toBe(base.staffing.rows[0].cells)
    })

    it('increments nextRowId', () => {
      const base = stateWithTwoItems()
      const state = appReducer(base, { type: 'DUPLICATE_STAFFING_ROW', rowId: 1 })
      expect(state.staffing.nextRowId).toBe(4)
    })

    it('defaults multiplier to 1 when source multiplier is nullish', () => {
      const base: AppState = {
        ...initialState,
        staffing: {
          rows: [
            { id: 1, discipline: 'X', hourly_rate: 0, cells: [], enabled: true, multiplier: undefined as unknown as number },
          ],
          week_count: 0,
          nextRowId: 2,
        },
      }
      const state = appReducer(base, { type: 'DUPLICATE_STAFFING_ROW', rowId: 1 })
      expect(state.staffing.rows[1].multiplier).toBe(1)
    })

    it('returns unchanged state when rowId not found', () => {
      const base = stateWithTwoItems()
      const state = appReducer(base, { type: 'DUPLICATE_STAFFING_ROW', rowId: 999 })
      expect(state).toBe(base)
    })
  })

  // -------------------------------------------------------------------------
  // 11. STAFFING_REMOVE_ROW
  // -------------------------------------------------------------------------
  describe('STAFFING_REMOVE_ROW', () => {
    it('removes the row with the given id', () => {
      const base = stateWithTwoItems()
      const state = appReducer(base, { type: 'STAFFING_REMOVE_ROW', rowId: 1 })
      expect(state.staffing.rows).toHaveLength(1)
      expect(state.staffing.rows[0].id).toBe(2)
    })

    it('allows removing all rows', () => {
      const base = stateWithTwoItems()
      let state = appReducer(base, { type: 'STAFFING_REMOVE_ROW', rowId: 1 })
      state = appReducer(state, { type: 'STAFFING_REMOVE_ROW', rowId: 2 })
      expect(state.staffing.rows).toHaveLength(0)
    })

    it('is a no-op for a non-existent rowId', () => {
      const base = stateWithTwoItems()
      const state = appReducer(base, { type: 'STAFFING_REMOVE_ROW', rowId: 999 })
      expect(state.staffing.rows).toHaveLength(2)
    })
  })

  // -------------------------------------------------------------------------
  // 12. STAFFING_UPDATE_ROW
  // -------------------------------------------------------------------------
  describe('STAFFING_UPDATE_ROW', () => {
    it('merges partial updates into the matching row', () => {
      const base = stateWithTwoItems()
      const state = appReducer(base, {
        type: 'STAFFING_UPDATE_ROW',
        rowId: 1,
        updates: { discipline: 'Design', hourly_rate: 120 },
      })
      expect(state.staffing.rows[0].discipline).toBe('Design')
      expect(state.staffing.rows[0].hourly_rate).toBe(120)
      // cells unchanged
      expect(state.staffing.rows[0].cells).toEqual(['36', '36'])
    })

    it('does not modify other rows', () => {
      const base = stateWithTwoItems()
      const state = appReducer(base, {
        type: 'STAFFING_UPDATE_ROW',
        rowId: 1,
        updates: { discipline: 'Changed' },
      })
      expect(state.staffing.rows[1]).toEqual(base.staffing.rows[1])
    })
  })

  // -------------------------------------------------------------------------
  // 13. STAFFING_UPDATE_CELL
  // -------------------------------------------------------------------------
  describe('STAFFING_UPDATE_CELL', () => {
    it('updates a specific cell in the matching row', () => {
      const base = stateWithTwoItems()
      const state = appReducer(base, {
        type: 'STAFFING_UPDATE_CELL',
        rowId: 1,
        weekIndex: 0,
        value: '40',
      })
      expect(state.staffing.rows[0].cells[0]).toBe('40')
      expect(state.staffing.rows[0].cells[1]).toBe('36') // unchanged
    })

    it('accepts non-numeric annotation values', () => {
      const base = stateWithTwoItems()
      const state = appReducer(base, {
        type: 'STAFFING_UPDATE_CELL',
        rowId: 2,
        weekIndex: 1,
        value: 'PTO',
      })
      expect(state.staffing.rows[1].cells[1]).toBe('PTO')
    })

    it('does not modify other rows', () => {
      const base = stateWithTwoItems()
      const state = appReducer(base, {
        type: 'STAFFING_UPDATE_CELL',
        rowId: 1,
        weekIndex: 0,
        value: '40',
      })
      expect(state.staffing.rows[1].cells).toEqual(['20', '20'])
    })
  })

  // -------------------------------------------------------------------------
  // 14. STAFFING_TOGGLE_ROW
  // -------------------------------------------------------------------------
  describe('STAFFING_TOGGLE_ROW', () => {
    it('flips enabled from true to false', () => {
      const base = stateWithTwoItems()
      const state = appReducer(base, { type: 'STAFFING_TOGGLE_ROW', rowId: 1 })
      expect(state.staffing.rows[0].enabled).toBe(false)
    })

    it('flips enabled from false to true', () => {
      const base = stateWithTwoItems()
      // First disable
      let state = appReducer(base, { type: 'STAFFING_TOGGLE_ROW', rowId: 1 })
      // Then re-enable
      state = appReducer(state, { type: 'STAFFING_TOGGLE_ROW', rowId: 1 })
      expect(state.staffing.rows[0].enabled).toBe(true)
    })

    it('does not affect other rows', () => {
      const base = stateWithTwoItems()
      const state = appReducer(base, { type: 'STAFFING_TOGGLE_ROW', rowId: 1 })
      expect(state.staffing.rows[1].enabled).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // 15. STAFFING_SET_WEEK_COUNT
  // -------------------------------------------------------------------------
  describe('STAFFING_SET_WEEK_COUNT', () => {
    it('increases week count and pads cells with empty strings', () => {
      const base = stateWithTwoItems() // week_count: 2
      const state = appReducer(base, { type: 'STAFFING_SET_WEEK_COUNT', weekCount: 4 })
      expect(state.staffing.week_count).toBe(4)
      expect(state.staffing.rows[0].cells).toEqual(['36', '36', '', ''])
      expect(state.staffing.rows[1].cells).toEqual(['20', '20', '', ''])
    })

    it('decreases week count and truncates cells', () => {
      const base = stateWithTwoItems() // week_count: 2
      const state = appReducer(base, { type: 'STAFFING_SET_WEEK_COUNT', weekCount: 1 })
      expect(state.staffing.week_count).toBe(1)
      expect(state.staffing.rows[0].cells).toEqual(['36'])
      expect(state.staffing.rows[1].cells).toEqual(['20'])
    })

    it('enforces minimum of 0 for negative values', () => {
      const base = stateWithTwoItems()
      const state = appReducer(base, { type: 'STAFFING_SET_WEEK_COUNT', weekCount: -5 })
      expect(state.staffing.week_count).toBe(0)
      expect(state.staffing.rows[0].cells).toEqual([])
    })

    it('is a no-op when week count does not change', () => {
      const base = stateWithTwoItems() // week_count: 2
      const state = appReducer(base, { type: 'STAFFING_SET_WEEK_COUNT', weekCount: 2 })
      expect(state.staffing.week_count).toBe(2)
      expect(state.staffing.rows[0].cells).toEqual(['36', '36'])
    })

    it('setting to 0 truncates all cells to empty arrays', () => {
      const base = stateWithTwoItems()
      const state = appReducer(base, { type: 'STAFFING_SET_WEEK_COUNT', weekCount: 0 })
      expect(state.staffing.week_count).toBe(0)
      for (const row of state.staffing.rows) {
        expect(row.cells).toEqual([])
      }
    })
  })

  // -------------------------------------------------------------------------
  // 16. STAFFING_INIT_FROM_ESTIMATE
  // -------------------------------------------------------------------------
  describe('STAFFING_INIT_FROM_ESTIMATE', () => {
    it('creates the correct number of rows', () => {
      const state = appReducer(initialState, {
        type: 'STAFFING_INIT_FROM_ESTIMATE',
        weekCount: 4,
        impliedPeople: 2,
        totalEffortHours: 200,
        hoursPerWeek: 36,
      })
      expect(state.staffing.rows).toHaveLength(2)
    })

    it('sets week_count from action', () => {
      const state = appReducer(initialState, {
        type: 'STAFFING_INIT_FROM_ESTIMATE',
        weekCount: 4,
        impliedPeople: 2,
        totalEffortHours: 200,
        hoursPerWeek: 36,
      })
      expect(state.staffing.week_count).toBe(4)
    })

    it('increments nextRowId by impliedPeople', () => {
      const base: AppState = {
        ...initialState,
        staffing: { rows: [], week_count: 0, nextRowId: 5 },
      }
      const state = appReducer(base, {
        type: 'STAFFING_INIT_FROM_ESTIMATE',
        weekCount: 3,
        impliedPeople: 3,
        totalEffortHours: 300,
        hoursPerWeek: 36,
      })
      expect(state.staffing.nextRowId).toBe(8) // 5 + 3
    })

    it('assigns consecutive ids starting from nextRowId', () => {
      const base: AppState = {
        ...initialState,
        staffing: { rows: [], week_count: 0, nextRowId: 10 },
      }
      const state = appReducer(base, {
        type: 'STAFFING_INIT_FROM_ESTIMATE',
        weekCount: 2,
        impliedPeople: 2,
        totalEffortHours: 100,
        hoursPerWeek: 36,
      })
      expect(state.staffing.rows[0].id).toBe(10)
      expect(state.staffing.rows[1].id).toBe(11)
    })

    it('distributes hours across rows and weeks', () => {
      const state = appReducer(initialState, {
        type: 'STAFFING_INIT_FROM_ESTIMATE',
        weekCount: 3,
        impliedPeople: 1,
        totalEffortHours: 100,
        hoursPerWeek: 36,
      })
      const cells = state.staffing.rows[0].cells
      // Week 1: 36, Week 2: 36, Week 3: 28 (100 - 72 = 28)
      expect(cells[0]).toBe('36')
      expect(cells[1]).toBe('36')
      expect(cells[2]).toBe('28') // Math.round(28)
    })

    it('fills rows week-by-week across people', () => {
      const state = appReducer(initialState, {
        type: 'STAFFING_INIT_FROM_ESTIMATE',
        weekCount: 2,
        impliedPeople: 2,
        totalEffortHours: 144, // exactly 2 people x 2 weeks x 36
        hoursPerWeek: 36,
      })
      expect(state.staffing.rows[0].cells).toEqual(['36', '36'])
      expect(state.staffing.rows[1].cells).toEqual(['36', '36'])
    })

    it('leaves trailing cells empty when hours are exhausted', () => {
      const state = appReducer(initialState, {
        type: 'STAFFING_INIT_FROM_ESTIMATE',
        weekCount: 4,
        impliedPeople: 1,
        totalEffortHours: 72,
        hoursPerWeek: 36,
      })
      const cells = state.staffing.rows[0].cells
      expect(cells[0]).toBe('36')
      expect(cells[1]).toBe('36')
      expect(cells[2]).toBe('')
      expect(cells[3]).toBe('')
    })

    it('does not modify workItems or constants', () => {
      const base = stateWithTwoItems()
      const state = appReducer(base, {
        type: 'STAFFING_INIT_FROM_ESTIMATE',
        weekCount: 2,
        impliedPeople: 1,
        totalEffortHours: 50,
        hoursPerWeek: 36,
      })
      expect(state.workItems).toBe(base.workItems)
      expect(state.constants).toBe(base.constants)
    })
  })

  // -------------------------------------------------------------------------
  // 17. REORDER_WORK_ITEMS
  // -------------------------------------------------------------------------
  describe('REORDER_WORK_ITEMS', () => {
    it('moves an item forward in the list', () => {
      const base = stateWithThreeItems()
      const state = appReducer(base, { type: 'REORDER_WORK_ITEMS', activeId: 1, overId: 3 })
      expect(state.workItems.map((w) => w.id)).toEqual([2, 3, 1])
    })

    it('moves an item backward in the list', () => {
      const base = stateWithThreeItems()
      const state = appReducer(base, { type: 'REORDER_WORK_ITEMS', activeId: 3, overId: 1 })
      expect(state.workItems.map((w) => w.id)).toEqual([3, 1, 2])
    })

    it('moves item to position of adjacent item', () => {
      const base = stateWithThreeItems()
      const state = appReducer(base, { type: 'REORDER_WORK_ITEMS', activeId: 1, overId: 2 })
      expect(state.workItems.map((w) => w.id)).toEqual([2, 1, 3])
    })

    it('returns same state when activeId equals overId', () => {
      const base = stateWithThreeItems()
      const state = appReducer(base, { type: 'REORDER_WORK_ITEMS', activeId: 1, overId: 1 })
      expect(state).toBe(base)
    })

    it('returns same state when activeId not found', () => {
      const base = stateWithThreeItems()
      const state = appReducer(base, { type: 'REORDER_WORK_ITEMS', activeId: 999, overId: 1 })
      expect(state).toBe(base)
    })

    it('returns same state when overId not found', () => {
      const base = stateWithThreeItems()
      const state = appReducer(base, { type: 'REORDER_WORK_ITEMS', activeId: 1, overId: 999 })
      expect(state).toBe(base)
    })

    it('preserves all item data after reorder', () => {
      const base = stateWithThreeItems()
      const state = appReducer(base, { type: 'REORDER_WORK_ITEMS', activeId: 1, overId: 3 })
      const movedItem = state.workItems.find((w) => w.id === 1)
      expect(movedItem).toEqual(base.workItems[0])
    })
  })

  // -------------------------------------------------------------------------
  // 18. REORDER_STAFFING_ROWS
  // -------------------------------------------------------------------------
  describe('REORDER_STAFFING_ROWS', () => {
    it('moves a row forward in the list', () => {
      const base = stateWithThreeStaffingRows()
      const state = appReducer(base, { type: 'REORDER_STAFFING_ROWS', activeId: 1, overId: 3 })
      expect(state.staffing.rows.map((r) => r.id)).toEqual([2, 3, 1])
    })

    it('moves a row backward in the list', () => {
      const base = stateWithThreeStaffingRows()
      const state = appReducer(base, { type: 'REORDER_STAFFING_ROWS', activeId: 3, overId: 1 })
      expect(state.staffing.rows.map((r) => r.id)).toEqual([3, 1, 2])
    })

    it('returns same state when activeId equals overId', () => {
      const base = stateWithThreeStaffingRows()
      const state = appReducer(base, { type: 'REORDER_STAFFING_ROWS', activeId: 1, overId: 1 })
      expect(state).toBe(base)
    })

    it('returns same state when activeId not found', () => {
      const base = stateWithThreeStaffingRows()
      const state = appReducer(base, { type: 'REORDER_STAFFING_ROWS', activeId: 999, overId: 1 })
      expect(state).toBe(base)
    })

    it('returns same state when overId not found', () => {
      const base = stateWithThreeStaffingRows()
      const state = appReducer(base, { type: 'REORDER_STAFFING_ROWS', activeId: 1, overId: 999 })
      expect(state).toBe(base)
    })

    it('preserves row data after reorder', () => {
      const base = stateWithThreeStaffingRows()
      const state = appReducer(base, { type: 'REORDER_STAFFING_ROWS', activeId: 1, overId: 3 })
      const movedRow = state.staffing.rows.find((r) => r.id === 1)
      expect(movedRow).toEqual(base.staffing.rows[0])
    })

    it('does not modify week_count or nextRowId', () => {
      const base = stateWithThreeStaffingRows()
      const state = appReducer(base, { type: 'REORDER_STAFFING_ROWS', activeId: 1, overId: 3 })
      expect(state.staffing.week_count).toBe(base.staffing.week_count)
      expect(state.staffing.nextRowId).toBe(base.staffing.nextRowId)
    })
  })

  // -------------------------------------------------------------------------
  // Default / unknown action
  // -------------------------------------------------------------------------
  describe('default case', () => {
    it('returns unchanged state for an unknown action type', () => {
      const state = appReducer(initialState, { type: 'UNKNOWN_ACTION' } as never)
      expect(state).toBe(initialState)
    })
  })

  // -------------------------------------------------------------------------
  // Cross-cutting: immutability checks
  // -------------------------------------------------------------------------
  describe('immutability', () => {
    it('ADD_WORK_ITEM does not mutate original state', () => {
      const before = { ...initialState, workItems: [...initialState.workItems] }
      appReducer(initialState, { type: 'ADD_WORK_ITEM' })
      expect(initialState.workItems).toHaveLength(before.workItems.length)
      expect(initialState.nextId).toBe(before.nextId)
    })

    it('STAFFING_SET_WEEK_COUNT does not mutate original rows', () => {
      const base = stateWithTwoItems()
      const originalCells = [...base.staffing.rows[0].cells]
      appReducer(base, { type: 'STAFFING_SET_WEEK_COUNT', weekCount: 5 })
      expect(base.staffing.rows[0].cells).toEqual(originalCells)
    })

    it('REORDER_WORK_ITEMS does not mutate original array', () => {
      const base = stateWithThreeItems()
      const originalIds = base.workItems.map((w) => w.id)
      appReducer(base, { type: 'REORDER_WORK_ITEMS', activeId: 1, overId: 3 })
      expect(base.workItems.map((w) => w.id)).toEqual(originalIds)
    })
  })

  // -------------------------------------------------------------------------
  // Group Actions
  // -------------------------------------------------------------------------

  describe('ADD_GROUP', () => {
    it('creates a new group with auto-name and increments nextGroupId', () => {
      const state = appReducer(initialState, { type: 'ADD_GROUP' })
      expect(state.groups).toHaveLength(1)
      expect(state.groups[0].id).toBe(1)
      expect(state.groups[0].name).toBe('Group 1')
      expect(state.groups[0].enabled).toBe(true)
      expect(state.groups[0].collapsed).toBe(false)
      expect(state.nextGroupId).toBe(2)
    })

    it('assigns cycling colors from the palette', () => {
      let state = initialState
      state = appReducer(state, { type: 'ADD_GROUP' })
      state = appReducer(state, { type: 'ADD_GROUP' })
      expect(state.groups[0].color).toBe('indigo')
      expect(state.groups[1].color).toBe('amber')
    })

    it('does not modify workItems', () => {
      const state = appReducer(initialState, { type: 'ADD_GROUP' })
      expect(state.workItems).toBe(initialState.workItems)
    })
  })

  describe('REMOVE_GROUP', () => {
    it('removes the group and ungroups its member items', () => {
      let state: AppState = {
        ...stateWithTwoItems(),
        groups: [{ id: 1, name: 'G1', color: 'indigo', enabled: true, collapsed: false, multiplier: 1 }],
        nextGroupId: 2,
      }
      state = { ...state, workItems: state.workItems.map((w, i) => i === 0 ? { ...w, groupId: 1 } : w) }
      const result = appReducer(state, { type: 'REMOVE_GROUP', groupId: 1 })
      expect(result.groups).toHaveLength(0)
      expect(result.workItems[0].groupId).toBeUndefined()
      expect(result.workItems[1].groupId).toBeUndefined()
    })

    it('is a no-op for nonexistent groupId', () => {
      const state = appReducer(initialState, { type: 'REMOVE_GROUP', groupId: 999 })
      expect(state.groups).toEqual(initialState.groups)
    })
  })

  describe('UPDATE_GROUP', () => {
    it('merges partial updates into the group', () => {
      let state = appReducer(initialState, { type: 'ADD_GROUP' })
      state = appReducer(state, { type: 'UPDATE_GROUP', groupId: 1, updates: { name: 'Backend' } })
      expect(state.groups[0].name).toBe('Backend')
      expect(state.groups[0].color).toBe('indigo') // unchanged
    })

    it('does not modify other groups', () => {
      let state = initialState
      state = appReducer(state, { type: 'ADD_GROUP' })
      state = appReducer(state, { type: 'ADD_GROUP' })
      state = appReducer(state, { type: 'UPDATE_GROUP', groupId: 1, updates: { name: 'Changed' } })
      expect(state.groups[1].name).toBe('Group 2')
    })
  })

  describe('TOGGLE_GROUP', () => {
    it('flips enabled true to false', () => {
      let state = appReducer(initialState, { type: 'ADD_GROUP' })
      state = appReducer(state, { type: 'TOGGLE_GROUP', groupId: 1 })
      expect(state.groups[0].enabled).toBe(false)
    })

    it('flips enabled false to true', () => {
      let state = appReducer(initialState, { type: 'ADD_GROUP' })
      state = appReducer(state, { type: 'TOGGLE_GROUP', groupId: 1 })
      state = appReducer(state, { type: 'TOGGLE_GROUP', groupId: 1 })
      expect(state.groups[0].enabled).toBe(true)
    })
  })

  describe('TOGGLE_GROUP_COLLAPSE', () => {
    it('flips collapsed false to true', () => {
      let state = appReducer(initialState, { type: 'ADD_GROUP' })
      state = appReducer(state, { type: 'TOGGLE_GROUP_COLLAPSE', groupId: 1 })
      expect(state.groups[0].collapsed).toBe(true)
    })

    it('flips collapsed true to false', () => {
      let state = appReducer(initialState, { type: 'ADD_GROUP' })
      state = appReducer(state, { type: 'TOGGLE_GROUP_COLLAPSE', groupId: 1 })
      state = appReducer(state, { type: 'TOGGLE_GROUP_COLLAPSE', groupId: 1 })
      expect(state.groups[0].collapsed).toBe(false)
    })
  })

  describe('REORDER_GROUPS', () => {
    it('moves a group forward', () => {
      let state = initialState
      state = appReducer(state, { type: 'ADD_GROUP' })
      state = appReducer(state, { type: 'ADD_GROUP' })
      state = appReducer(state, { type: 'ADD_GROUP' })
      state = appReducer(state, { type: 'REORDER_GROUPS', activeId: 1, overId: 3 })
      expect(state.groups.map((g) => g.id)).toEqual([2, 3, 1])
    })

    it('also reorders work items to match group order', () => {
      let state = initialState
      state = appReducer(state, { type: 'ADD_GROUP' }) // group 1
      state = appReducer(state, { type: 'ADD_GROUP' }) // group 2
      // Add items to groups
      state = appReducer(state, { type: 'ADD_WORK_ITEM_TO_GROUP', groupId: 1 }) // item in group 1
      state = appReducer(state, { type: 'ADD_WORK_ITEM_TO_GROUP', groupId: 2 }) // item in group 2
      const g1ItemId = state.workItems.find((w) => w.groupId === 1)!.id
      const g2ItemId = state.workItems.find((w) => w.groupId === 2)!.id

      // Move group 1 after group 2
      state = appReducer(state, { type: 'REORDER_GROUPS', activeId: 1, overId: 2 })
      expect(state.groups.map((g) => g.id)).toEqual([2, 1])
      // Items should reflect the new order: group 2's items before group 1's
      const g2Idx = state.workItems.findIndex((w) => w.id === g2ItemId)
      const g1Idx = state.workItems.findIndex((w) => w.id === g1ItemId)
      expect(g2Idx).toBeLessThan(g1Idx)
    })

    it('moves work items before target group when moving up', () => {
      let state = initialState
      state = appReducer(state, { type: 'ADD_GROUP' }) // group 1
      state = appReducer(state, { type: 'ADD_GROUP' }) // group 2
      state = appReducer(state, { type: 'ADD_WORK_ITEM_TO_GROUP', groupId: 1 })
      state = appReducer(state, { type: 'ADD_WORK_ITEM_TO_GROUP', groupId: 2 })
      const g1ItemId = state.workItems.find((w) => w.groupId === 1)!.id
      const g2ItemId = state.workItems.find((w) => w.groupId === 2)!.id

      // Move group 2 before group 1
      state = appReducer(state, { type: 'REORDER_GROUPS', activeId: 2, overId: 1 })
      expect(state.groups.map((g) => g.id)).toEqual([2, 1])
      const g2Idx = state.workItems.findIndex((w) => w.id === g2ItemId)
      const g1Idx = state.workItems.findIndex((w) => w.id === g1ItemId)
      expect(g2Idx).toBeLessThan(g1Idx)
    })

    it('handles empty active group gracefully', () => {
      let state = initialState
      state = appReducer(state, { type: 'ADD_GROUP' }) // group 1
      state = appReducer(state, { type: 'ADD_GROUP' }) // group 2
      state = appReducer(state, { type: 'ADD_WORK_ITEM_TO_GROUP', groupId: 2 })
      // Group 1 is empty — should still reorder groups array
      state = appReducer(state, { type: 'REORDER_GROUPS', activeId: 1, overId: 2 })
      expect(state.groups.map((g) => g.id)).toEqual([2, 1])
    })

    it('is a no-op for same activeId and overId', () => {
      let state = appReducer(initialState, { type: 'ADD_GROUP' })
      const result = appReducer(state, { type: 'REORDER_GROUPS', activeId: 1, overId: 1 })
      expect(result).toBe(state)
    })

    it('is a no-op for nonexistent IDs', () => {
      let state = appReducer(initialState, { type: 'ADD_GROUP' })
      const result = appReducer(state, { type: 'REORDER_GROUPS', activeId: 99, overId: 1 })
      expect(result).toBe(state)
    })
  })

  describe('MOVE_ITEM_TO_GROUP', () => {
    it('sets groupId on the target item', () => {
      let state = appReducer(initialState, { type: 'ADD_GROUP' })
      state = appReducer(state, { type: 'MOVE_ITEM_TO_GROUP', itemId: 1, groupId: 1 })
      expect(state.workItems[0].groupId).toBe(1)
    })

    it('clears groupId to undefined when moving to ungrouped', () => {
      let state = appReducer(initialState, { type: 'ADD_GROUP' })
      state = appReducer(state, { type: 'MOVE_ITEM_TO_GROUP', itemId: 1, groupId: 1 })
      state = appReducer(state, { type: 'MOVE_ITEM_TO_GROUP', itemId: 1, groupId: undefined })
      expect(state.workItems[0].groupId).toBeUndefined()
    })

    it('does not modify other items', () => {
      const state = stateWithTwoItems()
      const withGroup = appReducer(state, { type: 'ADD_GROUP' })
      const result = appReducer(withGroup, { type: 'MOVE_ITEM_TO_GROUP', itemId: 1, groupId: 1 })
      expect(result.workItems[1].groupId).toBeUndefined()
    })
  })

  describe('ADD_WORK_ITEM_TO_GROUP', () => {
    it('adds item with groupId set', () => {
      let state = appReducer(initialState, { type: 'ADD_GROUP' })
      state = appReducer(state, { type: 'ADD_WORK_ITEM_TO_GROUP', groupId: 1 })
      const newItem = state.workItems[state.workItems.length - 1]
      expect(newItem.groupId).toBe(1)
      expect(newItem.enabled).toBe(true)
    })

    it('increments nextId', () => {
      let state = appReducer(initialState, { type: 'ADD_GROUP' })
      const before = state.nextId
      state = appReducer(state, { type: 'ADD_WORK_ITEM_TO_GROUP', groupId: 1 })
      expect(state.nextId).toBe(before + 1)
    })
  })

  describe('DUPLICATE_WORK_ITEM preserves groupId', () => {
    it('cloned item inherits source groupId', () => {
      let state = stateWithTwoItems()
      state = appReducer(state, { type: 'ADD_GROUP' })
      state = appReducer(state, { type: 'MOVE_ITEM_TO_GROUP', itemId: 1, groupId: 1 })
      state = appReducer(state, { type: 'DUPLICATE_WORK_ITEM', id: 1 })
      const clone = state.workItems[1] // inserted after source
      expect(clone.groupId).toBe(1)
    })
  })

  describe('MOVE_GROUP_BLOCK', () => {
    it('moves group items before target when dragging up', () => {
      let state = stateWithThreeItems()
      state = appReducer(state, { type: 'ADD_GROUP' })
      state = appReducer(state, { type: 'MOVE_ITEM_TO_GROUP', itemId: 3, groupId: 1 })
      // Items: [1, 2, 3(g1)] → drag group up to item 1 → [3(g1), 1, 2]
      state = appReducer(state, { type: 'MOVE_GROUP_BLOCK', groupId: 1, targetItemId: 1 })
      expect(state.workItems.map((w) => w.id)).toEqual([3, 1, 2])
    })

    it('moves group items after target when dragging down', () => {
      let state = stateWithThreeItems()
      state = appReducer(state, { type: 'ADD_GROUP' })
      state = appReducer(state, { type: 'MOVE_ITEM_TO_GROUP', itemId: 1, groupId: 1 })
      // Items: [1(g1), 2, 3] → drag group down to item 2 → [2, 1(g1), 3]
      state = appReducer(state, { type: 'MOVE_GROUP_BLOCK', groupId: 1, targetItemId: 2 })
      expect(state.workItems.map((w) => w.id)).toEqual([2, 1, 3])
    })

    it('moves multi-item group down past one item', () => {
      let state = stateWithThreeItems()
      state = appReducer(state, { type: 'ADD_GROUP' })
      state = appReducer(state, { type: 'MOVE_ITEM_TO_GROUP', itemId: 1, groupId: 1 })
      state = appReducer(state, { type: 'MOVE_ITEM_TO_GROUP', itemId: 2, groupId: 1 })
      // Items: [1(g1), 2(g1), 3] → drag group down to item 3 → [3, 1(g1), 2(g1)]
      state = appReducer(state, { type: 'MOVE_GROUP_BLOCK', groupId: 1, targetItemId: 3 })
      expect(state.workItems.map((w) => w.id)).toEqual([3, 1, 2])
    })

    it('no-op when group has no items', () => {
      let state = stateWithThreeItems()
      state = appReducer(state, { type: 'ADD_GROUP' })
      const before = state.workItems.map((w) => w.id)
      state = appReducer(state, { type: 'MOVE_GROUP_BLOCK', groupId: 1, targetItemId: 1 })
      expect(state.workItems.map((w) => w.id)).toEqual(before)
    })

    it('no-op when target item not found', () => {
      let state = stateWithThreeItems()
      state = appReducer(state, { type: 'ADD_GROUP' })
      state = appReducer(state, { type: 'MOVE_ITEM_TO_GROUP', itemId: 1, groupId: 1 })
      const before = state.workItems.map((w) => w.id)
      state = appReducer(state, { type: 'MOVE_GROUP_BLOCK', groupId: 1, targetItemId: 999 })
      expect(state.workItems.map((w) => w.id)).toEqual(before)
    })
  })

  describe('DUPLICATE_GROUP', () => {
    it('creates a copy of the group with (copy) suffix', () => {
      let state = stateWithTwoItems()
      state = appReducer(state, { type: 'ADD_GROUP' })
      state = appReducer(state, { type: 'MOVE_ITEM_TO_GROUP', itemId: 1, groupId: 1 })
      state = appReducer(state, { type: 'DUPLICATE_GROUP', groupId: 1 })

      expect(state.groups).toHaveLength(2)
      expect(state.groups[1].name).toBe('Group 1 (copy)')
      expect(state.groups[1].id).toBe(2)
      expect(state.nextGroupId).toBe(3)
    })

    it('clones all items in the group', () => {
      let state = stateWithTwoItems()
      state = appReducer(state, { type: 'ADD_GROUP' })
      state = appReducer(state, { type: 'MOVE_ITEM_TO_GROUP', itemId: 1, groupId: 1 })
      state = appReducer(state, { type: 'MOVE_ITEM_TO_GROUP', itemId: 2, groupId: 1 })
      state = appReducer(state, { type: 'DUPLICATE_GROUP', groupId: 1 })

      const clonedGroupItems = state.workItems.filter((w) => w.groupId === 2)
      expect(clonedGroupItems).toHaveLength(2)
      expect(state.nextId).toBe(5) // 3 + 2 cloned items
    })

    it('inserts new group after source group', () => {
      let state = stateWithTwoItems()
      state = appReducer(state, { type: 'ADD_GROUP' })
      state = appReducer(state, { type: 'ADD_GROUP' })
      state = appReducer(state, { type: 'DUPLICATE_GROUP', groupId: 1 })

      expect(state.groups.map((g) => g.id)).toEqual([1, 3, 2])
    })

    it('no-op when group not found', () => {
      let state = stateWithTwoItems()
      state = appReducer(state, { type: 'ADD_GROUP' })
      const before = { groups: state.groups.length, items: state.workItems.length }
      state = appReducer(state, { type: 'DUPLICATE_GROUP', groupId: 999 })
      expect(state.groups.length).toBe(before.groups)
      expect(state.workItems.length).toBe(before.items)
    })
  })

  describe('LOAD_SESSION with groups', () => {
    it('backfills missing groups to empty array', () => {
      const sessionWithoutGroups = {
        workItems: [],
        constants: DEFAULT_CONSTANTS,
        nextId: 1,
        staffing: { rows: [], week_count: 0, nextRowId: 1 },
      } as unknown as AppState
      const state = appReducer(initialState, { type: 'LOAD_SESSION', session: sessionWithoutGroups })
      expect(state.groups).toEqual([])
      expect(state.nextGroupId).toBe(1)
    })

    it('preserves groups when present', () => {
      const session: AppState = {
        workItems: [],
        constants: DEFAULT_CONSTANTS,
        nextId: 1,
        staffing: { rows: [], week_count: 0, nextRowId: 1 },
        groups: [{ id: 1, name: 'Test', color: 'indigo', enabled: true, collapsed: false, multiplier: 1 }],
        nextGroupId: 2,
      }
      const state = appReducer(initialState, { type: 'LOAD_SESSION', session })
      expect(state.groups).toHaveLength(1)
      expect(state.groups[0].name).toBe('Test')
      expect(state.nextGroupId).toBe(2)
    })
  })
})
