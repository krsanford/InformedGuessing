import type { ReactNode } from 'react'
import type { PortfolioResults } from '../domain/estimation'
import { AnimatedNumber } from './AnimatedNumber'
import { GearIcon } from './icons'
import styles from './OutputsSection.module.css'

interface OutputsSectionProps {
  results: PortfolioResults | null
  settingsOpen: boolean
  onSettingsToggle: () => void
  settingsContent: ReactNode
}

export function OutputsSection({ results, settingsOpen, onSettingsToggle, settingsContent }: OutputsSectionProps) {
  return (
    <div className={styles.footer}>
      <div className={`${styles.settingsPanel} ${settingsOpen ? styles.settingsPanelOpen : ''}`}>
        <div className={styles.settingsInner}>
          {settingsContent}
        </div>
      </div>

      <div className={styles.bar} aria-live="polite">
        <button
          onClick={onSettingsToggle}
          className={`${styles.settingsToggle} ${settingsOpen ? styles.settingsToggleActive : ''}`}
          aria-label="Toggle advanced settings"
          title="Advanced Settings"
        >
          <GearIcon />
        </button>

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
    </div>
  )
}
