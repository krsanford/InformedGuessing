import type { WorkItem, WorkItemCalculated } from '../domain/estimation'
import { WorkItemCard } from './WorkItemCard'
import { EmptyStateIllustration } from './icons'
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
        <EmptyStateIllustration className={styles.emptyIllustration} />
        <p className={styles.emptyText}>No work items yet</p>
        <p className={styles.emptyHint}>Click &quot;+ Add Work Item&quot; to get started.</p>
      </div>
    )
  }

  return (
    <div className={styles.list} role="list" aria-label="Work items">
      {items.map((item) => (
        <WorkItemCard
          key={item.id}
          item={item}
          onUpdate={(field, value) => onUpdate(item.id, field, value)}
          onRemove={() => onRemove(item.id)}
        />
      ))}
    </div>
  )
}
