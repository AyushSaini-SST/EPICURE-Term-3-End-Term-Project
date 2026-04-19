import { useCallback, useMemo } from 'react';
import { getExpiryStatus, CATEGORIES } from '../context/InventoryContext';

/**
 * IngredientCard — Displays a single ingredient with expiry color coding.
 * Props:
 *   - item: the ingredient data
 *   - onEdit(item): called when edit clicked
 *   - onUse(item): called when use clicked (decrements qty, auto-adds to shopping list if qty=0)
 *   - onDelete(item): called when delete clicked (auto-adds to shopping list)
 */
export default function IngredientCard({ item, onEdit, onUse, onDelete }) {
  // useMemo: compute expiry status for this card
  const expiryInfo = useMemo(() => getExpiryStatus(item.expiryDate), [item.expiryDate]);

  const categoryInfo = useMemo(
    () => CATEGORIES.find(c => c.value === item.category) || { icon: '📦', label: 'Other' },
    [item.category]
  );

  const formattedDate = useMemo(() => {
    const date = new Date(item.expiryDate);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [item.expiryDate]);

  const handleEdit = useCallback(() => onEdit(item), [item, onEdit]);
  const handleUse = useCallback(() => onUse(item), [item, onUse]);
  const handleDelete = useCallback(() => onDelete(item), [item, onDelete]);

  return (
    <div className={`ingredient-card glass-card status-${expiryInfo.status} animate-in`} id={`ingredient-${item.id}`}>
      <div className="ingredient-header">
        <div className="ingredient-name">
          <span className="ingredient-category">{categoryInfo.icon}</span>
          {item.name}
        </div>
        <div className="ingredient-actions">
          <button
            className="edit-btn"
            onClick={handleEdit}
            title="Edit ingredient"
            aria-label={`Edit ${item.name}`}
            id={`edit-${item.id}`}
          >
            ✏️
          </button>
          <button
            className="use-btn"
            onClick={handleUse}
            title="Use 1 unit (adds to shopping list when depleted)"
            aria-label={`Use ${item.name}`}
            id={`use-${item.id}`}
          >
            🍽️
          </button>
          <button
            className="delete-btn"
            onClick={handleDelete}
            title="Delete & add to restock list"
            aria-label={`Delete ${item.name}`}
            id={`delete-${item.id}`}
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="ingredient-meta">
        <div className="ingredient-meta-item">
          <span className="icon">📦</span>
          <strong>{item.quantity}</strong> {item.unit}
        </div>
        <div className="ingredient-meta-item">
          <span className="icon">📅</span>
          {formattedDate}
        </div>
      </div>

      <div className={`expiry-badge ${expiryInfo.status}`}>
        {expiryInfo.status === 'expired' && '⚠️ '}
        {expiryInfo.status === 'critical' && '🔴 '}
        {expiryInfo.status === 'warning' && '🟠 '}
        {expiryInfo.status === 'fresh' && '🟢 '}
        {expiryInfo.label}
      </div>
    </div>
  );
}
