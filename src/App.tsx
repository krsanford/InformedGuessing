import { useReducer } from 'react'
import {
  calculatePortfolio,
  calculateWorkItem,
  validateWorkItem,
} from './domain/estimation'
import { appReducer, initialState } from './reducer'
import type { WorkItem } from './domain/estimation'
import './App.css'

function App() {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Calculate results for each work item
  const itemsWithCalculations = state.workItems.map((item) => ({
    ...item,
    ...calculateWorkItem(item, state.constants),
  }))

  // Calculate portfolio-level results
  const results = state.workItems.length > 0
    ? calculatePortfolio(state.workItems, state.constants)
    : null

  // Handler for number inputs with auto-adjust logic
  const handleNumberInput = (id: WorkItem['id'], field: 'best_case_hours' | 'worst_case_hours', value: string) => {
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0) {
      const currentItem = state.workItems.find((item) => item.id === id)
      if (!currentItem) return

      const updates: Partial<Omit<WorkItem, 'id'>> = { [field]: numValue }

      // Auto-adjust to keep best <= worst
      if (field === 'best_case_hours' && numValue > currentItem.worst_case_hours) {
        updates.worst_case_hours = numValue
      } else if (field === 'worst_case_hours' && numValue < currentItem.best_case_hours) {
        updates.best_case_hours = numValue
      }

      dispatch({ type: 'UPDATE_WORK_ITEM', id, updates })
    }
  }

  // Check if item has validation warning
  const getItemWarning = (item: WorkItem): string | null => {
    return validateWorkItem(item)
  }

  return (
    <div className="app-container">
      <h1 className="app-title">Informed Guessing - Estimation Workbench</h1>

      {/* Inputs Section */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">1. Inputs</h2>
          <button
            onClick={() => dispatch({ type: 'ADD_WORK_ITEM' })}
            className="btn-primary"
          >
            + Add Work Item
          </button>
        </div>

        {state.workItems.length === 0 ? (
          <p className="empty-state">No work items yet. Click "+ Add Work Item" to get started.</p>
        ) : (
          <div className="table-container">
            <table className="work-items-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Best Case (hrs)</th>
                  <th>Worst Case (hrs)</th>
                  <th>Expected (hrs)</th>
                  <th>Range Spread (hrs)</th>
                  <th>Variance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {itemsWithCalculations.map((item) => {
                  const warning = getItemWarning(item)
                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="id-cell">
                          {item.id}
                          {warning && (
                            <span title={warning} className="warning-icon">
                              ⚠️
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={item.best_case_hours}
                          onChange={(e) => handleNumberInput(item.id, 'best_case_hours', e.target.value)}
                          className="number-input"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={item.worst_case_hours}
                          onChange={(e) => handleNumberInput(item.id, 'worst_case_hours', e.target.value)}
                          className="number-input"
                        />
                      </td>
                      <td>{item.expected_hours.toFixed(2)}</td>
                      <td>{item.range_spread_hours.toFixed(2)}</td>
                      <td>{item.variance.toFixed(2)}</td>
                      <td>
                        <button
                          onClick={() => dispatch({ type: 'REMOVE_WORK_ITEM', id: item.id })}
                          className="btn-danger"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Advanced Variables Section */}
      <details style={{ marginTop: '2rem' }}>
        <summary className="advanced-summary">2. Advanced Variables</summary>
        <div className="advanced-content">
          <p>Expected case position: {state.constants.expected_case_position}</p>
          <p>Range spread divisor: {state.constants.range_spread_divisor}</p>
          <p>Billable hours/week: {state.constants.billable_hours_per_week}</p>
          <p>Duration scaling power: {state.constants.duration_scaling_power}</p>
        </div>
      </details>

      {/* Outputs Section */}
      <section className="section">
        <h2>3. Outputs</h2>
        {results ? (
          <div className="outputs-grid">
            <div className="output-metric">
              <strong>Total Expected Hours:</strong>
              <div className="output-value">{results.total_expected_hours.toFixed(2)}</div>
            </div>
            <div className="output-metric">
              <strong>Portfolio Range Spread:</strong>
              <div className="output-value">±{results.portfolio_range_spread.toFixed(2)}</div>
            </div>
            <div className="output-metric">
              <strong>Total Effort Hours:</strong>
              <div className="output-value">{results.total_effort_hours.toFixed(2)}</div>
            </div>
            <div className="output-metric">
              <strong>Total Effort Staff Weeks:</strong>
              <div className="output-value">{results.total_effort_staff_weeks.toFixed(2)}</div>
            </div>
            <div className="output-metric">
              <strong>Duration (Calendar Weeks):</strong>
              <div className="output-value">{results.duration_weeks}</div>
            </div>
          </div>
        ) : (
          <p className="empty-state">Add work items to see results</p>
        )}
      </section>
    </div>
  )
}

export default App
