import { evaluateRecipe, rankEvaluatedRecipes } from '../src/lib/recipeMatcher';
import { extractFoodNameFromIngredient, normalizeFoodName, matchFoodLibrary } from '../src/lib/food-library/normalizer';
import { FOOD_LIBRARY_CATALOG } from '../src/lib/food-library/food-catalog';
import { FoodItem, Recipe } from '../src/types';

console.log('=== TEST 1: INGREDIENT EXTRACTION & CATALOG RESOLUTION ===');
const testCases = [
  { raw: 'Fresh Paneer', expectedFoodId: 'food-paneer' },
  { raw: 'paneer', expectedFoodId: 'food-paneer' },
  { raw: 'Paneer, cubed', expectedFoodId: 'food-paneer' },
  { raw: '200g paneer', expectedFoodId: 'food-paneer' },
  { raw: 'Paneer cheese', expectedFoodId: 'food-paneer' },
  { raw: 'Fresh tomato', expectedFoodId: 'food-tomato' },
  { raw: 'tomatoes', expectedFoodId: 'food-tomato' },
  { raw: '2 tomatoes', expectedFoodId: 'food-tomato' },
  { raw: 'chopped tomato', expectedFoodId: 'food-tomato' },
  { raw: '1 medium onion, chopped', expectedFoodId: 'food-onion' },
  { raw: '2 tbsp cooking oil', expectedFoodId: 'food-sunflower-oil' },
  { raw: '1 cup milk', expectedFoodId: 'food-milk-cow' },
];

for (const tc of testCases) {
  const extracted = extractFoodNameFromIngredient(tc.raw);
  const matched = matchFoodLibrary(extracted, FOOD_LIBRARY_CATALOG) || matchFoodLibrary(tc.raw, FOOD_LIBRARY_CATALOG);
  const pass = matched?.id === tc.expectedFoodId;
  if (!pass) {
    throw new Error(`FAIL: "${tc.raw}" resolved to ${matched?.id}, expected ${tc.expectedFoodId}`);
  }
  console.log(`✅ PASS: "${tc.raw}" -> "${extracted}" -> ${matched?.id} (${matched?.name})`);
}

console.log('\n=== TEST 2: DEMO PANTRY (Paneer, Tomato, Milk) CLASSIFICATION ===');
const mockPantry: FoodItem[] = [
  {
    id: 'p-1',
    name: 'Paneer',
    quantity: 200,
    unit: 'g',
    category: 'Dairy & Eggs',
    storageLocation: 'Fridge',
    opened: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-2',
    name: 'Tomato',
    quantity: 3,
    unit: 'pcs',
    category: 'Produce',
    storageLocation: 'Fridge',
    opened: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-3',
    name: 'Milk',
    quantity: 1,
    unit: 'l',
    category: 'Dairy & Eggs',
    storageLocation: 'Fridge',
    opened: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockAssessment = (_item: FoodItem) => ({
  tier: 'SAFE_FOR_NOW' as const,
  score: 10,
  primaryReason: 'Fresh and safe',
  detailedReasons: ['Plenty of days left'],
  daysRemaining: 7,
  perishabilityScore: 2,
});

// Recipe 1: 100% match -> COOK_NOW
const recipeCookNow: Recipe = {
  id: 'r-1',
  slug: 'paneer-tomato-stew',
  name: 'Paneer Tomato Stew',
  description: 'Quick dish',
  image: '',
  category: 'Vegetarian',
  timeMinutes: 15,
  difficulty: 'Easy',
  servings: 2,
  isVegetarian: true,
  tags: ['Quick'],
  ingredients: [
    { name: 'paneer', amount: '200g' },
    { name: 'tomato', amount: '2 pcs' },
  ],
  steps: ['Cook'],
};

const evCookNow = evaluateRecipe(recipeCookNow, mockPantry, mockAssessment);
if (evCookNow.state !== 'COOK_NOW') {
  throw new Error(`FAIL: Expected COOK_NOW, got ${evCookNow.state}`);
}
console.log(`✅ PASS: Recipe with all pantry ingredients classified as COOK_NOW (Match: ${evCookNow.availableCount}/${evCookNow.totalCount})`);

// Recipe 2: 2/5 match (paneer, tomato in pantry; onion, oil, spices missing) -> ALMOST_THERE (Step 5)
const recipeAlmostThere: Recipe = {
  id: 'r-2',
  slug: 'paneer-masala',
  name: 'Paneer Masala',
  description: 'Curry',
  image: '',
  category: 'Vegetarian',
  timeMinutes: 25,
  difficulty: 'Medium',
  servings: 2,
  isVegetarian: true,
  tags: ['Curry'],
  ingredients: [
    { name: 'paneer', amount: '200g' },
    { name: 'tomato', amount: '2 pcs' },
    { name: 'onion', amount: '1 pc' },
    { name: 'cooking oil', amount: '2 tbsp' },
    { name: 'spices', amount: '1 tsp' },
  ],
  steps: ['Cook'],
};

const evAlmostThere = evaluateRecipe(recipeAlmostThere, mockPantry, mockAssessment);
if (evAlmostThere.state !== 'ALMOST_THERE') {
  throw new Error(`FAIL: Expected ALMOST_THERE for Paneer Masala, got ${evAlmostThere.state}`);
}
console.log(`✅ PASS: Paneer Masala (2/5 available) classified as ALMOST_THERE, not EXPLORE (Missing: ${evAlmostThere.missingIngredientsList.join(', ')})`);

// Recipe 3: 0/4 match -> NEEDS_INGREDIENTS (EXPLORE)
const recipeExplore: Recipe = {
  id: 'r-3',
  slug: 'chicken-biryani',
  name: 'Chicken Biryani',
  description: 'Rice dish',
  image: '',
  category: 'Non-Veg',
  timeMinutes: 45,
  difficulty: 'Intermediate',
  servings: 4,
  isVegetarian: false,
  tags: ['Hearty'],
  ingredients: [
    { name: 'chicken', amount: '500g' },
    { name: 'basmati rice', amount: '2 cups' },
    { name: 'yogurt', amount: '1 cup' },
    { name: 'biryani masala', amount: '2 tbsp' },
  ],
  steps: ['Cook'],
};

const evExplore = evaluateRecipe(recipeExplore, mockPantry, mockAssessment);
if (evExplore.state !== 'NEEDS_INGREDIENTS') {
  throw new Error(`FAIL: Expected NEEDS_INGREDIENTS, got ${evExplore.state}`);
}
console.log(`✅ PASS: Unrelated recipe correctly classified as NEEDS_INGREDIENTS / EXPLORE`);

console.log('\n=======================================');
console.log('ALL GEMINI RECIPE MATCHING TESTS PASSED');
console.log('=======================================');
