import { useState, useCallback, useMemo } from 'react';
import { useInventory, getExpiryStatus } from '../context/InventoryContext';
import RecipeCard from '../components/RecipeCard';
import RecipeModal from '../components/RecipeModal';
import SearchBar from '../components/SearchBar';
import EmptyState from '../components/EmptyState';

// TheMealDB API base (free, test key "1")
const API_BASE = 'https://www.themealdb.com/api/json/v1/1';

/**
 * Recipes — Recipe discovery page.
 * Fetches recipes from TheMealDB based on inventory ingredients.
 * Shows which ingredients user has vs needs to buy.
 * Recipes are NOT restricted to only inventory items — partial matches welcome.
 */
export default function Recipes() {
  const { sortedItems } = useInventory();

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // useMemo: Get ingredient names from inventory for matching
  const inventoryIngredients = useMemo(() => {
    return sortedItems.map(item => item.name.toLowerCase().trim());
  }, [sortedItems]);

  // useMemo: Determine which ingredients to prioritize (expiring soonest)
  const priorityIngredients = useMemo(() => {
    const sorted = [...sortedItems].sort((a, b) => {
      const statusA = getExpiryStatus(a.expiryDate);
      const statusB = getExpiryStatus(b.expiryDate);
      return statusA.daysLeft - statusB.daysLeft;
    });
    // Take top 5 unique ingredient base names
    const unique = [];
    const seen = new Set();
    for (const item of sorted) {
      const baseName = item.name.toLowerCase().split(' ')[0]; // e.g. "chicken" from "Chicken Breast"
      if (!seen.has(baseName) && unique.length < 5) {
        seen.add(baseName);
        unique.push(item.name);
      }
    }
    return unique;
  }, [sortedItems]);

  // Parse TheMealDB meal to extract ingredients
  const parseMealIngredients = useCallback((meal) => {
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ingredient && ingredient.trim()) {
        ingredients.push({
          name: ingredient.trim(),
          measure: measure ? measure.trim() : '',
        });
      }
    }
    return ingredients;
  }, []);

  // Match recipe ingredients against inventory
  const matchIngredients = useCallback((recipeIngredients) => {
    const matched = [];
    const missing = [];

    recipeIngredients.forEach(ing => {
      const ingName = ing.name.toLowerCase();
      const isInInventory = inventoryIngredients.some(invIng => {
        return invIng.includes(ingName) || ingName.includes(invIng) ||
          ingName.split(' ').some(word => word.length > 3 && invIng.includes(word)) ||
          invIng.split(' ').some(word => word.length > 3 && ingName.includes(word));
      });
      if (isInInventory) {
        matched.push(ing.name);
      } else {
        missing.push(ing.name);
      }
    });

    return { matched, missing };
  }, [inventoryIngredients]);

  // Fetch full meal details by ID
  const fetchMealDetails = useCallback(async (mealId) => {
    try {
      const response = await fetch(`${API_BASE}/lookup.php?i=${mealId}`);
      const data = await response.json();
      return data.meals ? data.meals[0] : null;
    } catch (error) {
      console.error('Error fetching meal details:', error);
      return null;
    }
  }, []);

  // Fetch recipes by ingredient from TheMealDB
  const fetchRecipesByIngredient = useCallback(async (ingredient) => {
    try {
      const response = await fetch(`${API_BASE}/filter.php?i=${encodeURIComponent(ingredient)}`);
      const data = await response.json();
      return data.meals || [];
    } catch (error) {
      console.error(`Error fetching recipes for ${ingredient}:`, error);
      return [];
    }
  }, []);

  // Search recipes by name
  const fetchRecipesByName = useCallback(async (name) => {
    try {
      const response = await fetch(`${API_BASE}/search.php?s=${encodeURIComponent(name)}`);
      const data = await response.json();
      return data.meals || [];
    } catch (error) {
      console.error(`Error fetching recipes for ${name}:`, error);
      return [];
    }
  }, []);

  // Main: Suggest recipes based on inventory
  const handleSuggestRecipes = useCallback(async () => {
    if (priorityIngredients.length === 0) return;

    setLoading(true);
    setHasSearched(true);

    try {
      // Fetch recipes for each priority ingredient
      const allMealResults = await Promise.all(
        priorityIngredients.map(ing => fetchRecipesByIngredient(ing))
      );

      // Deduplicate meals by ID + count how many queries returned them
      const mealMap = new Map();
      allMealResults.flat().forEach(meal => {
        if (mealMap.has(meal.idMeal)) {
          mealMap.get(meal.idMeal).matchCount += 1;
        } else {
          mealMap.set(meal.idMeal, { ...meal, matchCount: 1 });
        }
      });

      // Sort by match count (most matched ingredients first), take top 12
      const topMeals = Array.from(mealMap.values())
        .sort((a, b) => b.matchCount - a.matchCount)
        .slice(0, 12);

      // Fetch full details for each meal
      const detailedMeals = await Promise.all(
        topMeals.map(async (meal) => {
          const details = await fetchMealDetails(meal.idMeal);
          if (!details) return null;

          const ingredients = parseMealIngredients(details);
          const { matched, missing } = matchIngredients(ingredients);

          return {
            id: details.idMeal,
            name: details.strMeal,
            thumbnail: details.strMealThumb,
            category: details.strCategory,
            area: details.strArea,
            instructions: details.strInstructions,
            youtube: details.strYoutube,
            ingredients,
            matchedIngredients: matched,
            missingIngredients: missing,
          };
        })
      );

      // Filter out nulls and sort by match percentage
      const validRecipes = detailedMeals
        .filter(Boolean)
        .sort((a, b) => {
          const pctA = a.matchedIngredients.length / a.ingredients.length;
          const pctB = b.matchedIngredients.length / b.ingredients.length;
          return pctB - pctA;
        });

      setRecipes(validRecipes);
    } catch (error) {
      console.error('Error suggesting recipes:', error);
    } finally {
      setLoading(false);
    }
  }, [priorityIngredients, fetchRecipesByIngredient, fetchMealDetails, parseMealIngredients, matchIngredients]);

  // Search recipes by name
  const handleSearchRecipes = useCallback(async (query) => {
    setSearchQuery(query);
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const meals = await fetchRecipesByName(query);

      const detailedRecipes = meals.slice(0, 12).map(meal => {
        const ingredients = parseMealIngredients(meal);
        const { matched, missing } = matchIngredients(ingredients);

        return {
          id: meal.idMeal,
          name: meal.strMeal,
          thumbnail: meal.strMealThumb,
          category: meal.strCategory,
          area: meal.strArea,
          instructions: meal.strInstructions,
          youtube: meal.strYoutube,
          ingredients,
          matchedIngredients: matched,
          missingIngredients: missing,
        };
      });

      setRecipes(detailedRecipes);
    } catch (error) {
      console.error('Error searching recipes:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchRecipesByName, parseMealIngredients, matchIngredients]);

  const handleRecipeClick = useCallback((recipe) => {
    setSelectedRecipe(recipe);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedRecipe(null);
  }, []);

  return (
    <div className="page-container" id="recipes-page">
      <div className="page-header">
        <h1>Recipe Suggestions</h1>
        <p>Discover recipes based on your inventory — use up ingredients before they expire!</p>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <SearchBar
          value={searchQuery}
          onChange={handleSearchRecipes}
          placeholder="Search recipes by name..."
          id="recipe-search"
        />

        <button
          className="btn btn-primary"
          onClick={handleSuggestRecipes}
          disabled={loading || priorityIngredients.length === 0}
          id="suggest-recipes-btn"
        >
          {loading ? '⏳ Loading...' : '🧑‍🍳 Suggest Recipes'}
        </button>
      </div>

      {/* Priority ingredients info */}
      {priorityIngredients.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '24px',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginRight: '4px' }}>
            Prioritizing:
          </span>
          {priorityIngredients.map((ing, idx) => (
            <span key={idx} className="ingredient-tag have" style={{ fontSize: '0.78rem' }}>
              {ing}
            </span>
          ))}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="recipes-grid">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="skeleton skeleton-recipe"></div>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && recipes.length > 0 && (
        <div className="recipes-grid">
          {recipes.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onClick={handleRecipeClick}
            />
          ))}
        </div>
      )}

      {/* Empty States */}
      {!loading && hasSearched && recipes.length === 0 && (
        <EmptyState
          icon="😕"
          title="No recipes found"
          message="Try different search terms or add more ingredients to your inventory for better suggestions."
        />
      )}

      {!loading && !hasSearched && (
        <EmptyState
          icon="👨‍🍳"
          title="Ready to cook?"
          message={
            priorityIngredients.length > 0
              ? 'Click "Suggest Recipes" to find dishes based on your inventory, or search by name.'
              : 'Add some ingredients to your inventory first, then come back for recipe suggestions!'
          }
          action={
            priorityIngredients.length > 0 && (
              <button className="btn btn-primary" onClick={handleSuggestRecipes}>
                🧑‍🍳 Suggest Recipes
              </button>
            )
          }
        />
      )}

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
