import type { ReactNode } from 'react'
import styles from './SettingsDrawer.module.css'

interface SettingsDrawerProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
}

export function SettingsDrawer({ isOpen, onClose, children }: SettingsDrawerProps) {
  return (
    <>
      {isOpen && (
        <div
          className={styles.overlay}
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`${styles.drawer} ${isOpen ? styles.open : ''}`}
        aria-label="Settings panel"
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Advanced Settings</h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close settings"
          >
            ×
          </button>
        </div>
        <div className={styles.content}>
          {children}
        </div>
      </aside>
    </>
  )
}
