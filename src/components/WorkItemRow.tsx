import { validateWorkItem } from '../domain/estimation'
import type { WorkItemCalculated } from '../domain/estimation'
import { TrashIcon } from './icons'
import styles from './WorkItemRow.module.css'

interface WorkItemRowProps {
  item: WorkItemCalculated
  onUpdate: (field: 'title' | 'notes' | 'best_case_hours' | 'worst_case_hours', value: string) => void
  onRemove: () => void
}

export function WorkItemRow({ item, onUpdate, onRemove }: WorkItemRowProps) {
  const warning = validateWorkItem(item)

  return (
    <div
      className={`${styles.row} ${warning ? styles.rowWarning : ''}`}
      role="listitem"
      style={{ '--index': item.id } as React.CSSProperties}
    >
      <span className={styles.id}>
        <span aria-label={`Work item ${item.id}`}>{item.id}</span>
        {warning && (
          <span
            className={styles.warningDot}
            title={warning}
            role="img"
            aria-label={`Warning: ${warning}`}
          >
            <span className="sr-only">{warning}</span>
          </span>
        )}
      </span>

      <label htmlFor={`title-${item.id}`} className="sr-only">
        Title for item {item.id}
      </label>
      <input
        id={`title-${item.id}`}
        type="text"
        value={item.title}
        onChange={(e) => onUpdate('title', e.target.value)}
        className={styles.titleInput}
        placeholder="Feature or task name"
        aria-label={`Title for work item ${item.id}`}
      />

      <label htmlFor={`notes-${item.id}`} className="sr-only">
        Notes for item {item.id}
      </label>
      <input
        id={`notes-${item.id}`}
        type="text"
        value={item.notes}
        onChange={(e) => onUpdate('notes', e.target.value)}
        className={styles.notesInput}
        placeholder="Notes..."
        aria-label={`Notes for work item ${item.id}`}
      />

      <label htmlFor={`best-${item.id}`} className="sr-only">
        Best case hours for item {item.id}
      </label>
      <input
        id={`best-${item.id}`}
        type="number"
        min="0"
        step="1"
        value={item.best_case_hours}
        onChange={(e) => onUpdate('best_case_hours', e.target.value)}
        className={styles.numberInput}
        aria-label={`Best case hours for work item ${item.id}`}
      />

      <label htmlFor={`worst-${item.id}`} className="sr-only">
        Worst case hours for item {item.id}
      </label>
      <input
        id={`worst-${item.id}`}
        type="number"
        min="0"
        step="1"
        value={item.worst_case_hours}
        onChange={(e) => onUpdate('worst_case_hours', e.target.value)}
        className={styles.numberInput}
        aria-label={`Worst case hours for work item ${item.id}`}
      />

      <span className={styles.divider} aria-hidden="true" />

      <span className={styles.computed} aria-label={`Expected hours: ${item.expected_hours.toFixed(2)}`}>
        {item.expected_hours.toFixed(2)}
      </span>
      <span className={styles.computed} aria-label={`Range spread: ${item.range_spread_hours.toFixed(2)} hours`}>
        {item.range_spread_hours.toFixed(2)}
      </span>
      <span className={styles.computed} aria-label={`Variance: ${item.variance.toFixed(2)}`}>
        {item.variance.toFixed(2)}
      </span>

      <button
        onClick={onRemove}
        className={styles.removeButton}
        aria-label={`Remove work item ${item.id}`}
      >
        <TrashIcon />
      </button>
    </div>
  )
}
