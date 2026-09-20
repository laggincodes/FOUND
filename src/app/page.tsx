'use client';

import React from 'react';
import Link from 'next/link';
import { usePantry } from '@/lib/store';
import { useToast } from '@/components/Toast';
import { FoodCard } from '@/components/FoodCard';
import { RecipeCard } from '@/components/RecipeCard';
import { RECIPES_DATA } from '@/lib/recipes-data';
import { PriorityBadge } from '@/components/PriorityBadge';
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

  // Partition pantry items
  const useFirstItems = items.filter((item) => {
    const t = getItemAssessment(item).tier;
    return t === 'USE_FIRST' || t === 'EXPIRED';
  });
  const useSoonItems = items.filter((item) => getItemAssessment(item).tier === 'USE_SOON');
  const attentionItems = [...useFirstItems, ...useSoonItems];

  // Featured recipes that leverage top urgent ingredients
  const priorityNames = attentionItems.map((i) => i.name.toLowerCase());
  const displayRecipes = RECIPES_DATA.filter((recipe) =>
    recipe.ingredients.some((ing) =>
      priorityNames.some((pName) => ing.name.toLowerCase().includes(pName) || pName.includes(ing.name.toLowerCase()))
    )
  ).slice(0, 3);

  const fallbackRecipes = displayRecipes.length > 0 ? displayRecipes : RECIPES_DATA.slice(0, 3);

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
    // Set 2 days from now for perishable presets
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
    <div className="min-h-screen pb-16">
      {/* Hero Section — Exact Stitch design text & actions */}
      <section className="bg-[#FAF9FC] border-b border-[#E3E2E6] pt-10 pb-12 sm:pt-14 sm:pb-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-[11px] font-bold tracking-widest text-primary uppercase mb-2.5 block">
              Kitchen Larder & Food Priority
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1A1C1E] tracking-tight leading-tight">
              Use what you have. First.
            </h1>
            <p className="mt-3 text-base sm:text-lg text-on-surface-variant leading-relaxed max-w-2xl font-normal">
              Know what needs attention, find something to cook, and make the most of the food already in your home.
            </p>

            {/* CTAs */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/add"
                className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white font-semibold px-5 py-2.5 rounded-sm shadow-subtle hover:shadow-card transition-all text-sm min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Food</span>
              </Link>
              <Link
                href="/pantry"
                className="inline-flex items-center gap-1.5 bg-white hover:bg-surface-container border border-[#C2C8C0] text-[#1A1C1E] font-medium px-4 py-2.5 rounded-sm shadow-subtle transition-all text-sm min-h-[44px]"
              >
                <span>View My Pantry</span>
              </Link>
            </div>
          </div>

          {/* Quick Add Bar */}
          <div className="mt-10 pt-6 border-t border-[#E3E2E6]">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Quick Add Frequent Staples
              </span>
              <span className="text-[11px] text-outline">Tap to immediately log in pantry</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              {quickAddItems.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handleQuickAdd(preset)}
                  className="px-3 py-1.5 bg-white hover:bg-[#C7ECCE]/40 border border-[#E3E2E6] hover:border-primary text-[#1A1C1E] hover:text-primary rounded-xs text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer shadow-subtle min-h-[34px]"
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
              <span className="text-xs px-2 py-0.5 rounded-xs bg-[#FFDBD0] text-[#97472E] font-bold">
                {attentionItems.length} items
              </span>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Food requiring prompt culinary attention based on date proximity, opened status, and perishability.
            </p>
          </div>
          <Link
            href="/priority"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover hover:underline"
          >
            <span>Full priority board</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {attentionItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {attentionItems.map((item) => (
              <FoodCard key={item.id} item={item} showStitchActions={true} />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-md bg-white border border-[#E3E2E6] text-center">
            <ShieldCheck className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="font-serif font-bold text-lg text-[#1A1C1E]">All clear right now</p>
            <p className="text-xs text-on-surface-variant mt-1">
              No items in your pantry currently demand immediate rescue.
            </p>
          </div>
        )}
      </section>

      {/* SECTION 2: What could you make? */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-2 border-b border-[#E3E2E6] gap-2">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1C1E] tracking-tight">
              What could you make?
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Recipes recommended from ingredients currently in your pantry and prioritized for use.
            </p>
          </div>
          <Link
            href="/recipes"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover hover:underline"
          >
            <span>Explore all recipes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fallbackRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
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
                {isHydrated ? groceryItems.filter((g) => !g.checked).length : 0} to buy
              </span>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Ingredients needed to complete recipes or restock kitchen staples.
            </p>
          </div>
          <Link
            href="/grocery"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover hover:underline"
          >
            <span>Open full grocery list</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Subtle For your next shop preview */}
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
              <span>View grocery suggestions</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {groceryItems.filter((g) => !g.checked).length > 0 ? (
          <div className="bg-white rounded-md border border-[#E3E2E6] shadow-subtle divide-y divide-[#E3E2E6]">
            {groceryItems
              .filter((g) => !g.checked)
              .slice(0, 4)
              .map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex items-center justify-between gap-3 hover:bg-[#FAF9FC] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#97472E] shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#1A1C1E]">{item.name}</span>
                        <span className="text-xs text-outline font-medium">
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                      {item.recipeName && (
                        <span className="text-[11px] text-primary flex items-center gap-1 mt-0.5">
                          <Sparkles className="w-3 h-3" />
                          <span>Needed for {item.recipeName}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    href="/grocery"
                    className="text-xs text-on-surface-variant hover:text-primary font-medium px-2.5 py-1 rounded-xs hover:bg-surface-container"
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
              All ingredients for your prioritized meals are stocked.
            </p>
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
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover hover:underline"
          >
            <span>View full impact</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-md border border-[#E3E2E6] shadow-subtle">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">
              Food items used
            </span>
            <div className="font-serif text-3xl font-bold text-[#1A1C1E] mt-1">
              {isHydrated ? impactMetrics.itemsUsedBeforePriority : '—'}
            </div>
            <span className="text-[11px] text-outline mt-0.5 block">Used before spoil date</span>
          </div>

          <div className="bg-white p-5 rounded-md border border-[#E3E2E6] shadow-subtle">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">
              Food value protected
            </span>
            <div className="font-serif text-3xl font-bold text-primary mt-1">
              {isHydrated ? `₹${impactMetrics.estimatedFoodValueINR}` : '—'}
            </div>
            <span className="text-[11px] text-outline mt-0.5 block">Estimated grocery savings</span>
          </div>

          <div className="bg-white p-5 rounded-md border border-[#E3E2E6] shadow-subtle">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">
              Homecooked meals
            </span>
            <div className="font-serif text-3xl font-bold text-[#1A1C1E] mt-1">
              {isHydrated ? impactMetrics.mealsMadeFromPantry : '—'}
            </div>
            <span className="text-[11px] text-outline mt-0.5 block">Cooked from pantry staples</span>
          </div>

          <div className="bg-white p-5 rounded-md border border-[#E3E2E6] shadow-subtle">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">
              Weekly utilization
            </span>
            <div className="font-serif text-3xl font-bold text-[#97472E] mt-1">
              {isHydrated ? `${impactMetrics.estimatedFoodRescuedKg} kg` : '—'}
            </div>
            <span className="text-[11px] text-outline mt-0.5 block">Rescued kitchen produce</span>
          </div>
        </div>
      </section>
    </div>
  );
}
