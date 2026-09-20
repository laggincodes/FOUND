import { evaluateRecipe, rankEvaluatedRecipes } from '../src/lib/recipeMatcher';
import { FoodItem, Recipe, PriorityAssessment } from '../src/types';
import { RECIPES_DATA } from '../src/lib/recipes-data';

function dummyAssessment(item: FoodItem): PriorityAssessment {
  if (item.name.toLowerCase().includes('spinach')) {
    return {
      tier: 'USE_FIRST',
      score: 90,
      primaryReason: 'Wilting greens need cooking today',
      detailedReasons: ['Wilting greens need cooking today'],
      daysRemaining: 0,
      perishabilityScore: 90,
    };
  }
  if (item.name.toLowerCase().includes('milk')) {
    return {
      tier: 'USE_SOON',
      score: 60,
      primaryReason: 'Use in 2 days',
      detailedReasons: ['Approaching date'],
      daysRemaining: 2,
      perishabilityScore: 60,
    };
  }
  return {
    tier: 'SAFE_FOR_NOW',
    score: 10,
    primaryReason: 'Stable shelf-life',
    detailedReasons: [],
    daysRemaining: 30,
    perishabilityScore: 10,
  };
}

const mockPantry: FoodItem[] = [
  {
    id: 'food-1',
    name: 'Spinach',
    category: 'Produce',
    quantity: 250,
    unit: 'g',
    createdAt: '2026-09-18T10:00:00.000Z',
    updatedAt: '2026-09-18T10:00:00.000Z',
    opened: false,
    storageLocation: 'Fridge',
  },
  {
    id: 'food-2',
    name: 'Paneer',
    category: 'Dairy & Eggs',
    quantity: 200,
    unit: 'g',
    createdAt: '2026-09-18T10:00:00.000Z',
    updatedAt: '2026-09-18T10:00:00.000Z',
    opened: false,
    storageLocation: 'Fridge',
  },
  {
    id: 'food-3',
    name: 'Onions',
    category: 'Produce',
    quantity: 3,
    unit: 'pcs',
    createdAt: '2026-09-18T10:00:00.000Z',
    updatedAt: '2026-09-18T10:00:00.000Z',
    opened: false,
    storageLocation: 'Cupboard / Pantry',
  },
  {
    id: 'food-4',
    name: 'Tomatoes',
    category: 'Produce',
    quantity: 4,
    unit: 'pcs',
    createdAt: '2026-09-18T10:00:00.000Z',
    updatedAt: '2026-09-18T10:00:00.000Z',
    opened: false,
    storageLocation: 'Cupboard / Pantry',
  },
];

console.log('=== VERIFYING RECIPE MATCHING AND RANKING ENGINE ===');

// 1. Evaluate Palak Paneer with Spinach (USE FIRST) and Paneer in stock
const palakPaneer = RECIPES_DATA.find((r) => r.slug === 'palak-paneer')!;
const evalPalak = evaluateRecipe(palakPaneer, mockPantry, dummyAssessment);

console.log(`Palak Paneer evaluated state: ${evalPalak.state}`);
console.log(`Palak Paneer summary: "${evalPalak.summaryText}"`);
console.log(`Available ingredients: ${evalPalak.availableCount}/${evalPalak.totalCount}`);
console.log(`Missing ingredients: ${evalPalak.missingIngredientsList.join(', ')}`);

if (evalPalak.state !== 'USE_FIRST') {
  console.error('❌ FAIL: Expected Palak Paneer to be USE_FIRST because it uses Spinach!');
  process.exit(1);
}
console.log('✅ PASS: Palak Paneer correctly categorized as USE_FIRST');

// 2. Test ranking of all recipes
const allEvaluated = RECIPES_DATA.map((r) => evaluateRecipe(r, mockPantry, dummyAssessment));
const ranked = rankEvaluatedRecipes(allEvaluated);

console.log(`Top ranked recipe: ${ranked[0].recipe.name} (${ranked[0].state})`);
if (ranked[0].state !== 'USE_FIRST') {
  console.error('❌ FAIL: Top ranked recipe must be USE_FIRST!');
  process.exit(1);
}
console.log('✅ PASS: USE FIRST recipes rise to the top of the rankings');

// 3. Test COOK NOW state with fully stocked recipe
const mockCompleteRecipe: Recipe = {
  id: 'test-complete',
  slug: 'test-complete',
  name: 'Simple Tomato Salad',
  description: 'Quick fresh salad',
  image: '',
  timeMinutes: 5,
  difficulty: 'Easy',
  servings: 1,
  category: 'Salad',
  isVegetarian: true,
  ingredients: [
    { name: 'Tomatoes', amount: '2 pcs' },
    { name: 'Onions', amount: '1 pcs' },
  ],
  steps: ['Chop and toss.'],
  tags: ['Quick'],
};

// Safe pantry for this test without priority flag
function safeAssessment(item: FoodItem): PriorityAssessment {
  return {
    tier: 'SAFE_FOR_NOW',
    score: 10,
    primaryReason: 'Stable',
    detailedReasons: [],
    daysRemaining: 30,
    perishabilityScore: 10,
  };
}

const evalComplete = evaluateRecipe(mockCompleteRecipe, mockPantry, safeAssessment);
console.log(`Complete recipe state: ${evalComplete.state}`);
if (evalComplete.state !== 'COOK_NOW') {
  console.error('❌ FAIL: Expected complete recipe to be COOK_NOW!');
  process.exit(1);
}
console.log('✅ PASS: COOK NOW state correctly assigned when all ingredients are available');

// 4. Test ALMOST THERE state (1-2 ingredients missing)
const mockAlmostRecipe: Recipe = {
  id: 'test-almost',
  slug: 'test-almost',
  name: 'Paneer Toast',
  description: 'Toasted bread with paneer',
  image: '',
  timeMinutes: 10,
  difficulty: 'Easy',
  servings: 1,
  category: 'Snack',
  isVegetarian: true,
  ingredients: [
    { name: 'Paneer', amount: '100g' },
    { name: 'Bread', amount: '2 slices' }, // missing in mockPantry
  ],
  steps: ['Toast bread and place paneer.'],
  tags: ['Snack'],
};

const evalAlmost = evaluateRecipe(mockAlmostRecipe, mockPantry, safeAssessment);
console.log(`Almost recipe state: ${evalAlmost.state}, Missing: ${evalAlmost.missingIngredientsList.join(', ')}`);
if (evalAlmost.state !== 'ALMOST_THERE') {
  console.error('❌ FAIL: Expected recipe with 1 missing ingredient to be ALMOST_THERE!');
  process.exit(1);
}
console.log('✅ PASS: ALMOST THERE state correctly identified with missing items list');

console.log('=== ALL RECIPE MATCHER TESTS PASSED! ===');
