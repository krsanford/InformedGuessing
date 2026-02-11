import type { AppAction, StaffingState, StaffingGridComputed, StaffingComparison } from '../../types'
import { StaffingGrid } from './StaffingGrid'
import styles from './StaffingSection.module.css'

interface StaffingSectionProps {
  staffing: StaffingState
  comparison: StaffingComparison | null
  gridComputed: StaffingGridComputed
  dispatch: React.Dispatch<AppAction>
  estimateDurationWeeks: number | null
}

export function StaffingSection({
  staffing,
  comparison,
  gridComputed,
  dispatch,
  estimateDurationWeeks,
}: StaffingSectionProps) {
  // Don't render until there's an estimate or the user has started staffing
  if (staffing.rows.length === 0 && staffing.week_count === 0 && estimateDurationWeeks === null) {
    return null
  }

  const hasData = staffing.rows.length > 0 && gridComputed.grand_total_hours > 0

  return (
    <details className={styles.section} open>
      <summary className={styles.sectionToggle}>
        <span className={styles.sectionLabelText}>Staffing Plan</span>
        {staffing.rows.length > 0 && (
          <span className={styles.count}>{staffing.rows.length}</span>
        )}
      </summary>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarSpacer} />

        {/* Week count adjuster */}
        {staffing.week_count > 0 && (
          <div className={styles.weekAdjuster}>
            <button
              onClick={() => dispatch({ type: 'STAFFING_SET_WEEK_COUNT', weekCount: staffing.week_count - 1 })}
              className={styles.weekButton}
              aria-label="Remove week"
              disabled={staffing.week_count <= 1}
            >
              −
            </button>
            <span className={styles.weekDisplay}>
              {staffing.week_count} <span className={styles.weekLabel}>wks</span>
            </span>
            <button
              onClick={() => dispatch({ type: 'STAFFING_SET_WEEK_COUNT', weekCount: staffing.week_count + 1 })}
              className={styles.weekButton}
              aria-label="Add week"
            >
              +
            </button>
          </div>
        )}

        <button
          onClick={() => dispatch({ type: 'STAFFING_ADD_ROW' })}
          className={styles.addButton}
          disabled={staffing.week_count === 0}
        >
          + Add Role
        </button>
      </div>

      {/* Initialize from estimate prompt */}
      {staffing.week_count === 0 && estimateDurationWeeks !== null && estimateDurationWeeks > 0 && (
        <button
          onClick={() => dispatch({ type: 'STAFFING_INIT_FROM_ESTIMATE', weekCount: estimateDurationWeeks })}
          className={styles.initButton}
        >
          Initialize staffing grid ({estimateDurationWeeks} weeks from estimate)
        </button>
      )}

      {/* Comparison banner */}
      {comparison && hasData && (
        <div className={styles.comparison}>
          <div className={styles.comparisonItem}>
            <span className={styles.comparisonLabel}>Estimated Effort</span>
            <span className={styles.comparisonValue}>
              {Math.round(comparison.estimated_effort_hours)}h
            </span>
          </div>
          <span className={styles.comparisonSep} aria-hidden="true" />
          <div className={styles.comparisonItem}>
            <span className={styles.comparisonLabel}>Staffed Hours</span>
            <span className={styles.comparisonValue}>
              {Math.round(comparison.staffed_hours)}h
            </span>
          </div>
          <span className={styles.comparisonSep} aria-hidden="true" />
          <div className={styles.comparisonItem}>
            <span className={styles.comparisonLabel}>Buffer</span>
            <span className={styles.comparisonDelta}>
              {comparison.delta_hours >= 0 ? '+' : ''}{Math.round(comparison.delta_hours)}h
              {' '}
              ({comparison.delta_hours >= 0 ? '+' : ''}{comparison.delta_percent.toFixed(0)}%)
            </span>
          </div>
        </div>
      )}

      {/* Grid */}
      {staffing.week_count > 0 && (
        <StaffingGrid
          rows={staffing.rows}
          weekCount={staffing.week_count}
          gridComputed={gridComputed}
          onUpdateRow={(rowId, updates) =>
            dispatch({ type: 'STAFFING_UPDATE_ROW', rowId, updates })
          }
          onUpdateCell={(rowId, weekIndex, value) =>
            dispatch({ type: 'STAFFING_UPDATE_CELL', rowId, weekIndex, value })
          }
          onRemoveRow={(rowId) =>
            dispatch({ type: 'STAFFING_REMOVE_ROW', rowId })
          }
        />
      )}

      {/* Empty state */}
      {staffing.week_count > 0 && staffing.rows.length === 0 && (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>No roles yet — click "+ Add Role" to start building your staffing plan</p>
        </div>
      )}
    </details>
  )
}
