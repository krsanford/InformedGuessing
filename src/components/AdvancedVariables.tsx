import { useState, useEffect } from 'react'
import type { EstimationConstants } from '../domain/estimation'
import styles from './AdvancedVariables.module.css'

interface AdvancedVariablesProps {
  constants: EstimationConstants
  onUpdate: (updates: Partial<EstimationConstants>) => void
  onReset: () => void
}

/** A single number field that lets the user type freely, committing on blur or Enter. */
function ConstantField({
  id,
  label,
  help,
  value,
  step,
  onCommit,
}: {
  id: string
  label: string
  help: string
  value: number
  step: string
  onCommit: (v: number) => void
}) {
  const [draft, setDraft] = useState(String(value))

  // Sync draft when the external value changes (e.g. reset)
  useEffect(() => {
    setDraft(String(value))
  }, [value])

  const commit = () => {
    const n = parseFloat(draft)
    if (!isNaN(n)) {
      onCommit(n)
    } else {
      // Revert to current value
      setDraft(String(value))
    }
  }

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.fieldLabel}>
        {label}
        <span className={styles.fieldHelp}>{help}</span>
      </label>
      <input
        id={id}
        type="number"
        step={step}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit() }}
        className={styles.fieldInput}
      />
    </div>
  )
}

export function AdvancedVariables({ constants, onUpdate, onReset }: AdvancedVariablesProps) {
  return (
    <div className={styles.content}>
      <ConstantField
        id="expected_case_position"
        label="Expected Case Position"
        help="Position between best (0) and worst (1) case"
        value={constants.expected_case_position}
        step="0.1"
        onCommit={(v) => onUpdate({ expected_case_position: v })}
      />
      <ConstantField
        id="range_spread_divisor"
        label="Range Spread Divisor"
        help="Confidence interval width (higher = tighter)"
        value={constants.range_spread_divisor}
        step="0.1"
        onCommit={(v) => onUpdate({ range_spread_divisor: v })}
      />
      <ConstantField
        id="billable_hours_per_week"
        label="Billable Hours per Week"
        help="Productive dev hours available per week"
        value={constants.billable_hours_per_week}
        step="1"
        onCommit={(v) => onUpdate({ billable_hours_per_week: v })}
      />
      <ConstantField
        id="duration_scaling_power"
        label="Duration Scaling Power"
        help="Coordination overhead factor"
        value={constants.duration_scaling_power}
        step="0.1"
        onCommit={(v) => onUpdate({ duration_scaling_power: v })}
      />
      <ConstantField
        id="coordination_cost_per_pair"
        label="Coordination Cost / Pair"
        help="Hours of overhead per pair of people per week"
        value={constants.coordination_cost_per_pair}
        step="0.5"
        onCommit={(v) => onUpdate({ coordination_cost_per_pair: v })}
      />
      <button onClick={onReset} className={styles.resetButton}>
        ↺ Reset to Defaults
      </button>
    </div>
  )
}
