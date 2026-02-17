import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { WorkItemGroup, GroupSubtotals } from '../domain/estimation'
import { GripIcon, ChevronIcon } from './icons'
import { GroupContextMenu } from './GroupContextMenu'
import styles from './GroupHeader.module.css'

interface GroupHeaderProps {
  group: WorkItemGroup
  subtotals: GroupSubtotals
  isDropTarget?: boolean
  onToggle: () => void
  onToggleCollapse: () => void
  onUpdateName: (name: string) => void
  onRemove: () => void
  onAddItem: () => void
  onDuplicate: () => void
  onMultiplierChange: (value: number) => void
}

export function GroupHeader({
  group,
  subtotals,
  isDropTarget,
  onToggle,
  onToggleCollapse,
  onUpdateName,
  onRemove,
  onAddItem,
  onDuplicate,
  onMultiplierChange,
}: GroupHeaderProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `group-${group.id}` })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    zIndex: isDragging ? 10 : undefined,
    position: 'relative',
  }

  return (
    <div
      ref={setNodeRef}
      className={`${styles.groupHeader} ${!group.enabled ? styles.disabled : ''} ${isDragging ? styles.dragging : ''} ${group.collapsed ? styles.collapsed : ''} ${isDropTarget ? styles.dropTarget : ''}`}
      style={style}
      role="row"
    >
      <button
        className={styles.dragHandle}
        {...attributes}
        {...listeners}
        type="button"
        aria-label={`Reorder group ${group.name}`}
      >
        <GripIcon />
      </button>

      <button
        className={styles.chevron}
        onClick={onToggleCollapse}
        type="button"
        aria-label={group.collapsed ? 'Expand group' : 'Collapse group'}
        aria-expanded={!group.collapsed}
      >
        <ChevronIcon
          width={14}
          height={14}
          style={{ transform: group.collapsed ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform var(--duration-fast) var(--ease-out)' }}
        />
      </button>

      <label className={styles.toggleLabel}>
        <input
          type="checkbox"
          checked={group.enabled}
          onChange={onToggle}
          className={styles.toggleInput}
          aria-label={`${group.enabled ? 'Disable' : 'Enable'} group ${group.name}`}
        />
        <span className={styles.toggleTrack}>
          <span className={styles.toggleThumb} />
        </span>
      </label>

      <GroupContextMenu
        multiplier={group.multiplier ?? 1}
        onDuplicate={onDuplicate}
        onDelete={onRemove}
        onMultiplierChange={onMultiplierChange}
        ariaLabel={`Actions for group ${group.name}`}
      />

      <div className={styles.nameCell}>
        {(group.multiplier ?? 1) > 1 && (
          <span className={styles.multiplierBadge} title={`This group is counted ${group.multiplier} times in all calculations`}>
            ×{group.multiplier}
          </span>
        )}
        <input
          type="text"
          value={group.name}
          onChange={(e) => onUpdateName(e.target.value)}
          className={styles.nameInput}
          aria-label="Group name"
        />
      </div>

      <span className={styles.itemCountGroup}>
        <span className={styles.itemCount}>
          {subtotals.item_count} item{subtotals.item_count !== 1 ? 's' : ''}
        </span>
        <button
          className={styles.addItemButton}
          onClick={onAddItem}
          type="button"
          aria-label={`Add item to ${group.name}`}
          title="Add item"
        >
          +
        </button>
      </span>

      <span className={styles.divider} aria-hidden="true" />

      <span className={styles.computed} title={`Expected: ${subtotals.total_expected_hours.toFixed(1)}h`}>
        {subtotals.total_expected_hours.toFixed(2)}
      </span>
      <span className={styles.computed} title={`Range: ${subtotals.portfolio_range_spread.toFixed(1)}h`}>
        {subtotals.portfolio_range_spread.toFixed(2)}
      </span>
      <span className={styles.computed} title={`Variance: ${subtotals.total_variance.toFixed(1)}`}>
        {subtotals.total_variance.toFixed(2)}
      </span>
    </div>
  )
}
