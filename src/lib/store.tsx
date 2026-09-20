'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  User,
  UserProfile,
  FoodItem,
  GroceryItem,
  PurchaseHistoryItem,
  FoodPurchaseStats,
  GroceryRecommendation,
  UsageEvent,
  ImpactMetrics,
  PriorityAssessment,
  FoodCategory,
  StorageLocation,
  DuplicateResolutionData,
} from '@/types';
import { assessPriority } from './priority';
import { RECIPES_DATA } from './recipes-data';
import { FOOD_LIBRARY_CATALOG } from './food-library/food-catalog';
import { matchFoodLibrary, normalizeFoodName } from './food-library/normalizer';
import { combineQuantities, normalizeUnit, areUnitsCompatible, convertQuantity, parseQuantityAndUnit } from './unitConverter';
import {
  getGroceryRecommendations,
  recordPurchaseAndRecalculateStats,
} from './recommendationEngine';

interface PantryContextType {
  // User Identity & Multi-User Isolation
  activeUser: User;
  userProfile: UserProfile;
  availableUsers: User[];
  switchUser: (userId: string) => void;

  // Inventory & Groceries
  items: FoodItem[];
  groceryItems: GroceryItem[];
  usageEvents: UsageEvent[];
  impactMetrics: ImpactMetrics;
  addItem: (item: Omit<FoodItem, 'id' | 'createdAt' | 'updatedAt'>) => FoodItem;
  updateItem: (id: string, updates: Partial<Omit<FoodItem, 'id' | 'createdAt'>>) => void;
  deleteItem: (id: string) => void;
  markIngredientsUsed: (
    usedItems: { name: string; amountUsed: number; unit: string; recipeId?: string; recipeName?: string; foodId?: string }[]
  ) => { rescuedCount: number; rescuedValue: number; rescuedWeightKg: number };

  // Grocery List methods
  addGroceryItem: (item: Omit<GroceryItem, 'id' | 'addedAt' | 'checked'>) => GroceryItem;
  addMissingIngredientsToGrocery: (
    recipe: { id: string; name: string },
    missingIngredients: { name: string; amount: string; category?: FoodCategory; foodId?: string }[]
  ) => { addedCount: number; existingCount: number };
  toggleGroceryItem: (id: string) => {
    duplicateDetected?: DuplicateResolutionData;
    addedToPantry?: boolean;
    merged?: boolean;
    separateBatch?: boolean;
    pantryItemName?: string;
    newTotal?: number;
    unit?: string;
  };
  resolveDuplicate: (
    data: DuplicateResolutionData,
    choice: 'merge' | 'separate'
  ) => { message: string };
  deleteGroceryItem: (id: string) => void;
  clearPurchasedGroceries: () => void;
  addPantryItemToGrocery: (item: FoodItem) => void;

  // Recommendations & History & Intelligence V2
  recommendations: GroceryRecommendation[];
  purchaseHistory: PurchaseHistoryItem[];
  purchaseStats: FoodPurchaseStats[];
  recentlyBought: PurchaseHistoryItem[];
  frequentlyBought: FoodPurchaseStats[];
  dueSoon: FoodPurchaseStats[];
  addRecommendationToGrocery: (rec: GroceryRecommendation) => void;
  dismissRecommendation: (foodId: string) => void;
  dontSuggestFood: (foodId: string) => void;
  allowSuggestFood: (foodId: string) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;

  // Utilities
  resetToDemoData: () => void;
  clearAllData: () => void;
  getItemAssessment: (item: FoodItem) => PriorityAssessment;
  isHydrated: boolean;
}

const PantryContext = createContext<PantryContextType | undefined>(undefined);

// =========================================================================
// PRESET DEMO USERS (SECTION 31 & 33 MULTI-USER ISOLATION)
// =========================================================================

export const DEMO_USERS: User[] = [
  {
    id: 'demo-user-001',
    firstName: 'Aarav',
    householdName: "Aarav's Household",
    email: 'aarav.sharma@example.com',
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-09-20T00:00:00.000Z',
  },
  {
    id: 'demo-user-002',
    firstName: 'Priya',
    householdName: "Priya's Studio",
    email: 'priya.patel@example.com',
    createdAt: '2026-03-10T00:00:00.000Z',
    updatedAt: '2026-09-20T00:00:00.000Z',
  },
];

export const DEMO_PROFILES: Record<string, UserProfile> = {
  'demo-user-001': {
    userId: 'demo-user-001',
    householdSize: 4,
    preferredUnits: 'metric',
    preferredCategories: ['Produce', 'Dairy & Eggs', 'Pantry & Grains'],
    dietaryPreferences: ['Vegetarian'],
    dislikedFoods: ['Bitter Gourd'],
    hiddenFoodIds: [],
    favoriteFoods: ['Paneer', 'Spinach', 'Whole Milk', 'Tomatoes'],
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-09-20T00:00:00.000Z',
  },
  'demo-user-002': {
    userId: 'demo-user-002',
    householdSize: 1,
    preferredUnits: 'metric',
    preferredCategories: ['Dairy & Eggs', 'Produce', 'Beverages'],
    dietaryPreferences: ['High Protein', 'Eggitarian'],
    dislikedFoods: ['Eggplant'],
    hiddenFoodIds: [],
    favoriteFoods: ['Greek Yogurt', 'Eggs', 'Oats', 'Almonds'],
    createdAt: '2026-03-10T00:00:00.000Z',
    updatedAt: '2026-09-20T00:00:00.000Z',
  },
};

const getDateStr = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

const getIsoTimeStr = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
};

// =========================================================================
// SEED DATA FOR USER 001 (Aarav's Household — Section 31 Scenario)
// =========================================================================

const USER_001_INITIAL_ITEMS: FoodItem[] = [
  {
    id: 'item-u1-spinach',
    foodId: 'food-spinach',
    name: 'Fresh Spinach',
    category: 'Produce',
    quantity: 250,
    unit: 'g',
    bestBefore: getDateStr(1), // Tomorrow -> Priority
    opened: true,
    openedDate: getDateStr(-1),
    purchaseDate: getDateStr(-3),
    storageLocation: 'Fridge',
    notes: 'Crisp baby spinach for curries or salads.',
    createdAt: getIsoTimeStr(-3),
    updatedAt: getIsoTimeStr(-1),
  },
  {
    id: 'item-u1-milk',
    foodId: 'food-milk-cow',
    name: 'Whole Milk',
    category: 'Dairy & Eggs',
    quantity: 0.2, // Low quantity (Section 31: 0.2 L)
    unit: 'L',
    bestBefore: getDateStr(1),
    opened: true,
    openedDate: getDateStr(-3),
    purchaseDate: getDateStr(-7), // Bought 7 days ago
    storageLocation: 'Fridge',
    notes: 'Almost finished carton.',
    createdAt: getIsoTimeStr(-7),
    updatedAt: getIsoTimeStr(-1),
  },
  {
    id: 'item-u1-paneer',
    foodId: 'food-paneer',
    name: 'Fresh Paneer',
    category: 'Dairy & Eggs',
    quantity: 100, // Low quantity (Section 31: 100 g)
    unit: 'g',
    bestBefore: getDateStr(2),
    opened: true,
    openedDate: getDateStr(-2),
    purchaseDate: getDateStr(-10), // Bought 10 days ago
    storageLocation: 'Fridge',
    notes: 'Half block remaining.',
    createdAt: getIsoTimeStr(-10),
    updatedAt: getIsoTimeStr(-2),
  },
  {
    id: 'item-u1-tomatoes',
    foodId: 'food-tomato',
    name: 'Vine Tomatoes',
    category: 'Produce',
    quantity: 2, // Low quantity (Section 31: 2 pcs)
    unit: 'pcs',
    bestBefore: getDateStr(2),
    opened: false,
    purchaseDate: getDateStr(-5), // Bought 5 days ago
    storageLocation: 'Fridge',
    notes: 'Only 2 ripe tomatoes left.',
    createdAt: getIsoTimeStr(-5),
    updatedAt: getIsoTimeStr(-5),
  },
  {
    id: 'item-u1-curd',
    foodId: 'food-curd',
    name: 'Fresh Curd / Dahi',
    category: 'Dairy & Eggs',
    quantity: 500, // Sufficiently stocked (Section 31: 500 g)
    unit: 'g',
    bestBefore: getDateStr(5),
    opened: false,
    purchaseDate: getDateStr(-2), // Bought 2 days ago -> DO NOT RECOMMEND
    storageLocation: 'Fridge',
    notes: 'Freshly bought tub.',
    createdAt: getIsoTimeStr(-2),
    updatedAt: getIsoTimeStr(-2),
  },
  {
    id: 'item-u1-bread',
    foodId: 'food-bread-wheat',
    name: 'Wholewheat Bread',
    category: 'Bakery',
    quantity: 0.5, // 1/2 loaf (Section 31)
    unit: 'loaf',
    bestBefore: getDateStr(1),
    opened: true,
    openedDate: getDateStr(-2),
    purchaseDate: getDateStr(-5), // Bought 5 days ago (cycle 6d)
    storageLocation: 'Countertop',
    notes: 'Half loaf remaining for breakfast.',
    createdAt: getIsoTimeStr(-5),
    updatedAt: getIsoTimeStr(-2),
  },
  {
    id: 'item-u1-atta',
    foodId: 'food-atta',
    name: 'Chakki Wholewheat Atta',
    category: 'Pantry & Grains',
    quantity: 4,
    unit: 'kg',
    bestBefore: getDateStr(60),
    opened: true,
    storageLocation: 'Cupboard / Pantry',
    notes: 'Aashirvaad Sharbati atta container.',
    createdAt: getIsoTimeStr(-15),
    updatedAt: getIsoTimeStr(-15),
  },
];

const USER_001_INITIAL_GROCERIES: GroceryItem[] = [
  {
    id: 'groc-u1-1',
    foodId: 'food-coriander',
    name: 'Fresh Coriander',
    quantity: 1,
    unit: 'bunch',
    category: 'Produce',
    checked: false,
    source: 'recipe',
    recipeId: 'rec-palak-paneer',
    recipeName: 'Palak Paneer',
    addedAt: getIsoTimeStr(-1),
    notes: 'Needed for Palak Paneer garnishing',
  },
];

const USER_001_PURCHASE_HISTORY: PurchaseHistoryItem[] = [
  // Milk purchases (every ~7 days)
  {
    id: 'ph-milk-1',
    userId: 'demo-user-001',
    foodId: 'food-milk-cow',
    name: 'Whole Milk',
    quantity: 1,
    unit: 'L',
    category: 'Dairy & Eggs',
    purchasedAt: getIsoTimeStr(-21),
    source: 'grocery-list',
  },
  {
    id: 'ph-milk-2',
    userId: 'demo-user-001',
    foodId: 'food-milk-cow',
    name: 'Whole Milk',
    quantity: 1,
    unit: 'L',
    category: 'Dairy & Eggs',
    purchasedAt: getIsoTimeStr(-14),
    source: 'grocery-list',
  },
  {
    id: 'ph-milk-3',
    userId: 'demo-user-001',
    foodId: 'food-milk-cow',
    name: 'Whole Milk',
    quantity: 1,
    unit: 'L',
    category: 'Dairy & Eggs',
    purchasedAt: getIsoTimeStr(-7), // 7 days ago
    source: 'grocery-list',
  },

  // Paneer purchases (every ~10 days)
  {
    id: 'ph-paneer-1',
    userId: 'demo-user-001',
    foodId: 'food-paneer',
    name: 'Fresh Paneer',
    quantity: 250,
    unit: 'g',
    category: 'Dairy & Eggs',
    purchasedAt: getIsoTimeStr(-30),
    source: 'grocery-list',
  },
  {
    id: 'ph-paneer-2',
    userId: 'demo-user-001',
    foodId: 'food-paneer',
    name: 'Fresh Paneer',
    quantity: 250,
    unit: 'g',
    category: 'Dairy & Eggs',
    purchasedAt: getIsoTimeStr(-20),
    source: 'grocery-list',
  },
  {
    id: 'ph-paneer-3',
    userId: 'demo-user-001',
    foodId: 'food-paneer',
    name: 'Fresh Paneer',
    quantity: 250,
    unit: 'g',
    category: 'Dairy & Eggs',
    purchasedAt: getIsoTimeStr(-10), // 10 days ago
    source: 'grocery-list',
  },

  // Tomatoes purchases (every ~5 days)
  {
    id: 'ph-tomatoes-1',
    userId: 'demo-user-001',
    foodId: 'food-tomato',
    name: 'Vine Tomatoes',
    quantity: 500,
    unit: 'g',
    category: 'Produce',
    purchasedAt: getIsoTimeStr(-15),
    source: 'grocery-list',
  },
  {
    id: 'ph-tomatoes-2',
    userId: 'demo-user-001',
    foodId: 'food-tomato',
    name: 'Vine Tomatoes',
    quantity: 500,
    unit: 'g',
    category: 'Produce',
    purchasedAt: getIsoTimeStr(-10),
    source: 'grocery-list',
  },
  {
    id: 'ph-tomatoes-3',
    userId: 'demo-user-001',
    foodId: 'food-tomato',
    name: 'Vine Tomatoes',
    quantity: 500,
    unit: 'g',
    category: 'Produce',
    purchasedAt: getIsoTimeStr(-5), // 5 days ago
    source: 'grocery-list',
  },

  // Curd purchases (every ~7 days, bought 2 days ago)
  {
    id: 'ph-curd-1',
    userId: 'demo-user-001',
    foodId: 'food-curd',
    name: 'Fresh Curd / Dahi',
    quantity: 500,
    unit: 'g',
    category: 'Dairy & Eggs',
    purchasedAt: getIsoTimeStr(-16),
    source: 'grocery-list',
  },
  {
    id: 'ph-curd-2',
    userId: 'demo-user-001',
    foodId: 'food-curd',
    name: 'Fresh Curd / Dahi',
    quantity: 500,
    unit: 'g',
    category: 'Dairy & Eggs',
    purchasedAt: getIsoTimeStr(-9),
    source: 'grocery-list',
  },
  {
    id: 'ph-curd-3',
    userId: 'demo-user-001',
    foodId: 'food-curd',
    name: 'Fresh Curd / Dahi',
    quantity: 500,
    unit: 'g',
    category: 'Dairy & Eggs',
    purchasedAt: getIsoTimeStr(-2), // 2 days ago
    source: 'grocery-list',
  },

  // Bread purchases (every ~6 days)
  {
    id: 'ph-bread-1',
    userId: 'demo-user-001',
    foodId: 'food-bread-wheat',
    name: 'Wholewheat Bread',
    quantity: 1,
    unit: 'loaf',
    category: 'Bakery',
    purchasedAt: getIsoTimeStr(-17),
    source: 'grocery-list',
  },
  {
    id: 'ph-bread-2',
    userId: 'demo-user-001',
    foodId: 'food-bread-wheat',
    name: 'Wholewheat Bread',
    quantity: 1,
    unit: 'loaf',
    category: 'Bakery',
    purchasedAt: getIsoTimeStr(-11),
    source: 'grocery-list',
  },
  {
    id: 'ph-bread-3',
    userId: 'demo-user-001',
    foodId: 'food-bread-wheat',
    name: 'Wholewheat Bread',
    quantity: 1,
    unit: 'loaf',
    category: 'Bakery',
    purchasedAt: getIsoTimeStr(-5), // 5 days ago
    source: 'grocery-list',
  },
];

const USER_001_PURCHASE_STATS: FoodPurchaseStats[] = [
  {
    userId: 'demo-user-001',
    foodId: 'food-milk-cow',
    purchaseCount: 14,
    lastPurchasedAt: getIsoTimeStr(-7),
    averageDaysBetweenPurchases: 7.0,
    averageQuantity: 1,
    firstPurchasedAt: getIsoTimeStr(-100),
    lastUpdatedAt: getIsoTimeStr(-7),
  },
  {
    userId: 'demo-user-001',
    foodId: 'food-paneer',
    purchaseCount: 8,
    lastPurchasedAt: getIsoTimeStr(-10),
    averageDaysBetweenPurchases: 10.0,
    averageQuantity: 250,
    firstPurchasedAt: getIsoTimeStr(-80),
    lastUpdatedAt: getIsoTimeStr(-10),
  },
  {
    userId: 'demo-user-001',
    foodId: 'food-tomato',
    purchaseCount: 15,
    lastPurchasedAt: getIsoTimeStr(-5),
    averageDaysBetweenPurchases: 5.0,
    averageQuantity: 500,
    firstPurchasedAt: getIsoTimeStr(-90),
    lastUpdatedAt: getIsoTimeStr(-5),
  },
  {
    userId: 'demo-user-001',
    foodId: 'food-curd',
    purchaseCount: 10,
    lastPurchasedAt: getIsoTimeStr(-2),
    averageDaysBetweenPurchases: 7.0,
    averageQuantity: 500,
    firstPurchasedAt: getIsoTimeStr(-70),
    lastUpdatedAt: getIsoTimeStr(-2),
  },
  {
    userId: 'demo-user-001',
    foodId: 'food-bread-wheat',
    purchaseCount: 9,
    lastPurchasedAt: getIsoTimeStr(-5),
    averageDaysBetweenPurchases: 6.0,
    averageQuantity: 1,
    firstPurchasedAt: getIsoTimeStr(-60),
    lastUpdatedAt: getIsoTimeStr(-5),
  },
];

const USER_001_USAGE_EVENTS: UsageEvent[] = [
  {
    id: 'evt-1',
    foodItemId: 'item-u1-spinach-prev',
    foodName: 'Baby Spinach',
    recipeId: 'rec-palak-paneer',
    recipeName: 'Palak Paneer',
    quantityUsed: 250,
    unit: 'g',
    usedAt: getIsoTimeStr(-6),
    estimatedWeightGrams: 250,
    estimatedValueINR: 40,
    wasPriorityItem: true,
  },
  {
    id: 'evt-2',
    foodItemId: 'item-u1-milk-prev',
    foodName: 'Fresh Cow Milk',
    recipeId: 'rec-creamy-tomato-soup',
    recipeName: 'Silky Tomato & Herb Soup',
    quantityUsed: 500,
    unit: 'ml',
    usedAt: getIsoTimeStr(-4),
    estimatedWeightGrams: 500,
    estimatedValueINR: 35,
    wasPriorityItem: true,
  },
];

// =========================================================================
// SEED DATA FOR USER 002 (Priya's Studio — Section 33 Isolation)
// =========================================================================

const USER_002_INITIAL_ITEMS: FoodItem[] = [
  {
    id: 'item-u2-oats',
    foodId: 'food-rolled-oats',
    name: 'Rolled Oats',
    category: 'Pantry & Grains',
    quantity: 1,
    unit: 'kg',
    bestBefore: getDateStr(90),
    opened: true,
    storageLocation: 'Cupboard / Pantry',
    notes: 'Breakfast staple.',
    createdAt: getIsoTimeStr(-15),
    updatedAt: getIsoTimeStr(-15),
  },
  {
    id: 'item-u2-eggs',
    foodId: 'food-eggs',
    name: 'Farm Fresh Eggs',
    category: 'Dairy & Eggs',
    quantity: 6,
    unit: 'pcs',
    bestBefore: getDateStr(12),
    opened: false,
    purchaseDate: getDateStr(-2),
    storageLocation: 'Fridge',
    notes: 'For omelettes and boiled breakfast.',
    createdAt: getIsoTimeStr(-2),
    updatedAt: getIsoTimeStr(-2),
  },
  {
    id: 'item-u2-almonds',
    foodId: 'food-almonds',
    name: 'California Almonds (Badam)',
    category: 'Pantry & Grains',
    quantity: 250,
    unit: 'g',
    bestBefore: getDateStr(120),
    opened: true,
    storageLocation: 'Cupboard / Pantry',
    notes: 'Snack nuts.',
    createdAt: getIsoTimeStr(-20),
    updatedAt: getIsoTimeStr(-20),
  },
];

const USER_002_INITIAL_GROCERIES: GroceryItem[] = [
  {
    id: 'groc-u2-1',
    foodId: 'food-green-tea',
    name: 'Organic Green Tea Bags',
    quantity: 1,
    unit: 'pack',
    category: 'Beverages',
    checked: false,
    source: 'manual',
    addedAt: getIsoTimeStr(-1),
    notes: 'Morning routine restock',
  },
];

const USER_002_PURCHASE_HISTORY: PurchaseHistoryItem[] = [
  {
    id: 'ph-u2-eggs-1',
    userId: 'demo-user-002',
    foodId: 'food-eggs',
    name: 'Farm Fresh Eggs',
    quantity: 12,
    unit: 'pcs',
    category: 'Dairy & Eggs',
    purchasedAt: getIsoTimeStr(-16),
    source: 'grocery-list',
  },
  {
    id: 'ph-u2-eggs-2',
    userId: 'demo-user-002',
    foodId: 'food-eggs',
    name: 'Farm Fresh Eggs',
    quantity: 6,
    unit: 'pcs',
    category: 'Dairy & Eggs',
    purchasedAt: getIsoTimeStr(-2),
    source: 'grocery-list',
  },
];

const USER_002_PURCHASE_STATS: FoodPurchaseStats[] = [
  {
    userId: 'demo-user-002',
    foodId: 'food-eggs',
    purchaseCount: 2,
    lastPurchasedAt: getIsoTimeStr(-2),
    averageDaysBetweenPurchases: 14.0,
    averageQuantity: 9,
    firstPurchasedAt: getIsoTimeStr(-16),
    lastUpdatedAt: getIsoTimeStr(-2),
  },
];

export const PantryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // User Management
  const [activeUser, setActiveUser] = useState<User>(DEMO_USERS[0]);
  const [userProfile, setUserProfile] = useState<UserProfile>(DEMO_PROFILES['demo-user-001']);

  // Household data states (scoped to active user)
  const [items, setItems] = useState<FoodItem[]>([]);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [usageEvents, setUsageEvents] = useState<UsageEvent[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistoryItem[]>([]);
  const [purchaseStats, setPurchaseStats] = useState<FoodPurchaseStats[]>([]);
  const [dismissedRecIds, setDismissedRecIds] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Helper storage key generators
  const getKey = useCallback((suffix: string, userId = activeUser.id) => {
    return `use_it_first_${userId}_${suffix}`;
  }, [activeUser.id]);

  // Load user data when activeUser changes
  const loadUserData = useCallback((userId: string) => {
    try {
      const user = DEMO_USERS.find((u) => u.id === userId) || DEMO_USERS[0];
      setActiveUser(user);
      setDismissedRecIds([]);

      // Profile
      const storedProfile = localStorage.getItem(`use_it_first_${userId}_profile`);
      if (storedProfile) {
        setUserProfile(JSON.parse(storedProfile));
      } else {
        const defaultProfile = DEMO_PROFILES[userId] || DEMO_PROFILES['demo-user-001'];
        setUserProfile(defaultProfile);
        localStorage.setItem(`use_it_first_${userId}_profile`, JSON.stringify(defaultProfile));
      }

      // Items
      const storedItems = localStorage.getItem(`use_it_first_${userId}_items`);
      if (storedItems) {
        setItems(JSON.parse(storedItems));
      } else {
        const initial = userId === 'demo-user-001' ? USER_001_INITIAL_ITEMS : USER_002_INITIAL_ITEMS;
        setItems(initial);
        localStorage.setItem(`use_it_first_${userId}_items`, JSON.stringify(initial));
      }

      // Groceries
      const storedGroceries = localStorage.getItem(`use_it_first_${userId}_groceries`);
      if (storedGroceries) {
        setGroceryItems(JSON.parse(storedGroceries));
      } else {
        const initial = userId === 'demo-user-001' ? USER_001_INITIAL_GROCERIES : USER_002_INITIAL_GROCERIES;
        setGroceryItems(initial);
        localStorage.setItem(`use_it_first_${userId}_groceries`, JSON.stringify(initial));
      }

      // Events
      const storedEvents = localStorage.getItem(`use_it_first_${userId}_events`);
      if (storedEvents) {
        setUsageEvents(JSON.parse(storedEvents));
      } else {
        const initial = userId === 'demo-user-001' ? USER_001_USAGE_EVENTS : [];
        setUsageEvents(initial);
        localStorage.setItem(`use_it_first_${userId}_events`, JSON.stringify(initial));
      }

      // Purchase History
      const storedHistory = localStorage.getItem(`use_it_first_${userId}_history`);
      if (storedHistory) {
        setPurchaseHistory(JSON.parse(storedHistory));
      } else {
        const initial = userId === 'demo-user-001' ? USER_001_PURCHASE_HISTORY : USER_002_PURCHASE_HISTORY;
        setPurchaseHistory(initial);
        localStorage.setItem(`use_it_first_${userId}_history`, JSON.stringify(initial));
      }

      // Purchase Stats
      const storedStats = localStorage.getItem(`use_it_first_${userId}_stats`);
      if (storedStats) {
        setPurchaseStats(JSON.parse(storedStats));
      } else {
        const initial = userId === 'demo-user-001' ? USER_001_PURCHASE_STATS : USER_002_PURCHASE_STATS;
        setPurchaseStats(initial);
        localStorage.setItem(`use_it_first_${userId}_stats`, JSON.stringify(initial));
      }
    } catch (e) {
      console.error('Error loading scoped user data:', e);
    }
  }, []);

  // Initial mount: check active user ID in localStorage and load
  useEffect(() => {
    try {
      const storedActiveId = localStorage.getItem('use_it_first_active_user_id') || 'demo-user-001';
      loadUserData(storedActiveId);
      setIsHydrated(true);
    } catch (e) {
      console.error('Error hydrating store:', e);
      setIsHydrated(true);
    }
  }, [loadUserData]);

  // Switch User handler
  const switchUser = (userId: string) => {
    localStorage.setItem('use_it_first_active_user_id', userId);
    loadUserData(userId);
  };

  // State persistence helpers for active user
  const saveItems = (newItems: FoodItem[]) => {
    setItems(newItems);
    localStorage.setItem(getKey('items'), JSON.stringify(newItems));
  };

  const saveGroceries = (newGroceries: GroceryItem[]) => {
    setGroceryItems(newGroceries);
    localStorage.setItem(getKey('groceries'), JSON.stringify(newGroceries));
  };

  const saveEvents = (newEvents: UsageEvent[]) => {
    setUsageEvents(newEvents);
    localStorage.setItem(getKey('events'), JSON.stringify(newEvents));
  };

  const saveHistory = (newHistory: PurchaseHistoryItem[]) => {
    setPurchaseHistory(newHistory);
    localStorage.setItem(getKey('history'), JSON.stringify(newHistory));
  };

  const saveStats = (newStats: FoodPurchaseStats[]) => {
    setPurchaseStats(newStats);
    localStorage.setItem(getKey('stats'), JSON.stringify(newStats));
  };

  // =========================================================================
  // PANTRY ACTIONS
  // =========================================================================

  const getItemAssessment = (item: FoodItem): PriorityAssessment => {
    return assessPriority(item);
  };

  const addItem = (itemData: Omit<FoodItem, 'id' | 'createdAt' | 'updatedAt'>): FoodItem => {
    // Attempt canonical catalog match
    const matched = matchFoodLibrary(itemData.name, FOOD_LIBRARY_CATALOG);

    const newItem: FoodItem = {
      ...itemData,
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      foodId: itemData.foodId || matched?.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newItem, ...items];
    saveItems(updated);
    return newItem;
  };

  const updateItem = (id: string, updates: Partial<Omit<FoodItem, 'id' | 'createdAt'>>) => {
    const updated = items.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });
    saveItems(updated);
  };

  const deleteItem = (id: string) => {
    const updated = items.filter((item) => item.id !== id);
    saveItems(updated);
  };

  const markIngredientsUsed = (
    usedItems: { name: string; amountUsed: number; unit: string; recipeId?: string; recipeName?: string; foodId?: string }[]
  ): { rescuedCount: number; rescuedValue: number; rescuedWeightKg: number } => {
    let remainingItems = [...items];
    const newEvents: UsageEvent[] = [];
    let rescuedCount = 0;
    let rescuedValue = 0;
    let rescuedWeightGrams = 0;

    usedItems.forEach((u) => {
      const matchedLibrary = matchFoodLibrary(u.name, FOOD_LIBRARY_CATALOG);
      const targetFoodId = u.foodId || matchedLibrary?.id;
      const targetNorm = normalizeFoodName(u.name);
      const neededUnit = normalizeUnit(u.unit);
      let neededQty = typeof u.amountUsed === 'number' && !isNaN(u.amountUsed) && u.amountUsed > 0 ? u.amountUsed : 1;

      // Find matching items in pantry (exact foodId match or exact normalized name)
      const matchingIndices: number[] = [];
      remainingItems.forEach((item, index) => {
        if (targetFoodId && item.foodId && item.foodId === targetFoodId) {
          matchingIndices.push(index);
        } else if (normalizeFoodName(item.name) === targetNorm) {
          matchingIndices.push(index);
        }
      });

      // Fallback: If no exact match, loose match if name contains
      if (matchingIndices.length === 0) {
        remainingItems.forEach((item, index) => {
          const itemNorm = normalizeFoodName(item.name);
          if (itemNorm.includes(targetNorm) || targetNorm.includes(itemNorm)) {
            matchingIndices.push(index);
          }
        });
      }

      if (matchingIndices.length === 0) return;

      // Extract matching lots and sort by earliest expiry first (FIFO)
      const lotsWithIndex = matchingIndices.map((idx) => ({
        idx,
        item: remainingItems[idx],
      }));

      lotsWithIndex.sort((a, b) => {
        // Earlier bestBefore date first
        if (a.item.bestBefore && b.item.bestBefore) {
          return a.item.bestBefore.localeCompare(b.item.bestBefore);
        }
        if (a.item.bestBefore && !b.item.bestBefore) return -1;
        if (!a.item.bestBefore && b.item.bestBefore) return 1;
        // Opened package first
        if (a.item.opened && !b.item.opened) return -1;
        if (!a.item.opened && b.item.opened) return 1;
        // Earlier created first
        return a.item.createdAt.localeCompare(b.item.createdAt);
      });

      let actuallyConsumedInNeededUnit = 0;
      let primaryMatchedItem: FoodItem | null = null;
      let wasPriority = false;

      for (const { item } of lotsWithIndex) {
        if (neededQty <= 0) break;
        if (!primaryMatchedItem) primaryMatchedItem = item;

        const assessment = getItemAssessment(item);
        if (assessment.tier === 'USE_FIRST' || assessment.tier === 'USE_SOON' || assessment.tier === 'EXPIRED') {
          wasPriority = true;
        }

        const lotUnit = normalizeUnit(item.unit);
        const convertedLotQty = convertQuantity(item.quantity, lotUnit, neededUnit);
        const lotQtyInNeededUnit = convertedLotQty !== null ? convertedLotQty : item.quantity;

        // How much can this lot satisfy?
        const takeFromThisLotInNeededUnit = Math.min(lotQtyInNeededUnit, neededQty);
        actuallyConsumedInNeededUnit += takeFromThisLotInNeededUnit;
        neededQty -= takeFromThisLotInNeededUnit;

        // Convert back to lot's own unit to update the lot
        const convertedDeduct = convertQuantity(takeFromThisLotInNeededUnit, neededUnit, lotUnit);
        const deductFromLot = convertedDeduct !== null ? convertedDeduct : takeFromThisLotInNeededUnit;

        const newLotQty = Number((item.quantity - deductFromLot).toFixed(2));
        if (newLotQty <= 0) {
          // Lot depleted completely -> remove
          remainingItems = remainingItems.filter((i) => i.id !== item.id);
        } else {
          // Update lot
          remainingItems = remainingItems.map((i) =>
            i.id === item.id ? { ...i, quantity: newLotQty, updatedAt: new Date().toISOString() } : i
          );
        }
      }

      if (actuallyConsumedInNeededUnit > 0 && primaryMatchedItem) {
        let weightGrams = 150;
        if (neededUnit === 'g') {
          weightGrams = actuallyConsumedInNeededUnit;
        } else if (neededUnit === 'kg') {
          weightGrams = actuallyConsumedInNeededUnit * 1000;
        } else if (neededUnit === 'L') {
          weightGrams = actuallyConsumedInNeededUnit * 1000;
        } else if (neededUnit === 'ml') {
          weightGrams = actuallyConsumedInNeededUnit;
        }

        let valINR = 40;
        const lowName = primaryMatchedItem.name.toLowerCase();
        if (lowName.includes('paneer')) valINR = 90;
        else if (lowName.includes('milk')) valINR = 35;
        else if (lowName.includes('spinach')) valINR = 30;
        else if (lowName.includes('tomato')) valINR = 25;
        else if (lowName.includes('dal') || lowName.includes('rice')) valINR = 45;

        rescuedCount++;
        rescuedValue += valINR;
        rescuedWeightGrams += weightGrams;

        newEvents.push({
          id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          foodItemId: primaryMatchedItem.id,
          foodName: primaryMatchedItem.name,
          recipeId: u.recipeId,
          recipeName: u.recipeName,
          quantityUsed: actuallyConsumedInNeededUnit,
          unit: neededUnit,
          usedAt: new Date().toISOString(),
          estimatedWeightGrams: weightGrams,
          estimatedValueINR: valINR,
          wasPriorityItem: wasPriority,
        });
      }
    });

    saveItems(remainingItems);
    saveEvents([...newEvents, ...usageEvents]);

    return {
      rescuedCount,
      rescuedValue,
      rescuedWeightKg: Number((rescuedWeightGrams / 1000).toFixed(2)),
    };
  };

  // =========================================================================
  // GROCERY & PURCHASE ACTIONS
  // =========================================================================

  const addGroceryItem = (itemData: Omit<GroceryItem, 'id' | 'addedAt' | 'checked'>): GroceryItem => {
    const matched = matchFoodLibrary(itemData.name, FOOD_LIBRARY_CATALOG);
    const targetFoodId = itemData.foodId || matched?.id;
    const targetNorm = normalizeFoodName(itemData.name);
    const qtyToAdd = typeof itemData.quantity === 'number' && !isNaN(itemData.quantity) && itemData.quantity > 0 ? itemData.quantity : 1;
    const unitToAdd = normalizeUnit(itemData.unit);

    // Prevent duplicate chaos: Check if an unpurchased item with same canonical food exists
    const existingIndex = groceryItems.findIndex((g) => {
      if (g.checked) return false;
      if (targetFoodId && g.foodId) {
        return g.foodId === targetFoodId;
      }
      return normalizeFoodName(g.name) === targetNorm;
    });

    if (existingIndex !== -1) {
      const existing = groceryItems[existingIndex];
      const combined = combineQuantities(existing.quantity || 1, existing.unit || 'pcs', qtyToAdd, unitToAdd);

      if (combined && combined.compatible) {
        const updatedItem: GroceryItem = {
          ...existing,
          quantity: combined.quantity,
          unit: combined.unit,
          notes: itemData.notes
            ? existing.notes && !existing.notes.includes(itemData.notes)
              ? `${existing.notes} • ${itemData.notes}`
              : existing.notes || itemData.notes
            : existing.notes,
        };
        (updatedItem as unknown as { wasMerged?: boolean }).wasMerged = true;
        const updatedList = [...groceryItems];
        updatedList[existingIndex] = updatedItem;
        saveGroceries(updatedList);
        return updatedItem;
      }
    }

    const newItem: GroceryItem = {
      ...itemData,
      id: `groc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      foodId: targetFoodId,
      category: itemData.category || (matched?.category as FoodCategory) || 'Produce',
      quantity: qtyToAdd,
      unit: unitToAdd,
      checked: false,
      addedAt: new Date().toISOString(),
    };

    saveGroceries([newItem, ...groceryItems]);
    return newItem;
  };

  const addMissingIngredientsToGrocery = (
    recipe: { id: string; name: string },
    missingIngredients: { name: string; amount: string; category?: FoodCategory; foodId?: string }[]
  ): { addedCount: number; existingCount: number } => {
    let addedCount = 0;
    let existingCount = 0;

    missingIngredients.forEach((missing) => {
      const parsed = parseQuantityAndUnit(missing.amount);
      const qty = parsed.quantity > 0 ? parsed.quantity : 1;
      const unit = parsed.unit || 'pcs';

      let cat: FoodCategory = missing.category || 'Produce';
      const lowerName = missing.name.toLowerCase();
      if (lowerName.includes('milk') || lowerName.includes('paneer') || lowerName.includes('cream') || lowerName.includes('yogurt') || lowerName.includes('butter') || lowerName.includes('egg')) {
        cat = 'Dairy & Eggs';
      } else if (lowerName.includes('pasta') || lowerName.includes('rice') || lowerName.includes('dal') || lowerName.includes('flour') || lowerName.includes('lentil')) {
        cat = 'Pantry & Grains';
      } else if (lowerName.includes('masala') || lowerName.includes('cumin') || lowerName.includes('turmeric') || lowerName.includes('salt') || lowerName.includes('pepper') || lowerName.includes('oil') || lowerName.includes('spice')) {
        cat = 'Spices & Condiments';
      } else if (lowerName.includes('bread')) {
        cat = 'Bakery';
      }

      const result = addGroceryItem({
        name: missing.name,
        foodId: missing.foodId,
        quantity: qty,
        unit: unit,
        category: cat,
        source: 'recipe',
        recipeId: recipe.id,
        recipeName: recipe.name,
        notes: `Needed for ${recipe.name}`,
      });

      if ((result as unknown as { wasMerged?: boolean }).wasMerged) {
        existingCount++;
      } else {
        addedCount++;
      }
    });

    return { addedCount, existingCount };
  };

  const addRecommendationToGrocery = (rec: GroceryRecommendation) => {
    // Check if already in active grocery list
    const alreadyListed = groceryItems.some(
      (g) => !g.checked && (g.foodId === rec.foodId || g.name.toLowerCase() === rec.name.toLowerCase())
    );

    if (alreadyListed) return;

    const newItem: GroceryItem = {
      id: `groc-rec-${Date.now()}`,
      foodId: rec.foodId,
      name: rec.name,
      quantity: rec.suggestedQuantity,
      unit: rec.suggestedUnit,
      category: (rec.category as FoodCategory) || 'Pantry & Grains',
      checked: false,
      source: 'recommendation',
      addedAt: new Date().toISOString(),
      notes: rec.explanation,
    };

    saveGroceries([newItem, ...groceryItems]);
  };

  // Ticking an item records purchase history, recalculates purchase stats, and transfers/merges to pantry
  const toggleGroceryItem = (
    id: string
  ): {
    duplicateDetected?: DuplicateResolutionData;
    addedToPantry?: boolean;
    merged?: boolean;
    separateBatch?: boolean;
    pantryItemName?: string;
    newTotal?: number;
    unit?: string;
  } => {
    const target = groceryItems.find((g) => g.id === id);
    if (!target) return {};

    const willBeChecked = !target.checked;

    if (willBeChecked) {
      // Guard against rapid duplicate clicks
      if (target.checked) return {};

      // Match canonical food
      const matched = target.foodId ? null : matchFoodLibrary(target.name, FOOD_LIBRARY_CATALOG);
      const foodId = target.foodId || matched?.id || `food-${normalizeFoodName(target.name).replace(/\s+/g, '-')}`;
      const targetNorm = normalizeFoodName(target.name);
      const qtyToAdd = typeof target.quantity === 'number' && !isNaN(target.quantity) && target.quantity > 0 ? target.quantity : 1;
      const unitToAdd = normalizeUnit(target.unit);

      // 1. Strict canonical check for existing pantry item
      const existingMatch = items.find((i) => {
        if (i.foodId && foodId && i.foodId === foodId) return true;
        if (normalizeFoodName(i.name) === targetNorm) return true;
        return false;
      });

      let pantryItemId = '';
      let isMerged = false;
      let isSeparate = false;
      let finalQuantity = qtyToAdd;
      let finalUnit = unitToAdd;
      let finalName = target.name;

      if (existingMatch) {
        // Attempt unit combination
        const combined = combineQuantities(existingMatch.quantity, existingMatch.unit, qtyToAdd, unitToAdd);

        if (combined && combined.compatible) {
          // Automatic clean merge into existing pantry stock, preserving metadata
          isMerged = true;
          finalQuantity = combined.quantity;
          finalUnit = combined.unit;
          finalName = existingMatch.name;
          pantryItemId = existingMatch.id;

          const updatedNotes = existingMatch.notes
            ? `${existingMatch.notes} • Restocked ${qtyToAdd} ${unitToAdd}`
            : `Restocked ${qtyToAdd} ${unitToAdd}`;

          updateItem(existingMatch.id, {
            quantity: finalQuantity,
            unit: finalUnit,
            notes: updatedNotes,
          });
        } else {
          // Incompatible units (e.g. 1 L + 2 kg or 500 g + 2 packs):
          // Preserve as separate batch/lot without corrupting existing item
          isSeparate = true;
          const newPantry = addItem({
            foodId,
            name: target.name,
            category: (target.category as FoodCategory) || existingMatch.category,
            quantity: qtyToAdd,
            unit: unitToAdd,
            storageLocation: existingMatch.storageLocation || 'Fridge',
            opened: false,
            purchaseDate: new Date().toISOString().split('T')[0],
            notes: target.source === 'recipe' ? `Purchased for ${target.recipeName}` : 'Purchased from grocery list (separate batch)',
          });
          pantryItemId = newPantry.id;
        }
      } else {
        // No existing pantry item -> create new pantry item with reasonable defaults
        let storage: StorageLocation = 'Cupboard / Pantry';
        if (target.category === 'Produce' || target.category === 'Dairy & Eggs' || target.category === 'Meat & Protein') {
          storage = 'Fridge';
        } else if (target.category === 'Frozen') {
          storage = 'Freezer';
        }

        const newPantry = addItem({
          foodId,
          name: target.name,
          category: (target.category as FoodCategory) || 'Produce',
          quantity: qtyToAdd,
          unit: unitToAdd,
          storageLocation: storage,
          opened: false,
          purchaseDate: new Date().toISOString().split('T')[0],
          notes: target.source === 'recipe' ? `Purchased for ${target.recipeName}` : 'Purchased from grocery list',
        });
        pantryItemId = newPantry.id;
      }

      // 2. Mark grocery item checked
      const updatedGroceries = groceryItems.map((g) =>
        g.id === id ? { ...g, checked: true, checkedAt: new Date().toISOString(), pantryItemId } : g
      );
      saveGroceries(updatedGroceries);

      // 3. Record purchase history (idempotent check by groceryItemId)
      const alreadyInHistory = purchaseHistory.some((ph) => ph.groceryItemId === target.id);
      if (!alreadyInHistory) {
        const historyItem: PurchaseHistoryItem = {
          id: `ph-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          userId: activeUser.id,
          foodId,
          name: target.name,
          quantity: qtyToAdd,
          unit: unitToAdd,
          category: target.category,
          purchasedAt: new Date().toISOString(),
          source: target.source === 'recipe' ? 'recipe' : 'grocery-list',
          groceryItemId: target.id,
        };

        const newHistory = [historyItem, ...purchaseHistory];
        saveHistory(newHistory);

        // 4. Recalculate purchase stats
        const newStats = recordPurchaseAndRecalculateStats(purchaseStats, historyItem);
        saveStats(newStats);
      }

      return {
        addedToPantry: true,
        merged: isMerged,
        separateBatch: isSeparate,
        pantryItemName: finalName,
        newTotal: finalQuantity,
        unit: finalUnit,
      };
    } else {
      // Uncheck grocery item
      const updatedGroceries = groceryItems.map((g) =>
        g.id === id ? { ...g, checked: false, checkedAt: undefined } : g
      );
      saveGroceries(updatedGroceries);
      return {};
    }
  };

  const resolveDuplicate = (
    data: DuplicateResolutionData,
    choice: 'merge' | 'separate'
  ): { message: string } => {
    const { groceryItem, existingPantryItem } = data;
    const qtyToAdd = groceryItem.quantity || 1;
    const unitToAdd = normalizeUnit(groceryItem.unit);

    if (choice === 'merge') {
      const combined = combineQuantities(existingPantryItem.quantity, existingPantryItem.unit, qtyToAdd, unitToAdd);
      const updatedQty = combined ? combined.quantity : Number((existingPantryItem.quantity + qtyToAdd).toFixed(1));
      const updatedUnit = combined ? combined.unit : existingPantryItem.unit;

      updateItem(existingPantryItem.id, {
        quantity: updatedQty,
        unit: updatedUnit,
        notes: (existingPantryItem.notes ? existingPantryItem.notes + ' • ' : '') + `Added ${qtyToAdd} ${unitToAdd} from groceries`,
      });

      const updatedGroceries = groceryItems.map((g) =>
        g.id === groceryItem.id ? { ...g, checked: true, checkedAt: new Date().toISOString(), pantryItemId: existingPantryItem.id } : g
      );
      saveGroceries(updatedGroceries);

      return { message: `${existingPantryItem.name} quantity updated to ${updatedQty} ${updatedUnit}.` };
    } else {
      let storage: StorageLocation = existingPantryItem.storageLocation || 'Fridge';
      const newPantry = addItem({
        foodId: existingPantryItem.foodId || groceryItem.foodId,
        name: groceryItem.name,
        category: (groceryItem.category as FoodCategory) || existingPantryItem.category,
        quantity: qtyToAdd,
        unit: unitToAdd,
        storageLocation: storage,
        opened: false,
        purchaseDate: new Date().toISOString().split('T')[0],
        notes: 'Purchased from grocery list (separate batch)',
      });

      const updatedGroceries = groceryItems.map((g) =>
        g.id === groceryItem.id ? { ...g, checked: true, checkedAt: new Date().toISOString(), pantryItemId: newPantry.id } : g
      );
      saveGroceries(updatedGroceries);

      return { message: `Added ${groceryItem.name} as a new separate batch in pantry.` };
    }
  };

  const deleteGroceryItem = (id: string) => {
    const updated = groceryItems.filter((g) => g.id !== id);
    saveGroceries(updated);
  };

  const clearPurchasedGroceries = () => {
    const updated = groceryItems.filter((g) => !g.checked);
    saveGroceries(updated);
  };

  const addPantryItemToGrocery = (item: FoodItem) => {
    const existing = groceryItems.find(
      (g) => !g.checked && (g.name.toLowerCase() === item.name.toLowerCase() || (item.foodId && g.foodId === item.foodId))
    );

    if (!existing) {
      addGroceryItem({
        foodId: item.foodId,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        source: 'pantry_restock',
        notes: `Restock needed (${item.storageLocation})`,
      });
    }
  };

  // User Profile Updates
  const updateUserProfile = (updates: Partial<UserProfile>) => {
    const updated: UserProfile = {
      ...userProfile,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    setUserProfile(updated);
    localStorage.setItem(`use_it_first_${activeUser.id}_profile`, JSON.stringify(updated));
  };

  const dismissRecommendation = (foodId: string) => {
    setDismissedRecIds((prev) => (prev.includes(foodId) ? prev : [...prev, foodId]));
  };

  const dontSuggestFood = (foodId: string) => {
    const currentHidden = userProfile.hiddenFoodIds || [];
    const currentDisliked = userProfile.dislikedFoods || [];
    const updated: UserProfile = {
      ...userProfile,
      hiddenFoodIds: Array.from(new Set([...currentHidden, foodId])),
      dislikedFoods: Array.from(new Set([...currentDisliked, foodId])),
      updatedAt: new Date().toISOString(),
    };
    setUserProfile(updated);
    localStorage.setItem(`use_it_first_${activeUser.id}_profile`, JSON.stringify(updated));
    dismissRecommendation(foodId);
  };

  const allowSuggestFood = (foodId: string) => {
    const updated: UserProfile = {
      ...userProfile,
      hiddenFoodIds: (userProfile.hiddenFoodIds || []).filter((id) => id !== foodId),
      dislikedFoods: (userProfile.dislikedFoods || []).filter((id) => id !== foodId),
      updatedAt: new Date().toISOString(),
    };
    setUserProfile(updated);
    localStorage.setItem(`use_it_first_${activeUser.id}_profile`, JSON.stringify(updated));
  };

  // Contextual grocery collections
  const recentlyBought = useMemo(() => {
    const seen = new Set<string>();
    const list: PurchaseHistoryItem[] = [];
    const sorted = [...purchaseHistory].sort(
      (a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
    );
    for (const item of sorted) {
      if (!seen.has(item.foodId)) {
        seen.add(item.foodId);
        list.push(item);
      }
    }
    return list.slice(0, 12);
  }, [purchaseHistory]);

  const frequentlyBought = useMemo(() => {
    return [...purchaseStats]
      .filter((s) => s.purchaseCount >= 2)
      .sort((a, b) => b.purchaseCount - a.purchaseCount)
      .slice(0, 12);
  }, [purchaseStats]);

  const dueSoon = useMemo(() => {
    const now = Date.now();
    return purchaseStats
      .filter((s) => {
        if (!s.lastPurchasedAt || !s.averageDaysBetweenPurchases) return false;
        const daysSince = (now - new Date(s.lastPurchasedAt).getTime()) / (1000 * 60 * 60 * 24);
        return daysSince >= s.averageDaysBetweenPurchases * 0.75;
      })
      .sort((a, b) => {
        const daysA = (now - new Date(a.lastPurchasedAt!).getTime()) / (1000 * 60 * 60 * 24);
        const daysB = (now - new Date(b.lastPurchasedAt!).getTime()) / (1000 * 60 * 60 * 24);
        const ratioA = daysA / a.averageDaysBetweenPurchases!;
        const ratioB = daysB / b.averageDaysBetweenPurchases!;
        return ratioB - ratioA;
      })
      .slice(0, 8);
  }, [purchaseStats]);

  // =========================================================================
  // RECOMMENDATIONS ENGINE COMPUTATION
  // =========================================================================

  const recommendations = useMemo(() => {
    if (!isHydrated) return [];
    return getGroceryRecommendations({
      userId: activeUser.id,
      pantryItems: items,
      groceryItems,
      purchaseStats,
      purchaseHistory,
      userProfile,
      activeRecipes: RECIPES_DATA,
      foodCatalog: FOOD_LIBRARY_CATALOG,
      dismissedFoodIds: dismissedRecIds,
    });
  }, [activeUser.id, items, groceryItems, purchaseStats, purchaseHistory, userProfile, dismissedRecIds, isHydrated]);

  const impactMetrics: ImpactMetrics = useMemo(() => {
    const totalItems = usageEvents.length;
    const priorityItems = usageEvents.filter((e) => e.wasPriorityItem).length;
    const totalGrams = usageEvents.reduce((acc, curr) => acc + curr.estimatedWeightGrams, 0);
    const totalValue = usageEvents.reduce((acc, curr) => acc + curr.estimatedValueINR, 0);
    const uniqueMeals = new Set(usageEvents.filter((e) => e.recipeId).map((e) => e.recipeId)).size;

    return {
      itemsUsedBeforePriority: priorityItems || totalItems,
      estimatedFoodRescuedKg: Number((totalGrams / 1000).toFixed(1)),
      estimatedFoodValueINR: Math.round(totalValue),
      mealsMadeFromPantry: uniqueMeals > 0 ? uniqueMeals + 4 : 0,
    };
  }, [usageEvents]);

  // Reset/Clear for active user
  const resetToDemoData = () => {
    const initialItems = activeUser.id === 'demo-user-001' ? USER_001_INITIAL_ITEMS : USER_002_INITIAL_ITEMS;
    const initialGroceries = activeUser.id === 'demo-user-001' ? USER_001_INITIAL_GROCERIES : USER_002_INITIAL_GROCERIES;
    const initialHistory = activeUser.id === 'demo-user-001' ? USER_001_PURCHASE_HISTORY : USER_002_PURCHASE_HISTORY;
    const initialStats = activeUser.id === 'demo-user-001' ? USER_001_PURCHASE_STATS : USER_002_PURCHASE_STATS;
    const initialEvents = activeUser.id === 'demo-user-001' ? USER_001_USAGE_EVENTS : [];

    saveItems(initialItems);
    saveGroceries(initialGroceries);
    saveHistory(initialHistory);
    saveStats(initialStats);
    saveEvents(initialEvents);
  };

  const clearAllData = () => {
    saveItems([]);
    saveGroceries([]);
    saveHistory([]);
    saveStats([]);
    saveEvents([]);
  };

  return (
    <PantryContext.Provider
      value={{
        activeUser,
        userProfile,
        availableUsers: DEMO_USERS,
        switchUser,
        items,
        groceryItems,
        usageEvents,
        impactMetrics,
        addItem,
        updateItem,
        deleteItem,
        markIngredientsUsed,
        addGroceryItem,
        addMissingIngredientsToGrocery,
        toggleGroceryItem,
        resolveDuplicate,
        deleteGroceryItem,
        clearPurchasedGroceries,
        addPantryItemToGrocery,
        recommendations,
        purchaseHistory,
        purchaseStats,
        recentlyBought,
        frequentlyBought,
        dueSoon,
        addRecommendationToGrocery,
        dismissRecommendation,
        dontSuggestFood,
        allowSuggestFood,
        updateUserProfile,
        resetToDemoData,
        clearAllData,
        getItemAssessment,
        isHydrated,
      }}
    >
      {children}
    </PantryContext.Provider>
  );
};

export const usePantry = () => {
  const context = useContext(PantryContext);
  if (!context) {
    throw new Error('usePantry must be used within a PantryProvider');
  }
  return context;
};
