import type { EstimationConstants } from '../domain/estimation'

interface AdvancedVariablesProps {
  constants: EstimationConstants
  onUpdate: (updates: Partial<EstimationConstants>) => void
  onReset: () => void
}

export function AdvancedVariables({ constants, onUpdate, onReset }: AdvancedVariablesProps) {
  const handleNumberChange = (field: keyof EstimationConstants, value: string) => {
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue > 0) {
      onUpdate({ [field]: numValue })
    }
  }

  return (
    <details style={{ marginTop: '2rem' }}>
      <summary className="advanced-summary">2. Advanced Variables</summary>
      <div className="advanced-content">
        <div className="advanced-field">
          <label htmlFor="expected_case_position">
            <strong>Expected case position:</strong>
            <span className="field-help"> (0 = best case, 1 = worst case)</span>
          </label>
          <input
            id="expected_case_position"
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={constants.expected_case_position}
            onChange={(e) => handleNumberChange('expected_case_position', e.target.value)}
            className="number-input"
          />
        </div>

        <div className="advanced-field">
          <label htmlFor="range_spread_divisor">
            <strong>Range spread divisor:</strong>
            <span className="field-help"> (higher = tighter confidence interval)</span>
          </label>
          <input
            id="range_spread_divisor"
            type="number"
            min="0.1"
            step="0.1"
            value={constants.range_spread_divisor}
            onChange={(e) => handleNumberChange('range_spread_divisor', e.target.value)}
            className="number-input"
          />
        </div>

        <div className="advanced-field">
          <label htmlFor="billable_hours_per_week">
            <strong>Billable hours/week:</strong>
            <span className="field-help"> (actual productive coding hours)</span>
          </label>
          <input
            id="billable_hours_per_week"
            type="number"
            min="1"
            step="1"
            value={constants.billable_hours_per_week}
            onChange={(e) => handleNumberChange('billable_hours_per_week', e.target.value)}
            className="number-input"
          />
        </div>

        <div className="advanced-field">
          <label htmlFor="duration_scaling_power">
            <strong>Duration scaling power:</strong>
            <span className="field-help"> (coordination overhead factor)</span>
          </label>
          <input
            id="duration_scaling_power"
            type="number"
            min="1"
            step="0.1"
            value={constants.duration_scaling_power}
            onChange={(e) => handleNumberChange('duration_scaling_power', e.target.value)}
            className="number-input"
          />
        </div>

        <button onClick={onReset} className="btn-secondary">
          Reset to Defaults
        </button>
      </div>
    </details>
  )
}
