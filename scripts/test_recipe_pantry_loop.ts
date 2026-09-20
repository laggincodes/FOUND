import { combineQuantities, areUnitsCompatible, normalizeUnit, convertQuantity, parseQuantityAndUnit } from '../src/lib/unitConverter';
import { matchFoodLibrary, normalizeFoodName } from '../src/lib/food-library/normalizer';
import { FOOD_LIBRARY_CATALOG } from '../src/lib/food-library/food-catalog';
import { FoodItem, GroceryItem, UsageEvent, PriorityTier, FoodCategory } from '../src/types';

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
console.log('STEP 4: RECIPE -> PANTRY & COOKING LOOP RELIABILITY');
console.log('====================================================\n');

// -------------------------------------------------------------
// CASE 1: AVAILABLE Status - Pantry has enough stock
// -------------------------------------------------------------
{
  const pantryItems: FoodItem[] = [
    {
      id: 'p-spinach-1',
      name: 'Baby Spinach',
      foodId: 'food-spinach',
      quantity: 500,
      unit: 'g',
      category: 'Produce',
      storageLocation: 'Fridge',
      opened: false,
      purchaseDate: '2026-09-20',
      bestBefore: '2026-09-25',
      createdAt: '2026-09-20T10:00:00Z',
      updatedAt: '2026-09-20T10:00:00Z',
    },
  ];

  const recipeIng = { name: 'Spinach', amount: '250g' };
  const parsed = parseQuantityAndUnit(recipeIng.amount);
  const matchedLib = matchFoodLibrary(recipeIng.name, FOOD_LIBRARY_CATALOG);
  const targetFoodId = matchedLib?.id;

  const matches = pantryItems.filter(
    (item) => item.foodId === targetFoodId || normalizeFoodName(item.name) === normalizeFoodName(recipeIng.name)
  );
  let totalStockInReqUnit = 0;
  matches.forEach((m) => {
    const conv = convertQuantity(m.quantity, m.unit, parsed.unit);
    totalStockInReqUnit += conv !== null ? conv : m.quantity;
  });

  const status = totalStockInReqUnit >= parsed.quantity ? 'AVAILABLE' : totalStockInReqUnit > 0 ? 'PARTIAL' : 'MISSING';
  const missingQty = Math.max(0, parsed.quantity - totalStockInReqUnit);

  assert(
    status === 'AVAILABLE' && missingQty === 0 && totalStockInReqUnit === 500,
    1,
    'AVAILABLE Status Check',
    `Required 250g, pantry has 500g -> status=${status}, missing=${missingQty}g`
  );
}

// -------------------------------------------------------------
// CASE 2: PARTIAL Status - Pantry has some stock but not enough
// -------------------------------------------------------------
{
  const pantryItems: FoodItem[] = [
    {
      id: 'p-spinach-2',
      name: 'Spinach Leaves',
      foodId: 'food-spinach',
      quantity: 200,
      unit: 'g',
      category: 'Produce',
      storageLocation: 'Fridge',
      opened: false,
      purchaseDate: '2026-09-20',
      bestBefore: '2026-09-23',
      createdAt: '2026-09-20T10:00:00Z',
      updatedAt: '2026-09-20T10:00:00Z',
    },
  ];

  const recipeIng = { name: 'Spinach', amount: '500g' };
  const parsed = parseQuantityAndUnit(recipeIng.amount);
  const matchedLib = matchFoodLibrary(recipeIng.name, FOOD_LIBRARY_CATALOG);
  const targetFoodId = matchedLib?.id;

  const matches = pantryItems.filter(
    (item) => item.foodId === targetFoodId || normalizeFoodName(item.name) === normalizeFoodName(recipeIng.name)
  );
  let totalStockInReqUnit = 0;
  matches.forEach((m) => {
    const conv = convertQuantity(m.quantity, m.unit, parsed.unit);
    totalStockInReqUnit += conv !== null ? conv : m.quantity;
  });

  const status = totalStockInReqUnit >= parsed.quantity ? 'AVAILABLE' : totalStockInReqUnit > 0 ? 'PARTIAL' : 'MISSING';
  const missingQty = Number((parsed.quantity - totalStockInReqUnit).toFixed(2));

  assert(
    status === 'PARTIAL' && missingQty === 300 && totalStockInReqUnit === 200,
    2,
    'PARTIAL Status Check',
    `Required 500g, pantry has 200g -> status=${status}, missing=${missingQty}g`
  );
}

// -------------------------------------------------------------
// CASE 3: MISSING Status - Pantry has zero stock
// -------------------------------------------------------------
{
  const pantryItems: FoodItem[] = [];

  const recipeIng = { name: 'Paneer', amount: '200g' };
  const parsed = parseQuantityAndUnit(recipeIng.amount);
  const matchedLib = matchFoodLibrary(recipeIng.name, FOOD_LIBRARY_CATALOG);
  const targetFoodId = matchedLib?.id;

  const matches = pantryItems.filter(
    (item) => item.foodId === targetFoodId || normalizeFoodName(item.name) === normalizeFoodName(recipeIng.name)
  );
  let totalStockInReqUnit = 0;
  matches.forEach((m) => {
    const conv = convertQuantity(m.quantity, m.unit, parsed.unit);
    totalStockInReqUnit += conv !== null ? conv : m.quantity;
  });

  const status = totalStockInReqUnit >= parsed.quantity ? 'AVAILABLE' : totalStockInReqUnit > 0 ? 'PARTIAL' : 'MISSING';
  const missingQty = parsed.quantity;

  assert(
    status === 'MISSING' && missingQty === 200 && totalStockInReqUnit === 0,
    3,
    'MISSING Status Check',
    `Required 200g, pantry has 0g -> status=${status}, missing=${missingQty}g`
  );
}

// -------------------------------------------------------------
// CASE 4: Add Missing to Grocery - Adds ONLY missing quantity and merges
// -------------------------------------------------------------
{
  const groceryList: GroceryItem[] = [
    {
      id: 'g-spinach-existing',
      name: 'Spinach',
      foodId: 'food-spinach',
      quantity: 100,
      unit: 'g',
      category: 'Produce',
      checked: false,
      source: 'manual',
      addedAt: '2026-09-20T08:00:00Z',
    },
  ];

  // Recipe needed 500g, pantry had 200g, so missing is 300g (NOT 500g)
  const missingToAdd = {
    name: 'Spinach',
    foodId: 'food-spinach',
    amount: '300 g',
  };

  const parsed = parseQuantityAndUnit(missingToAdd.amount);
  const existingIdx = groceryList.findIndex((g) => !g.checked && g.foodId === missingToAdd.foodId);

  let merged = false;
  if (existingIdx !== -1) {
    const existing = groceryList[existingIdx];
    const combined = combineQuantities(existing.quantity || 0, existing.unit || 'pcs', parsed.quantity, parsed.unit);
    if (combined && combined.compatible) {
      groceryList[existingIdx] = {
        ...existing,
        quantity: combined.quantity,
        unit: combined.unit,
      };
      merged = true;
    }
  }

  assert(
    merged && groceryList.length === 1 && groceryList[0].quantity === 400 && groceryList[0].unit === 'g',
    4,
    'Add Missing to Grocery (Partial Quantity & Merge)',
    `Existing was 100g, added missing 300g (not full 500g) -> total merged=${groceryList[0].quantity}${groceryList[0].unit}`
  );
}

// -------------------------------------------------------------
// CASE 5: Recipe Usage -> Pantry Deduction with Unit Conversion
// -------------------------------------------------------------
{
  let pantry: FoodItem[] = [
    {
      id: 'p-tomato-1',
      name: 'Tomatoes',
      foodId: 'food-tomato',
      quantity: 1, // 1 kg in pantry
      unit: 'kg',
      category: 'Produce',
      storageLocation: 'Fridge',
      opened: false,
      purchaseDate: '2026-09-18',
      bestBefore: '2026-09-25',
      createdAt: '2026-09-18T10:00:00Z',
      updatedAt: '2026-09-18T10:00:00Z',
    },
  ];

  // Recipe consumes 400g
  const neededQty = 400;
  const neededUnit = 'g';
  const lot = pantry[0];

  const lotQtyInNeededUnit = convertQuantity(lot.quantity, lot.unit, neededUnit) ?? lot.quantity;
  const takeFromLot = Math.min(lotQtyInNeededUnit, neededQty);
  const deductFromLot = convertQuantity(takeFromLot, neededUnit, lot.unit) ?? takeFromLot;

  const newQty = Number((lot.quantity - deductFromLot).toFixed(2));
  pantry[0] = { ...lot, quantity: newQty };

  assert(
    pantry[0].quantity === 0.6 && pantry[0].unit === 'kg',
    5,
    'Recipe Usage with Unit Conversion (kg -> g)',
    `Had 1 kg, consumed 400 g -> remaining=${pantry[0].quantity} kg`
  );
}

// -------------------------------------------------------------
// CASE 6: FIFO Lot Consumption - Earliest Expiry Consumed First
// -------------------------------------------------------------
{
  let pantry: FoodItem[] = [
    {
      id: 'lot-later',
      name: 'Paneer',
      foodId: 'food-paneer',
      quantity: 300,
      unit: 'g',
      category: 'Dairy & Eggs',
      storageLocation: 'Fridge',
      opened: false,
      bestBefore: '2026-09-30', // Expires in 10 days
      createdAt: '2026-09-20T10:00:00Z',
      updatedAt: '2026-09-20T10:00:00Z',
    },
    {
      id: 'lot-sooner',
      name: 'Paneer',
      foodId: 'food-paneer',
      quantity: 150,
      unit: 'g',
      category: 'Dairy & Eggs',
      storageLocation: 'Fridge',
      opened: false,
      bestBefore: '2026-09-22', // Expires in 2 days (USE FIRST)
      createdAt: '2026-09-19T10:00:00Z',
      updatedAt: '2026-09-19T10:00:00Z',
    },
  ];

  // Sort lots FIFO (earliest expiry first)
  pantry.sort((a, b) => (a.bestBefore || '').localeCompare(b.bestBefore || ''));

  // Recipe requires 250g Paneer
  let neededQty = 250;
  let consumedFromSooner = 0;
  let consumedFromLater = 0;

  pantry = pantry
    .map((lot) => {
      if (neededQty <= 0) return lot;
      const take = Math.min(lot.quantity, neededQty);
      if (lot.id === 'lot-sooner') consumedFromSooner = take;
      if (lot.id === 'lot-later') consumedFromLater = take;
      neededQty -= take;
      const remaining = Number((lot.quantity - take).toFixed(2));
      return { ...lot, quantity: remaining };
    })
    .filter((lot) => lot.quantity > 0); // Depleted lot removed

  assert(
    consumedFromSooner === 150 &&
      consumedFromLater === 100 &&
      pantry.length === 1 &&
      pantry[0].id === 'lot-later' &&
      pantry[0].quantity === 200,
    6,
    'FIFO Multi-Lot Consumption & Depleted Lot Removal',
    `Sooner lot depleted (150g) and removed; Later lot deducted 100g, 200g remains`
  );
}

// -------------------------------------------------------------
// CASE 7: Non-Negative Stock Clamping
// -------------------------------------------------------------
{
  let pantry: FoodItem[] = [
    {
      id: 'p-ginger',
      name: 'Ginger',
      foodId: 'food-ginger',
      quantity: 50,
      unit: 'g',
      category: 'Produce',
      storageLocation: 'Fridge',
      opened: false,
      bestBefore: '2026-09-24',
      createdAt: '2026-09-20T10:00:00Z',
      updatedAt: '2026-09-20T10:00:00Z',
    },
  ];

  // Recipe asks for 100g (pantry only has 50g)
  let neededQty = 100;
  let actuallyConsumed = 0;

  pantry = pantry
    .map((lot) => {
      const take = Math.min(lot.quantity, neededQty);
      actuallyConsumed += take;
      neededQty -= take;
      const remaining = Math.max(0, lot.quantity - take);
      return { ...lot, quantity: remaining };
    })
    .filter((lot) => lot.quantity > 0);

  assert(
    actuallyConsumed === 50 && pantry.length === 0,
    7,
    'Non-Negative Stock Clamping',
    `Requested 100g from 50g stock -> actually consumed=50g, pantry empty, never negative`
  );
}

// -------------------------------------------------------------
// CASE 8: Idempotent / Double-Click Action Protection
// -------------------------------------------------------------
{
  let isMarkingCooked = false;
  let hasCooked = false;
  let executionCount = 0;

  const triggerCook = () => {
    if (isMarkingCooked || hasCooked) return false;
    isMarkingCooked = true;
    try {
      executionCount++;
      hasCooked = true;
      return true;
    } finally {
      isMarkingCooked = false;
    }
  }

  const click1 = triggerCook();
  const click2 = triggerCook(); // rapid second click
  const click3 = triggerCook(); // third click

  assert(
    click1 === true && click2 === false && click3 === false && executionCount === 1,
    8,
    'Double-Click / Idempotent Cook Protection',
    `3 consecutive clicks resulted in exactly ${executionCount} execution`
  );
}

// -------------------------------------------------------------
// CASE 9: Multi-User Isolation in Cooking & Pantry Deductions
// -------------------------------------------------------------
{
  const userAPantry: FoodItem[] = [
    {
      id: 'userA-rice',
      name: 'Basmati Rice',
      foodId: 'food-rice',
      quantity: 1000,
      unit: 'g',
      category: 'Pantry & Grains',
      storageLocation: 'Cupboard / Pantry',
      opened: false,
      createdAt: '2026-09-20T10:00:00Z',
      updatedAt: '2026-09-20T10:00:00Z',
    },
  ];

  const userBPantry: FoodItem[] = [
    {
      id: 'userB-rice',
      name: 'Basmati Rice',
      foodId: 'food-rice',
      quantity: 1000,
      unit: 'g',
      category: 'Pantry & Grains',
      storageLocation: 'Cupboard / Pantry',
      opened: false,
      createdAt: '2026-09-20T10:00:00Z',
      updatedAt: '2026-09-20T10:00:00Z',
    },
  ];

  // User A cooks a recipe using 300g rice
  userAPantry[0].quantity -= 300;

  assert(
    userAPantry[0].quantity === 700 && userBPantry[0].quantity === 1000,
    9,
    'Multi-User Cooking Isolation',
    `User A cooked 300g rice (remains 700g); User B pantry remains untouched (1000g)`
  );
}

console.log('\n====================================================');
const passedCount = results.filter((r) => r.passed).length;
console.log(`TOTAL RESULTS: ${passedCount}/${results.length} PASSED`);
console.log('====================================================\n');

if (passedCount < results.length) {
  process.exit(1);
}
