import { useState, useRef, useEffect, useCallback } from 'react'
import { EllipsisIcon, TrashIcon, DuplicateIcon } from './icons'
import styles from './RowContextMenu.module.css'

interface RowContextMenuProps {
  multiplier: number
  onDelete: () => void
  onDuplicate: () => void
  onMultiplierChange: (value: number) => void
  ariaLabel: string
}

export function RowContextMenu({
  multiplier,
  onDelete,
  onDuplicate,
  onMultiplierChange,
  ariaLabel,
}: RowContextMenuProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(String(multiplier))
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const close = useCallback(() => setOpen(false), [])

  // Sync draft when prop changes externally
  useEffect(() => { setDraft(String(multiplier)) }, [multiplier])

  // Commit draft value — used by blur, Enter, and before close
  const commitDraft = useCallback(() => {
    const v = parseInt(draft, 10)
    if (!isNaN(v) && v >= 1) onMultiplierChange(v)
    else setDraft(String(multiplier))
  }, [draft, multiplier, onMultiplierChange])

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        close()
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open, close])

  return (
    <div className={styles.wrapper}>
      <button
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        className={styles.trigger}
        aria-label={ariaLabel}
        aria-expanded={open}
        type="button"
      >
        <EllipsisIcon />
      </button>

      {open && (
        <div ref={menuRef} className={styles.popover} role="toolbar" aria-label="Row actions">
          <button
            onClick={() => { onDuplicate(); close() }}
            className={styles.actionButton}
            aria-label="Duplicate"
            title="Duplicate"
            type="button"
          >
            <DuplicateIcon />
          </button>

          <span className={styles.separator} aria-hidden="true" />

          <button
            onClick={() => onMultiplierChange(Math.max(1, multiplier - 1))}
            className={styles.stepperButton}
            aria-label="Decrease multiplier"
            disabled={multiplier <= 1}
            type="button"
          >
            −
          </button>
          <span className={styles.multiplierLabel}>×</span>
          <input
            type="text"
            inputMode="numeric"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitDraft}
            onKeyDown={(e) => { if (e.key === 'Enter') commitDraft() }}
            className={styles.multiplierInput}
            aria-label="Multiplier"
          />
          <button
            onClick={() => onMultiplierChange(multiplier + 1)}
            className={styles.stepperButton}
            aria-label="Increase multiplier"
            type="button"
          >
            +
          </button>

          <span className={styles.separator} aria-hidden="true" />

          <button
            onClick={() => { onDelete(); close() }}
            className={styles.deleteButton}
            aria-label="Delete"
            title="Delete"
            type="button"
          >
            <TrashIcon />
          </button>
        </div>
      )}
    </div>
  )
}
