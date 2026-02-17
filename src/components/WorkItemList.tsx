import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useState, useCallback, useMemo } from 'react'
import type { WorkItem, WorkItemCalculated, WorkItemGroup } from '../domain/estimation'
import { calculateGroupSubtotals } from '../domain/estimation'
import { WorkItemRow } from './WorkItemRow'
import { GroupHeader } from './GroupHeader'
import styles from './WorkItemList.module.css'

interface WorkItemListProps {
  items: WorkItemCalculated[]
  groups: WorkItemGroup[]
  onUpdate: (
    id: WorkItem['id'],
    field: 'title' | 'notes' | 'best_case_hours' | 'worst_case_hours' | 'multiplier',
    value: string
  ) => void
  onRemove: (id: WorkItem['id']) => void
  onToggle: (id: WorkItem['id']) => void
  onDuplicate: (id: WorkItem['id']) => void
  onReorder: (activeId: number, overId: number) => void
  onToggleGroup: (groupId: number) => void
  onToggleGroupCollapse: (groupId: number) => void
  onUpdateGroup: (groupId: number, updates: Partial<Omit<WorkItemGroup, 'id'>>) => void
  onRemoveGroup: (groupId: number) => void
  onReorderGroups: (activeId: number, overId: number) => void
  onMoveItemToGroup: (itemId: number, groupId: number | undefined) => void
  onAddItemToGroup: (groupId: number) => void
  onMoveGroupBlock: (groupId: number, targetItemId: number) => void
  onDuplicateGroup: (groupId: number) => void
}

export function WorkItemList({
  items,
  groups,
  onUpdate,
  onRemove,
  onToggle,
  onDuplicate,
  onReorder,
  onToggleGroup,
  onToggleGroupCollapse,
  onUpdateGroup,
  onRemoveGroup,
  onReorderGroups,
  onMoveItemToGroup,
  onAddItemToGroup,
  onMoveGroupBlock,
  onDuplicateGroup,
}: WorkItemListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  // Custom collision detection: require pointer to be clearly centered on a
  // group header to target it (add-to-group). On the edges, prefer the adjacent
  // item so that reordering near group boundaries isn't finicky.
  const collisionDetection = useCallback(
    (args: Parameters<typeof closestCenter>[0]) => {
      const collisions = closestCenter(args)
      if (!args.pointerCoordinates || collisions.length < 2) return collisions

      const topId = String(collisions[0].id)
      if (!topId.startsWith('group-')) return collisions

      // Don't intervene when dragging a group — group↔group is fine
      if (String(args.active.id).startsWith('group-')) return collisions

      const rect = args.droppableRects.get(collisions[0].id)
      if (!rect) return collisions

      // Only target group header if pointer is in center 40% of the header
      const insetY = rect.height * 0.3
      const py = args.pointerCoordinates.y
      if (py >= rect.top + insetY && py <= rect.bottom - insetY) return collisions

      // Pointer on edge — prefer the closest non-group target if it's nearby
      const nextBest = collisions.find((c) => !String(c.id).startsWith('group-'))
      if (nextBest) {
        const nextRect = args.droppableRects.get(nextBest.id)
        if (nextRect) {
          const groupDist = Math.abs(py - (rect.top + rect.height / 2))
          const itemDist = Math.abs(py - (nextRect.top + nextRect.height / 2))
          if (itemDist <= groupDist * 1.5) {
            return [nextBest, ...collisions.filter((c) => c.id !== nextBest.id)]
          }
        }
      }

      return collisions
    },
    []
  )

  // Build interleaved render order: walk items array, inject group headers
  // before first member of each group. Groups with no members get appended at end.
  const groupMap = new Map(groups.map((g) => [g.id, g]))
  const seenGroups = new Set<number>()
  const rowNumberByGroup = new Map<number | undefined, number>() // group id → running count

  interface RenderEntry {
    type: 'item' | 'group-header'
    item?: WorkItemCalculated
    group?: WorkItemGroup
    rowNumber: number
    grouped: boolean
    lastInGroup?: boolean
  }

  const renderEntries: RenderEntry[] = []

  for (const item of items) {
    const gid = item.groupId
    if (gid != null && groupMap.has(gid) && !seenGroups.has(gid)) {
      // First item of this group — inject header
      seenGroups.add(gid)
      renderEntries.push({ type: 'group-header', group: groupMap.get(gid)!, rowNumber: 0, grouped: false })
    }

    const group = gid != null ? groupMap.get(gid) : undefined
    const isGrouped = group != null

    // Skip rendering if group is collapsed
    if (isGrouped && group!.collapsed) continue

    const counterKey = gid ?? undefined
    const count = (rowNumberByGroup.get(counterKey) ?? 0) + 1
    rowNumberByGroup.set(counterKey, count)

    renderEntries.push({ type: 'item', item, rowNumber: count, grouped: isGrouped })
  }

  // Append group headers for empty groups that weren't seen
  for (const group of groups) {
    if (!seenGroups.has(group.id)) {
      renderEntries.push({ type: 'group-header', group, rowNumber: 0, grouped: false })
    }
  }

  // Mark last item in each group for visual separation
  for (let i = renderEntries.length - 1; i >= 0; i--) {
    const entry = renderEntries[i]
    if (entry.type === 'item' && entry.grouped) {
      const gid = entry.item!.groupId
      const next = renderEntries[i + 1]
      const isLast = !next || next.type === 'group-header' || !next.grouped || next.item?.groupId !== gid
      if (isLast) entry.lastInGroup = true
    }
  }

  // Build flat list of sortable IDs matching render order
  const sortableIds: string[] = renderEntries.map((entry) =>
    entry.type === 'group-header' ? `group-${entry.group!.id}` : `item-${entry.item!.id}`
  )

  // Determine whether drop indicator shows above or below the target
  const dropPosition = useMemo((): 'before' | 'after' | null => {
    if (!activeId || !overId || activeId === overId) return null
    const activeIndex = sortableIds.indexOf(activeId)
    const overIndex = sortableIds.indexOf(overId)
    if (activeIndex === -1 || overIndex === -1) return null
    return activeIndex < overIndex ? 'after' : 'before'
  }, [activeId, overId, sortableIds])

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  function handleDragOver(event: DragOverEvent) {
    setOverId(event.over ? String(event.over.id) : null)
  }

  function handleDragCancel() {
    setActiveId(null)
    setOverId(null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    setOverId(null)

    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeStr = String(active.id)
    const overStr = String(over.id)

    const isActiveGroup = activeStr.startsWith('group-')
    const isOverGroup = overStr.startsWith('group-')

    if (isActiveGroup && isOverGroup) {
      // Group over group: reorder groups
      const activeGroupId = parseInt(activeStr.replace('group-', ''), 10)
      const overGroupId = parseInt(overStr.replace('group-', ''), 10)
      onReorderGroups(activeGroupId, overGroupId)
      return
    }

    if (isActiveGroup && !isOverGroup) {
      // Group dropped onto an item: move the group block to that position
      const activeGroupId = parseInt(activeStr.replace('group-', ''), 10)
      const overItemId = parseInt(overStr.replace('item-', ''), 10)
      onMoveGroupBlock(activeGroupId, overItemId)
      return
    }

    if (!isActiveGroup && !isOverGroup) {
      // Item over item
      const activeItemId = parseInt(activeStr.replace('item-', ''), 10)
      const overItemId = parseInt(overStr.replace('item-', ''), 10)
      const activeItem = items.find((i) => i.id === activeItemId)
      const overItem = items.find((i) => i.id === overItemId)
      if (!activeItem || !overItem) return

      if (activeItem.groupId !== overItem.groupId) {
        onMoveItemToGroup(activeItemId, overItem.groupId)
      }
      onReorder(activeItemId, overItemId)
      return
    }

    if (!isActiveGroup && isOverGroup) {
      // Item dropped onto a group header: add to that group
      const activeItemId = parseInt(activeStr.replace('item-', ''), 10)
      const overGroupId = parseInt(overStr.replace('group-', ''), 10)
      onMoveItemToGroup(activeItemId, overGroupId)
      return
    }
  }

  if (items.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyText}>No work items yet</p>
      </div>
    )
  }

  return (
    <div className={styles.table}>
      <div className={styles.headerRow} aria-hidden="true">
        <span className={styles.headerCellGrip} />
        <span className={styles.headerCellId}>#</span>
        <span className={styles.headerCellToggle} />
        <span className={styles.headerCellAction} />
        <span className={styles.headerCell}>Title</span>
        <span className={styles.headerCellNotes}>Notes</span>
        <span className={styles.headerCellNum} title="Optimistic estimate — if everything goes right">Best</span>
        <span className={styles.headerCellNum} title="Pessimistic estimate — if everything goes wrong">Worst</span>
        <span className={styles.headerDivider} />
        <span className={styles.headerCellComputed} title="Expected hours: weighted average of best and worst case">Exp</span>
        <span className={styles.headerCellComputed} title="Uncertainty spread in hours (worst − best, scaled by divisor)">Range</span>
        <span className={styles.headerCellComputed} title="Statistical variance — drives portfolio risk calculations">Var</span>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        modifiers={[restrictToVerticalAxis]}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext
          items={sortableIds}
          strategy={verticalListSortingStrategy}
        >
          <div role="list" aria-label="Work items">
            {renderEntries.map((entry) => {
              if (entry.type === 'group-header') {
                const group = entry.group!
                const subtotals = calculateGroupSubtotals(items, group.id, group.multiplier ?? 1)
                return (
                  <GroupHeader
                    key={`group-${group.id}`}
                    group={group}
                    subtotals={subtotals}
                    isDropTarget={overId === `group-${group.id}` && activeId != null && !activeId.startsWith('group-')}
                    onToggle={() => onToggleGroup(group.id)}
                    onToggleCollapse={() => onToggleGroupCollapse(group.id)}
                    onUpdateName={(name) => onUpdateGroup(group.id, { name })}
                    onRemove={() => onRemoveGroup(group.id)}
                    onAddItem={() => onAddItemToGroup(group.id)}
                    onDuplicate={() => onDuplicateGroup(group.id)}
                    onMultiplierChange={(v) => onUpdateGroup(group.id, { multiplier: v })}
                  />
                )
              }

              const item = entry.item!
              const group = item.groupId != null ? groupMap.get(item.groupId) : undefined
              const itemSortableId = `item-${item.id}`
              const isItemDrop = overId === itemSortableId && activeId != null && activeId !== itemSortableId
              return (
                <WorkItemRow
                  key={item.id}
                  item={item}
                  rowNumber={entry.rowNumber}
                  grouped={entry.grouped}
                  lastInGroup={entry.lastInGroup}
                  groupEnabled={group?.enabled}
                  isDropTarget={isItemDrop}
                  dropPosition={isItemDrop ? dropPosition : null}
                  onUpdate={(field, value) => onUpdate(item.id, field, value)}
                  onRemove={() => onRemove(item.id)}
                  onToggle={() => onToggle(item.id)}
                  onDuplicate={() => onDuplicate(item.id)}
                />
              )
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
