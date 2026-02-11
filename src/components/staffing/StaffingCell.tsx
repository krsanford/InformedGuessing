import { isCellAnnotation } from '../../domain/staffing'
import styles from './StaffingCell.module.css'

interface StaffingCellProps {
  value: string
  weekIndex: number
  rowId: number
  onChange: (value: string) => void
}

export function StaffingCell({ value, weekIndex, rowId, onChange }: StaffingCellProps) {
  const isAnnotation = isCellAnnotation(value)

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={(e) => e.target.select()}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          const next = (e.target as HTMLElement).nextElementSibling as HTMLElement | null
          if (next?.tagName === 'INPUT') next.focus()
          else (e.target as HTMLElement).blur()
        }
      }}
      className={`${styles.cell} ${isAnnotation ? styles.cellAnnotation : ''}`}
      placeholder="0"
      aria-label={`Week ${weekIndex + 1} hours for row ${rowId}`}
    />
  )
}
