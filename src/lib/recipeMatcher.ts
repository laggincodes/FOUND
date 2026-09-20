import { FoodItem, Recipe, PriorityAssessment, PriorityTier, FoodCategory } from '@/types';
import { FOOD_LIBRARY_CATALOG } from '@/lib/food-library/food-catalog';
import { matchFoodLibrary, normalizeFoodName, extractFoodNameFromIngredient } from '@/lib/food-library/normalizer';
import { normalizeUnit, convertQuantity, parseQuantityAndUnit } from '@/lib/unitConverter';

export type RecipeMatchState = 'USE_FIRST' | 'COOK_NOW' | 'ALMOST_THERE' | 'NEEDS_INGREDIENTS';

export interface EvaluatedIngredient {
  name: string;
  amount: string;
  isAvailable: boolean;
  status: 'AVAILABLE' | 'PARTIAL' | 'MISSING';
  pantryItemName?: string;
  pantryStockQty: number;
  reqQty: number;
  reqUnit: string;
  missingAmountStr: string;
  isPriority: boolean;
  priorityTier?: PriorityTier;
  priorityReason?: string;
  category?: FoodCategory;
  foodId?: string;
}

export interface EvaluatedRecipe {
  recipe: Recipe;
  state: RecipeMatchState;
  stateBadge: {
    label: string;
    bg: string;
    text: string;
    border: string;
  };
  summaryText: string;
  availableCount: number;
  totalCount: number;
  missingCount: number;
  matchRatio: number;
  priorityRescueCount: number;
  priorityRescueNames: string[];
  evaluatedIngredients: EvaluatedIngredient[];
  missingIngredientsList: string[];
}

/**
 * Pure local evaluation of a recipe against real pantry inventory.
 * FOUND decides availability — NEVER Gemini or external services.
 */
export function evaluateRecipe(
  recipe: Recipe,
  pantryItems: FoodItem[],
  getItemAssessment: (item: FoodItem) => PriorityAssessment
): EvaluatedRecipe {
  const evaluatedIngredients: EvaluatedIngredient[] = recipe.ingredients.map((ing) => {
    const targetExtracted = extractFoodNameFromIngredient(ing.name);
    const matchedLib =
      matchFoodLibrary(ing.name, FOOD_LIBRARY_CATALOG) ||
      matchFoodLibrary(targetExtracted, FOOD_LIBRARY_CATALOG);
    const targetFoodId = matchedLib?.id;
    const targetNorm = normalizeFoodName(ing.name);

    const parsedReq = parseQuantityAndUnit(ing.amount);
    const reqQty = parsedReq.quantity > 0 ? parsedReq.quantity : 1;
    const reqUnit = parsedReq.unit || 'pcs';

    // Match in pantry using canonical IDs, extracted food names, and aliases
    const matchingLots = pantryItems.filter((item) => {
      if (item.quantity <= 0) return false;

      // 1. Canonical Food ID match
      const pantryItemFoodId =
        item.foodId || matchFoodLibrary(item.name, FOOD_LIBRARY_CATALOG)?.id;
      if (targetFoodId && pantryItemFoodId && targetFoodId === pantryItemFoodId) {
        return true;
      }

      // 2. Extracted food name exact match (e.g. "Paneer, cubed" -> "paneer", "Fresh Paneer" -> "paneer")
      const itemExtracted = extractFoodNameFromIngredient(item.name);
      if (itemExtracted && targetExtracted && itemExtracted === targetExtracted) {
        return true;
      }

      // 3. Normalized name direct match
      const itemNorm = normalizeFoodName(item.name);
      if (
        itemNorm === targetNorm ||
        itemNorm === targetExtracted ||
        itemExtracted === targetNorm
      ) {
        return true;
      }

      // 4. Catalog alias match
      if (
        matchedLib?.aliases.some((alias) => {
          const normA = normalizeFoodName(alias);
          return normA === itemNorm || normA === itemExtracted;
        })
      ) {
        return true;
      }

      // 5. Distinct whole-word containment (e.g. "paneer cheese" contains "paneer")
      if (targetExtracted.length > 2) {
        const regTarget = new RegExp(`\\b${targetExtracted}\\b`, 'i');
        if (regTarget.test(item.name)) return true;
      }
      if (itemExtracted.length > 2) {
        const regItem = new RegExp(`\\b${itemExtracted}\\b`, 'i');
        if (regItem.test(ing.name)) return true;
      }

      return (
        itemNorm.includes(targetNorm) ||
        targetNorm.includes(itemNorm) ||
        item.name.toLowerCase().includes(ing.name.toLowerCase()) ||
        ing.name.toLowerCase().includes(item.name.toLowerCase())
      );
    });

    let totalStock = 0;
    let highestTier: PriorityTier = 'SAFE_FOR_NOW';
    let highestReason = '';
    let primaryName = ing.name;

    if (matchingLots.length > 0) {
      primaryName = matchingLots[0].name;

      for (const lot of matchingLots) {
        const lotUnit = normalizeUnit(lot.unit);
        const converted = convertQuantity(lot.quantity, lotUnit, reqUnit);
        totalStock += converted !== null ? converted : lot.quantity;

        const assessment = getItemAssessment(lot);
        if (assessment.tier === 'EXPIRED') {
          highestTier = 'EXPIRED';
          highestReason = assessment.primaryReason;
        } else if (assessment.tier === 'USE_FIRST' && highestTier !== 'EXPIRED') {
          highestTier = 'USE_FIRST';
          highestReason = assessment.primaryReason;
        } else if (assessment.tier === 'USE_SOON' && highestTier === 'SAFE_FOR_NOW') {
          highestTier = 'USE_SOON';
          highestReason = assessment.primaryReason;
        }
      }
    }

    totalStock = Number(totalStock.toFixed(2));

    const isAvailable = matchingLots.length > 0 && totalStock > 0;
    const isFullAvailable = isAvailable && totalStock >= reqQty;
    const status: 'AVAILABLE' | 'PARTIAL' | 'MISSING' = isFullAvailable
      ? 'AVAILABLE'
      : isAvailable
      ? 'PARTIAL'
      : 'MISSING';

    const missingAmount = status === 'AVAILABLE' ? 0 : Math.max(0, reqQty - totalStock);
    const isPriority = highestTier === 'EXPIRED' || highestTier === 'USE_FIRST' || highestTier === 'USE_SOON';

    return {
      name: ing.name,
      amount: ing.amount,
      isAvailable,
      status,
      pantryItemName: isAvailable ? primaryName : undefined,
      pantryStockQty: totalStock,
      reqQty,
      reqUnit,
      missingAmountStr: `${missingAmount > 0 ? missingAmount : reqQty} ${reqUnit}`,
      isPriority,
      priorityTier: highestTier,
      priorityReason: highestReason,
      category: (matchedLib?.category as FoodCategory) || undefined,
      foodId: targetFoodId,
    };
  });

  const totalCount = evaluatedIngredients.length;
  // Count as available if at least partial or full stock exists
  const availableCount = evaluatedIngredients.filter((i) => i.isAvailable).length;
  const missingCount = Math.max(0, totalCount - availableCount);
  const matchRatio = totalCount > 0 ? availableCount / totalCount : 0;

  const priorityIngredients = evaluatedIngredients.filter((i) => i.isAvailable && i.isPriority);
  const priorityRescueCount = priorityIngredients.length;
  const priorityRescueNames = priorityIngredients.map((i) => i.pantryItemName || i.name);

  const missingIngredientsList = evaluatedIngredients
    .filter((i) => !i.isAvailable)
    .map((i) => i.name);

  // Determine state according to prompt specifications:
  // USE FIRST: Recipe uses one or more pantry items currently marked EXPIRED, USE_FIRST, or USE_SOON (with useful match)
  // COOK NOW: All required ingredients available (100% match)
  // ALMOST THERE: Substantial pantry overlap (e.g. >= 40% match with 2+ available, or <= 2 missing items)
  // NEEDS INGREDIENTS: Weak or zero pantry overlap (shown as EXPLORE)
  let state: RecipeMatchState;
  let summaryText = '';

  if (priorityRescueCount > 0 && availableCount > 0) {
    state = 'USE_FIRST';
    const rescued = priorityRescueNames[0];
    summaryText = `Uses ${rescued}${priorityRescueCount > 1 ? ` +${priorityRescueCount - 1} priority items` : ''} that needs attention`;
  } else if (missingCount === 0 && totalCount > 0) {
    state = 'COOK_NOW';
    summaryText = 'All required ingredients available in your pantry';
  } else if (
    availableCount >= 1 &&
    (
      missingCount <= 2 ||
      (availableCount >= 2 && missingCount <= 3) ||
      matchRatio >= 0.4
    )
  ) {
    state = 'ALMOST_THERE';
    summaryText = `Missing: ${missingIngredientsList.slice(0, 2).join(', ')}`;
  } else {
    state = 'NEEDS_INGREDIENTS';
    summaryText = `${missingCount} ingredient${missingCount === 1 ? '' : 's'} missing`;
  }

  // Development-only structured debug logging (Step 1)
  if (process.env.NODE_ENV !== 'production') {
    const matchedNames = evaluatedIngredients.filter((i) => i.isAvailable).map((i) => i.pantryItemName || i.name);
    const missingNames = evaluatedIngredients.filter((i) => !i.isAvailable).map((i) => i.name);
    console.log(`[Recipe Matcher]`);
    console.log(`PANTRY ITEMS:`, JSON.stringify(pantryItems.map((p) => p.name)));
    console.log(`RECIPE: "${recipe.name}"`);
    console.log(`RECIPE INGREDIENTS:`, JSON.stringify(recipe.ingredients.map((i) => i.name)));
    console.log(`MATCHED:`, JSON.stringify(matchedNames));
    console.log(`MISSING:`, JSON.stringify(missingNames));
    console.log(`MATCH: ${availableCount}/${totalCount} (${Math.round(matchRatio * 100)}%)`);
    console.log(`CLASS: ${state}`);
  }

  const stateBadges: Record<RecipeMatchState, { label: string; bg: string; text: string; border: string }> = {
    USE_FIRST: {
      label: 'USE FIRST',
      bg: 'bg-[#FFDBD0]',
      text: 'text-[#97472E]',
      border: 'border-[#F5C2B4]',
    },
    COOK_NOW: {
      label: 'COOK NOW',
      bg: 'bg-[#E3F2E9]',
      text: 'text-[#1B3D2F]',
      border: 'border-[#C8E6D3]',
    },
    ALMOST_THERE: {
      label: 'ALMOST THERE',
      bg: 'bg-[#FEF3D6]',
      text: 'text-[#8F5A00]',
      border: 'border-[#F5E0A3]',
    },
    NEEDS_INGREDIENTS: {
      label: 'NEEDS INGREDIENTS',
      bg: 'bg-[#F2F4F1]',
      text: 'text-[#5F6762]',
      border: 'border-[#E2E5E1]',
    },
  };

  return {
    recipe,
    state,
    stateBadge: stateBadges[state],
    summaryText,
    availableCount,
    totalCount,
    missingCount,
    matchRatio,
    priorityRescueCount,
    priorityRescueNames,
    evaluatedIngredients,
    missingIngredientsList,
  };
}

/**
 * Ranks recipes by:
 * 1. USE FIRST
 * 2. COOK NOW
 * 3. ALMOST THERE
 * 4. NEEDS INGREDIENTS
 */
export function rankEvaluatedRecipes(evaluated: EvaluatedRecipe[]): EvaluatedRecipe[] {
  const stateWeight: Record<RecipeMatchState, number> = {
    USE_FIRST: 400,
    COOK_NOW: 300,
    ALMOST_THERE: 200,
    NEEDS_INGREDIENTS: 100,
  };

  return [...evaluated].sort((a, b) => {
    // 1. Primary sort by State
    const weightDiff = stateWeight[b.state] - stateWeight[a.state];
    if (weightDiff !== 0) return weightDiff;

    // 2. USE FIRST tie-breaker: number of priority ingredients rescued, then match ratio
    if (a.state === 'USE_FIRST' && b.state === 'USE_FIRST') {
      if (b.priorityRescueCount !== a.priorityRescueCount) {
        return b.priorityRescueCount - a.priorityRescueCount;
      }
      if (b.matchRatio !== a.matchRatio) {
        return b.matchRatio - a.matchRatio;
      }
      return a.recipe.timeMinutes - b.recipe.timeMinutes;
    }

    // 3. COOK NOW tie-breaker: fastest cooking time
    if (a.state === 'COOK_NOW' && b.state === 'COOK_NOW') {
      return a.recipe.timeMinutes - b.recipe.timeMinutes;
    }

    // 4. ALMOST THERE tie-breaker: fewest missing items, then highest match ratio
    if (a.state === 'ALMOST_THERE' && b.state === 'ALMOST_THERE') {
      if (a.missingCount !== b.missingCount) {
        return a.missingCount - b.missingCount;
      }
      if (b.matchRatio !== a.matchRatio) {
        return b.matchRatio - a.matchRatio;
      }
      return a.recipe.timeMinutes - b.recipe.timeMinutes;
    }

    // 5. NEEDS INGREDIENTS tie-breaker: most available items
    if (b.availableCount !== a.availableCount) {
      return b.availableCount - a.availableCount;
    }
    return a.recipe.timeMinutes - b.recipe.timeMinutes;
  });
}
