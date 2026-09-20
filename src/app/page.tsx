'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePantry } from '@/lib/store';
import { useToast } from '@/components/Toast';
import { FoodCard } from '@/components/FoodCard';
import { RecipeCard } from '@/components/RecipeCard';
import { RECIPES_DATA } from '@/lib/recipes-data';
import { FOOD_LIBRARY_CATALOG } from '@/lib/food-library/food-catalog';
import { matchFoodLibrary, normalizeFoodName } from '@/lib/food-library/normalizer';
import { FoodCategory, StorageLocation } from '@/types';
import {
  Plus,
  ArrowRight,
  ShieldCheck,
  UtensilsCrossed,
  Sparkles,
  Award,
  Package,
  CheckCircle2,
  ShoppingCart,
} from 'lucide-react';

export default function DashboardPage() {
  const {
    items,
    groceryItems,
    recommendations,
    impactMetrics,
    getItemAssessment,
    addItem,
    isHydrated,
  } = usePantry();
  const { showToast } = useToast();

  // 1. PANTRY ATTENTION: Real priority system only (EXPIRED, USE_FIRST, USE_SOON)
  // Safe items are strictly excluded from urgent attention
  const useFirstItems = items.filter((item) => {
    const t = getItemAssessment(item).tier;
    return t === 'USE_FIRST' || t === 'EXPIRED';
  });
  const useSoonItems = items.filter((item) => getItemAssessment(item).tier === 'USE_SOON');

  const attentionItems = useMemo(() => {
    return [...useFirstItems, ...useSoonItems].sort((a, b) => {
      const scoreA = getItemAssessment(a).score;
      const scoreB = getItemAssessment(b).score;
      return scoreB - scoreA;
    });
  }, [useFirstItems, useSoonItems, getItemAssessment]);

  // 2. WHAT CAN I EAT?: Strict pantry availability & priority rescue matching
  // Only recipes matching ingredients currently present in the pantry are shown
  const matchingRecipes = useMemo(() => {
    if (items.length === 0) return [];

    const scored = RECIPES_DATA.map((recipe) => {
      let matchedIngredientsCount = 0;
      let priorityRescuedCount = 0;

      recipe.ingredients.forEach((ing) => {
        const matchedLib = matchFoodLibrary(ing.name, FOOD_LIBRARY_CATALOG);
        const targetFoodId = matchedLib?.id;
        const targetNorm = normalizeFoodName(ing.name);

        const match = items.find((item) => {
          if (targetFoodId && item.foodId && item.foodId === targetFoodId) return true;
          if (normalizeFoodName(item.name) === targetNorm) return true;
          const itemNorm = normalizeFoodName(item.name);
          return (
            itemNorm.includes(targetNorm) ||
            targetNorm.includes(itemNorm) ||
            item.name.toLowerCase().includes(ing.name.toLowerCase()) ||
            ing.name.toLowerCase().includes(item.name.toLowerCase())
          );
        });

        if (match && match.quantity > 0) {
          matchedIngredientsCount++;
          const assessment = getItemAssessment(match);
          if (assessment.tier === 'USE_FIRST' || assessment.tier === 'EXPIRED' || assessment.tier === 'USE_SOON') {
            priorityRescuedCount++;
          }
        }
      });

      const matchRatio = matchedIngredientsCount / recipe.ingredients.length;

      return {
        recipe,
        matchedIngredientsCount,
        priorityRescuedCount,
        matchRatio,
      };
    })
      .filter((entry) => entry.matchedIngredientsCount > 0)
      .sort((a, b) => {
        // Priority 1: Rescues most urgent priority ingredients
        if (b.priorityRescuedCount !== a.priorityRescuedCount) {
          return b.priorityRescuedCount - a.priorityRescuedCount;
        }
        // Priority 2: Highest proportion of ingredients available
        if (b.matchRatio !== a.matchRatio) {
          return b.matchRatio - a.matchRatio;
        }
        // Priority 3: Fastest cooking time
        return a.recipe.timeMinutes - b.recipe.timeMinutes;
      });

    return scored.map((s) => s.recipe);
  }, [items, getItemAssessment]);

  const displayRecipes = matchingRecipes.slice(0, 3);

  // 3. GROCERY: Real unpurchased items
  const unpurchasedGroceries = useMemo(
    () => groceryItems.filter((g) => !g.checked),
    [groceryItems]
  );
  const purchasedGroceries = useMemo(
    () => groceryItems.filter((g) => g.checked),
    [groceryItems]
  );

  // Frequently used household quick-add presets
  const quickAddItems = [
    { name: 'Fresh Spinach', category: 'Produce' as FoodCategory, qty: 1, unit: 'bunch', loc: 'Fridge' as StorageLocation },
    { name: 'Whole Milk', category: 'Dairy & Eggs' as FoodCategory, qty: 1, unit: 'L', loc: 'Fridge' as StorageLocation },
    { name: 'Fresh Paneer', category: 'Dairy & Eggs' as FoodCategory, qty: 200, unit: 'g', loc: 'Fridge' as StorageLocation },
    { name: 'Heirloom Tomatoes', category: 'Produce' as FoodCategory, qty: 500, unit: 'g', loc: 'Fridge' as StorageLocation },
    { name: 'Wholewheat Bread', category: 'Bakery' as FoodCategory, qty: 1, unit: 'loaf', loc: 'Countertop' as StorageLocation },
    { name: 'Farm Eggs', category: 'Dairy & Eggs' as FoodCategory, qty: 6, unit: 'pcs', loc: 'Fridge' as StorageLocation },
    { name: 'Fresh Curd / Yogurt', category: 'Dairy & Eggs' as FoodCategory, qty: 400, unit: 'g', loc: 'Fridge' as StorageLocation },
    { name: 'Fresh Coriander', category: 'Produce' as FoodCategory, qty: 1, unit: 'bunch', loc: 'Fridge' as StorageLocation },
  ];

  const handleQuickAdd = (preset: typeof quickAddItems[0]) => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    const dateStr = d.toISOString().split('T')[0];

    addItem({
      name: preset.name,
      category: preset.category,
      quantity: preset.qty,
      unit: preset.unit,
      storageLocation: preset.loc,
      bestBefore: dateStr,
      opened: false,
      notes: 'Quick-added from dashboard',
    });

    showToast(`Added "${preset.name}" to your pantry.`);
  };

  return (
    <div className="min-h-screen pb-16 overflow-x-hidden">
      {/* Hero Section */}
      <section className="bg-[#FAF9FC] border-b border-[#E3E2E6] pt-8 pb-10 sm:pt-12 sm:pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-[11px] font-bold tracking-widest text-primary uppercase mb-2 block">
              Kitchen Larder & Food Priority
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-[#1A1C1E] tracking-tight leading-tight">
              Use what you have. First.
            </h1>
            <p className="mt-2.5 text-sm sm:text-base lg:text-lg text-on-surface-variant leading-relaxed font-normal">
              Know what needs attention, find something to cook, and make the most of the food already in your home.
            </p>

            {/* Primary Action Buttons */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                href="/add"
                className="inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-hover text-white font-semibold px-5 py-2.5 rounded-xs shadow-subtle hover:shadow-card transition-all text-xs sm:text-sm min-h-[42px] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Food</span>
              </Link>
              <Link
                href="/pantry"
                className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-surface-container border border-[#C2C8C0] text-[#1A1C1E] font-medium px-4 py-2.5 rounded-xs shadow-subtle transition-all text-xs sm:text-sm min-h-[42px]"
              >
                <Package className="w-4 h-4 text-outline" />
                <span>View My Pantry</span>
              </Link>
            </div>
          </div>

          {/* 5-STEP CORE HOUSEHOLD LOOP WORKFLOW STRIP */}
          <div className="mt-8 pt-6 border-t border-[#E3E2E6]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Everyday Household Loop
              </span>
              <span className="text-[11px] text-outline hidden sm:inline">
                Buy → Pantry → Use First → Cook → Impact
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
              <Link
                href="/grocery"
                className="p-3 bg-white hover:bg-[#FAF9FC] border border-[#E3E2E6] hover:border-primary rounded-xs shadow-subtle transition-all flex flex-col justify-between group min-w-0"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-outline group-hover:text-primary">
                    1. Buy
                  </span>
                  <ShoppingCart className="w-3.5 h-3.5 text-outline group-hover:text-primary transition-colors shrink-0" />
                </div>
                <div className="mt-2 min-w-0">
                  <span className="font-semibold text-xs text-[#1A1C1E] block truncate">Grocery List</span>
                  <span className="text-[11px] text-on-surface-variant block truncate">
                    {isHydrated ? `${unpurchasedGroceries.length} to buy` : 'Shopping list'}
                  </span>
                </div>
              </Link>

              <Link
                href="/pantry"
                className="p-3 bg-white hover:bg-[#FAF9FC] border border-[#E3E2E6] hover:border-primary rounded-xs shadow-subtle transition-all flex flex-col justify-between group min-w-0"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-outline group-hover:text-primary">
                    2. Stock
                  </span>
                  <Package className="w-3.5 h-3.5 text-outline group-hover:text-primary transition-colors shrink-0" />
                </div>
                <div className="mt-2 min-w-0">
                  <span className="font-semibold text-xs text-[#1A1C1E] block truncate">Pantry</span>
                  <span className="text-[11px] text-on-surface-variant block truncate">
                    {isHydrated ? `${items.length} items logged` : 'Kitchen inventory'}
                  </span>
                </div>
              </Link>

              <Link
                href="/priority"
                className="p-3 bg-white hover:bg-[#FAF9FC] border border-[#E3E2E6] hover:border-secondary rounded-xs shadow-subtle transition-all flex flex-col justify-between group min-w-0"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-outline group-hover:text-secondary">
                    3. Prioritize
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-secondary transition-colors shrink-0" />
                </div>
                <div className="mt-2 min-w-0">
                  <span className="font-semibold text-xs text-[#1A1C1E] block truncate">Use First</span>
                  <span className="text-[11px] text-on-surface-variant block truncate">
                    {isHydrated ? `${attentionItems.length} urgent` : 'Expiring items'}
                  </span>
                </div>
              </Link>

              <Link
                href="/recipes"
                className="p-3 bg-white hover:bg-[#FAF9FC] border border-[#E3E2E6] hover:border-primary rounded-xs shadow-subtle transition-all flex flex-col justify-between group min-w-0"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-outline group-hover:text-primary">
                    4. Cook
                  </span>
                  <UtensilsCrossed className="w-3.5 h-3.5 text-outline group-hover:text-primary transition-colors shrink-0" />
                </div>
                <div className="mt-2 min-w-0">
                  <span className="font-semibold text-xs text-[#1A1C1E] block truncate">What Can I Eat?</span>
                  <span className="text-[11px] text-on-surface-variant block truncate">
                    {isHydrated ? `${matchingRecipes.length} available` : 'Matched meals'}
                  </span>
                </div>
              </Link>

              <Link
                href="/impact"
                className="col-span-2 sm:col-span-1 p-3 bg-white hover:bg-[#FAF9FC] border border-[#E3E2E6] hover:border-primary rounded-xs shadow-subtle transition-all flex flex-col justify-between group min-w-0"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-outline group-hover:text-primary">
                    5. Track
                  </span>
                  <Award className="w-3.5 h-3.5 text-outline group-hover:text-primary transition-colors shrink-0" />
                </div>
                <div className="mt-2 min-w-0">
                  <span className="font-semibold text-xs text-[#1A1C1E] block truncate">Impact</span>
                  <span className="text-[11px] text-on-surface-variant block truncate">
                    {isHydrated ? `₹${impactMetrics.estimatedFoodValueINR} saved` : 'Food rescued'}
                  </span>
                </div>
              </Link>
            </div>
          </div>

          {/* Quick Add Bar */}
          <div className="mt-6 pt-5 border-t border-[#E3E2E6]">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Quick Add Staples
              </span>
              <span className="text-[11px] text-outline">Tap to log directly into pantry</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar max-w-full">
              {quickAddItems.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handleQuickAdd(preset)}
                  className="px-3 py-1.5 bg-white hover:bg-[#C7ECCE]/40 border border-[#E3E2E6] hover:border-primary text-[#1A1C1E] hover:text-primary rounded-xs text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer shadow-subtle min-h-[34px] shrink-0"
                  title={`Quick add ${preset.name} (${preset.qty} ${preset.unit})`}
                >
                  <Plus className="w-3 h-3 text-primary" />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: Needs your attention */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-2 border-b border-[#E3E2E6] gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1C1E] tracking-tight">
                Needs your attention
              </h2>
              {isHydrated && attentionItems.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-xs bg-[#FFDBD0] text-[#97472E] font-bold">
                  {attentionItems.length} items
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Food requiring prompt culinary attention based on date proximity, opened status, and perishability. Safe items are excluded.
            </p>
          </div>
          <Link
            href="/priority"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover hover:underline shrink-0"
          >
            <span>Full priority board</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {attentionItems.length > 0 ? (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {attentionItems.slice(0, 6).map((item) => (
                <FoodCard key={item.id} item={item} showStitchActions={true} />
              ))}
            </div>
            {attentionItems.length > 6 && (
              <div className="mt-4 text-center">
                <Link
                  href="/priority"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  <span>View all {attentionItems.length} items needing attention on Priority Board</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        ) : items.length === 0 ? (
          /* Empty state for brand new household */
          <div className="p-8 rounded-md bg-white border border-[#E3E2E6] text-center">
            <Package className="w-8 h-8 text-outline mx-auto mb-2" />
            <p className="font-serif font-bold text-lg text-[#1A1C1E]">Your pantry is empty</p>
            <p className="text-xs text-on-surface-variant mt-1 max-w-md mx-auto">
              Add the food you currently have in your kitchen or use the quick-add buttons above to start tracking shelf life and priority.
            </p>
            <div className="mt-4">
              <Link
                href="/add"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xs shadow-subtle transition-colors min-h-[36px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add your first food item</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Populated pantry with no urgent attention items */
          <div className="p-8 rounded-md bg-white border border-[#E3E2E6] text-center">
            <ShieldCheck className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="font-serif font-bold text-lg text-[#1A1C1E]">All clear right now</p>
            <p className="text-xs text-on-surface-variant mt-1">
              All {items.length} items in your pantry are currently fresh and safe for now.
            </p>
            <div className="mt-3">
              <Link
                href="/pantry"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <span>Browse kitchen inventory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: What could you make? */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-2 border-b border-[#E3E2E6] gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1C1E] tracking-tight">
                What could you make?
              </h2>
              {isHydrated && matchingRecipes.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-xs bg-primary-fixed text-primary font-bold">
                  {matchingRecipes.length} available
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Recipes matched strictly against ingredients currently in your pantry, prioritizing food that needs to be used first.
            </p>
          </div>
          <Link
            href="/recipes"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover hover:underline shrink-0"
          >
            <span>Explore all recipes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {displayRecipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        ) : (
          /* Empty state when no recipes match pantry or pantry is empty */
          <div className="p-8 rounded-md bg-white border border-[#E3E2E6] text-center">
            <UtensilsCrossed className="w-8 h-8 text-outline mx-auto mb-2" />
            <p className="font-serif font-bold text-lg text-[#1A1C1E]">
              {items.length === 0 ? 'No pantry items logged yet' : 'No matching recipes found'}
            </p>
            <p className="text-xs text-on-surface-variant mt-1 max-w-md mx-auto">
              {items.length === 0
                ? 'Add the food you currently have in your kitchen to get recipe suggestions tailored to your stock.'
                : 'None of our recipes currently match the ingredients in your pantry. Explore our full library or check your grocery list.'}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
              <Link
                href="/add"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xs shadow-subtle transition-colors min-h-[36px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Food</span>
              </Link>
              <Link
                href="/recipes"
                className="inline-flex items-center gap-1 px-4 py-2 bg-surface-container hover:bg-surface-container-high text-[#1A1C1E] text-xs font-medium rounded-xs transition-colors min-h-[36px]"
              >
                <span>Browse all {RECIPES_DATA.length} recipes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 3: Your shopping list */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-2 border-b border-[#E3E2E6] gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1C1E] tracking-tight">
                Your shopping list
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-xs bg-[#FFDBD0] text-[#97472E] font-bold">
                {isHydrated ? unpurchasedGroceries.length : 0} to buy
                {isHydrated && purchasedGroceries.length > 0 ? ` • ${purchasedGroceries.length} bought` : ''}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Ingredients needed to complete recipes or restock kitchen staples.
            </p>
          </div>
          <Link
            href="/grocery"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover hover:underline shrink-0"
          >
            <span>Open full grocery list</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Dynamic Next Shop Suggestions */}
        {recommendations.length > 0 && (
          <div className="mb-6 p-4 rounded-xs bg-[#FFDBD0]/40 border border-[#F5C2B4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-secondary block">
                  For your next shop
                </span>
                <p className="text-xs sm:text-sm text-[#1A1C1E] mt-0.5">
                  Suggested: <strong>{recommendations.slice(0, 3).map((r) => r.name).join(', ')}</strong>.
                  {' '}{recommendations.length} item{recommendations.length > 1 ? 's' : ''} based on pantry levels and shopping habits.
                </p>
              </div>
            </div>
            <Link
              href="/grocery"
              className="inline-flex items-center gap-1 text-xs font-semibold text-secondary hover:text-secondary-hover shrink-0 self-start sm:self-auto hover:underline"
            >
              <span>View suggestions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {unpurchasedGroceries.length > 0 ? (
          <div className="bg-white rounded-md border border-[#E3E2E6] shadow-subtle divide-y divide-[#E3E2E6]">
            {unpurchasedGroceries.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="p-4 flex items-center justify-between gap-3 hover:bg-[#FAF9FC] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#97472E] shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-[#1A1C1E]">{item.name}</span>
                      <span className="text-xs text-outline font-medium">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                    {item.recipeName && (
                      <span className="text-[11px] text-primary flex items-center gap-1 mt-0.5 truncate">
                        <Sparkles className="w-3 h-3 shrink-0" />
                        <span>Needed for {item.recipeName}</span>
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  href="/grocery"
                  className="text-xs text-on-surface-variant hover:text-primary font-medium px-2.5 py-1 rounded-xs hover:bg-surface-container shrink-0"
                >
                  View in list →
                </Link>
              </div>
            ))}
            <div className="p-3 bg-surface-container-low text-center">
              <Link
                href="/grocery"
                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>Check off items as you buy them</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-md bg-white border border-[#E3E2E6] text-center">
            <CheckCircle2 className="w-6 h-6 text-primary mx-auto mb-1.5" />
            <p className="font-serif font-bold text-base text-[#1A1C1E]">Shopping list is clear</p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {purchasedGroceries.length > 0
                ? 'All current grocery items have been purchased and added to your pantry.'
                : 'All ingredients for your prioritized meals are currently stocked.'}
            </p>
            <div className="mt-3">
              <Link
                href="/grocery"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <span>Manage grocery list</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 4: This week at home */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-2 border-b border-[#E3E2E6] gap-2">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1C1E] tracking-tight">
              This week at home
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Meaningful household-use metrics tracking food consumed rather than forgotten.
            </p>
          </div>
          <Link
            href="/impact"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover hover:underline shrink-0"
          >
            <span>View full impact</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-3.5 sm:p-5 rounded-md border border-[#E3E2E6] shadow-subtle min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block truncate">
              Food items used
            </span>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1C1E] mt-1">
              {isHydrated ? impactMetrics.itemsUsedBeforePriority : 0}
            </div>
            <span className="text-[10px] sm:text-[11px] text-outline mt-0.5 block truncate">Before spoil date</span>
          </div>

          <div className="bg-white p-3.5 sm:p-5 rounded-md border border-[#E3E2E6] shadow-subtle min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block truncate">
              Value protected
            </span>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-primary mt-1 truncate">
              {isHydrated ? `₹${impactMetrics.estimatedFoodValueINR}` : '₹0'}
            </div>
            <span className="text-[10px] sm:text-[11px] text-outline mt-0.5 block truncate">Grocery savings</span>
          </div>

          <div className="bg-white p-3.5 sm:p-5 rounded-md border border-[#E3E2E6] shadow-subtle min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block truncate">
              Cooked meals
            </span>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1C1E] mt-1">
              {isHydrated ? impactMetrics.mealsMadeFromPantry : 0}
            </div>
            <span className="text-[10px] sm:text-[11px] text-outline mt-0.5 block truncate">From pantry staples</span>
          </div>

          <div className="bg-white p-3.5 sm:p-5 rounded-md border border-[#E3E2E6] shadow-subtle min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block truncate">
              Rescued produce
            </span>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#97472E] mt-1 truncate">
              {isHydrated ? `${impactMetrics.estimatedFoodRescuedKg} kg` : '0 kg'}
            </div>
            <span className="text-[10px] sm:text-[11px] text-outline mt-0.5 block truncate">Kitchen utilization</span>
          </div>
        </div>
      </section>
    </div>
  );
}
