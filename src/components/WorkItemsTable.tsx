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
    <div className="table-container" role="region" aria-label="Work Items Table">
      <table className="work-items-table">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Title</th>
            <th scope="col">Notes</th>
            <th scope="col" title="Best Case Hours">Best</th>
            <th scope="col" title="Worst Case Hours">Worst</th>
            <th scope="col" title="Expected Hours">Expected</th>
            <th scope="col" title="Range Spread Hours">Range</th>
            <th scope="col" title="Variance">Var</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const warning = getItemWarning(item)
            return (
              <tr key={item.id}>
                <td>
                  <div className="id-cell">
                    <span aria-label={`Work item ${item.id}`}>{item.id}</span>
                    {warning && (
                      <span 
                        title={warning} 
                        className="warning-icon" 
                        role="img" 
                        aria-label={`Warning: ${warning}`}
                      >
                        ⚠️
                      </span>
                    )}
                  </div>
                </td>
                <td data-label="Title">
                  <label htmlFor={`title-${item.id}`} className="sr-only">
                    Title for item {item.id}
                  </label>
                  <input
                    id={`title-${item.id}`}
                    type="text"
                    value={item.title}
                    onChange={(e) => onUpdate(item.id, 'title', e.target.value)}
                    className="text-input"
                    placeholder="Feature or task name"
                    aria-label={`Title for work item ${item.id}`}
                  />
                </td>
                <td data-label="Notes">
                  <label htmlFor={`notes-${item.id}`} className="sr-only">
                    Notes for item {item.id}
                  </label>
                  <input
                    id={`notes-${item.id}`}
                    type="text"
                    value={item.notes}
                    onChange={(e) => onUpdate(item.id, 'notes', e.target.value)}
                    className="text-input"
                    placeholder="Additional details"
                    aria-label={`Notes for work item ${item.id}`}
                  />
                </td>
                <td data-label="Best Case (hrs)">
                  <label htmlFor={`best-${item.id}`} className="sr-only">
                    Best case hours for item {item.id}
                  </label>
                  <input
                    id={`best-${item.id}`}
                    type="number"
                    min="0"
                    step="1"
                    value={item.best_case_hours}
                    onChange={(e) => onUpdate(item.id, 'best_case_hours', e.target.value)}
                    className="number-input"
                    aria-label={`Best case hours for work item ${item.id}`}
                  />
                </td>
                <td data-label="Worst Case (hrs)">
                  <label htmlFor={`worst-${item.id}`} className="sr-only">
                    Worst case hours for item {item.id}
                  </label>
                  <input
                    id={`worst-${item.id}`}
                    type="number"
                    min="0"
                    step="1"
                    value={item.worst_case_hours}
                    onChange={(e) => onUpdate(item.id, 'worst_case_hours', e.target.value)}
                    className="number-input"
                    aria-label={`Worst case hours for work item ${item.id}`}
                  />
                </td>
                <td data-label="Expected (hrs)">
                  <span aria-label={`Expected hours: ${item.expected_hours.toFixed(2)}`}>
                    {item.expected_hours.toFixed(2)}
                  </span>
                </td>
                <td data-label="Range Spread (hrs)">
                  <span aria-label={`Range spread: ${item.range_spread_hours.toFixed(2)} hours`}>
                    {item.range_spread_hours.toFixed(2)}
                  </span>
                </td>
                <td data-label="Variance">
                  <span aria-label={`Variance: ${item.variance.toFixed(2)}`}>
                    {item.variance.toFixed(2)}
                  </span>
                </td>
                <td data-label="Actions">
                  <button
                    onClick={() => onRemove(item.id)}
                    className="btn-danger"
                    aria-label={`Remove work item ${item.id}`}
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
