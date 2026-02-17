import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { validateWorkItem } from '../domain/estimation'
import type { WorkItemCalculated } from '../domain/estimation'
import { GripIcon } from './icons'
import { RowContextMenu } from './RowContextMenu'
import styles from './WorkItemRow.module.css'

interface WorkItemRowProps {
  item: WorkItemCalculated
  rowNumber: number
  grouped?: boolean
  lastInGroup?: boolean
  groupEnabled?: boolean
  isDropTarget?: boolean
  dropPosition?: 'before' | 'after' | null
  onUpdate: (field: 'title' | 'notes' | 'best_case_hours' | 'worst_case_hours' | 'multiplier', value: string) => void
  onRemove: () => void
  onToggle: () => void
  onDuplicate: () => void
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

export function WorkItemRow({ item, rowNumber, grouped, lastInGroup, groupEnabled, isDropTarget, dropPosition, onUpdate, onRemove, onToggle, onDuplicate }: WorkItemRowProps) {
  const warning = validateWorkItem(item)
  const disabled = !item.enabled || groupEnabled === false
  const mult = item.multiplier ?? 1

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `item-${item.id}` })

  const style: React.CSSProperties = {
    '--index': rowNumber,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    zIndex: isDragging ? 10 : undefined,
    position: 'relative',
    paddingLeft: grouped ? '12px' : undefined,
    marginBottom: lastInGroup ? '6px' : undefined,
    borderBottomWidth: lastInGroup ? '2px' : undefined,
    borderBottomColor: lastInGroup ? 'var(--surface-border-strong)' : undefined,
  } as React.CSSProperties

  return (
    <div
      ref={setNodeRef}
      className={`${styles.row} ${warning ? styles.rowWarning : ''} ${disabled ? styles.rowDisabled : ''} ${isDragging ? styles.rowDragging : ''} ${isDropTarget && dropPosition === 'before' ? styles.dropBefore : ''} ${isDropTarget && dropPosition === 'after' ? styles.dropAfter : ''}`}
      role="listitem"
      style={style}
    >
      <button
        className={styles.dragHandle}
        {...attributes}
        {...listeners}
        aria-label={`Reorder work item ${rowNumber}`}
        type="button"
      >
        <GripIcon />
      </button>

      <span className={styles.id}>
        <span aria-label={`Work item ${rowNumber}`}>{rowNumber}</span>
      </span>

      <label className={styles.toggleLabel}>
        <input
          type="checkbox"
          checked={item.enabled}
          onChange={onToggle}
          className={styles.toggleInput}
          aria-label={`${disabled ? 'Enable' : 'Disable'} work item ${rowNumber}`}
        />
        <span className={styles.toggleTrack}>
          <span className={styles.toggleThumb} />
        </span>
      </label>

      <RowContextMenu
        multiplier={mult}
        onDelete={onRemove}
        onDuplicate={onDuplicate}
        onMultiplierChange={(v) => onUpdate('multiplier', String(v))}
        ariaLabel={`Actions for work item ${rowNumber}`}
      />

      <div className={styles.titleCell}>
        {mult > 1 && <span className={styles.multiplierBadge} title={`This item is counted ${mult} times in all calculations`}>×{mult}</span>}
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
      </div>

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

      {warning ? (
        <span
          className={styles.warningBadge}
          title={warning}
          role="img"
          aria-label={`Warning: ${warning}`}
        >!</span>
      ) : (
        <span className={styles.divider} aria-hidden="true" />
      )}

      <span className={styles.computed} aria-label={`Expected hours: ${item.expected_hours.toFixed(2)}`} title={`Expected: ${item.expected_hours.toFixed(1)}h — weighted average of best (${item.best_case_hours}h) and worst (${item.worst_case_hours}h)`}>
        {item.expected_hours.toFixed(2)}
      </span>
      <span className={styles.computed} aria-label={`Range spread: ${item.range_spread_hours.toFixed(2)} hours`} title={`Range: ±${item.range_spread_hours.toFixed(1)}h of uncertainty around the expected value`}>
        {item.range_spread_hours.toFixed(2)}
      </span>
      <span className={styles.computed} aria-label={`Variance: ${item.variance.toFixed(2)}`} title={`Variance: ${item.variance.toFixed(1)} — this item's contribution to portfolio risk`}>
        {item.variance.toFixed(2)}
      </span>

    </div>
  )
}
