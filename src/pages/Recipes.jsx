import { useState, useCallback, useMemo } from 'react';
import { useInventory, getExpiryStatus } from '../context/InventoryContext';
import RecipeCard from '../components/RecipeCard';
import RecipeModal from '../components/RecipeModal';
import SearchBar from '../components/SearchBar';
import EmptyState from '../components/EmptyState';

// TheMealDB API base (free, test key "1")
const API_BASE = 'https://www.themealdb.com/api/json/v1/1';

// Non-veg ingredient keywords for detection
const NON_VEG_KEYWORDS = [
  'chicken', 'beef', 'pork', 'lamb', 'mutton', 'fish', 'prawn', 'shrimp',
  'crab', 'lobster', 'salmon', 'tuna', 'bacon', 'ham', 'sausage', 'turkey',
  'duck', 'veal', 'venison', 'anchovy', 'anchovies', 'sardine', 'mackerel',
  'mince', 'steak', 'ribs', 'wings', 'drumstick', 'lard', 'gelatin',
  'oyster', 'mussel', 'clam', 'squid', 'octopus',
];

// Non-veg MealDB categories
const NON_VEG_CATEGORIES = [
  'Beef', 'Chicken', 'Lamb', 'Pork', 'Seafood', 'Goat',
];

/**
 * isNonVeg — Returns true if the recipe contains any non-veg ingredients or category.
 */
function isNonVeg(recipe) {
  if (NON_VEG_CATEGORIES.includes(recipe.category)) return true;
  const ingredientNames = recipe.ingredients.map(i => i.name.toLowerCase());
  return ingredientNames.some(name =>
    NON_VEG_KEYWORDS.some(kw => name.includes(kw))
  );
}

/**
 * Recipes — Recipe discovery page.
 * Fetches recipes from TheMealDB based on inventory ingredients.
 * Shows which ingredients user has vs needs to buy.
 */
export default function Recipes() {
  const { sortedItems } = useInventory();

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [dietFilter, setDietFilter] = useState('all'); // 'all' | 'veg' | 'nonveg'

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
    const unique = [];
    const seen = new Set();
    for (const item of sorted) {
      const baseName = item.name.toLowerCase().split(' ')[0];
      if (!seen.has(baseName) && unique.length < 5) {
        seen.add(baseName);
        unique.push(item.name);
      }
    }
    return unique;
  }, [sortedItems]);

  // useMemo: Filter recipes by veg/non-veg selection
  const filteredRecipes = useMemo(() => {
    if (dietFilter === 'veg') return recipes.filter(r => !isNonVeg(r));
    if (dietFilter === 'nonveg') return recipes.filter(r => isNonVeg(r));
    return recipes;
  }, [recipes, dietFilter]);

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
      if (isInInventory) matched.push(ing.name);
      else missing.push(ing.name);
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

  // Fetch all Indian meals from TheMealDB
  const fetchAllIndianMeals = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/filter.php?a=Indian`);
      const data = await response.json();
      return data.meals || [];
    } catch (error) {
      console.error('Error fetching Indian meals:', error);
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

  // Main: Suggest Indian recipes based on inventory
  const handleSuggestRecipes = useCallback(async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      // Fetch all Indian meals + ingredient-based meals, then intersect
      const [indianMeals, ...ingredientResults] = await Promise.all([
        fetchAllIndianMeals(),
        ...priorityIngredients.map(ing => fetchRecipesByIngredient(ing)),
      ]);

      const indianIds = new Set(indianMeals.map(m => m.idMeal));

      // If we have inventory items, prioritize Indian meals matching those ingredients
      let targetMeals;
      if (priorityIngredients.length > 0) {
        const mealMap = new Map();
        ingredientResults.flat().forEach(meal => {
          if (!indianIds.has(meal.idMeal)) return; // Only Indian
          if (mealMap.has(meal.idMeal)) {
            mealMap.get(meal.idMeal).matchCount += 1;
          } else {
            mealMap.set(meal.idMeal, { ...meal, matchCount: 1 });
          }
        });

        // If ingredient-based search found Indian meals, use those; otherwise fall back to all Indian
        if (mealMap.size > 0) {
          targetMeals = Array.from(mealMap.values())
            .sort((a, b) => b.matchCount - a.matchCount)
            .slice(0, 15);
        } else {
          targetMeals = indianMeals.slice(0, 15);
        }
      } else {
        // No inventory — just show popular Indian dishes
        targetMeals = indianMeals.slice(0, 15);
      }

      const detailedMeals = await Promise.all(
        targetMeals.map(async (meal) => {
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
  }, [priorityIngredients, fetchAllIndianMeals, fetchRecipesByIngredient, fetchMealDetails, parseMealIngredients, matchIngredients]);

  // Search recipes by name (Indian only)
  const handleSearchRecipes = useCallback(async (query) => {
    setSearchQuery(query);
    if (!query.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const meals = await fetchRecipesByName(query);
      // Filter to Indian cuisine only
      const indianMeals = meals.filter(m => m.strArea === 'Indian');
      const detailedRecipes = indianMeals.slice(0, 12).map(meal => {
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

  const handleRecipeClick = useCallback((recipe) => setSelectedRecipe(recipe), []);
  const handleCloseModal = useCallback(() => setSelectedRecipe(null), []);

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

        {/* Veg / Non-Veg Toggle */}
        <div className="diet-toggle" id="diet-toggle" role="group" aria-label="Diet filter">
          <button
            className={`diet-btn ${dietFilter === 'all' ? 'active' : ''}`}
            onClick={() => setDietFilter('all')}
            id="diet-all"
          >
            🍽️ All
          </button>
          <button
            className={`diet-btn veg ${dietFilter === 'veg' ? 'active' : ''}`}
            onClick={() => setDietFilter('veg')}
            id="diet-veg"
          >
            🥦 Veg
          </button>
          <button
            className={`diet-btn nonveg ${dietFilter === 'nonveg' ? 'active' : ''}`}
            onClick={() => setDietFilter('nonveg')}
            id="diet-nonveg"
          >
            🍗 Non-Veg
          </button>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSuggestRecipes}
          disabled={loading}
          id="suggest-recipes-btn"
        >
          {loading ? '⏳ Loading...' : '🧑‍🍳 Suggest Recipes'}
        </button>
      </div>

      {/* Priority ingredients info */}
      {priorityIngredients.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginRight: '4px' }}>
            Prioritizing:
          </span>
          {priorityIngredients.map((ing, idx) => (
            <span key={idx} className="ingredient-tag have" style={{ fontSize: '0.78rem' }}>{ing}</span>
          ))}
        </div>
      )}

      {/* Active filter badge */}
      {hasSearched && recipes.length > 0 && (
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredRecipes.length}</strong> of {recipes.length} recipes
          </span>
          {dietFilter === 'veg' && <span className="diet-badge veg">🥦 Vegetarian only</span>}
          {dietFilter === 'nonveg' && <span className="diet-badge nonveg">🍗 Non-Veg only</span>}
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
      {!loading && filteredRecipes.length > 0 && (
        <div className="recipes-grid">
          {filteredRecipes.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} onClick={handleRecipeClick} />
          ))}
        </div>
      )}

      {/* No results after filter */}
      {!loading && hasSearched && recipes.length > 0 && filteredRecipes.length === 0 && (
        <EmptyState
          icon={dietFilter === 'veg' ? '🥦' : '🍗'}
          title={`No ${dietFilter === 'veg' ? 'vegetarian' : 'non-veg'} recipes found`}
          message="Try switching the filter or searching for different ingredients."
        />
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
          icon="🧑‍🍳"
          title="Ready to cook?"
          message={
            priorityIngredients.length > 0
              ? 'Click "Suggest Recipes" to find dishes based on your inventory, or search by name.'
              : 'Click "Suggest Recipes" to browse popular dishes, or add ingredients to get personalized suggestions!'
          }
          action={
            <button className="btn btn-primary" onClick={handleSuggestRecipes}>
              🧑‍🍳 Suggest Recipes
            </button>
          }
        />
      )}

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <RecipeModal recipe={selectedRecipe} onClose={handleCloseModal} />
      )}
    </div>
  );
}
