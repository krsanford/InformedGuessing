import { GearIcon } from './icons'
import styles from './AppHeader.module.css'

interface AppHeaderProps {
  onSettingsToggle: () => void
  settingsOpen: boolean
}

export function AppHeader({ onSettingsToggle, settingsOpen }: AppHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.textGroup}>
          <h1 className={styles.title}>Informed Guessing</h1>
          <p className={styles.subtitle}>two-point estimation workbench</p>
        </div>
        <button
          onClick={onSettingsToggle}
          className={`${styles.gearButton} ${settingsOpen ? styles.gearActive : ''}`}
          aria-label="Toggle settings"
          title="Advanced Settings"
        >
          <GearIcon />
        </button>
      </div>
    </header>
  )
}
