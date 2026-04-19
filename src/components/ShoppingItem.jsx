import { useCallback } from 'react';

/**
 * ShoppingItem — A single row in the shopping list.
 * Props:
 *   - item: { id, name, quantity, unit, checked, source }
 *   - onToggle(id): toggle checked
 *   - onDelete(id): remove item
 */
export default function ShoppingItem({ item, onToggle, onDelete }) {
  const handleToggle = useCallback(() => onToggle(item.id), [item.id, onToggle]);
  const handleDelete = useCallback(() => onDelete(item.id), [item.id, onDelete]);

  return (
    <div className="shopping-item glass-card animate-in" id={`shopping-item-${item.id}`}>
      <div
        className={`shopping-checkbox ${item.checked ? 'checked' : ''}`}
        onClick={handleToggle}
        role="checkbox"
        aria-checked={item.checked}
        aria-label={`Mark ${item.name} as ${item.checked ? 'not purchased' : 'purchased'}`}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggle(); }}
        id={`checkbox-${item.id}`}
      />

      <div className="shopping-item-info">
        <div className={`shopping-item-name ${item.checked ? 'checked' : ''}`}>
          {item.name}
        </div>
        <div className="shopping-item-detail">
          {item.quantity} {item.unit}
          {item.source === 'auto' && ' • Auto-added from inventory'}
        </div>
      </div>

      <button
        className="shopping-item-delete"
        onClick={handleDelete}
        aria-label={`Remove ${item.name} from shopping list`}
        title="Remove from list"
        id={`delete-shopping-${item.id}`}
      >
        🗑️
      </button>
    </div>
  );
}
