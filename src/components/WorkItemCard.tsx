import { validateWorkItem } from '../domain/estimation'
import type { WorkItemCalculated } from '../domain/estimation'
import { TrashIcon } from './icons'
import styles from './WorkItemCard.module.css'

interface WorkItemCardProps {
  item: WorkItemCalculated
  onUpdate: (field: 'title' | 'notes' | 'best_case_hours' | 'worst_case_hours', value: string) => void
  onRemove: () => void
}

export function WorkItemCard({ item, onUpdate, onRemove }: WorkItemCardProps) {
  const warning = validateWorkItem(item)

  return (
    <div
      className={styles.card}
      role="listitem"
      style={{ '--index': item.id } as React.CSSProperties}
    >
      {/* Row 1: Badge + Title (remove button is at end of card for tab order) */}
      <div className={styles.headerRow}>
        <span className={warning ? styles.badgeWithWarning : styles.badge}>
          <span aria-label={`Work item ${item.id}`}>{item.id}</span>
          {warning && (
            <>
              <span className={styles.warningDot} />
              <span
                className={styles.warningTooltip}
                title={warning}
                role="img"
                aria-label={`Warning: ${warning}`}
                style={{ position: 'absolute', inset: 0 }}
              >
                <span className="sr-only">{warning}</span>
              </span>
            </>
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
      </div>

      {/* Row 2: Notes */}
      <div className={styles.notesRow}>
        <label htmlFor={`notes-${item.id}`} className="sr-only">
          Notes for item {item.id}
        </label>
        <input
          id={`notes-${item.id}`}
          type="text"
          value={item.notes}
          onChange={(e) => onUpdate('notes', e.target.value)}
          className={styles.notesInput}
          placeholder="Add notes..."
          aria-label={`Notes for work item ${item.id}`}
        />
      </div>

      {/* Row 3: Best / Worst inputs */}
      <div className={styles.inputsRow}>
        <div className={styles.inputGroup}>
          <span className={styles.inputLabel}>Best Case (hrs)</span>
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
        </div>
        <div className={styles.inputGroup}>
          <span className={styles.inputLabel}>Worst Case (hrs)</span>
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
        </div>
      </div>

      {/* Row 4: Computed values as chips */}
      <div className={styles.computedRow}>
        <span className={styles.chip} aria-label={`Expected hours: ${item.expected_hours.toFixed(2)}`}>
          <span className={styles.chipLabel}>Expected</span>
          <span className={styles.chipValue}>{item.expected_hours.toFixed(2)}h</span>
        </span>
        <span className={styles.chip} aria-label={`Range spread: ${item.range_spread_hours.toFixed(2)} hours`}>
          <span className={styles.chipLabel}>Range</span>
          <span className={styles.chipValue}>{item.range_spread_hours.toFixed(2)}h</span>
        </span>
        <span className={styles.chip} aria-label={`Variance: ${item.variance.toFixed(2)}`}>
          <span className={styles.chipLabel}>Var</span>
          <span className={styles.chipValue}>{item.variance.toFixed(2)}</span>
        </span>
      </div>

      {/* Remove button: last in DOM for tab order, positioned top-right via CSS */}
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
