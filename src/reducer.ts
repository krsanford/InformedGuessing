import { DEFAULT_CONSTANTS, GROUP_COLOR_PALETTE } from './domain/estimation'
import type { GroupColorKey, WorkItem, WorkItemGroup } from './domain/estimation'
import { createStaffingRow, createPrepopulatedRows, resizeRowCells } from './domain/staffing'
import type { AppState, AppAction, StaffingRow, StaffingState } from './types'

function arrayMove<T>(array: T[], fromIndex: number, toIndex: number): T[] {
  const result = [...array]
  const [removed] = result.splice(fromIndex, 1)
  result.splice(toIndex, 0, removed)
  return result
}

function nextGroupColor(groups: WorkItemGroup[]): GroupColorKey {
  const usedColors = new Set(groups.map((g) => g.color))
  const available = GROUP_COLOR_PALETTE.find((c) => !usedColors.has(c.key))
  return available ? available.key : GROUP_COLOR_PALETTE[groups.length % GROUP_COLOR_PALETTE.length].key
}

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
  groups: [],
  nextGroupId: 1,
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
      const clone = { ...source, id: state.nextId, multiplier: source.multiplier ?? 1, groupId: source.groupId }
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
        groups: action.session.groups ?? [],
        nextGroupId: action.session.nextGroupId ?? 1,
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

    case 'REORDER_WORK_ITEMS': {
      const oldIndex = state.workItems.findIndex((item) => item.id === action.activeId)
      const newIndex = state.workItems.findIndex((item) => item.id === action.overId)
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return state
      return { ...state, workItems: arrayMove(state.workItems, oldIndex, newIndex) }
    }

    case 'REORDER_STAFFING_ROWS': {
      const oldIndex = state.staffing.rows.findIndex((r) => r.id === action.activeId)
      const newIndex = state.staffing.rows.findIndex((r) => r.id === action.overId)
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return state
      return {
        ...state,
        staffing: { ...state.staffing, rows: arrayMove(state.staffing.rows, oldIndex, newIndex) },
      }
    }

    // ========================================================================
    // Group Actions
    // ========================================================================

    case 'ADD_GROUP':
      return {
        ...state,
        groups: [
          ...state.groups,
          {
            id: state.nextGroupId,
            name: `Group ${state.nextGroupId}`,
            color: nextGroupColor(state.groups),
            enabled: true,
            collapsed: false,
            multiplier: 1,
          },
        ],
        nextGroupId: state.nextGroupId + 1,
      }

    case 'REMOVE_GROUP':
      return {
        ...state,
        groups: state.groups.filter((g) => g.id !== action.groupId),
        workItems: state.workItems.map((item) =>
          item.groupId === action.groupId ? { ...item, groupId: undefined } : item
        ),
      }

    case 'UPDATE_GROUP':
      return {
        ...state,
        groups: state.groups.map((g) =>
          g.id === action.groupId ? { ...g, ...action.updates } : g
        ),
      }

    case 'TOGGLE_GROUP':
      return {
        ...state,
        groups: state.groups.map((g) =>
          g.id === action.groupId ? { ...g, enabled: !g.enabled } : g
        ),
      }

    case 'TOGGLE_GROUP_COLLAPSE':
      return {
        ...state,
        groups: state.groups.map((g) =>
          g.id === action.groupId ? { ...g, collapsed: !g.collapsed } : g
        ),
      }

    case 'REORDER_GROUPS': {
      const oldIndex = state.groups.findIndex((g) => g.id === action.activeId)
      const newIndex = state.groups.findIndex((g) => g.id === action.overId)
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return state

      const newGroups = arrayMove(state.groups, oldIndex, newIndex)

      // Also reorder work items so the visual order matches. The UI renders
      // group headers based on where items appear, not the groups array order.
      const activeItems = state.workItems.filter((w) => w.groupId === action.activeId)
      if (activeItems.length === 0) {
        return { ...state, groups: newGroups }
      }

      const remaining = state.workItems.filter((w) => w.groupId !== action.activeId)
      const movingUp = oldIndex > newIndex

      let insertAt: number
      if (movingUp) {
        // Insert before the first item of the target group
        insertAt = remaining.findIndex((w) => w.groupId === action.overId)
      } else {
        // Insert after the last item of the target group
        let lastIdx = -1
        for (let i = 0; i < remaining.length; i++) {
          if (remaining[i].groupId === action.overId) lastIdx = i
        }
        insertAt = lastIdx + 1
      }

      if (insertAt === -1) {
        return { ...state, groups: newGroups }
      }

      const newItems = [...remaining]
      newItems.splice(insertAt, 0, ...activeItems)
      return { ...state, groups: newGroups, workItems: newItems }
    }

    case 'MOVE_ITEM_TO_GROUP':
      return {
        ...state,
        workItems: state.workItems.map((item) =>
          item.id === action.itemId ? { ...item, groupId: action.groupId } : item
        ),
      }

    case 'ADD_WORK_ITEM_TO_GROUP': {
      const newItem = {
        id: state.nextId,
        title: '',
        notes: '',
        best_case_hours: 0,
        worst_case_hours: 0,
        enabled: true,
        multiplier: 1,
        groupId: action.groupId,
      }
      // Find the first member, then the end of its contiguous block
      let firstMemberIdx = -1
      for (let i = 0; i < state.workItems.length; i++) {
        if (state.workItems[i].groupId === action.groupId) {
          firstMemberIdx = i
          break
        }
      }
      const newItems = [...state.workItems]
      if (firstMemberIdx >= 0) {
        let insertAfter = firstMemberIdx
        for (let i = firstMemberIdx + 1; i < state.workItems.length; i++) {
          if (state.workItems[i].groupId === action.groupId) {
            insertAfter = i
          } else {
            break
          }
        }
        newItems.splice(insertAfter + 1, 0, newItem)
      } else {
        newItems.push(newItem)
      }
      return { ...state, workItems: newItems, nextId: state.nextId + 1 }
    }

    case 'MOVE_GROUP_BLOCK': {
      const groupItems = state.workItems.filter((w) => w.groupId === action.groupId)
      if (groupItems.length === 0) return state
      const remaining = state.workItems.filter((w) => w.groupId !== action.groupId)
      const targetIdx = remaining.findIndex((w) => w.id === action.targetItemId)
      if (targetIdx === -1) return state

      // Determine direction: if the group was originally above the target,
      // insert after the target (dragging down). Otherwise insert before.
      const firstGroupIdx = state.workItems.findIndex((w) => w.groupId === action.groupId)
      const targetOrigIdx = state.workItems.findIndex((w) => w.id === action.targetItemId)
      const draggingDown = firstGroupIdx < targetOrigIdx

      const newItems = [...remaining]
      newItems.splice(draggingDown ? targetIdx + 1 : targetIdx, 0, ...groupItems)
      return { ...state, workItems: newItems }
    }

    case 'DUPLICATE_GROUP': {
      const sourceGroup = state.groups.find((g) => g.id === action.groupId)
      if (!sourceGroup) return state
      const newGroupId = state.nextGroupId
      const sourceItems = state.workItems.filter((w) => w.groupId === action.groupId)
      const clonedItems = sourceItems.map((item, i) => ({
        ...item,
        id: state.nextId + i,
        groupId: newGroupId,
      }))
      const groupInsertIdx = state.groups.findIndex((g) => g.id === action.groupId)
      const newGroups = [...state.groups]
      newGroups.splice(groupInsertIdx + 1, 0, {
        ...sourceGroup,
        id: newGroupId,
        name: `${sourceGroup.name} (copy)`,
      })
      // Insert cloned items right after the last source-group item
      const newWorkItems = [...state.workItems]
      const lastSourceIdx = newWorkItems.reduce(
        (last, w, i) => (w.groupId === action.groupId ? i : last),
        -1
      )
      newWorkItems.splice(lastSourceIdx + 1, 0, ...clonedItems)
      return {
        ...state,
        groups: newGroups,
        nextGroupId: state.nextGroupId + 1,
        workItems: newWorkItems,
        nextId: state.nextId + clonedItems.length,
      }
    }

    // ========================================================================
    // AI Import Actions
    // ========================================================================

    case 'AI_IMPORT_ITEMS': {
      if (action.items.length === 0) return state

      // Collect unique group names in order of first appearance
      const seenGroups = new Map<string, number>()
      const newGroups: WorkItemGroup[] = []
      let gId = state.nextGroupId

      for (const item of action.items) {
        if (!seenGroups.has(item.groupName)) {
          const allGroups = [...state.groups, ...newGroups]
          newGroups.push({
            id: gId,
            name: item.groupName,
            color: nextGroupColor(allGroups),
            enabled: true,
            collapsed: false,
            multiplier: 1,
          })
          seenGroups.set(item.groupName, gId)
          gId++
        }
      }

      // Create work items, grouped contiguously by groupName
      const itemsByGroup = new Map<string, typeof action.items>()
      for (const item of action.items) {
        const list = itemsByGroup.get(item.groupName)
        if (list) {
          list.push(item)
        } else {
          itemsByGroup.set(item.groupName, [item])
        }
      }

      let itemId = state.nextId
      const newWorkItems: WorkItem[] = []
      for (const [groupName, items] of itemsByGroup) {
        const groupId = seenGroups.get(groupName)!
        for (const item of items) {
          newWorkItems.push({
            id: itemId++,
            title: item.title,
            notes: item.notes,
            best_case_hours: item.best_case_hours,
            worst_case_hours: item.worst_case_hours,
            enabled: true,
            multiplier: 1,
            groupId,
          })
        }
      }

      return {
        ...state,
        workItems: [...state.workItems, ...newWorkItems],
        nextId: itemId,
        groups: [...state.groups, ...newGroups],
        nextGroupId: gId,
      }
    }

    case 'AI_IMPORT_STAFFING': {
      if (action.roles.length === 0) return state

      let rowId = state.staffing.nextRowId
      const newRows: StaffingRow[] = []
      for (const role of action.roles) {
        for (let i = 0; i < role.count; i++) {
          newRows.push({
            id: rowId++,
            discipline: role.discipline,
            hourly_rate: role.hourly_rate,
            cells: new Array(action.weekCount).fill(''),
            enabled: true,
            multiplier: 1,
          })
        }
      }

      return {
        ...state,
        staffing: {
          ...state.staffing,
          week_count: action.weekCount,
          rows: newRows,
          nextRowId: rowId,
        },
      }
    }

    default:
      return state
  }
}
