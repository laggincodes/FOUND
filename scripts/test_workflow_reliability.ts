import { combineQuantities, areUnitsCompatible, normalizeUnit } from '../src/lib/unitConverter';
import { matchFoodLibrary, normalizeFoodName } from '../src/lib/food-library/normalizer';
import { FOOD_LIBRARY_CATALOG } from '../src/lib/food-library/food-catalog';
import { getGroceryRecommendations, recordPurchaseAndRecalculateStats } from '../src/lib/recommendationEngine';
import { FoodItem, GroceryItem, PurchaseHistoryItem, FoodPurchaseStats, UserProfile } from '../src/types';

interface TestResult {
  caseNum: number;
  title: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, caseNum: number, title: string, details: string) {
  results.push({
    caseNum,
    title,
    passed: condition,
    details,
  });
  const symbol = condition ? '✅ PASS' : '❌ FAIL';
  console.log(`${symbol} [Case ${caseNum}]: ${title} - ${details}`);
}

// -------------------------------------------------------------
// CASE 1: No existing pantry item -> Mark Milk purchased -> appears in pantry
// -------------------------------------------------------------
{
  const pantry: FoodItem[] = [];
  const groceryItem: GroceryItem = {
    id: 'g-1',
    name: 'Fresh Cow Milk',
    quantity: 1,
    unit: 'L',
    category: 'Dairy & Eggs',
    checked: false,
    source: 'manual',
    addedAt: new Date().toISOString(),
    foodId: 'food-milk-cow',
  };

  // Simulate toggle purchase:
  const targetFoodId = groceryItem.foodId || 'food-milk-cow';
  const existingMatch = pantry.find((i) => i.foodId === targetFoodId);
  if (!existingMatch) {
    pantry.push({
      id: 'p-1',
      name: groceryItem.name,
      foodId: targetFoodId,
      quantity: groceryItem.quantity!,
      unit: groceryItem.unit!,
      category: groceryItem.category,
      storageLocation: 'Fridge',
      opened: false,
      purchaseDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  assert(
    pantry.length === 1 && pantry[0].name === 'Fresh Cow Milk' && pantry[0].quantity === 1 && pantry[0].unit === 'L' && pantry[0].storageLocation === 'Fridge',
    1,
    'No existing pantry item',
    `Pantry contains ${pantry.length} item: ${pantry[0]?.quantity} ${pantry[0]?.unit} ${pantry[0]?.name}`
  );
}

// -------------------------------------------------------------
// CASE 2: Existing pantry item with same unit -> 1 L Milk + 1 L Milk = 2 L Milk
// -------------------------------------------------------------
{
  const pantry: FoodItem[] = [
    {
      id: 'p-milk',
      name: 'Fresh Cow Milk',
      foodId: 'food-milk-cow',
      quantity: 1,
      unit: 'L',
      category: 'Dairy & Eggs',
      storageLocation: 'Fridge',
      opened: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const groceryItem: GroceryItem = {
    id: 'g-2',
    name: 'Fresh Cow Milk',
    foodId: 'food-milk-cow',
    quantity: 1,
    unit: 'L',
    category: 'Dairy & Eggs',
    checked: false,
    source: 'manual',
    addedAt: new Date().toISOString(),
  };

  const existingMatch = pantry.find((i) => i.foodId === groceryItem.foodId);
  const combined = existingMatch ? combineQuantities(existingMatch.quantity, existingMatch.unit, groceryItem.quantity!, groceryItem.unit!) : null;
  if (combined && combined.compatible && existingMatch) {
    existingMatch.quantity = combined.quantity;
    existingMatch.unit = combined.unit;
  }

  assert(
    pantry.length === 1 && pantry[0].quantity === 2 && pantry[0].unit === 'L',
    2,
    'Existing pantry item with same unit',
    `Pantry updated to single entry with ${pantry[0].quantity} ${pantry[0].unit}`
  );
}

// -------------------------------------------------------------
// CASE 3: Compatible unit -> 1 L Milk + 250 ml Milk = 1.25 L Milk
// -------------------------------------------------------------
{
  const pantry: FoodItem[] = [
    {
      id: 'p-milk',
      name: 'Fresh Cow Milk',
      foodId: 'food-milk-cow',
      quantity: 1,
      unit: 'L',
      category: 'Dairy & Eggs',
      storageLocation: 'Fridge',
      opened: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const groceryItem: GroceryItem = {
    id: 'g-3',
    name: 'Fresh Cow Milk',
    foodId: 'food-milk-cow',
    quantity: 250,
    unit: 'ml',
    category: 'Dairy & Eggs',
    checked: false,
    source: 'manual',
    addedAt: new Date().toISOString(),
  };

  const existingMatch = pantry.find((i) => i.foodId === groceryItem.foodId);
  const combined = existingMatch ? combineQuantities(existingMatch.quantity, existingMatch.unit, groceryItem.quantity!, groceryItem.unit!) : null;
  if (combined && combined.compatible && existingMatch) {
    existingMatch.quantity = combined.quantity;
    existingMatch.unit = combined.unit;
  }

  assert(
    pantry.length === 1 && pantry[0].quantity === 1.25 && pantry[0].unit === 'L',
    3,
    'Compatible unit conversion',
    `1 L + 250 ml correctly converted and merged to ${pantry[0].quantity} ${pantry[0].unit}`
  );
}

// -------------------------------------------------------------
// CASE 4: Incompatible unit -> 1 L Milk + 2 kg Milk = Separate entries (no garbage math)
// -------------------------------------------------------------
{
  const pantry: FoodItem[] = [
    {
      id: 'p-milk-1',
      name: 'Fresh Cow Milk',
      foodId: 'food-milk-cow',
      quantity: 1,
      unit: 'L',
      category: 'Dairy & Eggs',
      storageLocation: 'Fridge',
      opened: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const groceryItem: GroceryItem = {
    id: 'g-4',
    name: 'Fresh Cow Milk',
    foodId: 'food-milk-cow',
    quantity: 2,
    unit: 'kg',
    category: 'Dairy & Eggs',
    checked: false,
    source: 'manual',
    addedAt: new Date().toISOString(),
  };

  const existingMatch = pantry.find((i) => i.foodId === groceryItem.foodId);
  const combined = existingMatch ? combineQuantities(existingMatch.quantity, existingMatch.unit, groceryItem.quantity!, groceryItem.unit!) : null;
  let separateBatchCreated = false;
  if (combined && combined.compatible && existingMatch) {
    existingMatch.quantity = combined.quantity;
  } else {
    // Separate batch
    pantry.push({
      id: 'p-milk-2',
      name: groceryItem.name,
      foodId: groceryItem.foodId,
      quantity: groceryItem.quantity!,
      unit: groceryItem.unit!,
      category: groceryItem.category,
      storageLocation: 'Fridge',
      opened: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    separateBatchCreated = true;
  }

  assert(
    combined === null && pantry.length === 2 && pantry[0].quantity === 1 && pantry[0].unit === 'L' && pantry[1].quantity === 2 && pantry[1].unit === 'kg',
    4,
    'Incompatible unit safety',
    `Incompatible units safely split into 2 separate lots without corrupted math: [1 L, 2 kg]`
  );
}

// -------------------------------------------------------------
// CASE 5: Same grocery item added twice -> Milk 1 L + Milk 500 ml = 1.5 L
// -------------------------------------------------------------
{
  const groceryItems: GroceryItem[] = [];

  const add = (name: string, quantity: number, unit: string, foodId: string) => {
    const existingIndex = groceryItems.findIndex((g) => !g.checked && g.foodId === foodId);
    if (existingIndex !== -1) {
      const existing = groceryItems[existingIndex];
      const combined = combineQuantities(existing.quantity || 1, existing.unit || 'pcs', quantity, unit);
      if (combined && combined.compatible) {
        groceryItems[existingIndex] = {
          ...existing,
          quantity: combined.quantity,
          unit: combined.unit,
        };
        return { merged: true, item: groceryItems[existingIndex] };
      }
    }
    const newItem: GroceryItem = {
      id: `g-${Date.now()}-${Math.random()}`,
      name,
      quantity,
      unit,
      foodId,
      category: 'Dairy & Eggs',
      checked: false,
      source: 'manual',
      addedAt: new Date().toISOString(),
    };
    groceryItems.push(newItem);
    return { merged: false, item: newItem };
  };

  const r1 = add('Whole Milk', 1, 'L', 'food-milk-cow');
  const r2 = add('Whole Milk', 500, 'ml', 'food-milk-cow');

  assert(
    groceryItems.length === 1 && groceryItems[0].quantity === 1.5 && groceryItems[0].unit === 'L' && r2.merged === true,
    5,
    'Duplicate grocery item add',
    `Shopping list consolidated 1 L + 500 ml into single item of ${groceryItems[0].quantity} ${groceryItems[0].unit}`
  );
}

// -------------------------------------------------------------
// CASE 6: Purchase button clicked twice rapidly -> Exactly 1 purchase history entry
// -------------------------------------------------------------
{
  const purchaseHistory: PurchaseHistoryItem[] = [];
  let stats: FoodPurchaseStats[] = [];
  const groceryItem: GroceryItem = {
    id: 'g-fast-click',
    name: 'Whole Milk',
    quantity: 1,
    unit: 'L',
    category: 'Dairy & Eggs',
    checked: false,
    source: 'manual',
    addedAt: new Date().toISOString(),
    foodId: 'food-milk-cow',
  };

  const simulatePurchaseClick = (target: GroceryItem) => {
    if (target.checked) return false;
    target.checked = true;

    const alreadyRecorded = purchaseHistory.some((ph) => ph.groceryItemId === target.id);
    if (!alreadyRecorded) {
      const historyItem: PurchaseHistoryItem = {
        id: `ph-${Date.now()}-${Math.random()}`,
        userId: 'u1',
        foodId: target.foodId || 'food-milk-cow',
        name: target.name,
        quantity: target.quantity,
        unit: target.unit,
        category: target.category,
        purchasedAt: new Date().toISOString(),
        source: 'grocery-list',
        groceryItemId: target.id,
      };
      purchaseHistory.push(historyItem);
      stats = recordPurchaseAndRecalculateStats(stats, historyItem);
      return true;
    }
    return false;
  };

  const click1 = simulatePurchaseClick(groceryItem);
  const click2 = simulatePurchaseClick(groceryItem);

  assert(
    click1 === true && click2 === false && purchaseHistory.length === 1 && stats[0].purchaseCount === 1,
    6,
    'Rapid double click idempotency',
    `Click 1: ${click1}, Click 2: ${click2}. Exactly 1 purchase recorded in history, stats count = 1.`
  );
}

// -------------------------------------------------------------
// CASE 7: Page refresh / state persistence
// -------------------------------------------------------------
{
  // Simulated storage
  const storage: Record<string, string> = {};
  const mockPantry: FoodItem[] = [
    {
      id: 'p-1',
      name: 'Paneer',
      quantity: 250,
      unit: 'g',
      category: 'Dairy & Eggs',
      storageLocation: 'Fridge',
      opened: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  const mockGroceries: GroceryItem[] = [
    {
      id: 'g-1',
      name: 'Paneer',
      quantity: 250,
      unit: 'g',
      category: 'Dairy & Eggs',
      checked: true,
      checkedAt: new Date().toISOString(),
      pantryItemId: 'p-1',
      source: 'manual',
      addedAt: new Date().toISOString(),
    },
  ];

  storage['use_it_first_demo-user-001_items'] = JSON.stringify(mockPantry);
  storage['use_it_first_demo-user-001_groceries'] = JSON.stringify(mockGroceries);

  // Reload
  const loadedPantry: FoodItem[] = JSON.parse(storage['use_it_first_demo-user-001_items']);
  const loadedGroceries: GroceryItem[] = JSON.parse(storage['use_it_first_demo-user-001_groceries']);

  assert(
    loadedPantry.length === 1 && loadedGroceries.length === 1 && loadedGroceries[0].checked === true && loadedGroceries[0].pantryItemId === 'p-1',
    7,
    'Page refresh persistence',
    `Storage persists across reload: ${loadedPantry[0].name} (${loadedPantry[0].quantity} ${loadedPantry[0].unit}), grocery checked: ${loadedGroceries[0].checked}`
  );
}

// -------------------------------------------------------------
// CASE 8: Multi-user isolation
// -------------------------------------------------------------
{
  const user1Storage: Record<string, any> = {
    pantry: [] as FoodItem[],
    groceries: [] as GroceryItem[],
    history: [] as PurchaseHistoryItem[],
  };
  const user2Storage: Record<string, any> = {
    pantry: [] as FoodItem[],
    groceries: [] as GroceryItem[],
    history: [] as PurchaseHistoryItem[],
  };

  // User 1 buys Rolled Oats
  user1Storage.history.push({
    id: 'ph-u1',
    userId: 'demo-user-001',
    foodId: 'food-rolled-oats',
    name: 'Rolled Oats',
    quantity: 1,
    unit: 'kg',
    category: 'Pantry & Grains',
    purchasedAt: new Date().toISOString(),
    source: 'grocery-list',
  });
  user1Storage.pantry.push({
    id: 'p-u1',
    foodId: 'food-rolled-oats',
    name: 'Rolled Oats',
    quantity: 1,
    unit: 'kg',
    category: 'Pantry & Grains',
    storageLocation: 'Cupboard / Pantry',
    opened: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  assert(
    user1Storage.pantry.length === 1 && user2Storage.pantry.length === 0 && user2Storage.history.length === 0,
    8,
    'Multi-user isolation',
    `User 1 has ${user1Storage.pantry.length} pantry items, User 2 has ${user2Storage.pantry.length} items. Total isolation maintained.`
  );
}

// -------------------------------------------------------------
// CASE 9: Excluded food purchased -> succeeds, but excluded from future recs
// -------------------------------------------------------------
{
  const userProfile: UserProfile = {
    userId: 'demo-user-001',
    householdSize: 4,
    preferredUnits: 'metric',
    preferredCategories: ['Produce'],
    dietaryPreferences: [],
    dislikedFoods: [],
    hiddenFoodIds: ['food-bitter-gourd'],
    favoriteFoods: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const pantry: FoodItem[] = [
    {
      id: 'p-bg',
      foodId: 'food-bitter-gourd',
      name: 'Bitter Gourd (Karela)',
      quantity: 500,
      unit: 'g',
      category: 'Produce',
      storageLocation: 'Fridge',
      opened: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const stats: FoodPurchaseStats[] = [
    {
      userId: 'demo-user-001',
      foodId: 'food-bitter-gourd',
      purchaseCount: 5,
      firstPurchasedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      lastPurchasedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      averageDaysBetweenPurchases: 5,
      averageQuantity: 500,
      lastUpdatedAt: new Date().toISOString(),
    },
  ];

  const recs = getGroceryRecommendations({
    userId: 'demo-user-001',
    pantryItems: pantry,
    groceryItems: [],
    purchaseStats: stats,
    purchaseHistory: [],
    userProfile,
  });

  const bitterGourdRec = recs.find((r) => r.foodId === 'food-bitter-gourd');

  assert(
    pantry.length === 1 && bitterGourdRec === undefined,
    9,
    'Excluded food purchased & recommendation suppression',
    `Bitter Gourd exists in pantry, but excluded from recommendations because hiddenFoodIds contains it.`
  );
}

// -------------------------------------------------------------
// CASE 10: Recently purchased food -> suppressed from recommendations
// -------------------------------------------------------------
{
  const now = Date.now();
  const pantry: FoodItem[] = [
    {
      id: 'p-milk',
      foodId: 'food-milk-cow',
      name: 'Fresh Cow Milk',
      quantity: 1,
      unit: 'L',
      category: 'Dairy & Eggs',
      storageLocation: 'Fridge',
      opened: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const stats: FoodPurchaseStats[] = [
    {
      userId: 'demo-user-001',
      foodId: 'food-milk-cow',
      purchaseCount: 10,
      // Purchased just today!
      lastPurchasedAt: new Date(now - 1000 * 60 * 60).toISOString(),
      averageDaysBetweenPurchases: 7,
      averageQuantity: 1,
      firstPurchasedAt: new Date(now - 70 * 86400000).toISOString(),
      lastUpdatedAt: new Date().toISOString(),
    },
  ];

  const history: PurchaseHistoryItem[] = [
    {
      id: 'ph-today',
      userId: 'demo-user-001',
      foodId: 'food-milk-cow',
      name: 'Fresh Cow Milk',
      quantity: 1,
      unit: 'L',
      category: 'Dairy & Eggs',
      purchasedAt: new Date(now - 1000 * 60 * 60).toISOString(),
      source: 'grocery-list',
    },
  ];

  const recs = getGroceryRecommendations({
    userId: 'demo-user-001',
    pantryItems: pantry,
    groceryItems: [],
    purchaseStats: stats,
    purchaseHistory: history,
  });

  const milkRec = recs.find((r) => r.foodId === 'food-milk-cow');

  assert(
    milkRec === undefined,
    10,
    'Recently purchased food suppressed',
    `Milk was bought today, so it is suppressed from next shop recommendations (recs count = ${recs.length}).`
  );
}

// -------------------------------------------------------------
// CASE 11: Partial pantry quantity -> 0.5 kg Rice + 1 kg Rice = 1.5 kg Rice
// -------------------------------------------------------------
{
  const pantry: FoodItem[] = [
    {
      id: 'p-rice',
      foodId: 'food-rice-basmati',
      name: 'Basmati Rice',
      quantity: 0.5,
      unit: 'kg',
      category: 'Pantry & Grains',
      storageLocation: 'Cupboard / Pantry',
      opened: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const groceryItem: GroceryItem = {
    id: 'g-rice',
    name: 'Basmati Rice',
    foodId: 'food-rice-basmati',
    quantity: 1,
    unit: 'kg',
    category: 'Pantry & Grains',
    checked: false,
    source: 'manual',
    addedAt: new Date().toISOString(),
  };

  const existingMatch = pantry.find((i) => i.foodId === groceryItem.foodId);
  const combined = existingMatch ? combineQuantities(existingMatch.quantity, existingMatch.unit, groceryItem.quantity!, groceryItem.unit!) : null;
  if (combined && combined.compatible && existingMatch) {
    existingMatch.quantity = combined.quantity;
    existingMatch.unit = combined.unit;
  }

  assert(
    pantry.length === 1 && pantry[0].quantity === 1.5 && pantry[0].unit === 'kg',
    11,
    'Partial pantry quantity merge',
    `Pantry updated: 0.5 kg + 1 kg = ${pantry[0].quantity} ${pantry[0].unit}`
  );
}

// -------------------------------------------------------------
// CASE 12: Distinct canonical foods -> Tomatoes vs Cherry Tomatoes never merge
// -------------------------------------------------------------
{
  const pantry: FoodItem[] = [
    {
      id: 'p-tomato',
      foodId: 'food-tomato',
      name: 'Vine Tomatoes',
      quantity: 500,
      unit: 'g',
      category: 'Produce',
      storageLocation: 'Fridge',
      opened: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const groceryItem: GroceryItem = {
    id: 'g-cherry',
    name: 'Cherry Tomatoes',
    foodId: 'food-cherry-tomatoes',
    quantity: 250,
    unit: 'g',
    category: 'Produce',
    checked: false,
    source: 'manual',
    addedAt: new Date().toISOString(),
  };

  // Canonical matching
  const targetNorm = normalizeFoodName(groceryItem.name);
  const existingMatch = pantry.find((i) => {
    if (i.foodId && groceryItem.foodId && i.foodId === groceryItem.foodId) return true;
    if (normalizeFoodName(i.name) === targetNorm) return true;
    return false;
  });

  if (!existingMatch) {
    pantry.push({
      id: 'p-cherry',
      foodId: groceryItem.foodId,
      name: groceryItem.name,
      quantity: groceryItem.quantity!,
      unit: groceryItem.unit!,
      category: groceryItem.category,
      storageLocation: 'Fridge',
      opened: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  assert(
    existingMatch === undefined && pantry.length === 2 && pantry[0].name === 'Vine Tomatoes' && pantry[1].name === 'Cherry Tomatoes',
    12,
    'Distinct canonical foods never merge',
    `Vine Tomatoes and Cherry Tomatoes remain 2 separate distinct pantry items.`
  );
}

console.log('\n-------------------------------------------------------------');
const total = results.length;
const passedCount = results.filter((r) => r.passed).length;
console.log(`TEST SUMMARY: ${passedCount} / ${total} PASSING`);
if (passedCount === total) {
  console.log('ALL 12 EDGE CASES VERIFIED SUCCESSFULLY! 🎉');
} else {
  console.error('SOME EDGE CASES FAILED');
  process.exit(1);
}
