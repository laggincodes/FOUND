/**
 * Centralized Unit Conversion & Quantity Arithmetic Helper
 * Handles mass, volume, and discrete count units safely.
 * Prevents invalid arithmetic (e.g., 1 L + 2 kg or 500 g + 2 packs).
 */

export interface QuantityCombineResult {
  compatible: boolean;
  quantity: number;
  unit: string;
}

/**
 * Normalizes common variations of units into canonical strings.
 */
export function normalizeUnit(rawUnit?: string): string {
  if (!rawUnit) return 'pcs';
  const trimmed = rawUnit.trim().toLowerCase();

  // Mass
  if (['kg', 'kilo', 'kilos', 'kilogram', 'kilograms', 'kgs'].includes(trimmed)) {
    return 'kg';
  }
  if (['g', 'gram', 'grams', 'gm', 'gms'].includes(trimmed)) {
    return 'g';
  }

  // Volume
  if (['l', 'liter', 'liters', 'litre', 'litres', 'ltr', 'ltrs'].includes(trimmed)) {
    return 'L';
  }
  if (['ml', 'milliliter', 'milliliters', 'milli', 'mls'].includes(trimmed)) {
    return 'ml';
  }

  // Count / Discrete
  if (['pcs', 'pc', 'piece', 'pieces', 'item', 'items', 'count', 'clove', 'cloves', 'medium', 'small', 'head', 'ripe'].includes(trimmed)) {
    return 'pcs';
  }
  if (['pack', 'packs', 'packet', 'packets', 'pkt', 'pkts'].includes(trimmed)) {
    return 'pack';
  }
  if (['bunch', 'bunches'].includes(trimmed)) {
    return 'bunch';
  }
  if (['loaf', 'loaves'].includes(trimmed)) {
    return 'loaf';
  }
  if (['can', 'cans', 'tin', 'tins'].includes(trimmed)) {
    return 'can';
  }
  if (['bottle', 'bottles', 'btl', 'btls'].includes(trimmed)) {
    return 'bottle';
  }
  if (['box', 'boxes'].includes(trimmed)) {
    return 'box';
  }

  // Spoons
  if (['tbsp', 'tablespoon', 'tablespoons'].includes(trimmed)) {
    return 'tbsp';
  }
  if (['tsp', 'teaspoon', 'teaspoons'].includes(trimmed)) {
    return 'tsp';
  }
  if (['cup', 'cups'].includes(trimmed)) {
    return 'cup';
  }

  return rawUnit.trim();
}

/**
 * Converts a numeric quantity from one unit to another compatible unit.
 * Returns null if the units are not compatible.
 */
export function convertQuantity(qty: number, fromUnit: string, toUnit: string): number | null {
  const normFrom = normalizeUnit(fromUnit);
  const normTo = normalizeUnit(toUnit);

  if (normFrom.toLowerCase() === normTo.toLowerCase()) {
    return qty;
  }

  // Mass (kg <-> g)
  if (normFrom === 'kg' && normTo === 'g') return qty * 1000;
  if (normFrom === 'g' && normTo === 'kg') return qty / 1000;

  // Volume (L <-> ml)
  if (normFrom === 'L' && normTo === 'ml') return qty * 1000;
  if (normFrom === 'ml' && normTo === 'L') return qty / 1000;

  // Spoons (tbsp <-> tsp)
  if (normFrom === 'tbsp' && normTo === 'tsp') return qty * 3;
  if (normFrom === 'tsp' && normTo === 'tbsp') return qty / 3;

  return null;
}

/**
 * Parses raw ingredient quantity and unit strings, including fractions.
 * Examples:
 * - "250g" -> { quantity: 250, unit: "g" }
 * - "1/2 tsp" -> { quantity: 0.5, unit: "tsp" }
 * - "1 1/2 cups" -> { quantity: 1.5, unit: "cup" }
 * - "4 cloves" -> { quantity: 4, unit: "pcs" }
 * - "1 medium" -> { quantity: 1, unit: "pcs" }
 * - "to taste" -> { quantity: 1, unit: "to taste" }
 */
export function parseQuantityAndUnit(raw: string): { quantity: number; unit: string } {
  if (!raw) return { quantity: 1, unit: 'pcs' };
  const trimmed = raw.trim();

  // 1. Mixed fraction: "1 1/2 tsp" or "2 1/4 cups"
  const mixedFracMatch = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)\s*(.*)$/);
  if (mixedFracMatch) {
    const whole = parseFloat(mixedFracMatch[1]);
    const num = parseFloat(mixedFracMatch[2]);
    const den = parseFloat(mixedFracMatch[3]);
    const unitStr = mixedFracMatch[4]?.trim() || 'pcs';
    const quantity = den !== 0 ? whole + num / den : whole;
    return { quantity: Number(quantity.toFixed(2)), unit: normalizeUnit(unitStr) };
  }

  // 2. Simple fraction: "1/2 tsp", "3/4 cup"
  const fracMatch = trimmed.match(/^(\d+)\/(\d+)\s*(.*)$/);
  if (fracMatch) {
    const num = parseFloat(fracMatch[1]);
    const den = parseFloat(fracMatch[2]);
    const unitStr = fracMatch[3]?.trim() || 'pcs';
    const quantity = den !== 0 ? num / den : 1;
    return { quantity: Number(quantity.toFixed(2)), unit: normalizeUnit(unitStr) };
  }

  // 3. Decimal or integer: "250g", "1.5 kg", "4 cloves"
  const numMatch = trimmed.match(/^(\d+(\.\d+)?)\s*(.*)$/);
  if (numMatch) {
    const quantity = parseFloat(numMatch[1]);
    const unitStr = numMatch[3]?.trim() || 'pcs';
    return { quantity, unit: normalizeUnit(unitStr) };
  }

  // 4. Non-numeric or descriptive: "to taste", "pinch"
  return { quantity: 1, unit: trimmed };
}

/**
 * Checks if two unit strings can be mathematically combined.
 */
export function areUnitsCompatible(unitA?: string, unitB?: string): boolean {
  const normA = normalizeUnit(unitA);
  const normB = normalizeUnit(unitB);

  // Exact match
  if (normA.toLowerCase() === normB.toLowerCase()) {
    return true;
  }

  // Mass compatibility (g <-> kg)
  if ((normA === 'g' || normA === 'kg') && (normB === 'g' || normB === 'kg')) {
    return true;
  }

  // Volume compatibility (ml <-> L)
  if ((normA === 'ml' || normA === 'L') && (normB === 'ml' || normB === 'L')) {
    return true;
  }

  // Spoon compatibility (tsp <-> tbsp)
  if ((normA === 'tsp' || normA === 'tbsp') && (normB === 'tsp' || normB === 'tbsp')) {
    return true;
  }

  return false;
}

/**
 * Combines two quantities with units safely.
 * Returns null if units are incompatible.
 *
 * Examples:
 * - combineQuantities(1, 'L', 250, 'ml') => { compatible: true, quantity: 1.25, unit: 'L' }
 * - combineQuantities(500, 'g', 1, 'kg') => { compatible: true, quantity: 1.5, unit: 'kg' }
 * - combineQuantities(2, 'pcs', 3, 'pcs') => { compatible: true, quantity: 5, unit: 'pcs' }
 * - combineQuantities(1, 'L', 2, 'kg') => null
 */
export function combineQuantities(
  qtyA: number,
  unitA: string,
  qtyB: number,
  unitB: string
): QuantityCombineResult | null {
  if (!areUnitsCompatible(unitA, unitB)) {
    return null;
  }

  const normA = normalizeUnit(unitA);
  const normB = normalizeUnit(unitB);

  const safeQtyA = typeof qtyA === 'number' && !isNaN(qtyA) ? qtyA : 0;
  const safeQtyB = typeof qtyB === 'number' && !isNaN(qtyB) ? qtyB : 0;

  // 1. Same normalized unit
  if (normA.toLowerCase() === normB.toLowerCase()) {
    return {
      compatible: true,
      quantity: Number((safeQtyA + safeQtyB).toFixed(2)),
      unit: normA,
    };
  }

  // 2. Mass: g & kg
  if ((normA === 'g' || normA === 'kg') && (normB === 'g' || normB === 'kg')) {
    const qtyA_g = normA === 'kg' ? safeQtyA * 1000 : safeQtyA;
    const qtyB_g = normB === 'kg' ? safeQtyB * 1000 : safeQtyB;
    const total_g = qtyA_g + qtyB_g;

    // Prefer kg if either was in kg or if total is >= 1000g
    if (normA === 'kg' || normB === 'kg' || total_g >= 1000) {
      return {
        compatible: true,
        quantity: Number((total_g / 1000).toFixed(2)),
        unit: 'kg',
      };
    } else {
      return {
        compatible: true,
        quantity: Math.round(total_g),
        unit: 'g',
      };
    }
  }

  // 3. Volume: ml & L
  if ((normA === 'ml' || normA === 'L') && (normB === 'ml' || normB === 'L')) {
    const qtyA_ml = normA === 'L' ? safeQtyA * 1000 : safeQtyA;
    const qtyB_ml = normB === 'L' ? safeQtyB * 1000 : safeQtyB;
    const total_ml = qtyA_ml + qtyB_ml;

    // Prefer L if either was in L or if total is >= 1000ml
    if (normA === 'L' || normB === 'L' || total_ml >= 1000) {
      return {
        compatible: true,
        quantity: Number((total_ml / 1000).toFixed(2)),
        unit: 'L',
      };
    } else {
      return {
        compatible: true,
        quantity: Math.round(total_ml),
        unit: 'ml',
      };
    }
  }

  // 4. Spoons: tsp & tbsp
  if ((normA === 'tsp' || normA === 'tbsp') && (normB === 'tsp' || normB === 'tbsp')) {
    const qtyA_tsp = normA === 'tbsp' ? safeQtyA * 3 : safeQtyA;
    const qtyB_tsp = normB === 'tbsp' ? safeQtyB * 3 : safeQtyB;
    const total_tsp = qtyA_tsp + qtyB_tsp;

    if (total_tsp >= 3) {
      return {
        compatible: true,
        quantity: Number((total_tsp / 3).toFixed(2)),
        unit: 'tbsp',
      };
    } else {
      return {
        compatible: true,
        quantity: Number(total_tsp.toFixed(1)),
        unit: 'tsp',
      };
    }
  }

  return null;
}
