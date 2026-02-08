import { validateWorkItem } from '../domain/estimation'
import type { WorkItemCalculated } from '../domain/estimation'
import { TrashIcon } from './icons'
import styles from './WorkItemRow.module.css'

interface WorkItemRowProps {
  item: WorkItemCalculated
  rowNumber: number
  onUpdate: (field: 'title' | 'notes' | 'best_case_hours' | 'worst_case_hours', value: string) => void
  onRemove: () => void
}

function NumberStepper({
  id,
  value,
  ariaLabel,
  onChange,
}: {
  id: string
  value: number
  ariaLabel: string
  onChange: (value: string) => void
}) {
  return (
    <div className={styles.stepperWrap}>
      <input
        id={id}
        type="number"
        min="0"
        step="1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={styles.numberInput}
        aria-label={ariaLabel}
      />
      <div className={styles.stepperButtons}>
        <button
          type="button"
          className={styles.stepUp}
          onClick={() => onChange(String(value + 1))}
          aria-label={`Increase ${ariaLabel}`}
          tabIndex={-1}
        >
          <svg width="8" height="5" viewBox="0 0 8 5" fill="currentColor"><path d="M4 0L8 5H0z"/></svg>
        </button>
        <button
          type="button"
          className={styles.stepDown}
          onClick={() => onChange(String(Math.max(0, value - 1)))}
          aria-label={`Decrease ${ariaLabel}`}
          tabIndex={-1}
        >
          <svg width="8" height="5" viewBox="0 0 8 5" fill="currentColor"><path d="M4 5L0 0h8z"/></svg>
        </button>
      </div>
    </div>
  )
}

export function WorkItemRow({ item, rowNumber, onUpdate, onRemove }: WorkItemRowProps) {
  const warning = validateWorkItem(item)

  return (
    <div
      className={`${styles.row} ${warning ? styles.rowWarning : ''}`}
      role="listitem"
      style={{ '--index': rowNumber } as React.CSSProperties}
    >
      <span className={styles.id}>
        <span aria-label={`Work item ${rowNumber}`}>{rowNumber}</span>
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
        Title for item {rowNumber}
      </label>
      <input
        id={`title-${item.id}`}
        type="text"
        value={item.title}
        onChange={(e) => onUpdate('title', e.target.value)}
        className={styles.titleInput}
        placeholder="Feature or task name"
        aria-label={`Title for work item ${rowNumber}`}
      />

      <label htmlFor={`notes-${item.id}`} className="sr-only">
        Notes for item {rowNumber}
      </label>
      <input
        id={`notes-${item.id}`}
        type="text"
        value={item.notes}
        onChange={(e) => onUpdate('notes', e.target.value)}
        className={styles.notesInput}
        placeholder="Notes..."
        aria-label={`Notes for work item ${rowNumber}`}
      />

      <label htmlFor={`best-${item.id}`} className="sr-only">
        Best case hours for item {rowNumber}
      </label>
      <NumberStepper
        id={`best-${item.id}`}
        value={item.best_case_hours}
        ariaLabel={`Best case hours for work item ${rowNumber}`}
        onChange={(v) => onUpdate('best_case_hours', v)}
      />

      <label htmlFor={`worst-${item.id}`} className="sr-only">
        Worst case hours for item {rowNumber}
      </label>
      <NumberStepper
        id={`worst-${item.id}`}
        value={item.worst_case_hours}
        ariaLabel={`Worst case hours for work item ${rowNumber}`}
        onChange={(v) => onUpdate('worst_case_hours', v)}
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
        aria-label={`Remove work item ${rowNumber}`}
      >
        <TrashIcon />
      </button>
    </div>
  )
}
