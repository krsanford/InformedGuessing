import type { PortfolioResults } from '../domain/estimation'

interface OutputsSectionProps {
  results: PortfolioResults | null
}

export function OutputsSection({ results }: OutputsSectionProps) {
  return (
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
  )
}
