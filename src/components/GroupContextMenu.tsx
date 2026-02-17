import { useState, useRef, useEffect, useCallback } from 'react'
import { EllipsisIcon, TrashIcon, DuplicateIcon, PlusIcon } from './icons'
import styles from './GroupContextMenu.module.css'

interface GroupContextMenuProps {
  multiplier: number
  onDuplicate: () => void
  onDelete: () => void
  onAddItem: () => void
  onMultiplierChange: (value: number) => void
  ariaLabel: string
}

export function GroupContextMenu({
  multiplier,
  onDuplicate,
  onDelete,
  onAddItem,
  onMultiplierChange,
  ariaLabel,
}: GroupContextMenuProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(String(multiplier))
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => { setDraft(String(multiplier)) }, [multiplier])

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
        <div ref={menuRef} className={styles.popover} role="toolbar" aria-label="Group actions">
          <button
            onClick={() => { onAddItem(); close() }}
            className={styles.actionButton}
            aria-label="Add item to group"
            title="Add item"
            type="button"
          >
            <PlusIcon />
          </button>

          <button
            onClick={() => { onDuplicate(); close() }}
            className={styles.actionButton}
            aria-label="Duplicate group"
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
            aria-label="Group multiplier"
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
            aria-label="Delete group"
            title="Delete group"
            type="button"
          >
            <TrashIcon />
          </button>
        </div>
      )}
    </div>
  )
}
