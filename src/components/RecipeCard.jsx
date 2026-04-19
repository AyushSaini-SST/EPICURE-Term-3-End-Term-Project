import { useMemo, useCallback } from 'react';

/**
 * RecipeCard — Displays a recipe with ingredient match info.
 * Shows which ingredients the user HAS vs NEEDS TO BUY.
 * Props:
 *   - recipe: { id, name, thumbnail, category, area, ingredients[], matchedIngredients[], missingIngredients[] }
 *   - onClick(recipe): opens the recipe modal
 */
export default function RecipeCard({ recipe, onClick }) {
  const matchPercentage = useMemo(() => {
    if (!recipe.ingredients || recipe.ingredients.length === 0) return 0;
    return Math.round((recipe.matchedIngredients.length / recipe.ingredients.length) * 100);
  }, [recipe]);

  const matchLevel = useMemo(() => {
    if (matchPercentage >= 70) return 'high';
    if (matchPercentage >= 40) return 'medium';
    return 'low';
  }, [matchPercentage]);

  const handleClick = useCallback(() => onClick(recipe), [recipe, onClick]);

  // Limit displayed ingredient tags
  const displayIngredients = useMemo(() => {
    const matched = recipe.matchedIngredients.slice(0, 4).map(i => ({ name: i, type: 'have' }));
    const missing = recipe.missingIngredients.slice(0, 3).map(i => ({ name: i, type: 'need' }));
    return [...matched, ...missing];
  }, [recipe]);

  const extraCount = useMemo(() => {
    const total = recipe.matchedIngredients.length + recipe.missingIngredients.length;
    const shown = Math.min(recipe.matchedIngredients.length, 4) + Math.min(recipe.missingIngredients.length, 3);
    return total - shown;
  }, [recipe]);

  return (
    <div className="recipe-card glass-card animate-in" onClick={handleClick} id={`recipe-${recipe.id}`}>
      <div className="recipe-card-image-wrapper">
        <img
          className="recipe-card-image"
          src={recipe.thumbnail}
          alt={recipe.name}
          loading="lazy"
        />
        <div className={`recipe-match-badge ${matchLevel}`}>
          {matchPercentage}% match
        </div>
      </div>

      <div className="recipe-card-body">
        <h3 className="recipe-card-title">{recipe.name}</h3>

        <div className="recipe-card-meta">
          {recipe.category && (
            <span className="recipe-card-tag">🏷️ {recipe.category}</span>
          )}
          {recipe.area && (
            <span className="recipe-card-tag">🌍 {recipe.area}</span>
          )}
        </div>

        <div className="recipe-ingredients-preview">
          {displayIngredients.map((ing, idx) => (
            <span key={idx} className={`ingredient-tag ${ing.type}`}>
              {ing.type === 'have' ? '✓' : '+'} {ing.name}
            </span>
          ))}
          {extraCount > 0 && (
            <span className="ingredient-tag need">+{extraCount} more</span>
          )}
        </div>
      </div>
    </div>
  );
}
