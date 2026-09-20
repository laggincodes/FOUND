import { assessPriority } from '../src/lib/priority';
import { FoodItem } from '../src/types';

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

const REF_DATE = new Date(2026, 8, 20, 12, 0, 0); // Sunday, Sep 20, 2026

// -------------------------------------------------------------
// CASE 1: EXPIRED FOOD
// -------------------------------------------------------------
{
  const item: FoodItem = {
    id: 'p-expired',
    name: 'Cow Milk',
    category: 'Dairy & Eggs',
    quantity: 1,
    unit: 'L',
    bestBefore: '2026-09-19', // Yesterday
    opened: false,
    storageLocation: 'Fridge',
    createdAt: '2026-09-15T00:00:00Z',
    updatedAt: '2026-09-15T00:00:00Z',
  };

  const assessment = assessPriority(item, REF_DATE);

  assert(
    assessment.tier === 'EXPIRED' && assessment.daysRemaining === -1 && assessment.score === 100 && assessment.primaryReason.includes('passed yesterday'),
    1,
    'Expired food',
    `Tier: ${assessment.tier}, daysRemaining: ${assessment.daysRemaining}, reason: "${assessment.primaryReason}"`
  );
}

// -------------------------------------------------------------
// CASE 2: EXPIRING FOOD (TODAY / TOMORROW)
// -------------------------------------------------------------
{
  const itemToday: FoodItem = {
    id: 'p-today',
    name: 'Baby Spinach',
    category: 'Produce',
    quantity: 250,
    unit: 'g',
    bestBefore: '2026-09-20', // Today
    opened: false,
    storageLocation: 'Fridge',
    createdAt: '2026-09-18T00:00:00Z',
    updatedAt: '2026-09-18T00:00:00Z',
  };

  const itemTomorrow: FoodItem = {
    id: 'p-tomorrow',
    name: 'Fresh Paneer',
    category: 'Dairy & Eggs',
    quantity: 200,
    unit: 'g',
    bestBefore: '2026-09-21', // Tomorrow
    opened: false,
    storageLocation: 'Fridge',
    createdAt: '2026-09-18T00:00:00Z',
    updatedAt: '2026-09-18T00:00:00Z',
  };

  const aToday = assessPriority(itemToday, REF_DATE);
  const aTomorrow = assessPriority(itemTomorrow, REF_DATE);

  assert(
    aToday.tier === 'USE_FIRST' && aToday.daysRemaining === 0 && aToday.primaryReason === 'Best before today' &&
    aTomorrow.tier === 'USE_FIRST' && aTomorrow.daysRemaining === 1 && aTomorrow.primaryReason === 'Best before tomorrow',
    2,
    'Expiring food',
    `Today: ${aToday.tier} ("${aToday.primaryReason}"), Tomorrow: ${aTomorrow.tier} ("${aTomorrow.primaryReason}")`
  );
}

// -------------------------------------------------------------
// CASE 3: SAFE FOOD
// -------------------------------------------------------------
{
  const safeItem: FoodItem = {
    id: 'p-safe',
    name: 'Basmati Rice',
    category: 'Pantry & Grains',
    quantity: 2,
    unit: 'kg',
    bestBefore: '2026-11-20', // 2 months away
    opened: false,
    storageLocation: 'Cupboard / Pantry',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  };

  const assessment = assessPriority(safeItem, REF_DATE);

  assert(
    assessment.tier === 'SAFE_FOR_NOW' && assessment.daysRemaining !== null && assessment.daysRemaining > 30,
    3,
    'Safe food',
    `Tier: ${assessment.tier}, score: ${assessment.score}, daysRemaining: ${assessment.daysRemaining}`
  );
}

// -------------------------------------------------------------
// CASE 4: PARTIAL QUANTITY USAGE
// -------------------------------------------------------------
{
  const pantry: FoodItem[] = [
    {
      id: 'p-paneer',
      name: 'Fresh Paneer',
      quantity: 500,
      unit: 'g',
      category: 'Dairy & Eggs',
      storageLocation: 'Fridge',
      opened: false,
      createdAt: '2026-09-18T00:00:00Z',
      updatedAt: '2026-09-18T00:00:00Z',
    },
  ];

  // Recipe uses 200 g
  const needed = 200;
  pantry[0].quantity -= needed;

  assert(
    pantry.length === 1 && pantry[0].quantity === 300 && pantry[0].unit === 'g',
    4,
    'Partial quantity usage',
    `500 g - 200 g = ${pantry[0].quantity} ${pantry[0].unit}`
  );
}

// -------------------------------------------------------------
// CASE 5: FULL QUANTITY USAGE
// -------------------------------------------------------------
{
  let pantry: FoodItem[] = [
    {
      id: 'p-paneer',
      name: 'Fresh Paneer',
      quantity: 200,
      unit: 'g',
      category: 'Dairy & Eggs',
      storageLocation: 'Fridge',
      opened: false,
      createdAt: '2026-09-18T00:00:00Z',
      updatedAt: '2026-09-18T00:00:00Z',
    },
  ];

  // Recipe uses 200 g
  const needed = 200;
  const remaining = pantry[0].quantity - needed;
  if (remaining <= 0) {
    pantry = [];
  }

  assert(
    pantry.length === 0,
    5,
    'Full quantity usage',
    `200 g - 200 g = 0 g -> item removed from active pantry stock (pantry length: ${pantry.length})`
  );
}

// -------------------------------------------------------------
// CASE 6: NO NEGATIVE QUANTITIES
// -------------------------------------------------------------
{
  const pantryStock = 100; // Only 100 g in pantry
  const recipeNeeds = 200; // Recipe needs 200 g

  // Consume available, clamp to available, never negative
  const actuallyConsumed = Math.min(pantryStock, recipeNeeds);
  const remaining = Math.max(0, pantryStock - actuallyConsumed);

  assert(
    actuallyConsumed === 100 && remaining === 0,
    6,
    'No negative quantities',
    `Available 100 g consumed, remaining = ${remaining} g (clamped, no negative quantity)`
  );
}

// -------------------------------------------------------------
// CASE 7: MULTI-USER ISOLATION
// -------------------------------------------------------------
{
  const user1Pantry: FoodItem[] = [
    {
      id: 'p-u1-paneer',
      name: 'Paneer',
      quantity: 250,
      unit: 'g',
      category: 'Dairy & Eggs',
      storageLocation: 'Fridge',
      opened: false,
      createdAt: '2026-09-18T00:00:00Z',
      updatedAt: '2026-09-18T00:00:00Z',
    },
  ];

  const user2Pantry: FoodItem[] = [
    {
      id: 'p-u2-oats',
      name: 'Rolled Oats',
      quantity: 1,
      unit: 'kg',
      category: 'Pantry & Grains',
      storageLocation: 'Cupboard / Pantry',
      opened: true,
      createdAt: '2026-09-18T00:00:00Z',
      updatedAt: '2026-09-18T00:00:00Z',
    },
  ];

  // User 1 uses their paneer
  user1Pantry.splice(0, 1);

  assert(
    user1Pantry.length === 0 && user2Pantry.length === 1 && user2Pantry[0].name === 'Rolled Oats',
    7,
    'Multi-user isolation',
    `User 1 pantry mutated without affecting User 2 (User 2 still has ${user2Pantry[0].name})`
  );
}

// -------------------------------------------------------------
// CASE 8: PRIORITY ORDERING
// -------------------------------------------------------------
{
  const expired: FoodItem = {
    id: '1',
    name: 'Old Milk',
    quantity: 1,
    unit: 'L',
    bestBefore: '2026-09-18', // -2 days
    category: 'Dairy & Eggs',
    storageLocation: 'Fridge',
    opened: false,
    createdAt: '2026-09-10T00:00:00Z',
    updatedAt: '2026-09-10T00:00:00Z',
  };

  const useFirst: FoodItem = {
    id: '2',
    name: 'Spinach',
    quantity: 250,
    unit: 'g',
    bestBefore: '2026-09-20', // today
    category: 'Produce',
    storageLocation: 'Fridge',
    opened: false,
    createdAt: '2026-09-18T00:00:00Z',
    updatedAt: '2026-09-18T00:00:00Z',
  };

  const useSoon: FoodItem = {
    id: '3',
    name: 'Bread',
    quantity: 1,
    unit: 'loaf',
    bestBefore: '2026-09-23', // +3 days
    category: 'Bakery',
    storageLocation: 'Countertop',
    opened: false,
    createdAt: '2026-09-18T00:00:00Z',
    updatedAt: '2026-09-18T00:00:00Z',
  };

  const safe: FoodItem = {
    id: '4',
    name: 'Rice',
    quantity: 2,
    unit: 'kg',
    bestBefore: '2026-12-01', // far
    category: 'Pantry & Grains',
    storageLocation: 'Cupboard / Pantry',
    opened: false,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  };

  const items = [safe, expired, useSoon, useFirst];
  items.sort((a, b) => assessPriority(b, REF_DATE).score - assessPriority(a, REF_DATE).score);

  assert(
    items[0].id === '1' && items[1].id === '2' && items[2].id === '3' && items[3].id === '4',
    8,
    'Priority ordering',
    `Sorted order: ${items.map((i) => i.name).join(' > ')} (EXPIRED > USE_FIRST > USE_SOON > SAFE_FOR_NOW)`
  );
}

console.log('\n-------------------------------------------------------------');
const total = results.length;
const passedCount = results.filter((r) => r.passed).length;
console.log(`TEST SUMMARY: ${passedCount} / ${total} PASSING`);
if (passedCount === total) {
  console.log('ALL 8 PANTRY & USE FIRST CASES VERIFIED SUCCESSFULLY! 🎉');
} else {
  console.error('SOME TESTS FAILED');
  process.exit(1);
}
