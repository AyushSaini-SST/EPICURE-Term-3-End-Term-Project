import { createContext, useContext, useReducer, useCallback, useMemo, useEffect, useState } from 'react';
import { db, auth, isFirebaseConfigured } from '../firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

const InventoryContext = createContext();

// ── LocalStorage Helpers ────────────────────────────────────
const LS_KEY = 'pantrypulse_inventory';

const loadFromLocalStorage = () => {
  try {
    const data = localStorage.getItem(LS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveToLocalStorage = (items) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
};

const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

// ── Helpers ─────────────────────────────────────────────────
export const getExpiryStatus = (expiryDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry - today;
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) return { status: 'expired', color: 'red', label: 'Expired', daysLeft };
  if (daysLeft === 0) return { status: 'expired', color: 'red', label: 'Expires today', daysLeft };
  if (daysLeft <= 2) return { status: 'critical', color: 'red', label: `${daysLeft}d left`, daysLeft };
  if (daysLeft <= 7) return { status: 'warning', color: 'orange', label: `${daysLeft}d left`, daysLeft };
  return { status: 'fresh', color: 'green', label: `${daysLeft}d left`, daysLeft };
};

export const CATEGORIES = [
  { value: 'vegetables', label: 'Vegetables', icon: '🥬' },
  { value: 'fruits', label: 'Fruits', icon: '🍎' },
  { value: 'dairy', label: 'Dairy', icon: '🧀' },
  { value: 'meat', label: 'Meat & Poultry', icon: '🥩' },
  { value: 'seafood', label: 'Seafood', icon: '🐟' },
  { value: 'grains', label: 'Grains & Cereals', icon: '🌾' },
  { value: 'spices', label: 'Spices & Herbs', icon: '🌿' },
  { value: 'beverages', label: 'Beverages', icon: '🥤' },
  { value: 'frozen', label: 'Frozen', icon: '🧊' },
  { value: 'bakery', label: 'Bakery', icon: '🍞' },
  { value: 'canned', label: 'Canned Goods', icon: '🥫' },
  { value: 'condiments', label: 'Condiments & Sauces', icon: '🫙' },
  { value: 'snacks', label: 'Snacks', icon: '🍿' },
  { value: 'other', label: 'Other', icon: '📦' },
];

export const UNITS = [
  'kg', 'g', 'lb', 'oz',
  'L', 'ml', 'cups', 'tbsp', 'tsp',
  'pcs', 'dozen', 'bunch', 'pack',
  'slices', 'cans', 'bottles', 'bags'
];

const getCategoryInfo = (value) => CATEGORIES.find(c => c.value === value) || CATEGORIES[CATEGORIES.length - 1];

// ── Reducer ─────────────────────────────────────────────────
const inventoryReducer = (state, action) => {
  switch (action.type) {
    case 'SET_ITEMS':
      return { ...state, items: action.payload, loading: false };
    case 'ADD_ITEM': {
      const newItems = [action.payload, ...state.items];
      if (!isFirebaseConfigured) saveToLocalStorage(newItems);
      return { ...state, items: newItems };
    }
    case 'UPDATE_ITEM': {
      const newItems = state.items.map(item =>
        item.id === action.payload.id ? { ...item, ...action.payload.updates } : item
      );
      if (!isFirebaseConfigured) saveToLocalStorage(newItems);
      return { ...state, items: newItems };
    }
    case 'DELETE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload);
      if (!isFirebaseConfigured) saveToLocalStorage(newItems);
      return { ...state, items: newItems };
    }
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
};

// ── Provider ────────────────────────────────────────────────
export function InventoryProvider({ children }) {
  const [state, dispatch] = useReducer(inventoryReducer, {
    items: [],
    loading: true,
    error: null,
  });

  const [toasts, setToasts] = useState([]);

  // Toast helper
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  // Data loading — Firestore or localStorage
  useEffect(() => {
    if (isFirebaseConfigured) {
      // Firestore real-time listener
      const user = auth.currentUser;
      if (!user) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      const q = query(
        collection(db, 'users', user.uid, 'inventory'),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q,
        (snapshot) => {
          const items = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data(),
          }));
          dispatch({ type: 'SET_ITEMS', payload: items });
        },
        (error) => {
          console.error('Inventory listener error:', error);
          dispatch({ type: 'SET_ERROR', payload: error.message });
        }
      );

      return () => unsubscribe();
    } else {
      // Load from localStorage
      const items = loadFromLocalStorage();
      dispatch({ type: 'SET_ITEMS', payload: items });
    }
  }, []);

  // ── CRUD Operations ────────────────────────────────────────
  const addItem = useCallback(async (itemData) => {
    try {
      if (isFirebaseConfigured) {
        const user = auth.currentUser;
        if (!user) throw new Error('Not authenticated');
        await addDoc(collection(db, 'users', user.uid, 'inventory'), {
          ...itemData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        // localStorage mode
        const newItem = {
          ...itemData,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_ITEM', payload: newItem });
      }
      addToast(`${itemData.name} added to inventory!`, 'success');
    } catch (error) {
      console.error('Add item error:', error);
      addToast('Failed to add item', 'error');
      throw error;
    }
  }, [addToast]);

  const updateItem = useCallback(async (itemId, updates) => {
    try {
      if (isFirebaseConfigured) {
        const user = auth.currentUser;
        if (!user) throw new Error('Not authenticated');
        const itemRef = doc(db, 'users', user.uid, 'inventory', itemId);
        await updateDoc(itemRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        });
      } else {
        dispatch({ type: 'UPDATE_ITEM', payload: { id: itemId, updates: { ...updates, updatedAt: new Date().toISOString() } } });
      }
      // No generic toast here — callers (like useItem) show their own specific message
    } catch (error) {
      console.error('Update item error:', error);
      addToast('Failed to update item', 'error');
      throw error;
    }
  }, [addToast]);


  const deleteItem = useCallback(async (itemId) => {
    try {
      if (isFirebaseConfigured) {
        const user = auth.currentUser;
        if (!user) throw new Error('Not authenticated');
        const itemRef = doc(db, 'users', user.uid, 'inventory', itemId);
        await deleteDoc(itemRef);
      } else {
        dispatch({ type: 'DELETE_ITEM', payload: itemId });
      }
      addToast('Item removed from inventory', 'success');
    } catch (error) {
      console.error('Delete item error:', error);
      addToast('Failed to delete item', 'error');
      throw error;
    }
  }, [addToast]);

  const useItem = useCallback(async (item, quantityUsed = null) => {
    try {
      const qtyToUse = quantityUsed || 1;
      const newQty = item.quantity - qtyToUse;

      if (newQty <= 0) {
        await deleteItem(item.id);
        addToast(`${item.name} used up — added to shopping list!`, 'warning');
        return { fullyUsed: true };
      } else {
        await updateItem(item.id, { quantity: newQty });
        addToast(`Used ${qtyToUse} ${item.unit} of ${item.name}`, 'success');
        return { fullyUsed: false };
      }
    } catch (error) {
      console.error('Use item error:', error);
      throw error;
    }
  }, [deleteItem, updateItem, addToast]);

  // ── useMemo: Sort ingredients by expiry date ──────────────
  const sortedItems = useMemo(() => {
    return [...state.items].sort((a, b) => {
      const dateA = new Date(a.expiryDate);
      const dateB = new Date(b.expiryDate);
      return dateA - dateB; // Soonest expiry first
    });
  }, [state.items]);

  // ── useMemo: Compute aggregate stats ──────────────────────
  const stats = useMemo(() => {
    const total = state.items.length;
    let fresh = 0, warning = 0, expired = 0;
    const categoryMap = {};

    state.items.forEach(item => {
      const { status } = getExpiryStatus(item.expiryDate);
      if (status === 'fresh') fresh++;
      else if (status === 'warning') warning++;
      else expired++; // expired + critical

      const cat = getCategoryInfo(item.category);
      categoryMap[cat.label] = (categoryMap[cat.label] || 0) + 1;
    });

    return { total, fresh, warning, expired, categories: Object.keys(categoryMap).length };
  }, [state.items]);

  // ── Context value ─────────────────────────────────────────
  const value = useMemo(() => ({
    items: state.items,
    sortedItems,
    stats,
    loading: state.loading,
    error: state.error,
    addItem,
    updateItem,
    deleteItem,
    useItem,
    toasts,
    addToast,
  }), [state.items, sortedItems, stats, state.loading, state.error, addItem, updateItem, deleteItem, useItem, toasts, addToast]);

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}

export default InventoryContext;
