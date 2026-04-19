import { useMemo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory, getExpiryStatus, CATEGORIES } from '../context/InventoryContext';
import { useShoppingList } from '../context/ShoppingListContext';
import StatsBar from '../components/StatsBar';
import EmptyState from '../components/EmptyState';

/**
 * Dashboard — Overview page with stats, expiring items, and quick actions.
 */
export default function Dashboard() {
  const { sortedItems, stats, loading, useItem, deleteItem } = useInventory();
  const { addToShoppingList, totalCount } = useShoppingList();
  const navigate = useNavigate();

  // useMemo: top 5 items closest to expiry
  const expiringItems = useMemo(() => {
    return sortedItems.slice(0, 5);
  }, [sortedItems]);

  // useMemo: items that are expired or critical
  const urgentItems = useMemo(() => {
    return sortedItems.filter(item => {
      const { status } = getExpiryStatus(item.expiryDate);
      return status === 'expired' || status === 'critical';
    });
  }, [sortedItems]);

  const handleUseItem = useCallback(async (item) => {
    const result = await useItem(item);
    if (result.fullyUsed) {
      await addToShoppingList({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        source: 'auto',
      });
    }
  }, [useItem, addToShoppingList]);

  const handleDeleteItem = useCallback(async (item) => {
    // Auto-add to shopping list before deleting
    await addToShoppingList({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      source: 'auto',
    });
    await deleteItem(item.id);
  }, [deleteItem, addToShoppingList]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner"><div className="spinner"></div></div>
      </div>
    );
  }

  return (
    <div className="page-container" id="dashboard-page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's your kitchen at a glance.</p>
      </div>

      {/* Stats */}
      <StatsBar stats={stats} />

      {/* Quick Actions */}
      <div className="section-header" style={{ marginTop: '16px' }}>
        <h2>⚡ Quick Actions</h2>
      </div>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => navigate('/inventory')} id="quick-add-btn">
          ➕ Add Ingredient
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/recipes')} id="quick-recipes-btn">
          👨‍🍳 Find Recipes
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/shopping-list')} id="quick-shopping-btn">
          🛒 Shopping List {totalCount > 0 && `(${totalCount})`}
        </button>
      </div>

      {/* Urgent: Expired Items */}
      {urgentItems.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div className="section-header">
            <h2>🚨 Needs Attention</h2>
          </div>
          <div className="expiring-list">
            {urgentItems.map(item => {
              const expiryInfo = getExpiryStatus(item.expiryDate);
              const categoryInfo = CATEGORIES.find(c => c.value === item.category) || { icon: '📦' };
              return (
                <div key={item.id} className="expiring-item animate-in" style={{ borderLeft: '3px solid var(--status-expired)' }}>
                  <div className="expiring-item-left">
                    <span style={{ fontSize: '1.3rem' }}>{categoryInfo.icon}</span>
                    <div>
                      <div className="expiring-item-name">{item.name}</div>
                      <div className="expiring-item-detail">
                        {item.quantity} {item.unit} • {expiryInfo.label}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleUseItem(item)}
                      title="Use this item"
                    >
                      🍽️ Use
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteItem(item)}
                      title="Delete & add to shopping list"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expiring Soon */}
      {expiringItems.length > 0 ? (
        <div>
          <div className="section-header">
            <h2>⏰ Expiring Soon</h2>
            <button className="btn btn-ghost" onClick={() => navigate('/inventory')}>
              View All →
            </button>
          </div>
          <div className="expiring-list">
            {expiringItems.map(item => {
              const expiryInfo = getExpiryStatus(item.expiryDate);
              const categoryInfo = CATEGORIES.find(c => c.value === item.category) || { icon: '📦' };
              const borderColor =
                expiryInfo.status === 'fresh'
                  ? 'var(--status-fresh)'
                  : expiryInfo.status === 'warning'
                    ? 'var(--status-warning)'
                    : 'var(--status-expired)';

              return (
                <div key={item.id} className="expiring-item animate-in" style={{ borderLeft: `3px solid ${borderColor}` }}>
                  <div className="expiring-item-left">
                    <span style={{ fontSize: '1.3rem' }}>{categoryInfo.icon}</span>
                    <div>
                      <div className="expiring-item-name">{item.name}</div>
                      <div className="expiring-item-detail">
                        {item.quantity} {item.unit}
                      </div>
                    </div>
                  </div>
                  <div className={`expiry-badge ${expiryInfo.status}`} style={{ fontSize: '0.75rem' }}>
                    {expiryInfo.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyState
          icon="🧑‍🍳"
          title="Your kitchen is empty"
          message="Start by adding some ingredients to your inventory to track expiry dates and get recipe suggestions."
          action={
            <button className="btn btn-primary" onClick={() => navigate('/inventory')}>
              ➕ Add Your First Ingredient
            </button>
          }
        />
      )}
    </div>
  );
}
