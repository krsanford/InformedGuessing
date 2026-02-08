import { useState, useMemo } from 'react'
import type { WorkItemCalculated, PortfolioResults, EstimationConstants } from '../../domain/estimation'
import {
  computeDistributionData,
  computeUncertaintyBars,
  computeDiversificationData,
  computeDurationCurveData,
} from '../../domain/visualization'
import { DistributionCurve } from './DistributionCurve'
import { UncertaintyBars } from './UncertaintyBars'
import { DiversificationBar } from './DiversificationBar'
import { EffortBreakdown } from './EffortBreakdown'
import { DurationCurve } from '../DurationCurve'
import { ChartIcon } from '../icons'
import styles from './InsightsPanel.module.css'

interface InsightsPanelProps {
  items: WorkItemCalculated[]
  results: PortfolioResults | null
  constants: EstimationConstants
}

export function InsightsPanel({ items, results, constants }: InsightsPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  const hasData = results !== null && items.length > 0
  const hasRanges = items.some((i) => i.worst_case_hours > i.best_case_hours)

  const distributionData = useMemo(
    () => (results ? computeDistributionData(results) : null),
    [results]
  )

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

  return (
    <div className={styles.container}>
      <button
        onClick={() => setIsOpen((o) => !o)}
        className={`${styles.toggleButton} ${isOpen ? styles.toggleButtonActive : ''}`}
        disabled={!hasData || !hasRanges}
        aria-expanded={isOpen}
        aria-controls="insights-panel"
        title={hasData && hasRanges ? 'Toggle Insights' : 'Add items with ranges to see insights'}
      >
        <ChartIcon />
        <span>Insights</span>
      </button>

      <div
        id="insights-panel"
        className={`${styles.panel} ${isOpen && hasData && hasRanges ? styles.panelOpen : ''}`}
      >
        <div className={styles.panelInner}>
          {/* Row 1: Distribution curve + Effort breakdown */}
          <div className={styles.topRow}>
            <div className={styles.vizCard}>
              <h3 className={styles.vizTitle}>Outcome Distribution</h3>
              <p className={styles.vizSubtitle}>
                Bell curve of likely total effort — shaded regions show confidence levels
              </p>
              <DistributionCurve data={distributionData} />
            </div>

            <div className={styles.vizCard}>
              <h3 className={styles.vizTitle}>Effort Breakdown</h3>
              <p className={styles.vizSubtitle}>
                Expected work vs. risk buffer at each confidence level
              </p>
              {results && <EffortBreakdown results={results} />}
            </div>
          </div>

          {/* Row 2: Three-column grid */}
          <div className={styles.secondRow}>
            <div className={styles.vizCard}>
              <h3 className={styles.vizTitle}>Uncertainty Ranges</h3>
              <p className={styles.vizSubtitle}>
                Per-item best → worst range, sorted by risk contribution
              </p>
              <UncertaintyBars items={uncertaintyBars} />
            </div>

            <div className={styles.vizCard}>
              <h3 className={styles.vizTitle}>Diversification Effect</h3>
              <p className={styles.vizSubtitle}>
                Why portfolio risk is less than the sum of individual risks
              </p>
              {diversificationData && (
                <DiversificationBar data={diversificationData} />
              )}
            </div>

            <div className={styles.vizCard}>
              <h3 className={styles.vizTitle}>Duration Scaling</h3>
              <p className={styles.vizSubtitle}>
                Cube-root relationship: effort → calendar time (Brooks's Law)
              </p>
              <DurationCurve data={durationCurveData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
