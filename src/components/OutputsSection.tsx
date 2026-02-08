import type { PortfolioResults } from '../domain/estimation'
import { AnimatedNumber } from './AnimatedNumber'
import styles from './OutputsSection.module.css'

interface OutputsSectionProps {
  results: PortfolioResults | null
}

export function OutputsSection({ results }: OutputsSectionProps) {
  return (
    <div className={styles.bar} aria-live="polite">
      <span className={styles.label}>Results</span>
      {results ? (
        <div className={styles.metrics}>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Total Expected Hours</span>
            <span className={styles.metricValue}>
              <AnimatedNumber value={results.total_expected_hours} />h
            </span>
          </div>
          <span className={styles.sep} aria-hidden="true" />
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Portfolio Range Spread</span>
            <span className={styles.metricValue}>
              ±<AnimatedNumber value={results.portfolio_range_spread} />h
            </span>
          </div>
          <span className={styles.sep} aria-hidden="true" />
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Total Effort Hours</span>
            <span className={styles.metricValue}>
              <AnimatedNumber value={results.total_effort_hours} />h
            </span>
          </div>
          <span className={styles.sep} aria-hidden="true" />
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Total Staff Weeks</span>
            <span className={styles.metricValue}>
              <AnimatedNumber value={results.total_effort_staff_weeks} />wk
            </span>
          </div>
          <span className={styles.sep} aria-hidden="true" />
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Duration (Calendar)</span>
            <span className={styles.metricValue}>
              {results.duration_weeks}wk
            </span>
          </div>
        </div>
      ) : (
        <span className={styles.empty}>add items to see results</span>
      )}
    </div>
  )
}
