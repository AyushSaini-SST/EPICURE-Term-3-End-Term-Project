import { useState, useCallback, useRef, useEffect } from 'react';
import { useShoppingList } from '../context/ShoppingListContext';
import ShoppingItem from '../components/ShoppingItem';
import EmptyState from '../components/EmptyState';

/**
 * ShoppingList — Auto-populated restock list + manual additions.
 * Items are auto-added here whenever you delete or fully use an inventory item.
 */
export default function ShoppingList() {
  const {
    items,
    loading,
    addManualItem,
    toggleChecked,
    removeFromShoppingList,
    clearChecked,
    clearAll,
    checkedCount,
    totalCount,
    progress,
  } = useShoppingList();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemUnit, setNewItemUnit] = useState('pcs');
  const addInputRef = useRef(null);

  // Auto-focus input when add form opens
  useEffect(() => {
    if (showAddForm && addInputRef.current) {
      addInputRef.current.focus();
    }
  }, [showAddForm]);

  const handleAddManual = useCallback(async (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    await addManualItem(newItemName.trim(), parseFloat(newItemQty) || 1, newItemUnit);
    setNewItemName('');
    setNewItemQty('1');
    setNewItemUnit('pcs');
    setShowAddForm(false);
  }, [newItemName, newItemQty, newItemUnit, addManualItem]);

  const handleClearChecked = useCallback(async () => {
    if (checkedCount === 0) return;
    await clearChecked();
  }, [checkedCount, clearChecked]);

  const handleClearAll = useCallback(async () => {
    if (totalCount === 0) return;
    if (window.confirm('Are you sure you want to clear the entire shopping list?')) {
      await clearAll();
    }
  }, [totalCount, clearAll]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner"><div className="spinner"></div></div>
      </div>
    );
  }

  return (
    <div className="page-container" id="shopping-list-page">
      <div className="page-header">
        <h1>Shopping List</h1>
        <p>Items to restock — auto-added when you delete or use up inventory items.</p>
      </div>

      {/* Progress */}
      {totalCount > 0 && (
        <div className="shopping-progress glass-card" style={{ padding: '20px 24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="progress-text">
              {checkedCount} of {totalCount} items purchased
            </span>
            <span className="progress-text" style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
              {progress}%
            </span>
          </div>
          <div className="progress-bar-wrapper">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="toolbar">
        <button
          className="btn btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
          id="manual-add-btn"
        >
          ➕ Add Manually
        </button>

        {checkedCount > 0 && (
          <button className="btn btn-secondary" onClick={handleClearChecked} id="clear-checked-btn">
            🧹 Clear Purchased ({checkedCount})
          </button>
        )}

        {totalCount > 0 && (
          <button className="btn btn-danger" onClick={handleClearAll} id="clear-all-btn">
            🗑️ Clear All
          </button>
        )}
      </div>

      {/* Manual Add Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddManual}
          className="glass-card"
          style={{ padding: '20px', marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}
          id="manual-add-form"
        >
          <div className="form-group" style={{ flex: '2', minWidth: '200px' }}>
            <label className="form-label" htmlFor="manual-item-name">Item Name</label>
            <input
              ref={addInputRef}
              type="text"
              id="manual-item-name"
              className="form-input"
              placeholder="e.g. Olive Oil"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="form-group" style={{ flex: '1', minWidth: '80px' }}>
            <label className="form-label" htmlFor="manual-item-qty">Qty</label>
            <input
              type="number"
              id="manual-item-qty"
              className="form-input"
              value={newItemQty}
              onChange={(e) => setNewItemQty(e.target.value)}
              min="1"
              step="1"
            />
          </div>
          <div className="form-group" style={{ flex: '1', minWidth: '80px' }}>
            <label className="form-label" htmlFor="manual-item-unit">Unit</label>
            <select
              id="manual-item-unit"
              className="form-select"
              value={newItemUnit}
              onChange={(e) => setNewItemUnit(e.target.value)}
            >
              <option value="pcs">pcs</option>
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="L">L</option>
              <option value="ml">ml</option>
              <option value="pack">pack</option>
              <option value="bottles">bottles</option>
              <option value="cans">cans</option>
              <option value="dozen">dozen</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-sm" id="manual-add-submit">
            ✓ Add
          </button>
        </form>
      )}

      {/* Shopping List */}
      {items.length > 0 ? (
        <div className="shopping-list">
          {items.map(item => (
            <ShoppingItem
              key={item.id}
              item={item}
              onToggle={toggleChecked}
              onDelete={removeFromShoppingList}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="🛒"
          title="Shopping list is empty"
          message="Items will appear here automatically when you delete or use up ingredients from your inventory. You can also add items manually."
          action={
            <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
              ➕ Add Item Manually
            </button>
          }
        />
      )}
    </div>
  );
}
