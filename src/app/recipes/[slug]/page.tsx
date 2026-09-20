'use client';

import React, { useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { RECIPES_DATA } from '@/lib/recipes-data';
import { usePantry } from '@/lib/store';
import { useToast } from '@/components/Toast';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PriorityBadge } from '@/components/PriorityBadge';
import { Modal } from '@/components/Modal';
import { PriorityTier, FoodCategory } from '@/types';
import { FOOD_LIBRARY_CATALOG } from '@/lib/food-library/food-catalog';
import { matchFoodLibrary, normalizeFoodName } from '@/lib/food-library/normalizer';
import { convertQuantity, parseQuantityAndUnit, normalizeUnit } from '@/lib/unitConverter';
import {
  Clock,
  ChefHat,
  Users,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Check,
  Award,
  ArrowRight,
  Utensils,
  ShoppingCart,
} from 'lucide-react';

export default function RecipeDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const { items, markIngredientsUsed, getItemAssessment, addMissingIngredientsToGrocery } = usePantry();
  const { showToast } = useToast();

  const recipe = RECIPES_DATA.find((r) => r.slug === slug);

  const [isMarkingCooked, setIsMarkingCooked] = useState(false);
  const [hasCooked, setHasCooked] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{
    rescuedCount: number;
    rescuedValue: number;
    rescuedWeightKg: number;
  } | null>(null);

  if (!recipe) {
    notFound();
  }

  // Analyze all recipe ingredients against kitchen inventory
  const analyzedIngredients = recipe.ingredients.map((ing) => {
    const matchedLib = matchFoodLibrary(ing.name, FOOD_LIBRARY_CATALOG);
    const targetFoodId = matchedLib?.id;
    const targetNorm = normalizeFoodName(ing.name);

    const parsedReq = parseQuantityAndUnit(ing.amount);
    const reqQty = parsedReq.quantity > 0 ? parsedReq.quantity : 1;
    const reqUnit = parsedReq.unit;

    // Find all matching pantry lots
    const matchingLots = items.filter((item) => {
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

    let totalStockInReqUnit = 0;
    let highestTier: PriorityTier = 'SAFE_FOR_NOW';
    let highestReason = '';
    let primaryName = ing.name;

    if (matchingLots.length > 0) {
      primaryName = matchingLots[0].name;

      matchingLots.forEach((lot) => {
        const lotUnit = normalizeUnit(lot.unit);
        const converted = convertQuantity(lot.quantity, lotUnit, reqUnit);
        totalStockInReqUnit += converted !== null ? converted : lot.quantity;

        const assessment = getItemAssessment(lot);
        if (assessment.tier === 'EXPIRED') {
          highestTier = 'EXPIRED';
          highestReason = assessment.primaryReason;
        } else if (assessment.tier === 'USE_FIRST' && highestTier !== 'EXPIRED') {
          highestTier = 'USE_FIRST';
          highestReason = assessment.primaryReason;
        } else if (assessment.tier === 'USE_SOON' && highestTier === 'SAFE_FOR_NOW') {
          highestTier = 'USE_SOON';
          highestReason = assessment.primaryReason;
        }
      });
    }

    totalStockInReqUnit = Number(totalStockInReqUnit.toFixed(2));

    let status: 'AVAILABLE' | 'PARTIAL' | 'MISSING' = 'MISSING';
    let missingAmountNum = reqQty;

    if (matchingLots.length === 0 || totalStockInReqUnit <= 0) {
      status = 'MISSING';
      missingAmountNum = reqQty;
    } else if (totalStockInReqUnit >= reqQty) {
      status = 'AVAILABLE';
      missingAmountNum = 0;
    } else {
      status = 'PARTIAL';
      missingAmountNum = Number((reqQty - totalStockInReqUnit).toFixed(2));
    }

    return {
      recipeIngName: ing.name,
      recipeAmount: ing.amount,
      reqQty,
      reqUnit,
      status,
      pantryStockQty: totalStockInReqUnit,
      missingAmountNum,
      missingAmountStr: `${missingAmountNum} ${reqUnit}`,
      canonicalFoodId: targetFoodId,
      category: (matchedLib?.category as FoodCategory) || undefined,
      priorityTier: highestTier as PriorityTier,
      primaryReason: highestReason,
      matchedPantryName: primaryName,
    };
  });

  // Items currently available in kitchen (full or partial)
  const pantryIngredients = analyzedIngredients.filter(
    (item) => item.status === 'AVAILABLE' || item.status === 'PARTIAL'
  );

  // Items that still need more stock (missing entirely or partial)
  const neededIngredients = analyzedIngredients.filter(
    (item) => item.status === 'MISSING' || item.status === 'PARTIAL'
  );

  const priorityUsedCount = pantryIngredients.filter(
    (p) => p.priorityTier === 'USE_FIRST' || p.priorityTier === 'USE_SOON'
  ).length;

  const handleMarkCooked = () => {
    if (isMarkingCooked || hasCooked) return;
    setIsMarkingCooked(true);

    try {
      const itemsToMark = pantryIngredients.map((p) => ({
        name: p.matchedPantryName || p.recipeIngName,
        foodId: p.canonicalFoodId,
        amountUsed: p.status === 'PARTIAL' ? p.pantryStockQty : p.reqQty,
        unit: p.reqUnit,
        recipeId: recipe.id,
        recipeName: recipe.name,
      }));

      const result = markIngredientsUsed(itemsToMark);
      setHasCooked(true);
      setSuccessInfo(result);
      showToast(`Recipe logged: ${recipe.name}. Pantry stock updated.`);
    } finally {
      setIsMarkingCooked(false);
    }
  };

  const handleAddMissingToGrocery = () => {
    const itemsToAdd = neededIngredients.map((item) => ({
      name: item.recipeIngName,
      amount: item.missingAmountStr,
      category: item.category,
      foodId: item.canonicalFoodId,
    }));

    const res = addMissingIngredientsToGrocery(recipe, itemsToAdd);
    if (res.addedCount > 0 && res.existingCount > 0) {
      showToast(`Added ${res.addedCount} new and updated ${res.existingCount} existing ingredient(s) in grocery list.`);
    } else if (res.addedCount > 0) {
      showToast(`Added ${res.addedCount} missing ingredient(s) to grocery list.`);
    } else {
      showToast(`Missing ingredients are already updated on your grocery list.`);
    }
  };

  const jsonLdRecipe = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.name,
    image: [recipe.image],
    description: recipe.description,
    totalTime: `PT${recipe.timeMinutes}M`,
    recipeYield: `${recipe.servings} servings`,
    recipeCategory: recipe.category,
    recipeIngredient: recipe.ingredients.map((i) => `${i.amount} ${i.name}`),
    recipeInstructions: recipe.steps.map((step, idx) => ({
      '@type': 'HowToStep',
      name: `Step ${idx + 1}`,
      text: step,
    })),
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdRecipe) }}
      />

      <Breadcrumbs
        items={[
          { label: 'What Can I Eat?', href: '/recipes' },
          { label: recipe.name },
        ]}
      />

      <div className="mt-3 mb-6">
        <Link
          href="/recipes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-[#1A1C1E] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to recipes</span>
        </Link>
      </div>

      {/* Recipe Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="px-2 py-0.5 rounded-xs bg-surface-container text-on-surface-variant text-[11px] font-bold uppercase tracking-wider">
            {recipe.category}
          </span>
          {recipe.isVegetarian && (
            <span className="px-2 py-0.5 rounded-xs bg-primary-fixed text-primary text-[11px] font-bold">
              Vegetarian
            </span>
          )}
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#1A1C1E] tracking-tight leading-tight">
          {recipe.name}
        </h1>

        <p className="text-sm sm:text-base text-on-surface-variant mt-2 max-w-2xl leading-relaxed">
          {recipe.description}
        </p>

        {/* Specs bar */}
        <div className="flex flex-wrap items-center gap-6 mt-6 py-3 px-4 bg-white rounded-xs border border-[#E3E2E6] text-xs sm:text-sm font-medium text-[#1A1C1E]">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-outline" />
            <span>{recipe.timeMinutes} mins total</span>
          </div>
          <span className="text-[#C2C8C0]">|</span>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-outline" />
            <span>{recipe.servings} servings</span>
          </div>
          <span className="text-[#C2C8C0]">|</span>
          <div className="flex items-center gap-1.5">
            <ChefHat className="w-4 h-4 text-outline" />
            <span>{recipe.difficulty} difficulty</span>
          </div>
        </div>
      </div>

      {/* Hero Image */}
      <div className="relative rounded-sm overflow-hidden border border-[#E3E2E6] mb-8 h-72 sm:h-96 w-full bg-[#F4F3F7] shadow-subtle">
        <img
          src={recipe.image}
          alt={recipe.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Food Rescue Highlight Box */}
      {priorityUsedCount > 0 && (
        <div className="p-5 rounded-xs bg-[#FFDBD0] border border-[#F5C2B4] mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
            <div>
              <h2 className="font-serif font-bold text-lg text-secondary">
                High Priority Rescue
              </h2>
              <p className="text-xs sm:text-sm text-[#1A1C1E] mt-0.5">
                This recipe uses <strong>{priorityUsedCount}</strong> ingredients currently prioritized in your pantry.
                Cooking this meal today makes the most of food already in your kitchen before it wilts.
              </p>
            </div>
          </div>

          <button
            onClick={handleMarkCooked}
            disabled={isMarkingCooked || hasCooked || pantryIngredients.length === 0}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-secondary hover:bg-secondary-hover disabled:bg-surface-container text-white font-semibold text-xs sm:text-sm rounded-xs shadow-subtle transition-colors shrink-0 min-h-[40px] cursor-pointer disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            <span>{hasCooked ? 'Meal Logged & Ingredients Used' : isMarkingCooked ? 'Logging...' : 'Mark ingredients as used'}</span>
          </button>
        </div>
      )}

      {/* Ingredients Columns: Already in pantry vs Still needed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* Already in pantry */}
        <div className="bg-white rounded-xs p-6 border border-[#E3E2E6] shadow-subtle">
          <div className="flex items-center justify-between pb-3 border-b border-[#E3E2E6] mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <h3 className="font-serif font-bold text-xl text-[#1A1C1E]">Already in pantry</h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-xs bg-primary-fixed text-primary font-bold">
              {pantryIngredients.length} in stock
            </span>
          </div>

          {pantryIngredients.length > 0 ? (
            <ul className="space-y-3 divide-y divide-[#E3E2E6] text-sm">
              {pantryIngredients.map((item, idx) => (
                <li key={idx} className="pt-3 first:pt-0 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#1A1C1E]">{item.recipeIngName}</span>
                      {item.status === 'AVAILABLE' ? (
                        <span className="px-1.5 py-0.5 rounded-xs bg-primary-fixed text-primary text-[10px] font-bold uppercase tracking-wider">
                          AVAILABLE
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-xs bg-[#FFEDB3] text-[#7A4B00] border border-[#F0D080] text-[10px] font-bold uppercase tracking-wider">
                          PARTIAL
                        </span>
                      )}
                    </div>
                    {item.status === 'AVAILABLE' ? (
                      <span className="text-xs text-on-surface-variant block mt-0.5">
                        Need: {item.recipeAmount} • In pantry: {item.pantryStockQty} {item.reqUnit}
                      </span>
                    ) : (
                      <span className="text-xs text-on-surface-variant block mt-0.5">
                        In pantry: <strong className="text-[#1A1C1E]">{item.pantryStockQty} {item.reqUnit}</strong> • Need <strong className="text-secondary">{item.missingAmountNum} {item.reqUnit} more</strong> (Total: {item.recipeAmount})
                      </span>
                    )}
                  </div>
                  <div className="shrink-0">
                    <PriorityBadge tier={item.priorityTier} size="sm" />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-on-surface-variant py-4">
              None of these ingredients are currently in your kitchen inventory.
            </p>
          )}
        </div>

        {/* Still needed */}
        <div className="bg-white rounded-xs p-6 border border-[#E3E2E6] shadow-subtle">
          <div className="flex items-center justify-between pb-3 border-b border-[#E3E2E6] mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-tertiary" />
              <h3 className="font-serif font-bold text-xl text-[#1A1C1E]">Still needed</h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-xs bg-surface-container text-on-surface-variant font-bold">
              {neededIngredients.length} items
            </span>
          </div>

          {neededIngredients.length > 0 ? (
            <div>
              <ul className="space-y-2.5 divide-y divide-[#E3E2E6] text-sm">
                {neededIngredients.map((item, idx) => (
                  <li key={idx} className="pt-2.5 first:pt-0 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-on-surface-variant">{item.recipeIngName}</span>
                      {item.status === 'PARTIAL' ? (
                        <span className="px-1.5 py-0.5 rounded-xs bg-[#FFEDB3] text-[#7A4B00] border border-[#F0D080] text-[10px] font-bold uppercase tracking-wider">
                          PARTIAL
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-xs bg-surface-container text-outline text-[10px] font-bold uppercase tracking-wider">
                          MISSING
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-outline font-medium">
                      {item.status === 'PARTIAL'
                        ? `Need ${item.missingAmountStr} more`
                        : `Need ${item.recipeAmount}`}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 pt-4 border-t border-[#E3E2E6] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={handleAddMissingToGrocery}
                  className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xs shadow-subtle transition-colors min-h-[36px] cursor-pointer"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>+ Add missing ingredients to grocery list</span>
                </button>
                <Link
                  href="/grocery"
                  className="inline-flex items-center justify-center gap-1 text-xs text-primary hover:text-primary-hover font-semibold py-1 hover:underline"
                >
                  <span>View list</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center">
              <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-1" />
              <p className="text-xs font-semibold text-primary">
                You have all required ingredients in your kitchen!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cooking Instructions */}
      <section className="bg-white rounded-xs p-6 sm:p-8 border border-[#E3E2E6] shadow-subtle mb-10">
        <h3 className="font-serif font-bold text-2xl text-[#1A1C1E] mb-6">Cooking Instructions</h3>
        <ol className="space-y-5">
          {recipe.steps.map((step, index) => (
            <li key={index} className="flex items-start gap-4">
              <span className="w-6 h-6 rounded-xs bg-primary text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                {index + 1}
              </span>
              <p className="text-sm text-[#1A1C1E] leading-relaxed pt-0.5">{step}</p>
            </li>
          ))}
        </ol>

        {/* Cooked Action Button */}
        <div className="mt-8 pt-6 border-t border-[#E3E2E6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-xs text-on-surface-variant">
            Cooked this meal? Mark ingredients as used to update your household impact and pantry stock.
          </p>
          <button
            onClick={handleMarkCooked}
            disabled={isMarkingCooked || hasCooked || pantryIngredients.length === 0}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-hover disabled:bg-surface-container text-white font-semibold text-xs sm:text-sm rounded-xs shadow-subtle transition-colors min-h-[40px] cursor-pointer disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            <span>{hasCooked ? 'Meal Logged & Ingredients Used' : isMarkingCooked ? 'Logging...' : 'Mark ingredients as used'}</span>
          </button>
        </div>
      </section>

      {/* Confirmation Modal */}
      <Modal
        isOpen={successInfo !== null}
        onClose={() => setSuccessInfo(null)}
        title="Recipe Logged & Pantry Updated"
        maxWidth="md"
      >
        <div className="text-center py-2 space-y-4">
          <div className="w-12 h-12 rounded-sm bg-primary-fixed text-primary flex items-center justify-center mx-auto">
            <Award className="w-6 h-6 stroke-[2]" />
          </div>

          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
            Successfully marked ingredients for <strong className="text-[#1A1C1E]">{recipe.name}</strong> as used.
            Your kitchen inventory has been updated.
          </p>

          <div className="grid grid-cols-3 gap-2.5 py-3 border-y border-[#E3E2E6] text-center">
            <div className="bg-surface-container-low p-2.5 rounded-xs border border-[#E3E2E6]">
              <div className="text-[10px] text-outline uppercase font-semibold">Ingredients</div>
              <div className="font-serif font-bold text-base text-[#1A1C1E] mt-0.5">
                {successInfo?.rescuedCount}
              </div>
            </div>
            <div className="bg-surface-container-low p-2.5 rounded-xs border border-[#E3E2E6]">
              <div className="text-[10px] text-outline uppercase font-semibold">Rescued</div>
              <div className="font-serif font-bold text-base text-primary mt-0.5">
                {successInfo?.rescuedWeightKg} kg
              </div>
            </div>
            <div className="bg-surface-container-low p-2.5 rounded-xs border border-[#E3E2E6]">
              <div className="text-[10px] text-outline uppercase font-semibold">Value</div>
              <div className="font-serif font-bold text-base text-secondary mt-0.5">
                ₹{successInfo?.rescuedValue}
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <Link
              href="/impact"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xs min-h-[38px]"
            >
              <span>View My Impact</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => setSuccessInfo(null)}
              className="w-full sm:w-auto px-4 py-2 bg-surface-container hover:bg-surface-container-high text-[#1A1C1E] text-xs font-medium rounded-xs min-h-[38px]"
            >
              Back to Recipe
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
