import { type ReactNode, useRef } from 'react'
import type { PortfolioResults } from '../domain/estimation'
import type { StaffingGridComputed } from '../types'
import { AnimatedNumber } from './AnimatedNumber'
import { GearIcon, DownloadIcon, UploadIcon } from './icons'
import styles from './OutputsSection.module.css'

function formatCurrency(value: number): string {
  return '$' + value.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

interface OutputsSectionProps {
  results: PortfolioResults | null
  staffingComputed: StaffingGridComputed | null
  settingsOpen: boolean
  onSettingsToggle: () => void
  settingsContent: ReactNode
  onExport: () => void
  onImport: (json: string) => void
}

export function OutputsSection({ results, staffingComputed, settingsOpen, onSettingsToggle, settingsContent, onExport, onImport }: OutputsSectionProps) {
  const hasStaffing = staffingComputed !== null && staffingComputed.grand_total_hours > 0
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (window.confirm('This will replace all current data. Continue?')) {
          onImport(reader.result)
        }
      }
    }
    reader.readAsText(file)
    // Reset so the same file can be re-selected
    e.target.value = ''
  }

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
        <button
          onClick={onExport}
          className={styles.settingsToggle}
          aria-label="Export session"
          title="Export JSON"
        >
          <DownloadIcon />
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className={styles.settingsToggle}
          aria-label="Import session"
          title="Import JSON"
        >
          <UploadIcon />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        <span className={styles.label}>Estimate</span>
        {results ? (
          <div className={styles.metrics}>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Expected</span>
              <span className={styles.metricValue}>
                <AnimatedNumber value={results.total_expected_hours} />h
              </span>
            </div>
            <span className={styles.sep} aria-hidden="true" />
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Spread</span>
              <span className={styles.metricValue}>
                ±<AnimatedNumber value={results.portfolio_range_spread} />h
              </span>
            </div>
            <span className={styles.sep} aria-hidden="true" />
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Total Effort</span>
              <span className={styles.metricValuePrimary}>
                <AnimatedNumber value={results.total_effort_hours} />h
              </span>
            </div>
            <span className={styles.sep} aria-hidden="true" />
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Staff Weeks</span>
              <span className={styles.metricValue}>
                <AnimatedNumber value={results.total_effort_staff_weeks} />wk
              </span>
            </div>
            <span className={styles.sep} aria-hidden="true" />
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Duration</span>
              <span className={styles.metricValue}>
                {results.duration_weeks}wk
              </span>
            </div>
          </div>
        ) : (
          <span className={styles.empty}>add items to see results</span>
        )}

        {hasStaffing && (
          <>
            <span className={styles.divider} aria-hidden="true" />
            <span className={styles.label}>Staffing</span>
            <div className={styles.metrics}>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Staffed Hours</span>
                <span className={styles.metricValue}>
                  <AnimatedNumber value={staffingComputed.grand_total_hours} />h
                </span>
              </div>
              <span className={styles.sep} aria-hidden="true" />
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Staffing Cost</span>
                <span className={styles.metricValueAccent}>
                  {formatCurrency(staffingComputed.grand_total_cost)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
