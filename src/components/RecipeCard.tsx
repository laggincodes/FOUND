'use client';

import React from 'react';
import { Clock, Leaf, Sparkles, Check, ArrowRight } from 'lucide-react';
import { EvaluatedRecipe } from '@/lib/recipeMatcher';

interface RecipeCardProps {
  evaluated: EvaluatedRecipe;
  onSelect: (evaluated: EvaluatedRecipe) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ evaluated, onSelect }) => {
  const { recipe, state, stateBadge, summaryText, availableCount, totalCount } = evaluated;

  return (
    <div
      onClick={() => onSelect(evaluated)}
      className="bg-white rounded-xl border border-[#E2E5E1] shadow-2xs hover:border-[#1B3D2F]/40 hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer group overflow-hidden"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(evaluated);
        }
      }}
      aria-label={`View recipe for ${recipe.name}`}
    >
      <div>
        {/* Card Header Media & Badges */}
        <div className="relative h-40 sm:h-44 w-full bg-[#F4F3F7] overflow-hidden">
          <img
            src={recipe.image}
            alt={recipe.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Decision Status Badge */}
          <div className="absolute top-2.5 left-2.5">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-full border shadow-2xs ${stateBadge.bg} ${stateBadge.text} ${stateBadge.border}`}
            >
              {state === 'USE_FIRST' && <Sparkles className="w-2.5 h-2.5" />}
              {state === 'COOK_NOW' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              {stateBadge.label}
            </span>
          </div>

          {/* Time & Vegetarian Pill */}
          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
            {recipe.isVegetarian && (
              <span className="bg-[#191C1B]/80 backdrop-blur-xs text-[#8EF3B2] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-2xs">
                <Leaf className="w-2.5 h-2.5" />
                <span>Veg</span>
              </span>
            )}
            <span className="bg-[#191C1B]/80 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
              <Clock className="w-2.5 h-2.5" />
              <span>{recipe.timeMinutes} min</span>
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2 text-[11px] text-[#5F6762] mb-1">
            <span className="font-semibold text-primary uppercase tracking-wide text-[10px]">
              {recipe.category || 'Home Meal'}
            </span>
            <span>•</span>
            <span>{recipe.servings} servings</span>
          </div>

          <h3 className="font-serif font-bold text-lg text-[#191C1B] group-hover:text-primary transition-colors leading-snug">
            {recipe.name}
          </h3>

          <p className="text-xs text-[#5F6762] mt-1 line-clamp-2 leading-relaxed">
            {recipe.description}
          </p>

          {/* Ingredient Match Section */}
          <div className="mt-3.5 pt-3 border-t border-[#F2F4F1] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#191C1B] text-[11px]">
                {availableCount} / {totalCount} ingredients
              </span>
              <span className="text-[11px] font-bold text-primary">
                {totalCount > 0 ? Math.round((availableCount / totalCount) * 100) : 0}% in pantry
              </span>
            </div>

            {/* Contextual Subline */}
            <p
              className={`text-[11px] font-medium truncate ${
                state === 'USE_FIRST'
                  ? 'text-[#97472E] font-semibold'
                  : state === 'COOK_NOW'
                  ? 'text-[#1B3D2F]'
                  : state === 'ALMOST_THERE'
                  ? 'text-[#8F5A00]'
                  : 'text-[#5F6762]'
              }`}
            >
              {summaryText}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="p-4 sm:p-5 pt-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(evaluated);
          }}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#F2F4F1] group-hover:bg-primary group-hover:text-white text-[#191C1B] font-semibold text-xs transition-colors min-h-[36px]"
        >
          <span>View Recipe</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
