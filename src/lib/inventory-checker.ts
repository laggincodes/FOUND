import {
  FoodItem,
  DurableItem,
  PurchaseHistoryItem,
  SearchMatchResult,
  InventoryDecision,
} from '@/types';
import { assessPriority } from './priority';

/**
 * Pure inventory checking engine for FOUND:
 * "Before you buy it. Find what you already have."
 *
 * Checks query across durable goods and food/consumables,
 * evaluates urgency/expiry, surplus/backup stock, purchase history,
 * and outputs an immediate BUY, USE, or WAIT recommendation.
 */
export function checkItemInventoryPure(
  query: string,
  durableItems: DurableItem[],
  foodItems: FoodItem[],
  purchaseHistory: PurchaseHistoryItem[]
): SearchMatchResult {
  const q = query.trim().toLowerCase();
  if (!q) {
    return {
      query,
      found: false,
      type: 'none',
      name: query,
      category: 'General',
      totalQuantity: 0,
      unit: 'items',
      decision: 'BUY',
      decisionReason: 'Enter an item name to search your inventory.',
      headline: 'Search your home inventory',
      subline: 'Check whether you already have this at home before buying.',
      foodItems: [],
      durableItems: [],
    };
  }

  // 1. Search durable items (notebooks, cables, stationery, electronics, etc.)
  const matchedDurables = durableItems.filter((d) => {
    const dName = d.name.toLowerCase();
    const dCat = d.category.toLowerCase();
    const dNotes = (d.notes || '').toLowerCase();
    // Normalized check for singular/plural
    const qClean = q.replace(/s$/, '');
    const dClean = dName.replace(/s$/, '');

    return (
      dName.includes(q) ||
      q.includes(dName) ||
      dClean.includes(qClean) ||
      qClean.includes(dClean) ||
      dCat.includes(q) ||
      dNotes.includes(q)
    );
  });

  // 2. Search food & consumable items (pantry items)
  const matchedFood = foodItems.filter((f) => {
    const fName = f.name.toLowerCase();
    const fCat = f.category.toLowerCase();
    const fNotes = (f.notes || '').toLowerCase();
    const qClean = q.replace(/s$/, '');
    const fClean = fName.replace(/s$/, '');

    return (
      fName.includes(q) ||
      q.includes(fName) ||
      fClean.includes(qClean) ||
      qClean.includes(fClean) ||
      fCat.includes(q) ||
      fNotes.includes(q)
    );
  });

  const hasDurables = matchedDurables.length > 0;
  const hasFood = matchedFood.length > 0;

  // Not found in either
  if (!hasDurables && !hasFood) {
    return {
      query,
      found: false,
      type: 'none',
      name: query,
      category: 'General',
      totalQuantity: 0,
      unit: 'items',
      decision: 'BUY',
      decisionReason: `No items matching "${query}" found in your pantry or home inventory.`,
      headline: 'Not found in your inventory.',
      subline: "You don't currently have this logged. Feel free to buy or add to your shopping list.",
      foodItems: [],
      durableItems: [],
    };
  }

  // Check past purchase history for spending memory
  let lastPurchasedAt: string | undefined;
  let lastQty: number | undefined;
  let lastPrice: number | undefined;
  let purchaseCount = 0;

  const matchingHist = purchaseHistory.filter((p) => {
    const pName = p.name.toLowerCase();
    const qClean = q.replace(/s$/, '');
    const pClean = pName.replace(/s$/, '');
    return pName.includes(q) || q.includes(pName) || pClean.includes(qClean) || qClean.includes(pClean);
  });

  if (matchingHist.length > 0) {
    const sorted = [...matchingHist].sort(
      (a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
    );
    lastPurchasedAt = sorted[0].purchasedAt;
    lastQty = sorted[0].quantity;
    lastPrice = sorted[0].estimatedPrice;
    purchaseCount = matchingHist.length;
  } else if (hasDurables && matchedDurables[0].purchaseDate) {
    lastPurchasedAt = matchedDurables[0].purchaseDate;
    lastQty = matchedDurables[0].quantity;
    lastPrice = matchedDurables[0].purchasePrice;
    purchaseCount = 1;
  }

  // Durable match only
  if (hasDurables && !hasFood) {
    const totalQty = matchedDurables.reduce((acc, d) => acc + d.quantity, 0);
    const primary = matchedDurables[0];
    const unit = primary.unit || 'pcs';
    const unusedMatch = primary.notes?.match(/(\d+)\s*unused/i);
    const unusedCount = unusedMatch ? unusedMatch[1] : totalQty > 1 ? Math.floor(totalQty / 2) : 0;
    const subline = unusedCount
      ? `${unusedCount} are currently unused (${primary.notes || 'in storage'}).`
      : `${primary.notes || 'In personal inventory.'}`;

    return {
      query,
      found: true,
      type: 'durable',
      name: primary.name,
      category: primary.category,
      totalQuantity: totalQty,
      unit,
      decision: 'WAIT',
      decisionReason: `You already have ${totalQty} ${primary.name}. Check your existing stock before buying more.`,
      headline: `You already have ${totalQty}.`,
      subline,
      foodItems: [],
      durableItems: matchedDurables,
      purchaseMemory: lastPurchasedAt
        ? {
            lastPurchasedAt,
            lastQuantity: lastQty,
            lastPrice,
            purchaseCount: purchaseCount || 1,
          }
        : undefined,
      isBoughtAhead: totalQty >= 3,
    };
  }

  // Food match only
  if (hasFood && !hasDurables) {
    const totalQty = Number(matchedFood.reduce((acc, f) => acc + f.quantity, 0).toFixed(1));
    const primary = matchedFood[0];
    const unit = primary.unit;

    let urgentFoodQty = 0;
    let hasUseFirst = false;
    let hasUseSoon = false;

    matchedFood.forEach((f) => {
      const assess = assessPriority(f);
      if (assess.tier === 'EXPIRED' || assess.tier === 'USE_FIRST') {
        hasUseFirst = true;
        urgentFoodQty += f.quantity;
      } else if (assess.tier === 'USE_SOON') {
        hasUseSoon = true;
        urgentFoodQty += f.quantity;
      }
    });

    const isToothpaste = q.includes('toothpaste') || primary.name.toLowerCase().includes('toothpaste');
    const isBoughtAhead = isToothpaste || totalQty >= 3 || matchedFood.some((f) => !f.opened && f.quantity >= 2);

    let decision: InventoryDecision = 'WAIT';
    let headline = `You already have ${totalQty}${unit}.`;
    let subline = '';

    if (hasUseFirst) {
      decision = 'USE';
      subline = `${urgentFoodQty}${unit} should be used soon.`;
    } else if (hasUseSoon) {
      decision = 'USE';
      subline = `${urgentFoodQty}${unit} needs attention soon.`;
    } else if (isToothpaste) {
      decision = 'WAIT';
      subline = 'BOUGHT AHEAD: You already have extra stock (1 opened, 2 stored).';
    } else if (isBoughtAhead) {
      decision = 'WAIT';
      subline = 'BOUGHT AHEAD: You already have extra stock.';
    } else {
      decision = totalQty <= 0.5 ? 'BUY' : 'WAIT';
      subline = totalQty <= 0.5 ? 'Running low, restock soon.' : 'Safe for now in pantry stock.';
    }

    return {
      query,
      found: true,
      type: 'food',
      name: primary.name,
      category: primary.category,
      totalQuantity: totalQty,
      unit,
      decision,
      decisionReason:
        decision === 'USE'
          ? `You already have ${totalQty}${unit}. Prioritize using existing stock first.`
          : decision === 'WAIT'
          ? `You already have ${totalQty}${unit}. No need to buy right now.`
          : `Stock is low (${totalQty}${unit}). Restock recommended.`,
      headline,
      subline,
      foodItems: matchedFood,
      durableItems: [],
      purchaseMemory: lastPurchasedAt
        ? {
            lastPurchasedAt,
            lastQuantity: lastQty,
            lastPrice,
            purchaseCount,
          }
        : undefined,
      isBoughtAhead,
    };
  }

  // Both match
  const totalDurableQty = matchedDurables.reduce((acc, d) => acc + d.quantity, 0);
  const totalFoodQty = Number(matchedFood.reduce((acc, f) => acc + f.quantity, 0).toFixed(1));

  return {
    query,
    found: true,
    type: 'both',
    name: query,
    category: 'Mixed',
    totalQuantity: totalDurableQty + totalFoodQty,
    unit: 'items',
    decision: 'WAIT',
    decisionReason: `You have ${totalFoodQty} ${matchedFood[0].unit} in pantry and ${totalDurableQty} in durable storage.`,
    headline: `You already have this in your inventory.`,
    subline: `${totalFoodQty} ${matchedFood[0].unit} in kitchen pantry, ${totalDurableQty} items in durable storage.`,
    foodItems: matchedFood,
    durableItems: matchedDurables,
    purchaseMemory: lastPurchasedAt
      ? {
          lastPurchasedAt,
          lastQuantity: lastQty,
          lastPrice,
          purchaseCount,
        }
      : undefined,
    isBoughtAhead: totalDurableQty >= 2 || totalFoodQty >= 2,
  };
}
