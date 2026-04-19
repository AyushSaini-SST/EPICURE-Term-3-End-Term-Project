import { useRef, useEffect, useCallback, useMemo } from 'react';

/**
 * RecipeModal — Detailed recipe view in an overlay.
 * Uses useRef for scroll lock on the body while open.
 * Props:
 *   - recipe: the full recipe data
 *   - onClose(): close the modal
 */
export default function RecipeModal({ recipe, onClose }) {
  const overlayRef = useRef(null);

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
                ✅ {recipe.matchedIngredients.length}/{recipe.ingredients.length} ingredients in stock
              </span>
            )}
          </div>

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
                    {!ing.hasIt && <small style={{ opacity: 0.6, marginLeft: '4px' }}>(buy extra)</small>}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions Section */}
          {recipe.instructions && (
            <div className="modal-section">
              <h3>📝 Instructions</h3>
              <p className="modal-instructions">{recipe.instructions}</p>
            </div>
          )}

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
