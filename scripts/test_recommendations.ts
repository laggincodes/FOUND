import { getGroceryRecommendations } from '../src/lib/recommendationEngine';
import { FoodItem, GroceryItem, FoodPurchaseStats, PurchaseHistoryItem, UserProfile, Recipe } from '../src/types';
import { FOOD_LIBRARY_CATALOG } from '../src/lib/food-library/food-catalog';

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

console.log('====================================================');
console.log('STEP 6: RECOMMENDATION ENGINE SANITY SUITE');
console.log('====================================================\n');

// -------------------------------------------------------------
// CASE 1: LOW STOCK RECOMMENDATION (Level 1: Need)
// -------------------------------------------------------------
{
  const pantryItems: FoodItem[] = [
    {
      id: 'p-milk',
      name: 'Fresh Cow Milk',
      foodId: 'food-milk-cow',
      quantity: 0.2, // 200ml remaining of 1L -> LOW STOCK
      unit: 'L',
      category: 'Dairy & Eggs',
      storageLocation: 'Fridge',
      opened: true,
      bestBefore: '2026-09-22',
      createdAt: '2026-09-18T10:00:00Z',
      updatedAt: '2026-09-18T10:00:00Z',
    },
  ];

  const recs = getGroceryRecommendations({
    userId: 'user-1',
    pantryItems,
    groceryItems: [],
    purchaseStats: [],
    purchaseHistory: [],
  });

  const lowStockRec = recs.find((r) => r.foodId === 'food-milk-cow' || r.name.toLowerCase().includes('milk'));

  assert(
    lowStockRec !== undefined &&
      lowStockRec.level === 1 &&
      lowStockRec.reason === 'running-low' &&
      lowStockRec.explanation.includes("running low"),
    1,
    'Low Stock Recommendation (Level 1)',
    `Milk with 0.2L remaining triggered Level 1 'running-low' recommendation: "${lowStockRec?.explanation}"`
  );
}

// -------------------------------------------------------------
// CASE 2: DUE / OVERDUE PURCHASE (Level 2: Due)
// -------------------------------------------------------------
{
  // User bought Paneer 10 days ago. Average interval is 7 days.
  const tenDaysAgo = new Date(Date.now() - 10 * 86400000).toISOString();

  const purchaseStats: FoodPurchaseStats[] = [
    {
      userId: 'user-1',
      foodId: 'food-paneer',
      purchaseCount: 4,
      firstPurchasedAt: new Date(Date.now() - 40 * 86400000).toISOString(),
      lastPurchasedAt: tenDaysAgo,
      averageDaysBetweenPurchases: 7, // Due every 7 days -> 10 days is overdue!
      averageQuantity: 200,
      lastUpdatedAt: tenDaysAgo,
    },
  ];

  const recs = getGroceryRecommendations({
    userId: 'user-1',
    pantryItems: [], // Not in pantry
    groceryItems: [],
    purchaseStats,
    purchaseHistory: [
      {
        id: 'ph-1',
        userId: 'user-1',
        foodId: 'food-paneer',
        name: 'Paneer',
        purchasedAt: tenDaysAgo,
        source: 'manual',
      },
    ],
  });

  const dueRec = recs.find((r) => r.foodId === 'food-paneer');

  assert(
    dueRec !== undefined &&
      dueRec.level === 2 &&
      dueRec.reason === 'due-for-restock',
    2,
    'Due / Overdue Purchase (Level 2)',
    `Paneer bought 10 days ago with 7-day interval triggered Level 2 'due-for-restock': "${dueRec?.explanation}"`
  );
}

// -------------------------------------------------------------
// CASE 3: RECENT PURCHASE SUPPRESSION
// -------------------------------------------------------------
{
  // User bought Paneer yesterday. Average interval is 7 days.
  const yesterday = new Date(Date.now() - 1 * 86400000).toISOString();

  const purchaseStats: FoodPurchaseStats[] = [
    {
      userId: 'user-1',
      foodId: 'food-paneer',
      purchaseCount: 4,
      firstPurchasedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      lastPurchasedAt: yesterday,
      averageDaysBetweenPurchases: 7,
      averageQuantity: 200,
      lastUpdatedAt: yesterday,
    },
  ];

  const recs = getGroceryRecommendations({
    userId: 'user-1',
    pantryItems: [],
    groceryItems: [],
    purchaseStats,
    purchaseHistory: [
      {
        id: 'ph-recent',
        userId: 'user-1',
        foodId: 'food-paneer',
        name: 'Paneer',
        purchasedAt: yesterday,
        source: 'manual',
      },
    ],
  });

  const suppressedRec = recs.find((r) => r.foodId === 'food-paneer');

  assert(
    suppressedRec === undefined,
    3,
    'Recent Purchase Suppression',
    `Paneer bought 1 day ago (interval 7 days) correctly suppressed from recommendations`
  );
}

// -------------------------------------------------------------
// CASE 4: GROCERY LIST SUPPRESSION
// -------------------------------------------------------------
{
  // Tomato is due for restock, BUT already exists on the active unpurchased grocery list!
  const tenDaysAgo = new Date(Date.now() - 10 * 86400000).toISOString();

  const purchaseStats: FoodPurchaseStats[] = [
    {
      userId: 'user-1',
      foodId: 'food-tomato',
      purchaseCount: 5,
      firstPurchasedAt: new Date(Date.now() - 40 * 86400000).toISOString(),
      lastPurchasedAt: tenDaysAgo,
      averageDaysBetweenPurchases: 7,
      averageQuantity: 500,
      lastUpdatedAt: tenDaysAgo,
    },
  ];

  const groceryItems: GroceryItem[] = [
    {
      id: 'g-tomato',
      name: 'Fresh Tomatoes',
      foodId: 'food-tomato',
      quantity: 500,
      unit: 'g',
      category: 'Produce',
      checked: false, // Active / unpurchased
      source: 'manual',
      addedAt: new Date().toISOString(),
    },
  ];

  const recs = getGroceryRecommendations({
    userId: 'user-1',
    pantryItems: [],
    groceryItems,
    purchaseStats,
    purchaseHistory: [],
  });

  const grocerySuppressedRec = recs.find((r) => r.foodId === 'food-tomato');

  assert(
    grocerySuppressedRec === undefined,
    4,
    'Grocery List Suppression',
    `Tomato already on unpurchased grocery list is strictly suppressed from recommendations`
  );
}

// -------------------------------------------------------------
// CASE 5: EXCLUDED / DISLIKED FOOD SUPPRESSION
// -------------------------------------------------------------
{
  // Bitter Gourd is low stock or due, but user excluded it in profile
  const userProfile: UserProfile = {
    userId: 'user-1',
    dislikedFoods: ['food-bitter-gourd', 'Bitter Gourd'],
    hiddenFoodIds: ['food-bitter-gourd'],
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
  };

  const pantryItems: FoodItem[] = [
    {
      id: 'p-karela',
      name: 'Bitter Gourd',
      foodId: 'food-bitter-gourd',
      quantity: 50, // Low quantity
      unit: 'g',
      category: 'Produce',
      storageLocation: 'Fridge',
      opened: false,
      createdAt: '2026-09-18T10:00:00Z',
      updatedAt: '2026-09-18T10:00:00Z',
    },
  ];

  const recs = getGroceryRecommendations({
    userId: 'user-1',
    pantryItems,
    groceryItems: [],
    purchaseStats: [],
    purchaseHistory: [],
    userProfile,
  });

  const excludedRec = recs.find((r) => r.foodId === 'food-bitter-gourd' || r.name.toLowerCase().includes('bitter gourd'));

  assert(
    excludedRec === undefined,
    5,
    'Excluded / Disliked Food Suppression',
    `Bitter Gourd present in user profile dislikedFoods/hiddenFoodIds was strictly excluded`
  );
}

// -------------------------------------------------------------
// CASE 6: NEW HOUSEHOLD DISCOVERY (Level 4)
// -------------------------------------------------------------
{
  // Brand new household: no pantry items, no purchases, no grocery list
  const recs = getGroceryRecommendations({
    userId: 'new-user',
    pantryItems: [],
    groceryItems: [],
    purchaseStats: [],
    purchaseHistory: [],
  });

  const discoveryRecs = recs.filter((r) => r.level === 4 && r.reason === 'popular-staple');

  assert(
    recs.length > 0 &&
      discoveryRecs.length >= 3 &&
      discoveryRecs.every((r) => r.explanation === 'Popular household staple to start your pantry.'),
    6,
    'New Household Discovery (Level 4)',
    `New household received ${discoveryRecs.length} staple recommendations (e.g. ${discoveryRecs.map((r) => r.name).join(', ')}) with factual explanation`
  );
}

// -------------------------------------------------------------
// CASE 7: RECIPE INGREDIENT NEED (Level 1: Need)
// -------------------------------------------------------------
{
  // Active planned recipe: Palak Paneer (requires Spinach and Paneer)
  const activeRecipes: Recipe[] = [
    {
      id: 'rec-palak-paneer',
      slug: 'palak-paneer',
      name: 'Palak Paneer',
      description: 'Cottage cheese in spiced spinach puree',
      image: '',
      timeMinutes: 25,
      difficulty: 'Easy',
      servings: 3,
      category: 'Main Course',
      isVegetarian: true,
      tags: [],
      ingredients: [
        { name: 'Spinach', amount: '250g' },
        { name: 'Paneer', amount: '200g' },
      ],
      steps: [],
    },
  ];

  // User has Spinach in pantry (250g), but NO Paneer
  const pantryItems: FoodItem[] = [
    {
      id: 'p-spinach',
      name: 'Spinach',
      foodId: 'food-spinach',
      quantity: 250,
      unit: 'g',
      category: 'Produce',
      storageLocation: 'Fridge',
      opened: false,
      createdAt: '2026-09-20T10:00:00Z',
      updatedAt: '2026-09-20T10:00:00Z',
    },
  ];

  const recs = getGroceryRecommendations({
    userId: 'user-1',
    pantryItems,
    groceryItems: [],
    purchaseStats: [],
    purchaseHistory: [],
    activeRecipes,
  });

  const recipeNeedRec = recs.find((r) => r.reason === 'recipe-needed' && r.name.toLowerCase().includes('paneer'));

  assert(
    recipeNeedRec !== undefined &&
      recipeNeedRec.level === 1 &&
      recipeNeedRec.explanation.includes('Needed for Palak Paneer'),
    7,
    'Recipe Ingredient Need (Level 1)',
    `Paneer recommended with factual explanation: "${recipeNeedRec?.explanation}"`
  );
}

// -------------------------------------------------------------
// CASE 8: MULTI-USER ISOLATION
// -------------------------------------------------------------
{
  // User A has low milk; User B has full milk (2L)
  const userARecs = getGroceryRecommendations({
    userId: 'user-A',
    pantryItems: [
      {
        id: 'item-A',
        name: 'Milk',
        foodId: 'food-milk-cow',
        quantity: 0.1, // low
        unit: 'L',
        category: 'Dairy & Eggs',
        storageLocation: 'Fridge',
        opened: true,
        createdAt: '2026-09-20T10:00:00Z',
        updatedAt: '2026-09-20T10:00:00Z',
      },
    ],
    groceryItems: [],
    purchaseStats: [],
    purchaseHistory: [],
  });

  const userBRecs = getGroceryRecommendations({
    userId: 'user-B',
    pantryItems: [
      {
        id: 'item-B',
        name: 'Milk',
        foodId: 'food-milk-cow',
        quantity: 2.0, // full
        unit: 'L',
        category: 'Dairy & Eggs',
        storageLocation: 'Fridge',
        opened: false,
        createdAt: '2026-09-20T10:00:00Z',
        updatedAt: '2026-09-20T10:00:00Z',
      },
    ],
    groceryItems: [],
    purchaseStats: [],
    purchaseHistory: [],
  });

  const userAHasMilk = userARecs.some((r) => r.foodId === 'food-milk-cow' && r.reason === 'running-low');
  const userBHasMilk = userBRecs.some((r) => r.foodId === 'food-milk-cow' && r.reason === 'running-low');

  assert(
    userAHasMilk && !userBHasMilk,
    8,
    'Multi-User Recommendation Isolation',
    `User A (0.1L milk) receives running-low rec; User B (2L milk) does not receive milk rec`
  );
}

console.log('\n====================================================');
const passedCount = results.filter((r) => r.passed).length;
console.log(`TOTAL RESULTS: ${passedCount}/${results.length} PASSED`);
console.log('====================================================\n');

if (passedCount < results.length) {
  process.exit(1);
}
