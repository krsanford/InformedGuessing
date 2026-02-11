import { memo } from 'react'
import type { StaffingRow as StaffingRowType, StaffingRowComputed } from '../../types'
import { StaffingCell } from './StaffingCell'
import { TrashIcon } from '../icons'
import styles from './StaffingRow.module.css'

interface StaffingRowProps {
  row: StaffingRowType
  rowNumber: number
  rowComputed: StaffingRowComputed
  onUpdateRow: (updates: Partial<Omit<StaffingRowType, 'id' | 'cells'>>) => void
  onUpdateCell: (weekIndex: number, value: string) => void
  onRemove: () => void
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
  gridColumns,
}: StaffingRowProps) {
  return (
    <div
      className={styles.row}
      role="listitem"
      style={{ gridTemplateColumns: gridColumns, '--index': rowNumber } as React.CSSProperties}
    >
      {/* # column - sticky */}
      <span className={`${styles.id} ${styles.stickyId}`}>
        <span aria-label={`Staffing row ${rowNumber}`}>{rowNumber}</span>
      </span>

      {/* Remove button - sticky, right after # */}
      <button
        onClick={onRemove}
        className={`${styles.removeButton} ${styles.stickyTrash}`}
        aria-label={`Remove staffing row ${rowNumber}`}
      >
        <TrashIcon />
      </button>

      {/* Discipline - sticky */}
      <div className={styles.stickyDiscipline}>
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
