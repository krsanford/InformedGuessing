import { useReducer, useState } from 'react'
import { calculatePortfolio, calculateWorkItem } from './domain/estimation'
import { appReducer, initialState } from './reducer'
import { AppHeader } from './components/AppHeader'
import { WorkItemList } from './components/WorkItemList'
import { AdvancedVariables } from './components/AdvancedVariables'
import { OutputsSection } from './components/OutputsSection'
import { SettingsDrawer } from './components/SettingsDrawer'
import { PlusIcon } from './components/icons'
import type { WorkItem } from './domain/estimation'
import styles from './App.module.css'

function App() {
  const [state, dispatch] = useReducer(appReducer, initialState)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const itemsWithCalculations = state.workItems.map((item) => ({
    ...item,
    ...calculateWorkItem(item, state.constants),
  }))

  let results = null
  try {
    if (state.workItems.length > 0) {
      results = calculatePortfolio(state.workItems, state.constants)
    }
  } catch {
    // Invalid inputs — results stay null, outputs show empty state
  }

  const handleNumberInput = (id: WorkItem['id'], field: 'best_case_hours' | 'worst_case_hours', value: string) => {
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0) {
      const currentItem = state.workItems.find((item) => item.id === id)
      if (!currentItem) return

      const updates: Partial<Omit<WorkItem, 'id'>> = { [field]: numValue }

      if (field === 'best_case_hours' && numValue > currentItem.worst_case_hours) {
        updates.worst_case_hours = numValue
      } else if (field === 'worst_case_hours' && numValue < currentItem.best_case_hours) {
        updates.best_case_hours = numValue
      }

      dispatch({ type: 'UPDATE_WORK_ITEM', id, updates })
    }
  }

  const handleFieldUpdate = (
    id: WorkItem['id'],
    field: 'title' | 'notes' | 'best_case_hours' | 'worst_case_hours',
    value: string
  ) => {
    if (field === 'best_case_hours' || field === 'worst_case_hours') {
      handleNumberInput(id, field, value)
    } else {
      dispatch({ type: 'UPDATE_WORK_ITEM', id, updates: { [field]: value } })
    }
  }

  return (
    <div className={styles.container}>
      <AppHeader
        onSettingsToggle={() => setSettingsOpen((o) => !o)}
        settingsOpen={settingsOpen}
      />

      <main className={styles.main}>
        <div className={styles.toolbar}>
          <h2 className={styles.sectionLabel}>Work Items</h2>
          <span className={styles.count}>{state.workItems.length}</span>
          <div className={styles.toolbarSpacer} />
          <button
            onClick={() => dispatch({ type: 'ADD_WORK_ITEM' })}
            className={styles.addButton}
          >
            <PlusIcon />
            + Add Work Item
          </button>
        </div>

        <WorkItemList
          items={itemsWithCalculations}
          onUpdate={handleFieldUpdate}
          onRemove={(id) => dispatch({ type: 'REMOVE_WORK_ITEM', id })}
        />
      </main>

      <OutputsSection results={results} />

      <SettingsDrawer
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      >
        <AdvancedVariables
          constants={state.constants}
          onUpdate={(updates) => dispatch({ type: 'UPDATE_CONSTANTS', updates })}
          onReset={() => dispatch({ type: 'RESET_CONSTANTS' })}
        />
      </SettingsDrawer>
    </div>
  )
}

export default App
