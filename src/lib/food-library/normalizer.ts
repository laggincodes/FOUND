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

  const scored = library
    .map((item) => {
      let score = 0;
      const lowerName = item.name.toLowerCase();
      const normName = item.normalizedName.toLowerCase();

      // 1. Exact canonical name match
      if (lowerName === clean || normName === normalizedQuery) {
        score += 150;
      }
      // 2. Canonical name starts with query
      else if (lowerName.startsWith(clean) || normName.startsWith(normalizedQuery)) {
        score += 100;
      }
      // 3. Exact alias match
      else if (item.aliases.some((a) => a.toLowerCase() === clean || normalizeFoodName(a) === normalizedQuery)) {
        score += 85;
      }
      // 4. Any alias starts with query
      else if (item.aliases.some((a) => a.toLowerCase().startsWith(clean))) {
        score += 70;
      }
      // 5. Canonical name contains query word
      else if (lowerName.includes(clean) || normName.includes(normalizedQuery)) {
        score += 55;
      }
      // 6. Alias contains query word
      else if (item.aliases.some((a) => a.toLowerCase().includes(clean))) {
        score += 40;
      }
      // 7. Subcategory or tags match
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
  const results = searchFoodLibrary(input, library, 1);
  return results.length > 0 ? results[0] : null;
}
