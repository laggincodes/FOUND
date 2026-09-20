import { FoodItem, PriorityAssessment, PriorityTier } from '@/types';

// Perishability baseline lookup (0-20)
const PERISHABILITY_MAP: Record<string, number> = {
  // Leafy greens / herbs / raw dairy / delicate berries (High Perishability: 18-20)
  spinach: 20,
  palak: 20,
  coriander: 20,
  lettuce: 20,
  mint: 20,
  cilantro: 20,
  berries: 19,
  strawberries: 19,
  milk: 18,
  paneer: 18,
  fish: 20,
  chicken: 19,
  sprouts: 18,
  mushrooms: 18,

  // Moderate perishability: bread, cut produce, tomatoes, yogurt, tofu (12-16)
  bread: 15,
  tomatoes: 15,
  tomato: 15,
  yogurt: 14,
  curd: 14,
  dahi: 14,
  bananas: 14,
  banana: 14,
  avocado: 14,
  tofu: 14,
  cucumber: 13,
  bellpepper: 13,
  capsicum: 13,
  cauliflower: 12,
  gobi: 12,
  cabbage: 12,
  broccoli: 13,

  // Low perishability: root veggies, citrus, eggs, hard cheese (6-10)
  eggs: 10,
  egg: 10,
  cheese: 9,
  lemon: 8,
  lime: 8,
  potatoes: 7,
  potato: 7,
  aloo: 7,
  onions: 6,
  onion: 6,
  garlic: 6,
  ginger: 7,
  apples: 7,
  apple: 7,
  carrots: 8,
  carrot: 8,

  // Shelf-stable: grains, pasta, flour, canned, spices, oils (0-4)
  rice: 2,
  pasta: 3,
  dal: 3,
  lentils: 3,
  flour: 2,
  atta: 2,
  oats: 2,
  beans: 3,
  chickpeas: 3,
  spices: 1,
  oil: 1,
  sugar: 0,
  salt: 0,
};

export function getPerishabilityScore(name: string, category: string): number {
  const normalized = name.toLowerCase().trim();
  for (const [key, score] of Object.entries(PERISHABILITY_MAP)) {
    if (normalized.includes(key)) {
      return score;
    }
  }

  // Fallback by category
  switch (category) {
    case 'Produce':
      return 15;
    case 'Dairy & Eggs':
      return 14;
    case 'Meat & Protein':
      return 18;
    case 'Bakery':
      return 14;
    case 'Beverages':
      return 10;
    case 'Frozen':
      return 6;
    case 'Canned & Jars':
      return 4;
    case 'Pantry & Grains':
      return 3;
    case 'Spices & Condiments':
      return 1;
    default:
      return 8;
  }
}

/**
 * Parses a YYYY-MM-DD string into year, month (0-indexed), and day
 * without ANY timezone conversion shifting.
 */
export function parseDateOnly(dateStr: string): { year: number; month: number; day: number } | null {
  if (!dateStr) return null;
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length < 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return { year, month, day };
}

/**
 * Calculates calendar days remaining until bestBefore date relative to referenceDate.
 * Avoids UTC/local timezone shift bugs where dates move forward/backward by a day.
 */
export function getDaysRemaining(bestBeforeDateStr?: string, referenceDate: Date = new Date()): number | null {
  if (!bestBeforeDateStr) return null;
  const parsed = parseDateOnly(bestBeforeDateStr);
  if (!parsed) return null;

  const target = new Date(parsed.year, parsed.month, parsed.day, 0, 0, 0, 0);
  const ref = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
    0,
    0,
    0,
    0
  );

  const diffMs = target.getTime() - ref.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function assessPriority(item: FoodItem, referenceDate: Date = new Date()): PriorityAssessment {
  let dateProximityScore = 0;
  const daysRemaining = getDaysRemaining(item.bestBefore, referenceDate);
  const detailedReasons: string[] = [];
  const isExpired = daysRemaining !== null && daysRemaining < 0;

  // 1. Date Proximity (0-60 points)
  if (item.bestBefore && daysRemaining !== null) {
    if (daysRemaining < 0) {
      dateProximityScore = 60;
      detailedReasons.push(
        daysRemaining === -1
          ? 'Best-before date passed yesterday'
          : `${Math.abs(daysRemaining)} days past best-before date`
      );
    } else if (daysRemaining === 0) {
      dateProximityScore = 60;
      detailedReasons.push('Best-before date is today');
    } else if (daysRemaining === 1) {
      dateProximityScore = 55;
      detailedReasons.push('1 day remaining until best-before date');
    } else if (daysRemaining === 2) {
      dateProximityScore = 48;
      detailedReasons.push('2 days remaining until best-before date');
    } else if (daysRemaining <= 4) {
      dateProximityScore = 38;
      detailedReasons.push(`${daysRemaining} days remaining until best-before date`);
    } else if (daysRemaining <= 7) {
      dateProximityScore = 22;
      detailedReasons.push(`${daysRemaining} days until best-before date`);
    } else if (daysRemaining <= 14) {
      dateProximityScore = 10;
      detailedReasons.push('Within 2 weeks of best-before date');
    } else {
      dateProximityScore = 3;
      detailedReasons.push('Best-before date is more than 2 weeks away');
    }
  } else {
    detailedReasons.push('No date entered; prioritized by perishability and state');
  }

  // 2. Perishability (0-20 points)
  const perishabilityScore = getPerishabilityScore(item.name, item.category);
  if (perishabilityScore >= 18) {
    detailedReasons.push('Highly perishable item');
  } else if (perishabilityScore >= 12) {
    detailedReasons.push('Moderately perishable produce or dairy');
  } else if (perishabilityScore <= 3) {
    detailedReasons.push('Shelf-stable staple');
  }

  // 3. Opened status (0-15 points)
  let openedScore = 0;
  if (item.opened) {
    if (perishabilityScore >= 12) {
      openedScore = 15;
      detailedReasons.push('Opened package requires prompt use');
    } else {
      openedScore = 8;
      detailedReasons.push('Opened package');
    }
  }

  // 4. Quantity / Context (0-10 points)
  let quantityScore = 0;
  if (item.quantity >= 3 && perishabilityScore >= 12) {
    quantityScore = 8;
    detailedReasons.push('Large quantity remaining of perishable food');
  } else if (item.quantity >= 5) {
    quantityScore = 4;
  }

  // Combined score (0-100)
  const rawScore = dateProximityScore + perishabilityScore + openedScore + quantityScore;
  const score = isExpired ? 100 : Math.min(100, Math.max(0, rawScore));

  // Determine Tier:
  // EXPIRED: Best before date has passed (< 0)
  // USE FIRST: Due today/tomorrow (score >= 70, or <= 1 day, or opened perishable)
  // USE SOON: Approaching best-before (score >= 40, or 2-4 days left)
  // SAFE FOR NOW: Sufficient time remaining
  let tier: PriorityTier;
  if (isExpired) {
    tier = 'EXPIRED';
  } else if (score >= 70 || (daysRemaining !== null && daysRemaining <= 1) || (item.opened && perishabilityScore >= 18)) {
    tier = 'USE_FIRST';
  } else if (score >= 40 || (daysRemaining !== null && daysRemaining <= 4)) {
    tier = 'USE_SOON';
  } else {
    tier = 'SAFE_FOR_NOW';
  }

  // Determine concise, human-readable primary reason (Zero AI buzzwords)
  let primaryReason = 'Stable for current planning';
  if (isExpired) {
    primaryReason = daysRemaining === -1
      ? 'Best-before date passed yesterday'
      : `Best-before date passed ${Math.abs(daysRemaining!)} days ago`;
  } else if (daysRemaining === 0) {
    primaryReason = 'Best before today';
  } else if (daysRemaining === 1) {
    primaryReason = 'Best before tomorrow';
  } else if (daysRemaining !== null && daysRemaining <= 3) {
    primaryReason = `Approaching best before (${daysRemaining} days left)`;
  } else if (item.opened && perishabilityScore >= 14) {
    primaryReason = 'Opened and highly perishable';
  } else if (daysRemaining !== null && daysRemaining <= 7) {
    primaryReason = `Due within a week (${daysRemaining} days)`;
  } else if (item.opened) {
    primaryReason = 'Opened package needs attention';
  } else if (perishabilityScore >= 18) {
    primaryReason = 'Highly perishable fresh ingredient';
  } else if (perishabilityScore <= 3) {
    primaryReason = 'Shelf-stable pantry staple';
  } else if (item.quantity >= 3 && perishabilityScore >= 12) {
    primaryReason = 'Large quantity to consume';
  }

  return {
    tier,
    score,
    primaryReason,
    detailedReasons,
    daysRemaining,
    perishabilityScore,
    isExpired,
  };
}

