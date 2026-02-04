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
    <details open>
      <summary className="advanced-summary">
        <span className="section-title">
          <span className="section-number">⚙</span>
          Advanced Settings
        </span>
        <span className="collapse-icon">▼</span>
      </summary>
      <div className="advanced-content">
        <div className="advanced-field">
          <label htmlFor="expected_case_position">
            Expected Case Position
            <span className="field-help">Position between best (0) and worst (1) case for expected calculation</span>
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
            Range Spread Divisor
            <span className="field-help">Controls confidence interval width (higher = tighter spread)</span>
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
            Billable Hours per Week
            <span className="field-help">Actual productive development hours available per week</span>
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
            Duration Scaling Power
            <span className="field-help">Coordination overhead factor (higher = more overhead impact)</span>
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

        <button onClick={onReset} className="btn-secondary reset-button">
          ↺ Reset to Defaults
        </button>
      </div>
    </details>
  )
}
