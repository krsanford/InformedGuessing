import { memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { StaffingRow as StaffingRowType, StaffingRowComputed } from '../../types'
import { GripIcon } from '../icons'
import { StaffingCell } from './StaffingCell'
import { RowContextMenu } from '../RowContextMenu'
import styles from './StaffingRow.module.css'

interface StaffingRowProps {
  row: StaffingRowType
  rowNumber: number
  rowComputed: StaffingRowComputed
  onUpdateRow: (updates: Partial<Omit<StaffingRowType, 'id' | 'cells'>>) => void
  onUpdateCell: (weekIndex: number, value: string) => void
  onRemove: () => void
  onToggle: () => void
  onDuplicate: () => void
  gridColumns: string
}

function formatCurrency(value: number): string {
  return '$' + value.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export const StaffingRow = memo(function StaffingRow({
  row,
  rowNumber,
  rowComputed,
  onUpdateRow,
  onUpdateCell,
  onRemove,
  onToggle,
  onDuplicate,
  gridColumns,
}: StaffingRowProps) {
  const disabled = !row.enabled
  const mult = row.multiplier ?? 1

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id })

  const style: React.CSSProperties = {
    gridTemplateColumns: gridColumns,
    '--index': rowNumber,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    zIndex: isDragging ? 10 : undefined,
    position: 'relative',
  } as React.CSSProperties

  return (
    <div
      ref={setNodeRef}
      className={`${styles.row} ${disabled ? styles.rowDisabled : ''} ${isDragging ? styles.rowDragging : ''}`}
      role="listitem"
      style={style}
    >
      {/* Drag handle - sticky */}
      <button
        className={`${styles.dragHandle} ${styles.stickyGrip}`}
        {...attributes}
        {...listeners}
        aria-label={`Reorder staffing row ${rowNumber}`}
        type="button"
      >
        <GripIcon />
      </button>

      {/* # column - sticky */}
      <span className={`${styles.id} ${styles.stickyId}`}>
        <span aria-label={`Staffing row ${rowNumber}`}>{rowNumber}</span>
      </span>

      {/* Toggle - sticky */}
      <label className={`${styles.toggleLabel} ${styles.stickyToggle}`}>
        <input
          type="checkbox"
          checked={row.enabled}
          onChange={onToggle}
          className={styles.toggleInput}
          aria-label={`${disabled ? 'Enable' : 'Disable'} staffing row ${rowNumber}`}
        />
        <span className={styles.toggleTrack}>
          <span className={styles.toggleThumb} />
        </span>
      </label>

      {/* Context menu - sticky */}
      <div className={`${styles.stickyTrash}`}>
        <RowContextMenu
          multiplier={mult}
          onDelete={onRemove}
          onDuplicate={onDuplicate}
          onMultiplierChange={(v) => onUpdateRow({ multiplier: v })}
          ariaLabel={`Actions for staffing row ${rowNumber}`}
        />
      </div>

      {/* Discipline - sticky */}
      <div className={styles.stickyDiscipline}>
        {mult > 1 && <span className={styles.multiplierBadge}>×{mult}</span>}
        <input
          type="text"
          value={row.discipline}
          onChange={(e) => onUpdateRow({ discipline: e.target.value })}
          className={styles.disciplineInput}
          placeholder="Role / Discipline"
          aria-label={`Discipline for staffing row ${rowNumber}`}
        />
      </div>

      {/* $/hr with $ prefix - sticky */}
      <div className={styles.stickyRate}>
        <span className={styles.ratePrefix}>$</span>
        <input
          type="number"
          min="0"
          step="1"
          value={row.hourly_rate || ''}
          onChange={(e) => {
            const v = parseFloat(e.target.value)
            if (!isNaN(v) && v >= 0) onUpdateRow({ hourly_rate: v })
            else if (e.target.value === '') onUpdateRow({ hourly_rate: 0 })
          }}
          className={styles.rateInput}
          placeholder="0"
          aria-label={`Hourly rate for staffing row ${rowNumber}`}
        />
      </div>

      {/* Hours total - sticky */}
      <span className={`${styles.computed} ${styles.stickyHours}`} aria-label={`Total hours: ${rowComputed.total_hours}`}>
        {rowComputed.total_hours > 0 ? rowComputed.total_hours : ''}
      </span>

      {/* Cost total - sticky */}
      <span className={`${styles.cost} ${styles.stickyCost}`} aria-label={`Total cost: ${formatCurrency(rowComputed.total_cost)}`}>
        {rowComputed.total_cost > 0 ? formatCurrency(rowComputed.total_cost) : ''}
      </span>

      {/* Week cells - scrollable area */}
      {row.cells.map((cell, weekIndex) => (
        <StaffingCell
          key={weekIndex}
          value={cell}
          weekIndex={weekIndex}
          rowId={row.id}
          onChange={(value) => onUpdateCell(weekIndex, value)}
        />
      ))}
    </div>
  )
})
