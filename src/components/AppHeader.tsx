import { CrystalBallIcon } from './icons'
import styles from './AppHeader.module.css'

export function AppHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <CrystalBallIcon className={styles.icon} />
        <div className={styles.textGroup}>
          <h1 className={styles.title}>Informed Guessing</h1>
          <p className={styles.subtitle}>Two-Point Estimation Workbench</p>
        </div>
      </div>
    </header>
  )
}
