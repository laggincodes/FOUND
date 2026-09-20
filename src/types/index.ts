export type PriorityTier = 'EXPIRED' | 'USE_FIRST' | 'USE_SOON' | 'SAFE_FOR_NOW';

export type FoodCategory =
  | 'Produce'
  | 'Dairy & Eggs'
  | 'Bakery'
  | 'Pantry & Grains'
  | 'Meat & Protein'
  | 'Canned & Jars'
  | 'Beverages'
  | 'Spices & Condiments'
  | 'Frozen'
  | 'Other';

export type StorageLocation = 'Fridge' | 'Cupboard / Pantry' | 'Freezer' | 'Countertop';

export interface PriorityAssessment {
  tier: PriorityTier;
  score: number; // 0-100
  primaryReason: string;
  detailedReasons: string[];
  daysRemaining: number | null;
  perishabilityScore: number;
  isExpired?: boolean;
}

export interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  quantity: number;
  unit: string;
  bestBefore?: string; // YYYY-MM-DD
  opened: boolean;
  openedDate?: string; // YYYY-MM-DD
  purchaseDate?: string; // YYYY-MM-DD
  storageLocation: StorageLocation;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  foodId?: string; // Reference to canonical FoodLibraryItem
}

export interface GroceryItem {
  id: string;
  name: string;
  quantity?: number;
  unit?: string;
  category: FoodCategory | 'Other';
  checked: boolean;
  source: 'manual' | 'recipe' | 'missing-ingredient' | 'restock' | 'pantry_restock' | 'recommendation' | 'library';
  recipeId?: string;
  recipeName?: string;
  addedAt: string;
  checkedAt?: string;
  notes?: string;
  pantryItemId?: string; // Linked pantry item if created or merged
  foodId?: string; // Reference to canonical FoodLibraryItem
}

export interface DuplicateResolutionData {
  groceryItem: GroceryItem;
  existingPantryItem: FoodItem;
}

export interface RecipeIngredient {
  name: string;
  amount: string;
  isPantryMatch?: boolean;
  pantryItemId?: string;
  priorityTier?: PriorityTier;
}

export interface Recipe {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  timeMinutes: number;
  difficulty: 'Easy' | 'Medium' | 'Intermediate';
  servings: number;
  category: string;
  isVegetarian: boolean;
  ingredients: RecipeIngredient[];
  steps: string[];
  tags: string[];
}

export interface UsageEvent {
  id: string;
  foodItemId: string;
  foodName: string;
  recipeId?: string;
  recipeName?: string;
  quantityUsed: number;
  unit: string;
  usedAt: string; // ISO string
  estimatedWeightGrams: number;
  estimatedValueINR: number;
  wasPriorityItem: boolean;
}

export interface ImpactMetrics {
  itemsUsedBeforePriority: number;
  estimatedFoodRescuedKg: number;
  estimatedFoodValueINR: number;
  mealsMadeFromPantry: number;
}

export interface DetectedPantryItem {
  id: string;
  name: string;
  category: FoodCategory;
  suggestedQuantity: number;
  suggestedUnit: string;
  confidence: number;
  confirmed: boolean;
  bestBefore?: string;
  opened: boolean;
  storageLocation: StorageLocation;
}

/* =========================================================================
   USER DATA, GROCERY LIBRARY & RECOMMENDATIONS MODELS
   ========================================================================= */

export type User = {
  id: string;
  email?: string;
  firstName?: string;
  householdName?: string;
  createdAt: string;
  updatedAt: string;
};

export type UserProfile = {
  userId: string;
  householdSize?: number;
  preferredUnits?: 'metric' | 'imperial';
  preferredCategories?: string[];
  dietaryPreferences?: string[];
  dislikedFoods?: string[];
  favoriteFoods?: string[];
  hiddenFoodIds?: string[]; // Foods dismissed with "Don't suggest this"
  createdAt: string;
  updatedAt: string;
};

export type PurchaseHistoryItem = {
  id: string;
  userId: string;
  foodId: string;
  name: string;
  quantity?: number;
  unit?: string;
  category?: string;
  purchasedAt: string;
  estimatedPrice?: number;
  source: 'manual' | 'grocery-list' | 'barcode' | 'scan' | 'recipe';
  groceryItemId?: string;
  pantryItemId?: string;
};

export type FoodPurchaseStats = {
  userId: string;
  foodId: string;
  purchaseCount: number;
  lastPurchasedAt?: string;
  averageDaysBetweenPurchases?: number;
  averageQuantity?: number;
  averagePrice?: number;
  firstPurchasedAt?: string;
  lastUpdatedAt: string;
};

export type GroceryRecommendationReason =
  | 'frequently-bought'
  | 'due-for-restock'
  | 'running-low'
  | 'recipe-needed'
  | 'missing-from-grocery-list'
  | 'popular-staple';

export type RecommendationLevel = 1 | 2 | 3 | 4; // 1: Need, 2: Due, 3: Frequent, 4: Discovery
export type RecommendationConfidence = 'strong' | 'moderate' | 'discovery';

export type GroceryRecommendation = {
  id: string;
  userId: string;
  foodId: string;
  name: string;
  category: string;
  suggestedQuantity: number;
  suggestedUnit: string;
  reason: GroceryRecommendationReason;
  level?: RecommendationLevel;
  confidence?: RecommendationConfidence;
  score: number;
  explanation: string;
  generatedAt: string;
};

export type FoodLibraryItem = {
  id: string;
  name: string;
  normalizedName: string;
  aliases: string[];
  category: string;
  subcategory?: string;
  defaultUnit?: string;
  commonUnits?: string[];
  commonUses?: string[];
  imageUrl?: string;
  thumbnailUrl?: string;
  imageSource?: string;
  imageAttribution?: string;
  barcode?: string;
  brand?: string;
  storageType?: 'pantry' | 'refrigerator' | 'freezer' | 'countertop';
  perishability?: 'high' | 'medium' | 'low';
  typicalShelfLifeDays?: number;
  tags?: string[];
  isPackaged?: boolean;
  country?: string;
  source?: string;
  sourceId?: string;
};

/* =========================================================================
   FOUND: DURABLE INVENTORY & UNIFIED "BEFORE YOU BUY" TYPES
   ========================================================================= */

export type DurableCategory =
  | 'Stationery'
  | 'Electronics'
  | 'Books'
  | 'Clothing'
  | 'Toiletries'
  | 'Household'
  | 'Other';

export interface DurableItem {
  id: string;
  userId?: string;
  name: string;
  category: DurableCategory;
  quantity: number;
  unit?: string;
  location?: string;
  purchaseDate?: string; // YYYY-MM-DD
  purchasePrice?: number; // In currency units (e.g. INR)
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type InventoryDecision = 'BUY' | 'USE' | 'WAIT';

export interface SearchMatchResult {
  query: string;
  found: boolean;
  type?: 'food' | 'durable' | 'both' | 'none';
  name?: string;
  category?: string;
  totalQuantity: number;
  unit: string;
  decision: InventoryDecision;
  decisionReason: string;
  headline: string; // e.g. "You already have 4 notebooks." or "You already have 2L."
  subline?: string; // e.g. "2 are currently unused." or "1L should be used soon."
  foodItems: FoodItem[];
  durableItems: DurableItem[];
  purchaseMemory?: {
    lastPurchasedAt?: string;
    lastQuantity?: number;
    lastPrice?: number;
    purchaseCount?: number;
  };
  isBoughtAhead?: boolean;
}
