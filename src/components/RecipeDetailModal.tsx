'use client';

import React, { useState } from 'react';
import {
  X,
  Clock,
  Users,
  Leaf,
  Sparkles,
  Check,
  ShoppingCart,
  ChefHat,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { EvaluatedRecipe } from '@/lib/recipeMatcher';
import { usePantry } from '@/lib/store';
import { useToast } from '@/components/Toast';

interface RecipeDetailModalProps {
  evaluated: EvaluatedRecipe | null;
  isOpen: boolean;
  onClose: () => void;
  onCookCompleted?: () => void;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  evaluated,
  isOpen,
  onClose,
  onCookCompleted,
}) => {
  const { markIngredientsUsed, addMissingIngredientsToGrocery } = usePantry();
  const { showToast } = useToast();

  const [confirmCookOpen, setConfirmCookOpen] = useState(false);
  const [isCooking, setIsCooking] = useState(false);
  const [hasCooked, setHasCooked] = useState(false);
  const [hasAddedToGrocery, setHasAddedToGrocery] = useState(false);

  if (!isOpen || !evaluated) return null;

  const { recipe, stateBadge, evaluatedIngredients } = evaluated;

  const availableIngredients = evaluatedIngredients.filter((i) => i.isAvailable);
  const missingIngredients = evaluatedIngredients.filter((i) => !i.isAvailable);

  const handleCookThis = () => {
    if (isCooking || hasCooked) return;
    setIsCooking(true);

    try {
      const itemsToMark = availableIngredients.map((ing) => ({
        name: ing.pantryItemName || ing.name,
        foodId: ing.foodId,
        amountUsed: ing.reqQty,
        unit: ing.reqUnit,
        recipeId: recipe.id,
        recipeName: recipe.name,
      }));

      const result = markIngredientsUsed(itemsToMark);
      setHasCooked(true);
      setConfirmCookOpen(false);
      showToast(`Recipe logged: ${recipe.name}. ${result.rescuedCount} items deducted from pantry.`);
      if (onCookCompleted) {
        onCookCompleted();
      }
    } finally {
      setIsCooking(false);
    }
  };

  const handleAddMissingToGrocery = () => {
    if (missingIngredients.length === 0 || hasAddedToGrocery) return;

    const itemsToAdd = missingIngredients.map((item) => ({
      name: item.name,
      amount: item.missingAmountStr || '1 item',
      category: item.category,
      foodId: item.foodId,
    }));

    const res = addMissingIngredientsToGrocery(recipe, itemsToAdd);
    setHasAddedToGrocery(true);

    if (res.addedCount > 0 && res.existingCount > 0) {
      showToast(`Added ${res.addedCount} new & updated ${res.existingCount} existing items on your grocery list.`);
    } else if (res.addedCount > 0) {
      showToast(`Added ${res.addedCount} missing ingredient(s) to grocery list.`);
    } else {
      showToast(`Missing ingredients are already on your grocery list.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div
        className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-card border border-[#E2E5E1] overflow-hidden my-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recipe-title"
      >
        {/* Modal Header Media & Close */}
        <div className="relative h-44 sm:h-52 w-full bg-[#F4F3F7] shrink-0">
          <img
            src={recipe.image}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-[#191C1B] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Status badge & title overlay */}
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-full border shadow-2xs ${stateBadge.bg} ${stateBadge.text} ${stateBadge.border}`}
              >
                {stateBadge.label}
              </span>
              {recipe.isVegetarian && (
                <span className="bg-[#191C1B]/80 text-[#8EF3B2] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <Leaf className="w-2.5 h-2.5" />
                  <span>Vegetarian</span>
                </span>
              )}
            </div>
            <h2 id="recipe-title" className="font-serif font-bold text-2xl sm:text-3xl text-white leading-tight">
              {recipe.name}
            </h2>
          </div>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-sm">
          {/* Metadata Row */}
          <div className="flex items-center gap-4 text-xs text-[#5F6762] pb-3 border-b border-[#F2F4F1]">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>{recipe.timeMinutes} mins</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span>{recipe.servings} servings</span>
            </div>
            <span>•</span>
            <span className="font-medium text-[#191C1B]">{recipe.category}</span>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-[#464D48] leading-relaxed">
            {recipe.description}
          </p>

          {/* Confirmation Prompt when Cook This is pressed */}
          {confirmCookOpen && !hasCooked && (
            <div className="p-4 bg-[#E3F2E9] border border-[#C8E6D3] rounded-xl space-y-2.5 animate-fadeIn">
              <div className="flex items-center gap-2 text-primary font-bold text-xs sm:text-sm">
                <ChefHat className="w-4 h-4" />
                <span>Ready to cook this recipe?</span>
              </div>
              <p className="text-xs text-[#2A4336] leading-relaxed">
                We will deduct the available ingredients from your pantry using FIFO (oldest batches first) and record your homecooked meal to your Impact tracker.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCookThis}
                  disabled={isCooking}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isCooking ? 'Logging...' : 'Confirm & Deduct Stock'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmCookOpen(false)}
                  className="px-3 py-2 bg-white hover:bg-[#F2F4F1] text-[#5F6762] font-semibold text-xs rounded-lg border border-[#E2E5E1] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Success banner if already cooked */}
          {hasCooked && (
            <div className="p-3.5 bg-[#E3F2E9] border border-[#C8E6D3] rounded-xl flex items-center gap-2.5 text-primary text-xs font-bold">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Recipe logged! Pantry inventory deducted and impact recorded.</span>
            </div>
          )}

          {/* 2-Column: YOUR PANTRY vs MISSING */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* YOUR PANTRY */}
            <div className="bg-[#FAFBF9] p-3.5 sm:p-4 rounded-xl border border-[#E2E5E1] space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Your Pantry ({availableIngredients.length})</span>
                </h4>
              </div>

              {availableIngredients.length > 0 ? (
                <ul className="space-y-1.5">
                  {availableIngredients.map((ing) => (
                    <li
                      key={ing.name}
                      className="text-xs text-[#191C1B] flex items-start gap-2 py-1 border-b border-[#F2F4F1] last:border-0"
                    >
                      <span className="w-4 h-4 rounded-full bg-[#E3F2E9] text-primary flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                        ✓
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold">{ing.name}</span>
                        <span className="text-[#5F6762] text-[11px] block">
                          {ing.amount} (Have {ing.pantryStockQty} {ing.reqUnit})
                        </span>
                        {ing.isPriority && (
                          <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-extrabold text-[#97472E] bg-[#FFDBD0] px-1.5 py-0.2 rounded-xs">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>Needs attention</span>
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#727972] italic">
                  No ingredients currently matched in your pantry.
                </p>
              )}
            </div>

            {/* MISSING */}
            <div className="bg-[#FAFBF9] p-3.5 sm:p-4 rounded-xl border border-[#E2E5E1] space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#97472E] flex items-center gap-1.5">
                  <span>Missing ({missingIngredients.length})</span>
                </h4>
              </div>

              {missingIngredients.length > 0 ? (
                <ul className="space-y-1.5">
                  {missingIngredients.map((ing) => (
                    <li
                      key={ing.name}
                      className="text-xs text-[#5F6762] flex items-start gap-2 py-1 border-b border-[#F2F4F1] last:border-0"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E57A22] shrink-0 mt-1.5" />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-[#191C1B]">{ing.name}</span>
                        <span className="text-[11px] text-[#727972] block">
                          Need {ing.amount}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-primary font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>You have everything needed for this recipe!</span>
                </p>
              )}
            </div>
          </div>

          {/* Cooking Instructions */}
          <div className="space-y-2.5 pt-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#191C1B]">
              Instructions
            </h4>
            <ol className="space-y-2 list-decimal list-inside text-xs text-[#464D48] leading-relaxed">
              {recipe.steps.map((step, idx) => (
                <li key={idx} className="pl-1">
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Modal Sticky Footer Actions */}
        <div className="p-4 sm:p-5 bg-[#FAFBF9] border-t border-[#E2E5E1] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-[#5F6762] hover:text-[#191C1B] transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* ADD MISSING TO GROCERY */}
            {missingIngredients.length > 0 && (
              <button
                type="button"
                onClick={handleAddMissingToGrocery}
                disabled={hasAddedToGrocery}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold border transition-all cursor-pointer min-h-[40px] ${
                  hasAddedToGrocery
                    ? 'bg-[#E3F2E9] text-primary border-[#C8E6D3]'
                    : 'bg-white hover:bg-[#F2F4F1] text-[#191C1B] border-[#E2E5E1] shadow-2xs'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{hasAddedToGrocery ? 'Added to Grocery ✓' : 'Add Missing to Grocery'}</span>
              </button>
            )}

            {/* COOK THIS */}
            <button
              type="button"
              onClick={() => {
                if (hasCooked) return;
                setConfirmCookOpen(true);
              }}
              disabled={hasCooked || availableIngredients.length === 0}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-2xs min-h-[40px] cursor-pointer ${
                hasCooked
                  ? 'bg-[#E3F2E9] text-primary cursor-default'
                  : availableIngredients.length === 0
                  ? 'bg-[#E2E5E1] text-[#727972] cursor-not-allowed'
                  : 'bg-primary hover:bg-primary-hover text-white'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>{hasCooked ? 'Logged as Cooked ✓' : 'Cook This'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
