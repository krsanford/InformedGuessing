import { useReducer } from 'react'
import { calculatePortfolio, calculateWorkItem } from './domain/estimation'
import { appReducer, initialState } from './reducer'
import { WorkItemsTable } from './components/WorkItemsTable'
import { AdvancedVariables } from './components/AdvancedVariables'
import { OutputsSection } from './components/OutputsSection'
import type { WorkItem } from './domain/estimation'
import './App.css'

function App() {
  const [state, dispatch] = useReducer(appReducer, initialState)

  const itemsWithCalculations = state.workItems.map((item) => ({
    ...item,
    ...calculateWorkItem(item, state.constants),
  }))

  const results = state.workItems.length > 0
    ? calculatePortfolio(state.workItems, state.constants)
    : null

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
    <div className="app-container">
      <h1 className="app-title">Informed Guessing - Estimation Workbench</h1>

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">1. Inputs</h2>
          <button onClick={() => dispatch({ type: 'ADD_WORK_ITEM' })} className="btn-primary">
            + Add Work Item
          </button>
        </div>

        {state.workItems.length === 0 ? (
          <p className="empty-state">No work items yet. Click "+ Add Work Item" to get started.</p>
        ) : (
          <WorkItemsTable
            items={itemsWithCalculations}
            onUpdate={handleFieldUpdate}
            onRemove={(id) => dispatch({ type: 'REMOVE_WORK_ITEM', id })}
          />
        )}
      </section>

      <AdvancedVariables
        constants={state.constants}
        onUpdate={(updates) => dispatch({ type: 'UPDATE_CONSTANTS', updates })}
        onReset={() => dispatch({ type: 'RESET_CONSTANTS' })}
      />

      <OutputsSection results={results} />
    </div>
  )
}

export default App
