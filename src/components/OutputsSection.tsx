import type { PortfolioResults } from '../domain/estimation'

interface OutputsSectionProps {
  results: PortfolioResults | null
}

export function OutputsSection({ results }: OutputsSectionProps) {
  return (
    <>
      {results ? (
        <div className="outputs-grid">
          <div className="output-metric">
            <strong>Total Expected Hours</strong>
            <div className="output-value">{results.total_expected_hours.toFixed(1)} hrs</div>
          </div>
          <div className="output-metric">
            <strong>Portfolio Range Spread</strong>
            <div className="output-value">±{results.portfolio_range_spread.toFixed(1)} hrs</div>
          </div>
          <div className="output-metric">
            <strong>Total Effort Hours</strong>
            <div className="output-value">{results.total_effort_hours.toFixed(1)} hrs</div>
          </div>
          <div className="output-metric">
            <strong>Total Staff Weeks</strong>
            <div className="output-value">{results.total_effort_staff_weeks.toFixed(1)} weeks</div>
          </div>
          <div className="output-metric">
            <strong>Duration (Calendar)</strong>
            <div className="output-value">{results.duration_weeks} weeks</div>
          </div>
        </div>
      ) : (
        <p className="empty-state">Add work items above to see portfolio calculations</p>
      )}
    </>
  )}