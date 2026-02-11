import type { EstimationConstants } from '../domain/estimation'
import styles from './AdvancedVariables.module.css'

interface AdvancedVariablesProps {
  constants: EstimationConstants
  onUpdate: (updates: Partial<EstimationConstants>) => void
  onReset: () => void
}

export function AdvancedVariables({ constants, onUpdate, onReset }: AdvancedVariablesProps) {
  const handleNumberChange = (field: keyof EstimationConstants, value: string) => {
    const numValue = parseFloat(value)
    if (isNaN(numValue)) return
    if (field === 'expected_case_position' && (numValue < 0 || numValue > 1)) return
    if (field === 'coordination_cost_per_pair' && (numValue < 0.5 || numValue > 8)) return
    if (field !== 'expected_case_position' && field !== 'coordination_cost_per_pair' && numValue <= 0) return
    onUpdate({ [field]: numValue })
  }

  return (
    <div className={styles.content}>
      <div className={styles.field}>
        <label htmlFor="expected_case_position" className={styles.fieldLabel}>
          Expected Case Position
          <span className={styles.fieldHelp}>Position between best (0) and worst (1) case</span>
        </label>
        <input
          id="expected_case_position"
          type="number"
          min="0"
          max="1"
          step="0.1"
          value={constants.expected_case_position}
          onChange={(e) => handleNumberChange('expected_case_position', e.target.value)}
          className={styles.fieldInput}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="range_spread_divisor" className={styles.fieldLabel}>
          Range Spread Divisor
          <span className={styles.fieldHelp}>Confidence interval width (higher = tighter)</span>
        </label>
        <input
          id="range_spread_divisor"
          type="number"
          min="0.1"
          step="0.1"
          value={constants.range_spread_divisor}
          onChange={(e) => handleNumberChange('range_spread_divisor', e.target.value)}
          className={styles.fieldInput}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="billable_hours_per_week" className={styles.fieldLabel}>
          Billable Hours per Week
          <span className={styles.fieldHelp}>Productive dev hours available per week</span>
        </label>
        <input
          id="billable_hours_per_week"
          type="number"
          min="1"
          step="1"
          value={constants.billable_hours_per_week}
          onChange={(e) => handleNumberChange('billable_hours_per_week', e.target.value)}
          className={styles.fieldInput}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="duration_scaling_power" className={styles.fieldLabel}>
          Duration Scaling Power
          <span className={styles.fieldHelp}>Coordination overhead factor</span>
        </label>
        <input
          id="duration_scaling_power"
          type="number"
          min="1"
          step="0.1"
          value={constants.duration_scaling_power}
          onChange={(e) => handleNumberChange('duration_scaling_power', e.target.value)}
          className={styles.fieldInput}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="coordination_cost_per_pair" className={styles.fieldLabel}>
          Coordination Cost / Pair
          <span className={styles.fieldHelp}>Hours of overhead per pair of people per week</span>
        </label>
        <input
          id="coordination_cost_per_pair"
          type="number"
          min="0.5"
          max="8"
          step="0.5"
          value={constants.coordination_cost_per_pair}
          onChange={(e) => handleNumberChange('coordination_cost_per_pair', e.target.value)}
          className={styles.fieldInput}
        />
      </div>

      <button onClick={onReset} className={styles.resetButton}>
        ↺ Reset to Defaults
      </button>
    </div>
  )
}
