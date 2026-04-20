import { NavLink, useNavigate } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { useShoppingList } from '../context/ShoppingListContext';
import { useAuth } from '../context/AuthContext';
import { useState, useCallback } from 'react';

export default function Navbar() {
  const { stats } = useInventory();
  const { totalCount } = useShoppingList();
  const { currentUser, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMobile = useCallback(() => {
    setMobileOpen(prev => !prev);
  }, []);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      closeMobile();
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand" onClick={closeMobile}>
          <img src="/epicure-logo.png" className="logo-icon" alt="Epicure Logo" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
          <span>Epicure</span>
        </NavLink>

        {currentUser && (
          <button
            className="mobile-menu-btn"
            onClick={toggleMobile}
            aria-label="Toggle navigation menu"
            id="mobile-menu-toggle"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        )}

        <div className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
          {currentUser ? (
            <>
              <NavLink
                to="/dashboard"
                end
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobile}
                id="nav-dashboard"
              >
                📊 Dashboard
              </NavLink>

              <NavLink
                to="/inventory"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobile}
                id="nav-inventory"
              >
                🗄️ Inventory
                {stats.total > 0 && (
                  <span className="badge">{stats.total}</span>
                )}
              </NavLink>

              <NavLink
                to="/recipes"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobile}
                id="nav-recipes"
              >
                👨‍🍳 Recipes
              </NavLink>

              <NavLink
                to="/shopping-list"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobile}
                id="nav-shopping-list"
              >
                🛒 Shopping List
                {totalCount > 0 && (
                  <span className="badge warning">{totalCount}</span>
                )}
              </NavLink>
              
              <button 
                onClick={handleLogout} 
                className="btn btn-ghost" 
                style={{ marginLeft: '8px', fontSize: '0.85rem' }}
              >
                🚪 Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobile}
              >
                Log In
              </NavLink>
              <NavLink
                to="/signup"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobile}
                style={{ background: 'var(--accent-primary)', color: 'white' }}
              >
                Sign Up
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
