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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div
        className="relative bg-[#181C19] rounded-sm max-w-2xl w-full max-h-[92vh] flex flex-col border border-[#28302A] overflow-hidden my-auto text-[#EFF1EC]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recipe-title"
      >
        {/* Modal Header Media & Close */}
        <div className="relative h-44 sm:h-52 w-full bg-[#141715] shrink-0">
          <img
            src={recipe.image}
            alt={recipe.name}
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#181C19] via-[#181C19]/40 to-transparent" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-xs bg-[#141715]/80 hover:bg-[#222824] text-[#EFF1EC] border border-[#28302A] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Status badge & title overlay */}
          <div className="absolute bottom-3 left-4 right-4 text-[#EFF1EC]">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-xs border bg-[#1E2420] text-[#EFF1EC] border-[#2B342D]"
              >
                {stateBadge.label}
              </span>
              {recipe.isVegetarian && (
                <span className="bg-[#121513]/90 text-[#78B48B] border border-[#26382C] text-[10px] font-mono px-2 py-0.5 rounded-xs flex items-center gap-0.5">
                  <Leaf className="w-2.5 h-2.5" />
                  <span>Vegetarian</span>
                </span>
              )}
            </div>
            <h2 id="recipe-title" className="font-serif font-bold text-2xl sm:text-3xl text-[#EFF1EC] leading-tight tracking-tight">
              {recipe.name}
            </h2>
          </div>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-sm">
          {/* Metadata Row */}
          <div className="flex items-center gap-4 text-xs font-mono text-[#8E968F] pb-3 border-b border-[#28302A]">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#78B48B]" />
              <span>{recipe.timeMinutes} mins</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#78B48B]" />
              <span>{recipe.servings} servings</span>
            </div>
            <span>•</span>
            <span className="text-[#C4CCC4]">{recipe.category}</span>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-[#8E968F] font-sans leading-relaxed">
            {recipe.description}
          </p>

          {/* Confirmation Prompt when Cook This is pressed */}
          {confirmCookOpen && !hasCooked && (
            <div className="p-4 bg-[#141715] border border-[#28302A] rounded-xs space-y-2.5 animate-fadeIn">
              <div className="flex items-center gap-2 text-[#78B48B] font-mono font-medium text-xs sm:text-sm uppercase tracking-wider">
                <ChefHat className="w-4 h-4" />
                <span>Ready to cook this recipe?</span>
              </div>
              <p className="text-xs text-[#8E968F] font-sans leading-relaxed">
                We will deduct the available ingredients from your pantry using FIFO (oldest batches first) and record your homecooked meal to your Impact tracker.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCookThis}
                  disabled={isCooking}
                  className="px-4 py-2 bg-[#3B6647] hover:bg-[#467854] text-[#EFF1EC] font-mono text-xs uppercase tracking-wider font-medium rounded-xs border border-[#4E805B]/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isCooking ? 'Logging...' : 'Confirm & Deduct Stock'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmCookOpen(false)}
                  className="px-3 py-2 bg-[#1E2420] hover:bg-[#262E28] text-[#8E968F] font-mono text-xs rounded-xs border border-[#28302A] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Success banner if already cooked */}
          {hasCooked && (
            <div className="p-3.5 bg-[#16261B] border border-[#243F2C] rounded-xs flex items-center gap-2.5 text-[#78B48B] text-xs font-mono">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Recipe logged! Pantry inventory deducted and impact recorded.</span>
            </div>
          )}

          {/* 2-Column: YOUR PANTRY vs MISSING */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* YOUR PANTRY */}
            <div className="bg-[#141715] p-3.5 sm:p-4 rounded-xs border border-[#28302A] space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-mono text-xs uppercase tracking-wider text-[#78B48B] flex items-center gap-1.5 font-bold">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Your Pantry ({availableIngredients.length})</span>
                </h4>
              </div>

              {availableIngredients.length > 0 ? (
                <ul className="space-y-1.5">
                  {availableIngredients.map((ing) => (
                    <li
                      key={ing.name}
                      className="text-xs text-[#EFF1EC] flex items-start gap-2 py-1.5 border-b border-[#222824] last:border-0"
                    >
                      <span className="w-4 h-4 rounded-xs bg-[#1A261E] text-[#78B48B] border border-[#273B2E] flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-mono font-bold">
                        ✓
                      </span>
                      <div className="flex-1 min-w-0 font-sans">
                        <span className="font-medium text-[#EFF1EC]">{ing.name}</span>
                        <span className="text-[#8E968F] font-mono text-[11px] block">
                          {ing.amount} (Have {ing.pantryStockQty} {ing.reqUnit})
                        </span>
                        {ing.isPriority && (
                          <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-mono uppercase font-bold text-[#FF9E90] bg-[#2D1915] border border-[#482520] px-1.5 py-0.2 rounded-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF9E90]" />
                            <span>Needs attention</span>
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#5A635B] italic font-sans">
                  No ingredients currently matched in your pantry.
                </p>
              )}
            </div>

            {/* MISSING */}
            <div className="bg-[#141715] p-3.5 sm:p-4 rounded-xs border border-[#28302A] space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-mono text-xs uppercase tracking-wider text-[#E5B567] flex items-center gap-1.5 font-bold">
                  <span>Missing ({missingIngredients.length})</span>
                </h4>
              </div>

              {missingIngredients.length > 0 ? (
                <ul className="space-y-1.5">
                  {missingIngredients.map((ing) => (
                    <li
                      key={ing.name}
                      className="text-xs text-[#8E968F] flex items-start gap-2 py-1.5 border-b border-[#222824] last:border-0"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E5B567] shrink-0 mt-1.5" />
                      <div className="flex-1 min-w-0 font-sans">
                        <span className="font-medium text-[#EFF1EC]">{ing.name}</span>
                        <span className="text-[11px] font-mono text-[#8E968F] block">
                          Need {ing.amount}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#78B48B] font-mono flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>You have everything needed for this recipe!</span>
                </p>
              )}
            </div>
          </div>

          {/* Cooking Instructions */}
          <div className="space-y-2.5 pt-2">
            <h4 className="font-mono text-xs uppercase tracking-wider text-[#EFF1EC]">
              Instructions
            </h4>
            <ol className="space-y-2 list-decimal list-inside text-xs text-[#8E968F] font-sans leading-relaxed">
              {recipe.steps.map((step, idx) => (
                <li key={idx} className="pl-1">
                  <span className="text-[#C4CCC4]">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Modal Sticky Footer Actions */}
        <div className="p-4 sm:p-5 bg-[#141715] border-t border-[#28302A] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-mono text-[#8E968F] hover:text-[#EFF1EC] transition-colors cursor-pointer"
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
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xs text-xs font-mono uppercase tracking-wider border transition-all cursor-pointer min-h-[40px] ${
                  hasAddedToGrocery
                    ? 'bg-[#16261B] text-[#78B48B] border-[#243F2C]'
                    : 'bg-[#1E2420] hover:bg-[#262E28] text-[#EFF1EC] border-[#28302A]'
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
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xs text-xs font-mono uppercase tracking-wider font-medium transition-all min-h-[40px] cursor-pointer ${
                hasCooked
                  ? 'bg-[#16261B] text-[#78B48B] border border-[#243F2C] cursor-default'
                  : availableIngredients.length === 0
                  ? 'bg-[#1E2420] text-[#5A635B] border border-[#28302A] cursor-not-allowed'
                  : 'bg-[#3B6647] hover:bg-[#467854] text-[#EFF1EC] border border-[#4E805B]/30 shadow-subtle'
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
