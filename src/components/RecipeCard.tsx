'use client';

import React from 'react';
import Link from 'next/link';
import { Recipe, FoodItem } from '@/types';
import { usePantry } from '@/lib/store';
import { Clock, ChefHat, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

import { FOOD_LIBRARY_CATALOG } from '@/lib/food-library/food-catalog';
import { matchFoodLibrary, normalizeFoodName } from '@/lib/food-library/normalizer';

interface RecipeCardProps {
  recipe: Recipe;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  const { items, getItemAssessment } = usePantry();

  // Determine pantry matching status for recipe ingredients
  const matchedPantryItems: { ingredient: string; item: FoodItem; isPriority: boolean }[] = [];
  const missingIngredients: string[] = [];

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

    if (match) {
      const assessment = getItemAssessment(match);
      const isPriority = assessment.tier === 'USE_FIRST' || assessment.tier === 'USE_SOON';
      matchedPantryItems.push({ ingredient: ing.name, item: match, isPriority });
    } else {
      missingIngredients.push(ing.name);
    }
  });

  const priorityIngredientsCount = matchedPantryItems.filter((m) => m.isPriority).length;
  const matchPercent = Math.round((matchedPantryItems.length / recipe.ingredients.length) * 100);

  return (
    <div className="bg-white rounded-md overflow-hidden border border-[#E3E2E6] shadow-subtle hover:border-[#C2C8C0] transition-all flex flex-col justify-between group">
      <div>
        {/* Recipe Image with Priority Rescue Badge */}
        <div className="relative h-48 sm:h-52 w-full bg-[#F4F3F7] overflow-hidden">
          <img
            src={recipe.image}
            alt={recipe.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {priorityIngredientsCount > 0 && (
            <div className="absolute top-3 left-3 bg-secondary text-white text-[11px] font-bold px-2 py-1 rounded-xs shadow-subtle flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              <span>
                Uses {priorityIngredientsCount} priority {priorityIngredientsCount === 1 ? 'ingredient' : 'ingredients'}
              </span>
            </div>
          )}

          <div className="absolute bottom-3 right-3 bg-[#1A1C1E]/80 backdrop-blur-xs text-white text-[11px] font-medium px-2 py-0.5 rounded-xs flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{recipe.timeMinutes} min</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-1.5">
            <span className="font-semibold text-primary">{recipe.category}</span>
            <span>•</span>
            <span>{recipe.difficulty}</span>
            {recipe.isVegetarian && (
              <>
                <span>•</span>
                <span className="text-primary font-medium">Vegetarian</span>
              </>
            )}
          </div>

          <h3 className="font-serif font-bold text-xl text-[#1A1C1E] group-hover:text-primary transition-colors leading-snug">
            {recipe.name}
          </h3>

          <p className="text-xs text-on-surface-variant mt-1.5 line-clamp-2 leading-relaxed">
            {recipe.description}
          </p>

          {/* Ingredient Match Section */}
          <div className="mt-4 pt-3 border-t border-[#E3E2E6] text-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#1A1C1E]">Pantry Match</span>
              <span className="font-bold text-primary">
                {matchedPantryItems.length} of {recipe.ingredients.length} ({matchPercent}%)
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {matchedPantryItems.slice(0, 3).map((m) => (
                <span
                  key={m.ingredient}
                  className={`px-2 py-0.5 rounded-xs font-medium text-[11px] flex items-center gap-1 ${
                    m.isPriority
                      ? 'bg-[#FFDBD0] text-[#97472E] border border-[#F5C2B4]'
                      : 'bg-surface-container text-[#1A1C1E]'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {m.ingredient}
                </span>
              ))}
              {matchedPantryItems.length > 3 && (
                <span className="px-2 py-0.5 rounded-xs bg-[#F4F3F7] text-outline text-[11px]">
                  +{matchedPantryItems.length - 3} more
                </span>
              )}
            </div>

            {missingIngredients.length > 0 && (
              <p className="text-outline text-[11px]">
                Still need: {missingIngredients.slice(0, 3).join(', ')}
                {missingIngredients.length > 3 ? ` +${missingIngredients.length - 3} more` : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-5 pt-0">
        <Link
          href={`/recipes/${recipe.slug}`}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-sm bg-primary text-white hover:bg-primary-hover font-semibold text-xs sm:text-sm transition-colors min-h-[40px]"
          aria-label={`View full recipe for ${recipe.name}`}
        >
          <span>View recipe</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
