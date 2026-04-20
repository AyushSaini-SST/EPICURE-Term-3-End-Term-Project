import { createContext, useContext, useReducer, useCallback, useMemo, useEffect } from 'react';
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

const ShoppingListContext = createContext();

// ── LocalStorage Helpers ────────────────────────────────────
const LS_KEY = 'pantrypulse_shopping';

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
    console.error('Failed to save shopping list to localStorage:', e);
  }
};

const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

// ── Reducer ─────────────────────────────────────────────────
const shoppingReducer = (state, action) => {
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
    case 'CLEAR_CHECKED': {
      const newItems = state.items.filter(item => !item.checked);
      if (!isFirebaseConfigured) saveToLocalStorage(newItems);
      return { ...state, items: newItems };
    }
    case 'CLEAR_ALL': {
      if (!isFirebaseConfigured) saveToLocalStorage([]);
      return { ...state, items: [] };
    }
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

// ── Provider ────────────────────────────────────────────────
export function ShoppingListProvider({ children }) {
  const [state, dispatch] = useReducer(shoppingReducer, {
    items: [],
    loading: true,
  });

  // Data loading — Firestore or localStorage
  useEffect(() => {
    if (isFirebaseConfigured) {
      const user = auth.currentUser;
      if (!user) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      const q = query(
        collection(db, 'users', user.uid, 'shoppingList'),
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
          console.error('Shopping list listener error:', error);
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

  // Add item to shopping list (auto-called when inventory item deleted/used up)
  const addToShoppingList = useCallback(async (itemData) => {
    try {
      // Check if item already exists in shopping list by name
      const existing = state.items.find(
        i => i.name.toLowerCase() === itemData.name.toLowerCase()
      );

      if (isFirebaseConfigured) {
        const user = auth.currentUser;
        if (!user) return;

        if (existing) {
          const itemRef = doc(db, 'users', user.uid, 'shoppingList', existing.id);
          await updateDoc(itemRef, {
            quantity: existing.quantity + (itemData.quantity || 1),
            updatedAt: serverTimestamp(),
          });
        } else {
          await addDoc(collection(db, 'users', user.uid, 'shoppingList'), {
            name: itemData.name,
            quantity: itemData.quantity || 1,
            unit: itemData.unit || 'pcs',
            category: itemData.category || 'other',
            checked: false,
            source: itemData.source || 'auto',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } else {
        // localStorage mode
        if (existing) {
          dispatch({
            type: 'UPDATE_ITEM',
            payload: {
              id: existing.id,
              updates: {
                quantity: existing.quantity + (itemData.quantity || 1),
                updatedAt: new Date().toISOString(),
              },
            },
          });
        } else {
          const newItem = {
            id: generateId(),
            name: itemData.name,
            quantity: itemData.quantity || 1,
            unit: itemData.unit || 'pcs',
            category: itemData.category || 'other',
            checked: false,
            source: itemData.source || 'auto',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          dispatch({ type: 'ADD_ITEM', payload: newItem });
        }
      }
    } catch (error) {
      console.error('Add to shopping list error:', error);
    }
  }, [state.items]);

  // Add a manual item to shopping list
  const addManualItem = useCallback(async (name, quantity = 1, unit = 'pcs') => {
    try {
      if (isFirebaseConfigured) {
        const user = auth.currentUser;
        if (!user) return;
        await addDoc(collection(db, 'users', user.uid, 'shoppingList'), {
          name,
          quantity,
          unit,
          category: 'other',
          checked: false,
          source: 'manual',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        const newItem = {
          id: generateId(),
          name,
          quantity,
          unit,
          category: 'other',
          checked: false,
          source: 'manual',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_ITEM', payload: newItem });
      }
    } catch (error) {
      console.error('Add manual item error:', error);
    }
  }, []);

  // Toggle checked state
  const toggleChecked = useCallback(async (itemId) => {
    try {
      const item = state.items.find(i => i.id === itemId);
      if (!item) return;

      if (isFirebaseConfigured) {
        const user = auth.currentUser;
        if (!user) return;
        const itemRef = doc(db, 'users', user.uid, 'shoppingList', itemId);
        await updateDoc(itemRef, {
          checked: !item.checked,
          updatedAt: serverTimestamp(),
        });
      } else {
        dispatch({
          type: 'UPDATE_ITEM',
          payload: { id: itemId, updates: { checked: !item.checked } },
        });
      }
    } catch (error) {
      console.error('Toggle checked error:', error);
    }
  }, [state.items]);

  // Remove from shopping list
  const removeFromShoppingList = useCallback(async (itemId) => {
    try {
      if (isFirebaseConfigured) {
        const user = auth.currentUser;
        if (!user) return;
        const itemRef = doc(db, 'users', user.uid, 'shoppingList', itemId);
        await deleteDoc(itemRef);
      } else {
        dispatch({ type: 'DELETE_ITEM', payload: itemId });
      }
    } catch (error) {
      console.error('Remove from shopping list error:', error);
    }
  }, []);

  // Clear all checked items
  const clearChecked = useCallback(async () => {
    try {
      if (isFirebaseConfigured) {
        const user = auth.currentUser;
        if (!user) return;
        const checkedItems = state.items.filter(i => i.checked);
        const deletePromises = checkedItems.map(item =>
          deleteDoc(doc(db, 'users', user.uid, 'shoppingList', item.id))
        );
        await Promise.all(deletePromises);
      } else {
        dispatch({ type: 'CLEAR_CHECKED' });
      }
    } catch (error) {
      console.error('Clear checked error:', error);
    }
  }, [state.items]);

  // Clear entire shopping list
  const clearAll = useCallback(async () => {
    try {
      if (isFirebaseConfigured) {
        const user = auth.currentUser;
        if (!user) return;
        const deletePromises = state.items.map(item =>
          deleteDoc(doc(db, 'users', user.uid, 'shoppingList', item.id))
        );
        await Promise.all(deletePromises);
      } else {
        dispatch({ type: 'CLEAR_ALL' });
      }
    } catch (error) {
      console.error('Clear all error:', error);
    }
  }, [state.items]);

  // ── Computed values ────────────────────────────────────────
  const checkedCount = useMemo(
    () => state.items.filter(i => i.checked).length,
    [state.items]
  );

  const totalCount = state.items.length;

  const progress = useMemo(
    () => totalCount === 0 ? 0 : Math.round((checkedCount / totalCount) * 100),
    [checkedCount, totalCount]
  );

  // ── Context value ─────────────────────────────────────────
  const value = useMemo(() => ({
    items: state.items,
    loading: state.loading,
    addToShoppingList,
    addManualItem,
    toggleChecked,
    removeFromShoppingList,
    clearChecked,
    clearAll,
    checkedCount,
    totalCount,
    progress,
  }), [state.items, state.loading, addToShoppingList, addManualItem, toggleChecked, removeFromShoppingList, clearChecked, clearAll, checkedCount, totalCount, progress]);

  return (
    <ShoppingListContext.Provider value={value}>
      {children}
    </ShoppingListContext.Provider>
  );
}

export function useShoppingList() {
  const context = useContext(ShoppingListContext);
  if (!context) {
    throw new Error('useShoppingList must be used within a ShoppingListProvider');
  }
  return context;
}

export default ShoppingListContext;
