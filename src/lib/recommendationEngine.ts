import {
  FoodItem,
  GroceryItem,
  PurchaseHistoryItem,
  FoodPurchaseStats,
  UserProfile,
  Recipe,
  GroceryRecommendation,
  FoodLibraryItem,
} from '@/types';
import { FOOD_LIBRARY_CATALOG } from './food-library/food-catalog';
import { normalizeFoodName } from './food-library/normalizer';

export interface RecommendationContext {
  userId: string;
  pantryItems: FoodItem[];
  groceryItems: GroceryItem[];
  purchaseStats: FoodPurchaseStats[];
  purchaseHistory: PurchaseHistoryItem[];
  userProfile?: UserProfile;
  activeRecipes?: Recipe[];
  foodCatalog?: FoodLibraryItem[];
  dismissedFoodIds?: string[];
}

/**
 * Computes deterministic, explainable grocery recommendations across 4 levels:
 * Level 1: Need (Pantry nearly empty or recipe required)
 * Level 2: Due (Replenishment cycle >= 80% passed)
 * Level 3: Frequent (Regular household staple)
 * Level 4: Discovery (Popular essentials for new users / empty history)
 */
export function getGroceryRecommendations(
  context: RecommendationContext
): GroceryRecommendation[] {
  const {
    userId,
    pantryItems,
    groceryItems,
    purchaseStats,
    purchaseHistory,
    userProfile,
    activeRecipes = [],
    foodCatalog = FOOD_LIBRARY_CATALOG,
    dismissedFoodIds = [],
  } = context;

  const now = Date.now();
  const recommendations: GroceryRecommendation[] = [];

  // Names/normalized names currently on the active grocery list (to avoid duplicate recommendations)
  const activeGroceryNames = new Set(
    groceryItems
      .filter((g) => !g.checked)
      .map((g) => normalizeFoodName(g.name))
  );

  // Set of permanently disliked or hidden foods from user profile
  const hiddenAndDislikedIds = new Set<string>([
    ...(userProfile?.hiddenFoodIds || []),
    ...(userProfile?.dislikedFoods || []),
  ]);

  // Session-dismissed items ("Not now")
  const sessionDismissed = new Set<string>(dismissedFoodIds);

  const isExcluded = (foodId: string, name: string): boolean => {
    const norm = normalizeFoodName(name);
    if (activeGroceryNames.has(norm)) return true;
    if (sessionDismissed.has(foodId) || sessionDismissed.has(norm)) return true;
    if (hiddenAndDislikedIds.has(foodId) || hiddenAndDislikedIds.has(norm) || hiddenAndDislikedIds.has(name)) return true;
    return false;
  };

  // Helper to find pantry item for a food name
  const findPantryItem = (foodName: string): FoodItem | undefined => {
    const norm = normalizeFoodName(foodName);
    return pantryItems.find((p) => {
      const pNorm = normalizeFoodName(p.name);
      return pNorm === norm || p.name.toLowerCase().includes(foodName.toLowerCase()) || foodName.toLowerCase().includes(p.name.toLowerCase());
    });
  };

  // Helper to find catalog item
  const findCatalogItem = (foodId: string, name: string): FoodLibraryItem | undefined => {
    return (
      foodCatalog.find((c) => c.id === foodId) ||
      foodCatalog.find((c) => c.name.toLowerCase() === name.toLowerCase()) ||
      foodCatalog.find((c) => normalizeFoodName(c.name) === normalizeFoodName(name))
    );
  };

  // Track already recommended food items in this run
  const recommendedFoods = new Set<string>();

  // =========================================================================
  // LEVEL 1: NEED — RUNNING LOW OR REQUIRED BY RECIPES
  // =========================================================================

  // 1A. Pantry items running low
  pantryItems.forEach((pItem) => {
    const norm = normalizeFoodName(pItem.name);
    const cat = findCatalogItem(pItem.foodId || '', pItem.name);
    const foodId = pItem.foodId || cat?.id || `food-${norm}`;

    if (isExcluded(foodId, pItem.name) || recommendedFoods.has(norm)) {
      return;
    }

    let isLow = false;
    const unitLower = pItem.unit.toLowerCase();

    if (unitLower === 'l' && pItem.quantity <= 0.3) isLow = true;
    else if (unitLower === 'ml' && pItem.quantity <= 300) isLow = true;
    else if (unitLower === 'kg' && pItem.quantity <= 0.3) isLow = true;
    else if (unitLower === 'g' && pItem.quantity <= 150) isLow = true;
    else if ((unitLower === 'pcs' || unitLower === 'bunch' || unitLower === 'pack' || unitLower === 'loaf') && pItem.quantity <= 1) isLow = true;

    if (isLow) {
      const stat = purchaseStats.find((s) => s.foodId === foodId);
      recommendedFoods.add(norm);

      recommendations.push({
        id: `rec-low-${pItem.id}`,
        userId,
        foodId,
        name: cat?.name || pItem.name,
        category: pItem.category,
        suggestedQuantity: stat?.averageQuantity || (pItem.unit === 'g' ? 500 : 1),
        suggestedUnit: pItem.unit,
        reason: 'running-low',
        level: 1,
        confidence: 'strong',
        score: 95,
        explanation: `Pantry is almost out (only ${pItem.quantity} ${pItem.unit} left).`,
        generatedAt: new Date().toISOString(),
      });
    }
  });

  // 1B. Missing or partial ingredients for active planned recipes (quantity-aware)
  activeRecipes.forEach((recipe) => {
    recipe.ingredients.forEach((ing) => {
      const norm = normalizeFoodName(ing.name);
      const cat = findCatalogItem('', ing.name);
      const foodId = cat?.id || `food-${norm}`;

      if (isExcluded(foodId, ing.name) || recommendedFoods.has(norm)) {
        return;
      }

      const numMatch = ing.amount.match(/(\d+(\.\d+)?)/);
      const requiredQty = numMatch ? parseFloat(numMatch[0]) : 1;
      const recipeUnit = ing.amount.replace(/(\d+(\.\d+)?)/, '').trim() || 'pcs';

      const inPantry = findPantryItem(ing.name);
      let neededQty = requiredQty;
      let isPartial = false;

      if (inPantry) {
        // If units match approximately
        if (inPantry.unit.toLowerCase() === recipeUnit.toLowerCase()) {
          if (inPantry.quantity >= requiredQty) {
            return; // Sufficient in pantry
          }
          neededQty = Number((requiredQty - inPantry.quantity).toFixed(1));
          isPartial = true;
        } else if (inPantry.quantity > 0) {
          // Unit mismatch (e.g. 1 bunch vs 100g), if pantry has any stock, skip
          return;
        }
      }

      recommendedFoods.add(norm);
      recommendations.push({
        id: `rec-recipe-${recipe.id}-${norm}`,
        userId,
        foodId,
        name: cat?.name || ing.name,
        category: cat?.category || 'Produce',
        suggestedQuantity: neededQty > 0 ? neededQty : 1,
        suggestedUnit: recipeUnit,
        reason: 'recipe-needed',
        level: 1,
        confidence: 'strong',
        score: 90,
        explanation: isPartial
          ? `Need ${neededQty} ${recipeUnit} more for ${recipe.name} (${inPantry?.quantity} ${inPantry?.unit} in pantry).`
          : `Required for ${recipe.name}.`,
        generatedAt: new Date().toISOString(),
      });
    });
  });

  // =========================================================================
  // LEVEL 2: DUE — PREDICTED REPLENISHMENT CYCLE
  // =========================================================================
  purchaseStats.forEach((stat) => {
    const cat = foodCatalog.find((c) => c.id === stat.foodId);
    const foodName = cat?.name || stat.foodId.replace('food-', '');
    const norm = normalizeFoodName(foodName);

    if (isExcluded(stat.foodId, foodName) || recommendedFoods.has(norm)) {
      return;
    }

    if (!stat.lastPurchasedAt || !stat.averageDaysBetweenPurchases || stat.averageDaysBetweenPurchases <= 0) {
      return;
    }

    const lastDate = new Date(stat.lastPurchasedAt).getTime();
    const daysSince = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
    const interval = stat.averageDaysBetweenPurchases;

    // Check current pantry level
    const existingPantry = findPantryItem(foodName);
    const hasAbundantStock = existingPantry && existingPantry.quantity > (stat.averageQuantity || 1) * 0.7;

    // If bought very recently or abundant in pantry, skip
    if (daysSince < interval * 0.4 || hasAbundantStock) {
      return;
    }

    // Due if daysSince is >= 80% of normal interval
    if (daysSince >= interval * 0.8) {
      recommendedFoods.add(norm);

      let explanation = '';
      if (Math.abs(daysSince - interval) <= 1) {
        explanation = interval >= 6 && interval <= 8
          ? 'You usually buy this every week.'
          : `You usually buy this every ${Math.round(interval)} days.`;
      } else if (daysSince >= interval) {
        explanation = `You normally restock this around now (last bought ${daysSince} days ago).`;
      } else {
        explanation = `Usually restocked every ~${Math.round(interval)} days (due in ${Math.max(1, Math.round(interval - daysSince))} days).`;
      }

      const isOverdue = daysSince >= interval;
      recommendations.push({
        id: `rec-due-${stat.foodId}`,
        userId,
        foodId: stat.foodId,
        name: cat?.name || foodName,
        category: cat?.category || 'Pantry Staples',
        suggestedQuantity: stat.averageQuantity || 1,
        suggestedUnit: cat?.defaultUnit || 'pack',
        reason: 'due-for-restock',
        level: 2,
        confidence: isOverdue ? 'strong' : 'moderate',
        score: Math.min(85, 70 + Math.round((daysSince / interval) * 15)),
        explanation,
        generatedAt: new Date().toISOString(),
      });
    }
  });

  // =========================================================================
  // LEVEL 3: FREQUENT — REGULAR HOUSEHOLD STAPLES
  // =========================================================================
  purchaseStats
    .filter((s) => s.purchaseCount >= 3)
    .sort((a, b) => b.purchaseCount - a.purchaseCount)
    .forEach((stat) => {
      const cat = foodCatalog.find((c) => c.id === stat.foodId);
      const foodName = cat?.name || stat.foodId.replace('food-', '');
      const norm = normalizeFoodName(foodName);

      if (isExcluded(stat.foodId, foodName) || recommendedFoods.has(norm)) {
        return;
      }

      // Suppress if purchased very recently
      if (stat.lastPurchasedAt) {
        const lastDate = new Date(stat.lastPurchasedAt).getTime();
        const daysSince = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
        const interval = stat.averageDaysBetweenPurchases || 7;
        if (daysSince < Math.max(2, interval * 0.4)) {
          return;
        }
      }

      const existingPantry = findPantryItem(foodName);
      if (existingPantry && existingPantry.quantity >= (stat.averageQuantity || 1) * 0.5) {
        return;
      }

      recommendedFoods.add(norm);
      recommendations.push({
        id: `rec-freq-${stat.foodId}`,
        userId,
        foodId: stat.foodId,
        name: cat?.name || foodName,
        category: cat?.category || 'Pantry Staples',
        suggestedQuantity: stat.averageQuantity || 1,
        suggestedUnit: cat?.defaultUnit || 'pack',
        reason: 'frequently-bought',
        level: 3,
        confidence: 'moderate',
        score: 65,
        explanation: `A regular staple in your home (bought ${stat.purchaseCount} times).`,
        generatedAt: new Date().toISOString(),
      });
    });

  // =========================================================================
  // LEVEL 4: DISCOVERY — POPULAR ESSENTIALS FOR NEW / SPARSE HOUSEHOLDS
  // =========================================================================
  // If the user has few or no recommendations and little purchase history (< 2 purchases),
  // offer common household staples so the screen is never an unhelpful empty void.
  if (recommendations.length < 3 && purchaseHistory.length <= 3) {
    const popularStaples = [
      'food-milk-cow',
      'food-egg-white',
      'food-onion',
      'food-tomato',
      'food-potato',
      'food-atta',
      'food-rice-basmati',
      'food-sunflower-oil',
    ];

    popularStaples.forEach((stapleId) => {
      if (recommendations.length >= 4) return;
      const cat = foodCatalog.find((c) => c.id === stapleId);
      if (!cat) return;

      const norm = normalizeFoodName(cat.name);
      if (isExcluded(cat.id, cat.name) || recommendedFoods.has(norm)) {
        return;
      }

      // Suppress if already in pantry or purchased recently
      const existingPantry = findPantryItem(cat.name);
      if (existingPantry && existingPantry.quantity > 0) {
        return;
      }

      const recentlyPurchased = purchaseHistory.some((ph) => {
        if (ph.foodId === stapleId || normalizeFoodName(ph.name) === norm) {
          const pDate = new Date(ph.purchasedAt).getTime();
          const days = Math.floor((now - pDate) / (1000 * 60 * 60 * 24));
          return days < 7;
        }
        return false;
      });
      if (recentlyPurchased) return;

      recommendedFoods.add(norm);
      recommendations.push({
        id: `rec-disc-${cat.id}`,
        userId,
        foodId: cat.id,
        name: cat.name,
        category: cat.category,
        suggestedQuantity: cat.defaultUnit === 'g' ? 500 : 1,
        suggestedUnit: cat.defaultUnit || 'pcs',
        reason: 'popular-staple',
        level: 4,
        confidence: 'discovery',
        score: 45,
        explanation: 'Popular household staple to start your pantry.',
        generatedAt: new Date().toISOString(),
      });
    });
  }

  // Sort primarily by Level ascending (Level 1 > Level 2 > Level 3 > Level 4), secondarily by score
  return recommendations.sort((a, b) => {
    const levelA = a.level ?? 3;
    const levelB = b.level ?? 3;
    if (levelA !== levelB) return levelA - levelB;
    return b.score - a.score;
  });
}

/**
 * Recomputes FoodPurchaseStats when a new purchase history item is recorded.
 */
export function recordPurchaseAndRecalculateStats(
  existingStats: FoodPurchaseStats[],
  purchase: PurchaseHistoryItem
): FoodPurchaseStats[] {
  const nowStr = purchase.purchasedAt || new Date().toISOString();
  const index = existingStats.findIndex((s) => s.foodId === purchase.foodId);

  if (index === -1) {
    // First recorded purchase
    const newStat: FoodPurchaseStats = {
      userId: purchase.userId,
      foodId: purchase.foodId,
      purchaseCount: 1,
      firstPurchasedAt: nowStr,
      lastPurchasedAt: nowStr,
      averageDaysBetweenPurchases: undefined,
      averageQuantity: purchase.quantity || 1,
      averagePrice: purchase.estimatedPrice,
      lastUpdatedAt: nowStr,
    };
    return [newStat, ...existingStats];
  }

  const current = existingStats[index];
  const newCount = current.purchaseCount + 1;

  // Calculate days between previous purchase and this purchase
  let newAvgInterval = current.averageDaysBetweenPurchases;
  if (current.lastPurchasedAt) {
    const prevTime = new Date(current.lastPurchasedAt).getTime();
    const thisTime = new Date(nowStr).getTime();
    const daysDiff = Math.max(1, Math.round((thisTime - prevTime) / (1000 * 60 * 60 * 24)));

    if (current.averageDaysBetweenPurchases) {
      // Exponential moving average or weighted average
      newAvgInterval = Number(
        ((current.averageDaysBetweenPurchases * (newCount - 2) + daysDiff) / (newCount - 1)).toFixed(1)
      );
    } else {
      newAvgInterval = daysDiff;
    }
  }

  // Update average quantity
  const prevQty = current.averageQuantity || 1;
  const thisQty = purchase.quantity || 1;
  const newAvgQty = Number(((prevQty * (newCount - 1) + thisQty) / newCount).toFixed(1));

  const updated: FoodPurchaseStats = {
    ...current,
    purchaseCount: newCount,
    lastPurchasedAt: nowStr,
    averageDaysBetweenPurchases: newAvgInterval,
    averageQuantity: newAvgQty,
    averagePrice: purchase.estimatedPrice || current.averagePrice,
    lastUpdatedAt: nowStr,
  };

  const copy = [...existingStats];
  copy[index] = updated;
  return copy;
}
