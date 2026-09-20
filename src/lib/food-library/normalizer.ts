import { FoodLibraryItem } from '@/types';

/**
 * Normalizes a food string for clean comparison without destroying
 * distinctive food qualifiers (e.g. "cherry tomato", "raw banana", "greek yogurt").
 */
export function normalizeFoodName(raw: string): string {
  if (!raw) return '';

  let text = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^\w\s-]/g, ' ') // replace punctuation with spaces
    .replace(/\s+/g, ' ')
    .trim();

  // Strip standalone packaging units only (e.g., "tomatoes 500g pack" -> "tomatoes")
  const packagingTokens = [
    'packet',
    'pack',
    'box',
    'bottle',
    'jar',
    'pouch',
    'tin',
    'can',
  ];

  const words = text.split(' ').filter((w) => !packagingTokens.includes(w) && !/^\d+(\.\d+)?(kg|g|gm|l|ml|pcs)?$/.test(w));
  text = words.join(' ').trim();

  // Gentle singularization for plural search queries (only if length > 4)
  if (text.endsWith('ies') && text.length > 5) {
    text = text.slice(0, -3) + 'y'; // berries -> berry
  } else if (text.endsWith('toes')) {
    text = text.slice(0, -2); // tomatoes -> tomato, potatoes -> potato
  } else if (text.endsWith('s') && !text.endsWith('ss') && !text.endsWith('us') && text.length > 4) {
    // Only strip trailing s if it's clearly a plural noun
    if (!['oats', 'peas', 'beans', 'chips'].includes(text)) {
      text = text.slice(0, -1); // onions -> onion, carrots -> carrot
    }
  }

  return text;
}

/**
 * Extracts the core food name from ingredient strings containing quantities,
 * units, and culinary prep words.
 *
 * Examples:
 * "200g paneer" -> "paneer"
 * "1 medium onion, chopped" -> "onion"
 * "2 tbsp cooking oil" -> "cooking oil"
 * "Paneer, cubed" -> "paneer"
 * "Fresh tomato" -> "tomato"
 * "1 cup milk" -> "milk"
 * "2 tomatoes" -> "tomato"
 */
export function extractFoodNameFromIngredient(raw: string): string {
  if (!raw) return '';

  let text = raw.toLowerCase().trim();

  // 1. Remove parenthetical descriptions like (cubed), (200g), (to taste), (optional)
  text = text.replace(/\(.*?\)/g, ' ').trim();

  // 2. Split on comma (culinary cut/prep instructions usually follow comma)
  // e.g. "Paneer, cubed" -> "Paneer", "1 medium onion, chopped" -> "1 medium onion"
  if (text.includes(',')) {
    const parts = text.split(',');
    if (parts[0].trim().length > 0) {
      text = parts[0].trim();
    }
  }

  // 3. Remove prep verbs/adjectives anywhere in string
  const prepWords = new Set([
    'chopped', 'diced', 'minced', 'sliced', 'cubed', 'grated', 'shredded',
    'peeled', 'crushed', 'pureed', 'cooked', 'boiled', 'roasted', 'fried',
    'blanched', 'steamed', 'mashed', 'melted', 'ground', 'fresh', 'dried',
    'dry', 'ripe', 'unripe', 'raw', 'organic', 'warm', 'cold', 'hot',
    'sweet', 'finely', 'coarsely', 'thinly', 'thickly', 'roughly',
    'to taste', 'as needed', 'optional', 'medium', 'large', 'small',
  ]);

  // 4. Standalone measurement units
  const unitTokens = new Set([
    'cup', 'cups', 'tbsp', 'tbsps', 'tablespoon', 'tablespoons',
    'tsp', 'tsps', 'teaspoon', 'teaspoons', 'g', 'gm', 'gms', 'gram', 'grams',
    'kg', 'kgs', 'kilo', 'kilos', 'kilogram', 'kilograms',
    'ml', 'mls', 'l', 'liter', 'liters', 'litre', 'litres',
    'oz', 'ounce', 'ounces', 'lb', 'lbs', 'pound', 'pounds',
    'pinch', 'pinches', 'clove', 'cloves', 'slice', 'slices',
    'piece', 'pieces', 'pcs', 'bunch', 'bunches', 'can', 'cans',
    'tin', 'tins', 'packet', 'packets', 'pack', 'packs', 'bottle', 'bottles',
    'box', 'boxes', 'handful', 'handfuls', 'drop', 'drops', 'dash', 'dashes',
    'inch', 'inches',
  ]);

  // Replace special characters with spaces
  text = text.replace(/[^a-zA-Z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();

  const words = text.split(' ').filter((w) => {
    if (!w) return false;
    // Strip pure numbers or fractions (e.g. "1", "200", "1/2", "0.5")
    if (/^\d+(\.\d+)?$/.test(w) || /^\d+\/\d+$/.test(w)) return false;
    // Strip number+unit e.g. 200g, 2tbsp, 1cup
    if (/^\d+(\.\d+)?[a-zA-Z]+$/.test(w)) return false;
    // Strip unit words
    if (unitTokens.has(w)) return false;
    // Strip prep words
    if (prepWords.has(w)) return false;
    return true;
  });

  const cleaned = words.join(' ').trim();
  return normalizeFoodName(cleaned || raw);
}

/**
 * Multi-factor search across canonical name, normalized name, and aliases.
 * Ranks exact matches first, then prefix matches, then alias matches.
 * NEVER collapses distinct canonical foods.
 */
export function searchFoodLibrary(
  query: string,
  library: FoodLibraryItem[],
  limit = 12
): FoodLibraryItem[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  const normalizedQuery = normalizeFoodName(clean);
  const extractedQuery = extractFoodNameFromIngredient(clean);

  const scored = library
    .map((item) => {
      let score = 0;
      const lowerName = item.name.toLowerCase();
      const normName = item.normalizedName.toLowerCase();

      // 1. Exact canonical name or normalized match
      if (
        lowerName === clean ||
        normName === normalizedQuery ||
        normName === extractedQuery ||
        lowerName === extractedQuery
      ) {
        score += 150;
      }
      // 2. Exact alias match
      else if (
        item.aliases.some(
          (a) =>
            a.toLowerCase() === clean ||
            normalizeFoodName(a) === normalizedQuery ||
            normalizeFoodName(a) === extractedQuery
        )
      ) {
        score += 120;
      }
      // 3. Canonical name starts with query
      else if (lowerName.startsWith(clean) || normName.startsWith(normalizedQuery)) {
        score += 100;
      }
      // 4. Any alias starts with query
      else if (item.aliases.some((a) => a.toLowerCase().startsWith(clean))) {
        score += 85;
      }
      // 5. Query contains the food's canonical normalized name as a distinct word
      // e.g. "paneer cheese" -> contains "paneer"
      else if (
        new RegExp(`\\b${normName}\\b`, 'i').test(clean) ||
        new RegExp(`\\b${normName}\\b`, 'i').test(extractedQuery)
      ) {
        score += 80;
      }
      // 6. Query contains any alias as a distinct word
      else if (
        item.aliases.some(
          (a) =>
            a.length > 2 &&
            (new RegExp(`\\b${normalizeFoodName(a)}\\b`, 'i').test(clean) ||
              new RegExp(`\\b${normalizeFoodName(a)}\\b`, 'i').test(extractedQuery))
        )
      ) {
        score += 75;
      }
      // 7. Canonical name contains query word
      else if (lowerName.includes(clean) || normName.includes(normalizedQuery)) {
        score += 55;
      }
      // 8. Alias contains query word
      else if (item.aliases.some((a) => a.toLowerCase().includes(clean))) {
        score += 40;
      }
      // 9. Subcategory or tags match
      else if (
        item.subcategory?.toLowerCase().includes(clean) ||
        item.tags?.some((t) => t.toLowerCase() === clean)
      ) {
        score += 25;
      }

      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((entry) => entry.item);
}

/**
 * Finds the closest canonical item for an exact string (used for background matching only).
 */
export function matchFoodLibrary(
  input: string,
  library: FoodLibraryItem[]
): FoodLibraryItem | null {
  if (!input) return null;
  // First search with extracted clean food name
  const extracted = extractFoodNameFromIngredient(input);
  if (extracted) {
    const results = searchFoodLibrary(extracted, library, 1);
    if (results.length > 0) return results[0];
  }
  // Fallback to searching with raw input
  const rawResults = searchFoodLibrary(input, library, 1);
  return rawResults.length > 0 ? rawResults[0] : null;
}

