import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { ShoppingListProvider } from './context/ShoppingListContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Recipes from './pages/Recipes';
import ShoppingList from './pages/ShoppingList';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Landing from './pages/Landing';

/**
 * ToastContainer — Renders toast notifications from InventoryContext.
 */
function ToastContainer() {
  const { toasts } = useInventory();

  if (toasts?.length === 0) return null;

  return (
    <div className="toast-container" id="toast-container">
      {toasts?.map(toast => (
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
 * AppLayout — Inner component that uses contexts.
 */
function AppLayout() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
          <Route path="/recipes" element={<ProtectedRoute><Recipes /></ProtectedRoute>} />
          <Route path="/shopping-list" element={<ProtectedRoute><ShoppingList /></ProtectedRoute>} />
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
      <AuthProvider>
        <InventoryProvider>
          <ShoppingListProvider>
            <AppLayout />
          </ShoppingListProvider>
        </InventoryProvider>
      </AuthProvider>
    </Router>
  );
}
