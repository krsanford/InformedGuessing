import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { WorkItem, WorkItemCalculated } from '../domain/estimation'
import { WorkItemRow } from './WorkItemRow'
import styles from './WorkItemList.module.css'

interface WorkItemListProps {
  items: WorkItemCalculated[]
  onUpdate: (
    id: WorkItem['id'],
    field: 'title' | 'notes' | 'best_case_hours' | 'worst_case_hours' | 'multiplier',
    value: string
  ) => void
  onRemove: (id: WorkItem['id']) => void
  onToggle: (id: WorkItem['id']) => void
  onDuplicate: (id: WorkItem['id']) => void
  onReorder: (activeId: number, overId: number) => void
}

export function WorkItemList({ items, onUpdate, onRemove, onToggle, onDuplicate, onReorder }: WorkItemListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      onReorder(active.id as number, over.id as number)
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
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div role="list" aria-label="Work items">
            {items.map((item, index) => (
              <WorkItemRow
                key={item.id}
                item={item}
                rowNumber={index + 1}
                onUpdate={(field, value) => onUpdate(item.id, field, value)}
                onRemove={() => onRemove(item.id)}
                onToggle={() => onToggle(item.id)}
                onDuplicate={() => onDuplicate(item.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
