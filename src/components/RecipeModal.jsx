import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { useShoppingList } from '../context/ShoppingListContext';
import { useInventory } from '../context/InventoryContext';

/** Check if an ingredient name exists in a list (case-insensitive, partial match) */
function isInList(name, list) {
  const n = name.toLowerCase();
  return list.some(item => {
    const i = item.toLowerCase();
    return i === n || i.includes(n) || n.includes(i);
  });
}

/**
 * parseMeasure — Extracts a numeric quantity and unit from a measure string.
 * e.g. "2 cups" → { quantity: 2, unit: 'cups' }
 *      "1/2 tsp" → { quantity: 0.5, unit: 'tsp' }
 *      "3" → { quantity: 3, unit: 'pcs' }
 */
function parseMeasure(measure) {
  if (!measure) return { quantity: 1, unit: 'pcs' };
  const trimmed = measure.trim();

  // Handle fractions like "1/2", "3/4"
  const fractionMatch = trimmed.match(/^(\d+)\/(\d+)\s*(.*)/);
  if (fractionMatch) {
    const qty = parseInt(fractionMatch[1]) / parseInt(fractionMatch[2]);
    return { quantity: Math.round(qty * 100) / 100, unit: fractionMatch[3].trim() || 'pcs' };
  }

  // Handle mixed numbers like "1 1/2 cups"
  const mixedMatch = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)\s*(.*)/);
  if (mixedMatch) {
    const qty = parseInt(mixedMatch[1]) + parseInt(mixedMatch[2]) / parseInt(mixedMatch[3]);
    return { quantity: Math.round(qty * 100) / 100, unit: mixedMatch[4].trim() || 'pcs' };
  }

  // Handle normal "2 cups" or just "2"
  const normalMatch = trimmed.match(/^([\d.]+)\s*(.*)/);
  if (normalMatch) {
    return {
      quantity: parseFloat(normalMatch[1]) || 1,
      unit: normalMatch[2].trim() || 'pcs',
    };
  }

  // Descriptive only e.g. "to taste", "a pinch" → quantity 1
  return { quantity: 1, unit: trimmed || 'pcs' };
}

/**
 * RecipeModal — Detailed recipe view in an overlay.
 * Uses useRef for scroll lock on the body while open.
 * Props:
 *   - recipe: the full recipe data
 *   - onClose(): close the modal
 */
export default function RecipeModal({ recipe, onClose }) {
  const overlayRef = useRef(null);
  const { addToShoppingList, items: shoppingItems } = useShoppingList();
  const { addToast } = useInventory();
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  // Shopping list item names for checking
  const shoppingNames = useMemo(
    () => shoppingItems.map(i => i.name),
    [shoppingItems]
  );

  // useRef: Lock body scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Close on overlay click
  const handleOverlayClick = useCallback((e) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  }, [onClose]);

  // Build ingredients list with have/need status
  const ingredientsList = useMemo(() => {
    if (!recipe.ingredients) return [];
    return recipe.ingredients.map(ing => ({
      ...ing,
      hasIt: recipe.matchedIngredients?.some(
        m => m.toLowerCase() === ing.name.toLowerCase()
      ),
    }));
  }, [recipe]);

  // Missing ingredients (ones we don't have in inventory)
  const missingIngredients = useMemo(
    () => ingredientsList.filter(ing => !ing.hasIt),
    [ingredientsList]
  );

  // Check if all missing ingredients are already in the shopping cart
  const allAlreadyInCart = useMemo(() => {
    if (missingIngredients.length === 0) return false;
    return missingIngredients.every(ing => isInList(ing.name, shoppingNames));
  }, [missingIngredients, shoppingNames]);

  // Add all missing ingredients to shopping cart
  const handleAddAllToCart = useCallback(async () => {
    if (missingIngredients.length === 0 || allAlreadyInCart) return;
    setAdding(true);
    try {
      // Only add items not already in the cart
      const toAdd = missingIngredients.filter(ing => !isInList(ing.name, shoppingNames));
      if (toAdd.length === 0) return;
      await Promise.all(
        toAdd.map(ing => {
          const { quantity, unit } = parseMeasure(ing.measure);
          return addToShoppingList({
            name: ing.name,
            quantity,
            unit: unit || 'pcs',
            category: 'other',
            source: 'recipe',
          });
        })
      );
      setJustAdded(true);
      addToast(`🛒 ${toAdd.length} ingredient${toAdd.length > 1 ? 's' : ''} added to cart!`, 'success');
      setTimeout(() => setJustAdded(false), 3000);
    } catch (err) {
      console.error('Failed to add to cart:', err);
      addToast('Failed to add ingredients to cart', 'error');
    } finally {
      setAdding(false);
    }
  }, [missingIngredients, allAlreadyInCart, shoppingNames, addToShoppingList, addToast]);

  if (!recipe) return null;

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
      id="recipe-modal-overlay"
    >
      <div className="modal-content" role="dialog" aria-modal="true" id="recipe-modal">
        <button
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close recipe modal"
          id="recipe-modal-close"
        >
          ✕
        </button>

        {recipe.thumbnail && (
          <img
            className="modal-header-image"
            src={recipe.thumbnail}
            alt={recipe.name}
          />
        )}

        <div className="modal-body">
          <h2 className="modal-title">{recipe.name}</h2>

          <div className="modal-meta">
            {recipe.category && (
              <span className="modal-meta-tag">🏷️ {recipe.category}</span>
            )}
            {recipe.area && (
              <span className="modal-meta-tag">🌍 {recipe.area}</span>
            )}
            {recipe.matchedIngredients && (
              <span className="modal-meta-tag">
                ✅ {recipe.matchedIngredients.length}/{recipe.ingredients.length} in stock
              </span>
            )}
          </div>

          {/* Add Missing to Cart CTA */}
          {missingIngredients.length > 0 && !allAlreadyInCart && (
            <div className="modal-cart-cta" id="modal-add-to-cart-section">
              <div className="modal-cart-cta-info">
                <span className="modal-cart-cta-icon">🛒</span>
                <div>
                  <strong>{missingIngredients.length} ingredient{missingIngredients.length > 1 ? 's' : ''} missing</strong>
                  <p>Add all to your shopping cart at once</p>
                </div>
              </div>
              <button
                className={`btn btn-cart-add ${justAdded ? 'btn-cart-added' : ''}`}
                onClick={handleAddAllToCart}
                disabled={adding || justAdded}
                id="add-missing-to-cart-btn"
              >
                {adding ? '⏳ Adding...' : justAdded ? '✅ Added to Cart!' : '🛒 Add All to Cart'}
              </button>
            </div>
          )}

          {missingIngredients.length > 0 && allAlreadyInCart && (
            <div className="modal-cart-cta modal-cart-cta-in-cart" id="modal-already-in-cart">
              <span className="modal-cart-cta-icon">✅</span>
              <strong>All missing ingredients are in your cart!</strong>
            </div>
          )}

          {missingIngredients.length === 0 && recipe.ingredients?.length > 0 && (
            <div className="modal-cart-cta modal-cart-cta-complete">
              <span className="modal-cart-cta-icon">🎉</span>
              <strong>You have all ingredients!</strong>
            </div>
          )}

          {/* Ingredients Section */}
          <div className="modal-section">
            <h3>🧾 Ingredients</h3>
            <div className="modal-ingredients-list">
              {ingredientsList.map((ing, idx) => (
                <div
                  key={idx}
                  className={`modal-ingredient-item ${ing.hasIt ? 'have' : 'need'}`}
                >
                  <span className={ing.hasIt ? 'check-icon' : 'buy-icon'}>
                    {ing.hasIt ? '✓' : '🛒'}
                  </span>
                  <span>
                    {ing.measure} {ing.name}
                    {!ing.hasIt && <small style={{ opacity: 0.6, marginLeft: '4px' }}>(need to buy)</small>}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions Section */}
          {recipe.instructions && (() => {
            // Split instructions into steps — handle newlines, "STEP X", numbered prefixes
            const steps = recipe.instructions
              .split(/\r?\n/)
              .map(s => s.replace(/^(STEP\s*\d+[:.]*\s*)/i, '').trim())
              .map(s => s.replace(/^\d+[.):-]\s*/, '').trim())
              .filter(s => s.length > 2);

            return (
              <div className="modal-section">
                <h3>📝 Instructions</h3>
                <ol className="modal-steps-list">
                  {steps.map((step, idx) => (
                    <li key={idx} className="modal-step-item">
                      <span className="modal-step-number">{idx + 1}</span>
                      <p>{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })()}

          {/* YouTube Link */}
          {recipe.youtube && (
            <div className="modal-section">
              <a
                href={recipe.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="modal-youtube-btn"
                id="recipe-youtube-link"
              >
                ▶️ Watch on YouTube
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
