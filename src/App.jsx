import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { InventoryProvider } from './context/InventoryContext';
import { ShoppingListProvider } from './context/ShoppingListContext';
import { useInventory } from './context/InventoryContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Recipes from './pages/Recipes';
import ShoppingList from './pages/ShoppingList';

/**
 * ToastContainer — Renders toast notifications from InventoryContext.
 */
function ToastContainer() {
  const { toasts } = useInventory();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" id="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast ${toast.type}`}>
          {toast.type === 'success' && '✅ '}
          {toast.type === 'warning' && '⚠️ '}
          {toast.type === 'error' && '❌ '}
          {toast.message}
        </div>
      ))}
    </div>
  );
}

/**
 * AppLayout — Inner component that uses contexts (must be inside providers).
 */
function AppLayout() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/shopping-list" element={<ShoppingList />} />
        </Routes>
      </main>
      <ToastContainer />
    </>
  );
}

/**
 * App — Root component with context providers and router.
 */
export default function App() {
  return (
    <Router>
      <InventoryProvider>
        <ShoppingListProvider>
          <AppLayout />
        </ShoppingListProvider>
      </InventoryProvider>
    </Router>
  );
}
