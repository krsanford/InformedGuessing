import type { PortfolioResults } from '../domain/estimation'
import type { StaffingGridComputed } from '../types'
import { AnimatedNumber } from './AnimatedNumber'
import styles from './OutputsSection.module.css'

function formatCurrency(value: number): string {
  return '$' + value.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

interface OutputsSectionProps {
  results: PortfolioResults | null
  staffingComputed: StaffingGridComputed | null
  staffingWeeks: number
  staffingPeople: number
}

export function OutputsSection({ results, staffingComputed, staffingWeeks, staffingPeople }: OutputsSectionProps) {
  const hasStaffing = staffingComputed !== null && staffingComputed.grand_total_hours > 0

  // Derive implied team size from estimate
  const estimateTeam = results && results.duration_weeks > 0
    ? Math.ceil(results.total_effort_staff_weeks / results.duration_weeks)
    : null

  return (
    <div className={styles.bar} aria-live="polite">
      {results ? (
        <div className={styles.panels}>
          {/* Estimate side */}
          <div className={styles.panel}>
            <span className={styles.panelLabel}>Estimate</span>
            <div className={styles.metricsRow}>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Duration</span>
                <span className={styles.valueHero}>
                  {results.duration_weeks}<span className={styles.unit}> wk</span>
                </span>
              </div>
              {estimateTeam !== null && (
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Team</span>
                  <span className={styles.valueHero}>
                    {estimateTeam}<span className={styles.unit}> {estimateTeam === 1 ? 'person' : 'people'}</span>
                  </span>
                </div>
              )}
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Effort</span>
                <span className={styles.valueTeal}>
                  <AnimatedNumber value={results.total_effort_hours} /><span className={styles.unit}> h</span>
                </span>
                <span className={styles.detail}>
                  <AnimatedNumber value={results.total_expected_hours} /> <span className={styles.detailSpread}>±<AnimatedNumber value={results.portfolio_range_spread} /></span>
                  {' '}(<AnimatedNumber value={results.total_effort_staff_weeks} /> staff-wk)
                </span>
              </div>
            </div>
          </div>

          {/* Plan side — only when staffing data exists */}
          {hasStaffing && (
            <>
              <span className={styles.divider} aria-hidden="true" />
              <div className={styles.panel}>
                <span className={styles.panelLabel}>Plan</span>
                <div className={styles.metricsRow}>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Duration</span>
                    <span className={styles.valueHero}>
                      {staffingWeeks}<span className={styles.unit}> wk</span>
                    </span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Team</span>
                    <span className={styles.valueHero}>
                      {staffingPeople}<span className={styles.unit}> {staffingPeople === 1 ? 'person' : 'people'}</span>
                    </span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Hours</span>
                    <span className={styles.valueTeal}>
                      <AnimatedNumber value={staffingComputed.grand_total_hours} /><span className={styles.unit}> h</span>
                    </span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Cost</span>
                    <span className={styles.valueHot}>
                      {formatCurrency(staffingComputed.grand_total_cost)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <span className={styles.empty}>add items to see results</span>
      )}
    </div>
  )
}
