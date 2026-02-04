import { validateWorkItem } from '../domain/estimation'
import type { WorkItem } from '../domain/estimation'
import type { WorkItemCalculated } from '../domain/estimation'

interface WorkItemsTableProps {
  items: WorkItemCalculated[]
  onUpdate: (
    id: WorkItem['id'],
    field: 'title' | 'notes' | 'best_case_hours' | 'worst_case_hours',
    value: string
  ) => void
  onRemove: (id: WorkItem['id']) => void
}

export function WorkItemsTable({ items, onUpdate, onRemove }: WorkItemsTableProps) {
  const getItemWarning = (item: WorkItem): string | null => {
    return validateWorkItem(item)
  }

  return (
    <div className="table-container">
      <table className="work-items-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Notes</th>
            <th>Best Case (hrs)</th>
            <th>Worst Case (hrs)</th>
            <th>Expected (hrs)</th>
            <th>Range Spread (hrs)</th>
            <th>Variance</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
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
                    type="text"
                    value={item.title}
                    onChange={(e) => onUpdate(item.id, 'title', e.target.value)}
                    className="text-input"
                    placeholder="Feature or task name"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={item.notes}
                    onChange={(e) => onUpdate(item.id, 'notes', e.target.value)}
                    className="text-input"
                    placeholder="Additional details"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={item.best_case_hours}
                    onChange={(e) => onUpdate(item.id, 'best_case_hours', e.target.value)}
                    className="number-input"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={item.worst_case_hours}
                    onChange={(e) => onUpdate(item.id, 'worst_case_hours', e.target.value)}
                    className="number-input"
                  />
                </td>
                <td>{item.expected_hours.toFixed(2)}</td>
                <td>{item.range_spread_hours.toFixed(2)}</td>
                <td>{item.variance.toFixed(2)}</td>
                <td>
                  <button
                    onClick={() => onRemove(item.id)}
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
  )
}
