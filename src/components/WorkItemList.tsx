import type { WorkItem, WorkItemCalculated } from '../domain/estimation'
import { WorkItemRow } from './WorkItemRow'
import styles from './WorkItemList.module.css'

interface WorkItemListProps {
  items: WorkItemCalculated[]
  onUpdate: (
    id: WorkItem['id'],
    field: 'title' | 'notes' | 'best_case_hours' | 'worst_case_hours',
    value: string
  ) => void
  onRemove: (id: WorkItem['id']) => void
}

export function WorkItemList({ items, onUpdate, onRemove }: WorkItemListProps) {
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
        <span className={styles.headerCell}>#</span>
        <span className={styles.headerCell}>Title</span>
        <span className={styles.headerCellNotes}>Notes</span>
        <span className={styles.headerCellNum}>Best</span>
        <span className={styles.headerCellNum}>Worst</span>
        <span className={styles.headerDivider} />
        <span className={styles.headerCellComputed}>Exp</span>
        <span className={styles.headerCellComputed}>Range</span>
        <span className={styles.headerCellComputed}>Var</span>
        <span className={styles.headerCellAction} />
      </div>
      <div role="list" aria-label="Work items">
        {items.map((item, index) => (
          <WorkItemRow
            key={item.id}
            item={item}
            rowNumber={index + 1}
            onUpdate={(field, value) => onUpdate(item.id, field, value)}
            onRemove={() => onRemove(item.id)}
          />
        ))}
      </div>
    </div>
  )
}
