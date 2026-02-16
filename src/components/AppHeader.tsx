import { type ReactNode, useRef } from 'react'
import { GearIcon, DownloadIcon, UploadIcon, ResetIcon, InfoIcon } from './icons'
import styles from './AppHeader.module.css'

interface AppHeaderProps {
  settingsOpen: boolean
  onSettingsToggle: () => void
  onExport: () => void
  onImport: (json: string) => void
  onReset: () => void
  onInfoToggle: () => void
  settingsContent: ReactNode
}

export function AppHeader({ settingsOpen, onSettingsToggle, onExport, onImport, onReset, onInfoToggle, settingsContent }: AppHeaderProps) {
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
    e.target.value = ''
  }

  return (
    <div className={styles.stickyWrap}>
      <header className={styles.header}>
        <div className={styles.inner}>
          <svg className={styles.logo} viewBox="0 0 32 32" aria-hidden="true">
            <path
              d="M24 12.5 L15.5 12.5 C9.5 12.5, 7.5 16.5, 7.5 19.5 C7.5 23.5, 10.5 26, 15 26 C19.5 26, 22.5 23, 22.5 19.5 C22.5 16, 19.5 13, 15.5 12.5"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          <div className={styles.textGroup}>
            <h1 className={styles.title}>Rough Math</h1>
            <p className={styles.subtitle}>two-point estimation workbench</p>
          </div>

          <div className={styles.actions}>
            <button
              onClick={onInfoToggle}
              className={`${styles.actionBtn} ${styles.actionBtnInfo}`}
              aria-label="About Rough Math"
              data-tip="What is this tool and how does it work?"
              data-tip-pos="bottom-end"
            >
              <InfoIcon />
            </button>
            <button
              onClick={onSettingsToggle}
              className={`${styles.actionBtn} ${settingsOpen ? styles.actionBtnActive : ''}`}
              aria-label="Toggle advanced settings"
              data-tip="Adjust calculation parameters like confidence divisors and scaling"
              data-tip-pos="bottom-end"
            >
              <GearIcon />
            </button>
            <button
              onClick={onExport}
              className={styles.actionBtn}
              aria-label="Export session"
              data-tip="Download your estimates and staffing as a JSON file"
              data-tip-pos="bottom-end"
            >
              <DownloadIcon />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className={styles.actionBtn}
              aria-label="Import session"
              data-tip="Load a previously exported session (replaces current data)"
              data-tip-pos="bottom-end"
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
            <button
              onClick={onReset}
              className={styles.actionBtn}
              aria-label="Reset all data"
              data-tip="Clear everything and start fresh"
              data-tip-pos="bottom-end"
            >
              <ResetIcon />
            </button>
          </div>
        </div>
      </header>

      <div className={`${styles.settingsPanel} ${settingsOpen ? styles.settingsPanelOpen : ''}`}>
        <div className={styles.settingsInnerWrap}>
          <div className={styles.settingsInner}>
            {settingsContent}
          </div>
        </div>
      </div>
    </div>
  )
}
