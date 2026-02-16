import { useState } from 'react'
import type { AppAction, StaffingState, StaffingGridComputed, StaffingComparison } from '../../types'
import type { GapDecomposition } from '../../domain/coordination'
import { StaffingGrid } from './StaffingGrid'
import styles from './StaffingSection.module.css'

interface StaffingSectionProps {
  staffing: StaffingState
  comparison: StaffingComparison | null
  gridComputed: StaffingGridComputed
  dispatch: React.Dispatch<AppAction>
  estimateDurationWeeks: number | null
  gapDecomposition: GapDecomposition | null
  impliedPeople: number
  baseEffortHours: number | null
  billableHoursPerWeek: number
}

export function StaffingSection({
  staffing,
  comparison,
  gridComputed,
  dispatch,
  estimateDurationWeeks,
  gapDecomposition,
  impliedPeople,
  baseEffortHours,
  billableHoursPerWeek,
}: StaffingSectionProps) {
  const [isOpen, setIsOpen] = useState(true)

  // Don't render until there's an estimate or the user has started staffing
  if (staffing.rows.length === 0 && staffing.week_count === 0 && estimateDurationWeeks === null) {
    return null
  }

  const hasData = staffing.rows.length > 0 && gridComputed.grand_total_hours > 0

  return (
    <div className={`${styles.section} ${isOpen ? styles.sectionOpen : ''}`}>
      {/* Toggle header */}
      <button
        className={styles.sectionToggle}
        onClick={() => setIsOpen((o) => !o)}
        type="button"
      >
        <span className={styles.sectionLabelText}>Staffing Plan</span>
        {staffing.rows.length > 0 && (
          <span className={styles.count}>{staffing.rows.length}</span>
        )}
        <span className={styles.toolbarSpacer} />

        {/* Week count adjuster */}
        {isOpen && staffing.week_count > 0 && (
          <div className={styles.weekAdjuster} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => dispatch({ type: 'STAFFING_SET_WEEK_COUNT', weekCount: staffing.week_count - 1 })}
              className={styles.weekButton}
              aria-label="Remove week"
              disabled={staffing.week_count <= 1}
              type="button"
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
              type="button"
            >
              +
            </button>
          </div>
        )}

        {isOpen && (
          <button
            onClick={(e) => { e.stopPropagation(); dispatch({ type: 'STAFFING_ADD_ROW' }) }}
            className={styles.addButton}
            disabled={staffing.week_count === 0}
            type="button"
          >
            + Add Role
          </button>
        )}
      </button>

      {/* Data banners — always visible */}

      {/* Estimate summary — shown before staffing grid has data */}
      {!hasData && baseEffortHours !== null && (
        <div className={styles.comparison}>
          <div className={styles.comparisonItem}>
            <span className={styles.comparisonLabel}>Implied Team</span>
            <span className={styles.comparisonValue}>
              {impliedPeople}
            </span>
          </div>
          <span className={styles.comparisonSep} aria-hidden="true" />
          <div className={styles.comparisonItem}>
            <span className={styles.comparisonLabel}>Base Estimate</span>
            <span className={styles.comparisonValue}>
              {Math.round(baseEffortHours)}h
            </span>
          </div>
        </div>
      )}

      {/* Gap decomposition banner */}
      {gapDecomposition && hasData && (
        <div className={styles.comparison}>
          <div className={styles.comparisonItem}>
            <span className={styles.comparisonLabel}>Implied Team</span>
            <span className={styles.comparisonValue}>
              {impliedPeople}
            </span>
          </div>
          <span className={styles.comparisonSep} aria-hidden="true" />
          <div className={styles.comparisonItem}>
            <span className={styles.comparisonLabel}>Base Estimate</span>
            <span className={styles.comparisonValue}>
              {Math.round(gapDecomposition.base_effort_hours)}h
            </span>
          </div>
          <span className={styles.comparisonSep} aria-hidden="true" />
          <div className={styles.comparisonItem}>
            <span className={styles.comparisonLabel}>Coordination</span>
            <span className={styles.comparisonCoordination}>
              +{Math.round(gapDecomposition.coordination_overhead_hours)}h
            </span>
          </div>
          <span className={styles.comparisonSep} aria-hidden="true" />
          <div className={styles.comparisonItem}>
            <span className={styles.comparisonLabel}>Adjusted</span>
            <span className={styles.comparisonValue}>
              {Math.round(gapDecomposition.adjusted_effort_hours)}h
            </span>
          </div>
          <span className={styles.comparisonSep} aria-hidden="true" />
          <div className={styles.comparisonItem}>
            <span className={styles.comparisonLabel}>Staffed</span>
            <span className={styles.comparisonValue}>
              {Math.round(gapDecomposition.staffed_hours)}h
            </span>
          </div>
          <span className={styles.comparisonSep} aria-hidden="true" />
          <div className={styles.comparisonItem}>
            <span className={styles.comparisonLabel}>Buffer</span>
            <span className={
              gapDecomposition.buffer_status === 'short'
                ? styles.comparisonShort
                : gapDecomposition.buffer_status === 'tight'
                  ? styles.comparisonDelta
                  : styles.comparisonBuffered
            }>
              {gapDecomposition.remaining_buffer_hours >= 0 ? '+' : ''}{Math.round(gapDecomposition.remaining_buffer_hours)}h
            </span>
          </div>
        </div>
      )}

      {/* Fallback: simple comparison */}
      {!gapDecomposition && comparison && hasData && (
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

      {/* Collapsible content */}
      {isOpen && (
        <>
          {!hasData && staffing.week_count === 0 && baseEffortHours === null && (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>
                Create your estimate, then initialize the staffing grid and add roles.
              </p>
            </div>
          )}

          {/* Initialize from estimate prompt */}
          {staffing.week_count === 0 && estimateDurationWeeks !== null && estimateDurationWeeks > 0 && (
            <button
              onClick={() => dispatch({ type: 'STAFFING_INIT_FROM_ESTIMATE', weekCount: estimateDurationWeeks, impliedPeople, totalEffortHours: baseEffortHours!, hoursPerWeek: billableHoursPerWeek })}
              className={styles.initButton}
              type="button"
            >
              Initialize staffing grid ({estimateDurationWeeks} weeks from estimate)
            </button>
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
              onToggleRow={(rowId) =>
                dispatch({ type: 'STAFFING_TOGGLE_ROW', rowId })
              }
              onDuplicateRow={(rowId) =>
                dispatch({ type: 'DUPLICATE_STAFFING_ROW', rowId })
              }
            />
          )}

          {/* Empty state with reinitialize option */}
          {staffing.week_count > 0 && staffing.rows.length === 0 && (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>No roles yet — click "+ Add Role" to start building your staffing plan</p>
              {estimateDurationWeeks !== null && estimateDurationWeeks > 0 && (
                <button
                  onClick={() => dispatch({ type: 'STAFFING_INIT_FROM_ESTIMATE', weekCount: estimateDurationWeeks, impliedPeople, totalEffortHours: baseEffortHours!, hoursPerWeek: billableHoursPerWeek })}
                  className={styles.initButton}
                  type="button"
                >
                  Reinitialize from estimate ({estimateDurationWeeks} weeks)
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
