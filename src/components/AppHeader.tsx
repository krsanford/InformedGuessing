import styles from './AppHeader.module.css'

export function AppHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.textGroup}>
          <h1 className={styles.title}>Rough Math</h1>
          <p className={styles.subtitle}>two-point estimation workbench</p>
        </div>
      </div>
    </header>
  )
}
