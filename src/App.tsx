import { useReducer, useMemo, useState, useCallback, useEffect } from 'react'
import { calculatePortfolio, calculateWorkItem } from './domain/estimation'
import { calculateStaffingGrid, calculateStaffingComparison } from './domain/staffing'
import { calculateCoordination, calculateGapDecomposition } from './domain/coordination'
import { exportSession, importSession, triggerDownload, saveToStorage, loadFromStorage } from './domain/serialization'
import { appReducer, initialState } from './reducer'
import { AppHeader } from './components/AppHeader'
import { WorkItemList } from './components/WorkItemList'
import { AdvancedVariables } from './components/AdvancedVariables'
import { OutputsSection } from './components/OutputsSection'
import { InsightsPanel } from './components/insights/InsightsPanel'
import { StaffingSection } from './components/staffing/StaffingSection'
import type { WorkItem } from './domain/estimation'
import styles from './App.module.css'

function App() {
  const [state, dispatch] = useReducer(appReducer, initialState, () => loadFromStorage() ?? initialState)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    saveToStorage(state)
  }, [state])

  const itemsWithCalculations = state.workItems.map((item) => ({
    ...item,
    ...calculateWorkItem(item, state.constants),
  }))

  // Expand multiplied items into N copies for visualizations
  const expandedItems = itemsWithCalculations.flatMap((item) => {
    const n = item.multiplier ?? 1
    if (n === 1) return [item]
    return Array.from({ length: n }, (_, i) => ({
      ...item,
      id: item.id * 1000 + i, // unique id per copy
      title: item.title ? `${item.title} (${i + 1}/${n})` : `Item ${item.id} (${i + 1}/${n})`,
      multiplier: 1,
    }))
  })

  let results = null
  try {
    if (state.workItems.length > 0) {
      results = calculatePortfolio(state.workItems, state.constants)
    }
  } catch {
    // Invalid inputs — results stay null, outputs show empty state
  }

  const staffingGridComputed = useMemo(
    () => calculateStaffingGrid(state.staffing.rows, state.staffing.week_count),
    [state.staffing.rows, state.staffing.week_count]
  )

  const staffingComparison = useMemo(
    () => results
      ? calculateStaffingComparison(results.total_effort_hours, staffingGridComputed.grand_total_hours)
      : null,
    [results, staffingGridComputed.grand_total_hours]
  )

  const impliedPeople = results && results.duration_weeks > 0
    ? Math.ceil(results.total_effort_staff_weeks / results.duration_weeks)
    : 0

  const coordinationResult = useMemo(
    () => calculateCoordination(
      state.staffing.rows,
      state.staffing.week_count,
      state.constants.coordination_cost_per_pair,
      impliedPeople
    ),
    [state.staffing.rows, state.staffing.week_count, state.constants.coordination_cost_per_pair, impliedPeople]
  )

  const gapDecomposition = useMemo(
    () => results && staffingGridComputed.grand_total_hours > 0
      ? calculateGapDecomposition(
          results.total_effort_hours,
          coordinationResult.total_coordination_hours,
          staffingGridComputed.grand_total_hours
        )
      : null,
    [results, coordinationResult, staffingGridComputed.grand_total_hours]
  )

  const handleExport = useCallback(() => {
    const json = exportSession(state)
    triggerDownload(json, 'rough-math-export.json')
  }, [state])

  const handleImport = useCallback((json: string) => {
    try {
      const session = importSession(json)
      dispatch({ type: 'LOAD_SESSION', session })
    } catch (err) {
      alert(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [])

  const handleReset = useCallback(() => {
    if (window.confirm('Clear all data and start fresh?')) {
      dispatch({ type: 'LOAD_SESSION', session: initialState })
    }
  }, [])

  const handleNumberInput = (id: WorkItem['id'], field: 'best_case_hours' | 'worst_case_hours', value: string) => {
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0) {
      dispatch({ type: 'UPDATE_WORK_ITEM', id, updates: { [field]: numValue } })
    }
  }

  const handleFieldUpdate = (
    id: WorkItem['id'],
    field: 'title' | 'notes' | 'best_case_hours' | 'worst_case_hours' | 'multiplier',
    value: string
  ) => {
    if (field === 'best_case_hours' || field === 'worst_case_hours') {
      handleNumberInput(id, field, value)
    } else if (field === 'multiplier') {
      const v = parseInt(value, 10)
      if (!isNaN(v) && v >= 1) {
        dispatch({ type: 'UPDATE_WORK_ITEM', id, updates: { multiplier: v } })
      }
    } else {
      dispatch({ type: 'UPDATE_WORK_ITEM', id, updates: { [field]: value } })
    }
  }

  return (
    <div className={styles.container}>
      <AppHeader
        settingsOpen={settingsOpen}
        onSettingsToggle={() => setSettingsOpen((o) => !o)}
        onExport={handleExport}
        onImport={handleImport}
        onReset={handleReset}
        settingsContent={
          <AdvancedVariables
            constants={state.constants}
            onUpdate={(updates) => dispatch({ type: 'UPDATE_CONSTANTS', updates })}
            onReset={() => dispatch({ type: 'RESET_CONSTANTS' })}
          />
        }
      />

      <main className={styles.main}>
        <details className={styles.section} open>
          <summary className={styles.sectionToggle}>
            <span className={styles.sectionLabel}>Work Items</span>
            <span className={styles.count}>{state.workItems.length}</span>
            <span className={styles.toolbarSpacer} />
            <button
              onClick={(e) => { e.preventDefault(); dispatch({ type: 'ADD_WORK_ITEM' }) }}
              className={styles.addButton}
            >
              + Add Work Item
            </button>
          </summary>

          <WorkItemList
            items={itemsWithCalculations}
            onUpdate={handleFieldUpdate}
            onRemove={(id) => dispatch({ type: 'REMOVE_WORK_ITEM', id })}
            onToggle={(id) => dispatch({ type: 'TOGGLE_WORK_ITEM', id })}
            onDuplicate={(id) => dispatch({ type: 'DUPLICATE_WORK_ITEM', id })}
          />
        </details>

        <InsightsPanel
          items={expandedItems}
          results={results}
          constants={state.constants}
        />

        <StaffingSection
          staffing={state.staffing}
          comparison={staffingComparison}
          gridComputed={staffingGridComputed}
          dispatch={dispatch}
          estimateDurationWeeks={results?.duration_weeks ?? null}
          gapDecomposition={gapDecomposition}
          impliedPeople={impliedPeople}
          baseEffortHours={results?.total_effort_hours ?? null}
          billableHoursPerWeek={state.constants.billable_hours_per_week}
        />
      </main>

      <OutputsSection
        results={results}
        staffingComputed={staffingGridComputed}
        staffingWeeks={state.staffing.week_count}
        staffingPeople={state.staffing.rows.filter((r) => r.enabled).length}
        gapDecomposition={gapDecomposition}
      />
    </div>
  )
}

export default App
