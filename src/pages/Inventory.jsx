import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useInventory, CATEGORIES } from '../context/InventoryContext';
import { useShoppingList } from '../context/ShoppingListContext';
import IngredientCard from '../components/IngredientCard';
import IngredientForm from '../components/IngredientForm';
import SearchBar from '../components/SearchBar';
import EmptyState from '../components/EmptyState';

/**
 * Inventory — Full inventory management page.
 * Features: add/edit/delete/use ingredients, search, filter by category, sort.
 * Uses useMemo for filtered + sorted list.
 */
export default function Inventory() {
  const { sortedItems, addItem, updateItem, deleteItem, consumeItem, loading } = useInventory();
  const { addToShoppingList } = useShoppingList();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('expiry'); // 'expiry', 'name', 'quantity', 'category'

  const modalRef = useRef(null);

  // Lock scroll when form modal is open
  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showForm]);

  // useMemo: Filter and sort the inventory
  const filteredItems = useMemo(() => {
    let items = [...sortedItems];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      items = items.filter(item => item.category === categoryFilter);
    }

    // Sort
    switch (sortBy) {
      case 'name':
        items.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'quantity':
        items.sort((a, b) => a.quantity - b.quantity);
        break;
      case 'category':
        items.sort((a, b) => a.category.localeCompare(b.category));
        break;
      case 'expiry':
      default:
        // Already sorted by expiry from context
        break;
    }

    return items;
  }, [sortedItems, searchQuery, categoryFilter, sortBy]);

  // ── Handlers ─────────────────────────────────────────────
  const handleAddClick = useCallback(() => {
    setEditingItem(null);
    setShowForm(true);
  }, []);

  const handleEditClick = useCallback((item) => {
    setEditingItem(item);
    setShowForm(true);
  }, []);

  const handleFormSubmit = useCallback(async (data) => {
    if (editingItem) {
      await updateItem(editingItem.id, data);
    } else {
      await addItem(data);
    }
    setShowForm(false);
    setEditingItem(null);
  }, [editingItem, addItem, updateItem]);

  const handleFormCancel = useCallback(() => {
    setShowForm(false);
    setEditingItem(null);
  }, []);

  const handleUseItem = useCallback(async (item) => {
    const result = await consumeItem(item);
    if (result.fullyUsed) {
      // Auto-add to shopping list when item fully used up
      await addToShoppingList({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        source: 'auto',
      });
    }
  }, [consumeItem, addToShoppingList]);

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

  const handleOverlayClick = useCallback((e) => {
    if (e.target === modalRef.current) {
      setShowForm(false);
      setEditingItem(null);
    }
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner"><div className="spinner"></div></div>
      </div>
    );
  }

  return (
    <div className="page-container" id="inventory-page">
      <div className="page-header">
        <h1>Inventory</h1>
        <p>Manage your kitchen ingredients and track expiry dates.</p>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search ingredients..."
          id="inventory-search"
        />

        <select
          className="filter-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          id="category-filter"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>
              {cat.icon} {cat.label}
            </option>
          ))}
        </select>

        <select
          className="filter-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          id="sort-filter"
        >
          <option value="expiry">Sort: Expiry Date</option>
          <option value="name">Sort: Name</option>
          <option value="quantity">Sort: Quantity</option>
          <option value="category">Sort: Category</option>
        </select>

        <button className="btn btn-primary" onClick={handleAddClick} id="add-ingredient-btn">
          ➕ Add Item
        </button>
      </div>

      {/* Inventory Grid */}
      {filteredItems.length > 0 ? (
        <div className="ingredients-grid">
          {filteredItems.map(item => (
            <IngredientCard
              key={item.id}
              item={item}
              onEdit={handleEditClick}
              onUse={handleUseItem}
              onDelete={handleDeleteItem}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={searchQuery || categoryFilter !== 'all' ? '🔍' : '🥫'}
          title={searchQuery || categoryFilter !== 'all' ? 'No items found' : 'Your inventory is empty'}
          message={
            searchQuery || categoryFilter !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'Add your first ingredient to start tracking expiry dates and get recipe suggestions.'
          }
          action={
            !searchQuery && categoryFilter === 'all' && (
              <button className="btn btn-primary" onClick={handleAddClick}>
                ➕ Add Your First Ingredient
              </button>
            )
          }
        />
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div
          className="modal-overlay add-form-modal"
          ref={modalRef}
          onClick={handleOverlayClick}
          id="ingredient-form-modal"
        >
          <div className="modal-content">
            <button
              className="modal-close-btn"
              onClick={handleFormCancel}
              aria-label="Close form"
              id="form-close-btn"
            >
              ✕
            </button>
            <div className="modal-body">
              <h2 style={{ marginBottom: '24px' }}>
                {editingItem ? '✏️ Edit Ingredient' : '➕ Add Ingredient'}
              </h2>
              <IngredientForm
                onSubmit={handleFormSubmit}
                onCancel={handleFormCancel}
                initialData={editingItem}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
