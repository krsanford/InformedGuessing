import styles from './AppHeader.module.css'

export function AppHeader() {
  return (
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
      </div>
    </header>
  )
}
