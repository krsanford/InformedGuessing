import { useMemo } from 'react'
import type { WorkItemCalculated, PortfolioResults, EstimationConstants } from '../../domain/estimation'
import {
  computeUncertaintyBars,
  computeDiversificationData,
  computeDurationCurveData,
} from '../../domain/visualization'
import { UncertaintyBars } from './UncertaintyBars'
import { DiversificationBar } from './DiversificationBar'
import { EffortBreakdown } from './EffortBreakdown'
import { DurationCurve } from '../DurationCurve'
import styles from './InsightsPanel.module.css'

interface InsightsPanelProps {
  items: WorkItemCalculated[]
  results: PortfolioResults | null
  constants: EstimationConstants
}

export function InsightsPanel({ items, results, constants }: InsightsPanelProps) {
  const hasData = results !== null && items.length > 0
  const hasRanges = items.some((i) => i.worst_case_hours > i.best_case_hours)

  const uncertaintyBars = useMemo(
    () => (results ? computeUncertaintyBars(items, results.total_variance) : []),
    [items, results]
  )

  const diversificationData = useMemo(
    () => (results ? computeDiversificationData(items, results) : null),
    [items, results]
  )

  const durationCurveData = useMemo(
    () => (results ? computeDurationCurveData(results, constants) : null),
    [results, constants]
  )

  const showViz = hasData && hasRanges

  return (
    <details className={`${styles.container} ${!showViz ? styles.disabled : ''}`}>
      <summary
        className={styles.sectionLabel}
        onClick={showViz ? undefined : (e) => e.preventDefault()}
      >
        Insights
        {!showViz && <span className={styles.hint}>add estimates to unlock</span>}
      </summary>

      {showViz && <div className={styles.grid}>
        <div className={styles.vizCard}>
          <h3 className={styles.vizTitle}>Effort Breakdown</h3>
          <p className={styles.vizSubtitle}>
            Expected work vs. risk buffer at each confidence level
          </p>
          <div className={styles.vizContent}>
            {results && <EffortBreakdown results={results} />}
          </div>
          <details className={styles.details}>
            <summary className={styles.detailsSummary}>How to use this</summary>
            <p className={styles.detailsBody}>
              The darkest segment is the base expected effort — what you'd budget if everything
              goes roughly as planned. The buffer layers show how much extra to plan for at
              higher confidence levels. <strong>Staff to the 84% number</strong> (expected + 1
              sigma) for most projects. Use the 97% number for high-stakes commitments where
              overrun would be costly. If the buffer feels too large, that's a signal to reduce
              uncertainty in your riskiest items.
            </p>
          </details>
        </div>

        <div className={styles.vizCard}>
          <h3 className={styles.vizTitle}>Uncertainty Ranges</h3>
          <p className={styles.vizSubtitle}>
            Per-item best → worst range, sorted by risk contribution
          </p>
          <div className={`${styles.vizContent} ${styles.vizContentScroll}`}>
            <UncertaintyBars items={uncertaintyBars} />
          </div>
          <details className={styles.details}>
            <summary className={styles.detailsSummary}>Take action</summary>
            <p className={styles.detailsBody}>
              Items at the top contribute the most to portfolio risk. The percentage shows each
              item's share of total variance. <strong>Focus investigation on the top 2-3
              items</strong> — narrowing their ranges will have the biggest impact on reducing
              overall uncertainty. Wide amber bars indicate items where a spike, prototype, or
              requirements clarification session would be most valuable.
            </p>
          </details>
        </div>

        <div className={styles.vizCard}>
          <h3 className={styles.vizTitle}>Diversification Effect</h3>
          <p className={styles.vizSubtitle}>
            Why portfolio risk is less than the sum of individual risks
          </p>
          <div className={styles.vizContent}>
            {diversificationData && (
              <DiversificationBar data={diversificationData} />
            )}
          </div>
          <details className={styles.details}>
            <summary className={styles.detailsSummary}>Why this matters</summary>
            <p className={styles.detailsBody}>
              If you added each item's uncertainty independently, you'd get the amber bar — an
              overly pessimistic total. But statistically, when items are independent, some will
              come in under estimate while others go over. They partially cancel out. <strong>The
              more items in your portfolio, the stronger this effect</strong>. This is why
              large projects are proportionally more predictable than small ones, and why
              it's better to estimate many small items than one giant lump.
            </p>
          </details>
        </div>

        <div className={styles.vizCard}>
          <h3 className={styles.vizTitle}>Duration Scaling</h3>
          <p className={styles.vizSubtitle}>
            Cube-root relationship: effort → calendar time
          </p>
          <div className={styles.vizContent}>
            <DurationCurve data={durationCurveData} />
          </div>
          <details className={styles.details}>
            <summary className={styles.detailsSummary}>What this means</summary>
            <p className={styles.detailsBody}>
              Calendar duration scales with the cube root of effort — not linearly. Doubling
              the work doesn't double the timeline because you can add people. But each
              additional person adds coordination overhead (Brooks's Law). <strong>The curve
              flattens as projects grow</strong>, meaning large projects need proportionally
              less calendar time per unit of effort. Adjust <em>Duration Scaling Power</em>
              in advanced settings to match your team's actual parallelization ability.
            </p>
          </details>
        </div>

      </div>}
    </details>
  )
}
