import { checkItemInventoryPure } from '../src/lib/inventory-checker';
import { FoodItem, DurableItem, PurchaseHistoryItem } from '../src/types';

interface TestResult {
  caseNum: number;
  title: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

const assert = (condition: boolean, caseNum: number, title: string, details: string) => {
  results.push({
    caseNum,
    title,
    passed: condition,
    details,
  });
  const symbol = condition ? '✅ PASS' : '❌ FAIL';
  console.log(`${symbol} [Case ${caseNum}]: ${title} - ${details}`);
};

// Setup initial demo state
const now = new Date();
const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

const demoDurables: DurableItem[] = [
  {
    id: 'dur-1',
    userId: 'demo-user-001',
    name: 'Ruled Notebooks (A5)',
    category: 'Stationery',
    quantity: 4,
    unit: 'pcs',
    location: 'Study desk drawer',
    notes: '2 in active use, 2 unused in drawer backup',
    purchaseDate: '2026-09-01',
    purchasePrice: 160,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'dur-2',
    userId: 'demo-user-001',
    name: 'USB-C Fast Charging Cables',
    category: 'Electronics',
    quantity: 2,
    unit: 'pcs',
    location: 'Living room cable basket',
    notes: '1 plugged in desk, 1 spare in basket',
    purchaseDate: '2026-08-20',
    purchasePrice: 299,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const demoFood: FoodItem[] = [
  {
    id: 'item-milk-1',
    name: 'Fresh Cow Milk (Amul Taaza)',
    category: 'Dairy & Eggs',
    quantity: 1,
    unit: 'L',
    bestBefore: tomorrow,
    opened: true,
    storageLocation: 'Fridge',
    notes: 'Opened yesterday for morning tea',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'item-milk-2',
    name: 'Fresh Cow Milk (Mother Dairy)',
    category: 'Dairy & Eggs',
    quantity: 1,
    unit: 'L',
    bestBefore: nextWeek,
    opened: false,
    storageLocation: 'Fridge',
    notes: 'Backup carton sealed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'item-toothpaste',
    name: 'Herbal Toothpaste (150g)',
    category: 'Personal Care' as any,
    quantity: 3,
    unit: 'pcs',
    bestBefore: '2027-12-31',
    opened: true,
    storageLocation: 'Cupboard / Pantry',
    notes: '1 in bathroom active, 2 stored in closet',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const demoHistory: PurchaseHistoryItem[] = [
  {
    id: 'hist-tp',
    userId: 'demo-user-001',
    foodId: 'item-toothpaste',
    name: 'Herbal Toothpaste (Pack of 3)',
    category: 'Personal Care',
    quantity: 3,
    unit: 'pcs',
    purchasedAt: '2026-09-05',
    source: 'grocery-list',
    estimatedPrice: 180,
  },
  {
    id: 'hist-nb',
    userId: 'demo-user-001',
    foodId: 'dur-1',
    name: 'Ruled Notebooks (A5)',
    category: 'Stationery',
    quantity: 4,
    unit: 'pcs',
    purchasedAt: '2026-09-01',
    source: 'manual',
    estimatedPrice: 160,
  },
];

console.log('=== RUNNING FOUND MVP VERIFICATION TESTS ===\n');

// -------------------------------------------------------------
// SCENARIO 1: notebook -> "You already have 4." (2 unused) -> WAIT
// -------------------------------------------------------------
{
  const result = checkItemInventoryPure('notebook', demoDurables, demoFood, demoHistory);

  assert(
    result.found === true &&
      result.type === 'durable' &&
      result.totalQuantity === 4 &&
      result.decision === 'WAIT' &&
      result.headline.includes('4') &&
      Boolean(result.subline?.includes('unused')),
    1,
    'Notebook search returns WAIT with 4 in stock (2 unused)',
    `found: ${result.found}, decision: ${result.decision}, headline: "${result.headline}", subline: "${result.subline}"`
  );
}

// -------------------------------------------------------------
// SCENARIO 2: milk -> "You already have 2L. 1L should be used soon." -> USE
// -------------------------------------------------------------
{
  const result = checkItemInventoryPure('milk', demoDurables, demoFood, demoHistory);

  assert(
    result.found === true &&
      result.type === 'food' &&
      result.totalQuantity === 2 &&
      result.decision === 'USE' &&
      result.headline.includes('2L') &&
      Boolean(result.subline?.includes('should be used soon')),
    2,
    'Milk search returns USE with 2L in stock and 1L urgent attention',
    `found: ${result.found}, decision: ${result.decision}, headline: "${result.headline}", subline: "${result.subline}"`
  );
}

// -------------------------------------------------------------
// SCENARIO 3: toothpaste -> "You already have 3 pcs." -> WAIT + BOUGHT AHEAD + Spending Memory
// -------------------------------------------------------------
{
  const result = checkItemInventoryPure('toothpaste', demoDurables, demoFood, demoHistory);

  assert(
    result.found === true &&
      result.decision === 'WAIT' &&
      result.totalQuantity === 3 &&
      result.isBoughtAhead === true &&
      Boolean(result.subline?.includes('BOUGHT AHEAD')) &&
      result.purchaseMemory !== undefined &&
      result.purchaseMemory?.lastPrice === 180,
    3,
    'Toothpaste search returns WAIT with BOUGHT AHEAD extra stock and spending memory',
    `found: ${result.found}, decision: ${result.decision}, isBoughtAhead: ${result.isBoughtAhead}, price: ₹${result.purchaseMemory?.lastPrice}`
  );
}

// -------------------------------------------------------------
// SCENARIO 4: USB hub -> "Not found in your inventory." -> BUY
// -------------------------------------------------------------
{
  const result = checkItemInventoryPure('USB hub', demoDurables, demoFood, demoHistory);

  assert(
    result.found === false &&
      result.decision === 'BUY' &&
      result.headline === 'Not found in your inventory.' &&
      Boolean(result.subline?.includes("don't currently have this logged")),
    4,
    'USB hub search returns BUY with not found notification',
    `found: ${result.found}, decision: ${result.decision}, headline: "${result.headline}"`
  );
}

// -------------------------------------------------------------
// SCENARIO 5: Partial singular/plural matching
// -------------------------------------------------------------
{
  const resultSingular = checkItemInventoryPure('cable', demoDurables, demoFood, demoHistory);
  const resultPlural = checkItemInventoryPure('cables', demoDurables, demoFood, demoHistory);

  assert(
    resultSingular.found === true && resultPlural.found === true && resultSingular.totalQuantity === 2,
    5,
    'Singular and plural forms match correctly ("cable" and "cables")',
    `cable found: ${resultSingular.found}, cables found: ${resultPlural.found}, totalQty: ${resultSingular.totalQuantity}`
  );
}

// Summary
const total = results.length;
const passed = results.filter((r) => r.passed).length;
console.log(`\n================================`);
console.log(`Results: ${passed}/${total} tests passed.`);
console.log(`================================\n`);

if (passed !== total) {
  process.exit(1);
}
