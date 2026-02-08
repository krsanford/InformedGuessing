import type { ReactNode } from 'react'
import styles from './MetricCard.module.css'

interface MetricCardProps {
  label: string
  icon?: ReactNode
  children: ReactNode
}

export function MetricCard({ label, icon, children }: MetricCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <strong className={styles.label}>{label}</strong>
      </div>
      <div className={styles.value}>{children}</div>
    </div>
  )
}
