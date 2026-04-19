import { NavLink } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { useShoppingList } from '../context/ShoppingListContext';
import { useState, useCallback } from 'react';

export default function Navbar() {
  const { stats } = useInventory();
  const { totalCount } = useShoppingList();
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMobile = useCallback(() => {
    setMobileOpen(prev => !prev);
  }, []);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand" onClick={closeMobile}>
          <div className="logo-icon">🍳</div>
          <span>SmartKitchen Pro</span>
        </NavLink>

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

        <div className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
          <NavLink
            to="/"
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
        </div>
      </div>
    </nav>
  );
}
