import { useState, useEffect, useRef, type Dispatch } from 'react'
import { useAIEstimate } from '../../hooks/useAIEstimate'
import type { AppAction } from '../../types'
import type { AIWorkItem, AIStaffingRole } from '../../ai/schemas'
import styles from './AIAssistPanel.module.css'

interface AIAssistPanelProps {
  open: boolean
  onClose: () => void
  dispatch: Dispatch<AppAction>
}

export function AIAssistPanel({ open, onClose, dispatch }: AIAssistPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [prompt, setPrompt] = useState('')
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set())
  const [importStaffing, setImportStaffing] = useState(true)
  const { estimate, generate, isLoading, stop, error } = useAIEstimate()

  // Escape key closes panel
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isLoading) stop()
        onClose()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose, isLoading, stop])

  // Focus textarea when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [open])

  // Auto-check new items as they stream in
  useEffect(() => {
    if (estimate?.workItems) {
      setCheckedItems(new Set(estimate.workItems.map((_, i) => i)))
    }
  }, [estimate?.workItems?.length])

  if (!open) return null

  const hasResults = estimate?.workItems && estimate.workItems.length > 0

  const handleSubmit = () => {
    if (!prompt.trim() || isLoading) return
    setCheckedItems(new Set())
    generate({ prompt: prompt.trim() })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const toggleItem = (index: number) => {
    setCheckedItems(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const isCompleteItem = (item: unknown): item is AIWorkItem => {
    const i = item as Partial<AIWorkItem> | undefined
    return !!(i?.title && i?.groupName && typeof i?.best_case_hours === 'number' && typeof i?.worst_case_hours === 'number')
  }

  const isCompleteRole = (role: unknown): role is AIStaffingRole => {
    const r = role as Partial<AIStaffingRole> | undefined
    return !!(r?.discipline && typeof r?.hourly_rate === 'number' && typeof r?.count === 'number')
  }

  const handleAccept = () => {
    if (!estimate?.workItems) return

    const selectedItems = estimate.workItems
      .filter((_, i) => checkedItems.has(i))
      .filter(isCompleteItem)

    if (selectedItems.length > 0) {
      dispatch({
        type: 'AI_IMPORT_ITEMS',
        items: selectedItems.map(item => ({
          title: item.title,
          notes: item.notes ?? '',
          best_case_hours: item.best_case_hours,
          worst_case_hours: item.worst_case_hours,
          groupName: item.groupName,
        })),
      })
    }

    if (importStaffing && estimate.staffingRoles) {
      const completeRoles = estimate.staffingRoles.filter(isCompleteRole)
      if (completeRoles.length > 0) {
        dispatch({
          type: 'AI_IMPORT_STAFFING',
          roles: completeRoles.map(r => ({
            discipline: r.discipline,
            hourly_rate: r.hourly_rate,
            count: r.count,
          })),
          weekCount: 12,
        })
      }
    }

    onClose()
  }

  const handleDiscard = () => {
    if (isLoading) stop()
    onClose()
  }

  const checkedCount = checkedItems.size
  const totalItems = estimate?.workItems?.length ?? 0

  return (
    <div className={styles.backdrop} onClick={handleDiscard}>
      <div
        ref={panelRef}
        className={styles.panel}
        onClick={e => e.stopPropagation()}
        tabIndex={-1}
        role="dialog"
        aria-label="AI Estimate Generator"
      >
        <button className={styles.close} onClick={handleDiscard} aria-label="Close">
          &times;
        </button>

        <h2 className={styles.heading}>AI Estimate Generator</h2>
        <p className={styles.subtitle}>
          Describe your project, feature, or scope of work. The AI will generate work items and a staffing plan.
        </p>

        {/* Prompt input */}
        <div className={styles.inputSection}>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Build a customer portal with authentication, dashboard, invoice management, and reporting..."
            rows={4}
            disabled={isLoading}
          />
          <div className={styles.inputFooter}>
            <span className={styles.hint}>
              {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Enter to submit
            </span>
            {isLoading ? (
              <button className={styles.stopButton} onClick={stop}>
                Stop
              </button>
            ) : (
              <button
                className={styles.generateButton}
                onClick={handleSubmit}
                disabled={!prompt.trim()}
              >
                Generate Estimate
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className={styles.error}>
            {error.message || 'Something went wrong. Please try again.'}
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && !hasResults && (
          <div className={styles.loading}>
            <div className={styles.pulse} />
            Generating estimate...
          </div>
        )}

        {/* Results preview */}
        {hasResults && (
          <div className={styles.results}>
            {/* Work items */}
            <div className={styles.resultSection}>
              <div className={styles.resultHeader}>
                <h3 className={styles.resultTitle}>
                  Work Items
                  <span className={styles.resultCount}>{totalItems}</span>
                </h3>
                <label className={styles.selectAll}>
                  <input
                    type="checkbox"
                    checked={checkedCount === totalItems}
                    onChange={() => {
                      if (checkedCount === totalItems) {
                        setCheckedItems(new Set())
                      } else {
                        setCheckedItems(new Set(estimate!.workItems!.map((_, i) => i)))
                      }
                    }}
                  />
                  All
                </label>
              </div>
              <div className={styles.itemList}>
                {estimate!.workItems!.map((item, i) => {
                  if (!item?.title) return null
                  return (
                    <label key={i} className={styles.itemRow}>
                      <input
                        type="checkbox"
                        checked={checkedItems.has(i)}
                        onChange={() => toggleItem(i)}
                      />
                      <span className={styles.itemGroup}>{item.groupName ?? ''}</span>
                      <span className={styles.itemTitle}>{item.title}</span>
                      <span className={styles.itemRange}>
                        {item.best_case_hours ?? '?'}&ndash;{item.worst_case_hours ?? '?'}h
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Staffing roles */}
            {estimate!.staffingRoles && estimate!.staffingRoles.length > 0 && (
              <div className={styles.resultSection}>
                <div className={styles.resultHeader}>
                  <h3 className={styles.resultTitle}>
                    Staffing Plan
                    <span className={styles.resultCount}>{estimate!.staffingRoles.length}</span>
                  </h3>
                  <label className={styles.selectAll}>
                    <input
                      type="checkbox"
                      checked={importStaffing}
                      onChange={() => setImportStaffing(v => !v)}
                    />
                    Import
                  </label>
                </div>
                <div className={styles.roleList}>
                  {estimate!.staffingRoles.map((role, i) => {
                    if (!role?.discipline) return null
                    return (
                      <div key={i} className={styles.roleRow}>
                        <span className={styles.roleName}>{role.discipline}</span>
                        <span className={styles.roleDetail}>
                          &times;{role.count ?? '?'} &middot; ${role.hourly_rate ?? '?'}/hr
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Assumptions & reasoning */}
            {(estimate!.assumptions?.length || estimate!.reasoning) && (
              <details className={styles.detailsSection}>
                <summary className={styles.detailsSummary}>
                  Assumptions &amp; Reasoning
                </summary>
                <div className={styles.detailsContent}>
                  {estimate!.assumptions && estimate!.assumptions.length > 0 && (
                    <ul className={styles.assumptionsList}>
                      {estimate!.assumptions.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  )}
                  {estimate!.reasoning && (
                    <p className={styles.reasoning}>{estimate!.reasoning}</p>
                  )}
                </div>
              </details>
            )}

            {/* Actions */}
            {!isLoading && (
              <div className={styles.actions}>
                <button className={styles.discardButton} onClick={handleDiscard}>
                  Discard
                </button>
                <button
                  className={styles.acceptButton}
                  onClick={handleAccept}
                  disabled={checkedCount === 0 && !importStaffing}
                >
                  Accept {checkedCount > 0 ? `${checkedCount} Item${checkedCount !== 1 ? 's' : ''}` : ''}
                  {importStaffing && estimate!.staffingRoles?.length ? ' + Staffing' : ''}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
