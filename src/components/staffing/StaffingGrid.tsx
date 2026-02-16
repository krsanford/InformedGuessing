import type { StaffingRow as StaffingRowType, StaffingGridComputed } from '../../types'
import { StaffingRow } from './StaffingRow'
import styles from './StaffingGrid.module.css'

interface StaffingGridProps {
  rows: StaffingRowType[]
  weekCount: number
  gridComputed: StaffingGridComputed
  onUpdateRow: (rowId: number, updates: Partial<Omit<StaffingRowType, 'id' | 'cells'>>) => void
  onUpdateCell: (rowId: number, weekIndex: number, value: string) => void
  onRemoveRow: (rowId: number) => void
  onToggleRow: (rowId: number) => void
  onDuplicateRow: (rowId: number) => void
}

function formatCurrency(value: number): string {
  return '$' + value.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

// Column order: # | toggle | trash | Discipline | $/hr | Hours | Cost | W1 W2 ... WN
function buildGridColumns(weekCount: number): string {
  const weekCols = weekCount > 0 ? ` repeat(${weekCount}, 56px)` : ''
  return `40px 32px 32px 160px 80px 72px 88px${weekCols}`
}

export function StaffingGrid({
  rows,
  weekCount,
  gridComputed,
  onUpdateRow,
  onUpdateCell,
  onRemoveRow,
  onToggleRow,
  onDuplicateRow,
}: StaffingGridProps) {
  const gridColumns = buildGridColumns(weekCount)

  return (
    <div className={styles.grid}>
      <div className={styles.scrollContainer}>
        {/* Header row */}
        <div
          className={styles.headerRow}
          style={{ gridTemplateColumns: gridColumns }}
          aria-hidden="true"
        >
          <span className={`${styles.headerCell} ${styles.stickyId}`}>#</span>
          <span className={`${styles.headerCellAction} ${styles.stickyToggle}`} />
          <span className={`${styles.headerCellAction} ${styles.stickyTrash}`} />
          <span className={`${styles.headerCell} ${styles.stickyDiscipline}`}>Discipline</span>
          <span className={`${styles.headerCellNum} ${styles.stickyRate}`}>$/hr</span>
          <span className={`${styles.headerCellComputed} ${styles.stickyHours}`}>Hours</span>
          <span className={`${styles.headerCellComputed} ${styles.stickyCost}`}>Cost</span>
          {Array.from({ length: weekCount }, (_, i) => (
            <span key={i} className={styles.headerCellWeek}>
              W{i + 1}
            </span>
          ))}
        </div>

        {/* Data rows */}
        <div role="list" aria-label="Staffing rows">
          {rows.map((row, index) => (
            <StaffingRow
              key={row.id}
              row={row}
              rowNumber={index + 1}
              rowComputed={gridComputed.row_totals[index]}
              onUpdateRow={(updates) => onUpdateRow(row.id, updates)}
              onUpdateCell={(weekIndex, value) => onUpdateCell(row.id, weekIndex, value)}
              onRemove={() => onRemoveRow(row.id)}
              onToggle={() => onToggleRow(row.id)}
              onDuplicate={() => onDuplicateRow(row.id)}
              gridColumns={gridColumns}
            />
          ))}
        </div>

        {/* Summary row */}
        {rows.length > 0 && (
          <div
            className={styles.summaryRow}
            style={{ gridTemplateColumns: gridColumns }}
          >
            <span className={styles.stickyId} />
            <span className={styles.stickyToggle} />
            <span className={styles.stickyTrash} />
            <span className={`${styles.summaryLabel} ${styles.stickyDiscipline}`}>Totals</span>
            <span className={styles.stickyRate} />
            <span className={`${styles.summaryTotal} ${styles.stickyHours}`}>
              {gridComputed.grand_total_hours}
            </span>
            <span className={`${styles.summaryCost} ${styles.stickyCost}`}>
              {formatCurrency(gridComputed.grand_total_cost)}
            </span>
            {gridComputed.week_totals.map((total, i) => (
              <span key={i} className={styles.summaryCell}>
                {total > 0 ? total : ''}
              </span>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
