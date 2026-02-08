import type { PortfolioResults } from '../domain/estimation'
import { MetricCard } from './MetricCard'
import { AnimatedNumber } from './AnimatedNumber'
import { ChartIcon } from './icons'
import styles from './OutputsSection.module.css'

interface OutputsSectionProps {
  results: PortfolioResults | null
}

export function OutputsSection({ results }: OutputsSectionProps) {
  return (
    <div aria-live="polite">
      {results ? (
        <div className={styles.grid}>
          <MetricCard label="Total Expected Hours" icon={<ChartIcon />}>
            <AnimatedNumber value={results.total_expected_hours} /> hrs
          </MetricCard>
          <MetricCard label="Portfolio Range Spread" icon={<ChartIcon />}>
            ±<AnimatedNumber value={results.portfolio_range_spread} /> hrs
          </MetricCard>
          <MetricCard label="Total Effort Hours" icon={<ChartIcon />}>
            <AnimatedNumber value={results.total_effort_hours} /> hrs
          </MetricCard>
          <MetricCard label="Total Staff Weeks" icon={<ChartIcon />}>
            <AnimatedNumber value={results.total_effort_staff_weeks} /> weeks
          </MetricCard>
          <MetricCard label="Duration (Calendar)" icon={<ChartIcon />}>
            {results.duration_weeks} weeks
          </MetricCard>
        </div>
      ) : (
        <p className={styles.emptyState}>Add work items above to see portfolio calculations</p>
      )}
    </div>
  )
}
