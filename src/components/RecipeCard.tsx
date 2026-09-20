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

  const getStatusBadgeStyle = () => {
    switch (state) {
      case 'USE_FIRST':
        return 'bg-[#2D1915] text-[#FF9E90] border-[#482520]';
      case 'COOK_NOW':
        return 'bg-[#16261B] text-[#78B48B] border-[#243F2C]';
      case 'ALMOST_THERE':
        return 'bg-[#282115] text-[#E5B567] border-[#453620]';
      default:
        return 'bg-[#1E2420] text-[#8E968F] border-[#2B342D]';
    }
  };

  return (
    <div
      onClick={() => onSelect(evaluated)}
      className="bg-[#181C19] rounded-sm border border-[#28302A] hover:border-[#38463B] transition-colors flex flex-col justify-between cursor-pointer group overflow-hidden"
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
        <div className="relative h-40 sm:h-44 w-full bg-[#141715] overflow-hidden">
          <img
            src={recipe.image}
            alt={recipe.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
            loading="lazy"
          />

          {/* Decision Status Badge */}
          <div className="absolute top-2.5 left-2.5">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-mono font-medium uppercase tracking-wider px-2 py-0.5 rounded-xs border shadow-subtle ${getStatusBadgeStyle()}`}
            >
              {state === 'USE_FIRST' && <span className="w-1.5 h-1.5 rounded-full bg-[#FF9E90]" />}
              {state === 'COOK_NOW' && <span className="w-1.5 h-1.5 rounded-full bg-[#78B48B]" />}
              {stateBadge.label}
            </span>
          </div>

          {/* Time & Vegetarian Pill */}
          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
            {recipe.isVegetarian && (
              <span className="bg-[#121513]/90 backdrop-blur-xs text-[#78B48B] border border-[#26382C] text-[10px] font-mono px-2 py-0.5 rounded-xs flex items-center gap-0.5">
                <Leaf className="w-2.5 h-2.5" />
                <span>Veg</span>
              </span>
            )}
            <span className="bg-[#121513]/90 backdrop-blur-xs text-[#EFF1EC] border border-[#262E28] text-[10px] font-mono px-2 py-0.5 rounded-xs flex items-center gap-1">
              <Clock className="w-2.5 h-2.5 text-[#8E968F]" />
              <span>{recipe.timeMinutes}m</span>
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-wider text-[#8E968F] mb-1">
            <span className="text-[#78B48B]">
              {recipe.category || 'Kitchen Recipe'}
            </span>
            <span>•</span>
            <span>{recipe.servings} servings</span>
          </div>

          <h3 className="font-serif font-bold text-lg text-[#EFF1EC] group-hover:text-[#93D4A8] transition-colors leading-snug tracking-tight">
            {recipe.name}
          </h3>

          <p className="text-xs text-[#8E968F] font-sans mt-1 line-clamp-2 leading-relaxed">
            {recipe.description}
          </p>

          {/* Ingredient Match Section */}
          <div className="mt-3.5 pt-3 border-t border-[#222824] space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#EFF1EC] text-[11px]">
                {availableCount} / {totalCount} in pantry
              </span>
              <span className="text-[11px] text-[#78B48B]">
                {totalCount > 0 ? Math.round((availableCount / totalCount) * 100) : 0}% matched
              </span>
            </div>

            {/* Contextual Subline */}
            <p
              className={`text-[11px] font-mono truncate ${
                state === 'USE_FIRST'
                  ? 'text-[#FF9E90]'
                  : state === 'COOK_NOW'
                  ? 'text-[#78B48B]'
                  : state === 'ALMOST_THERE'
                  ? 'text-[#E5B567]'
                  : 'text-[#8E968F]'
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
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xs bg-[#1C211D] group-hover:bg-[#252C27] text-[#EFF1EC] border border-[#28302A] font-mono text-xs uppercase tracking-wider transition-colors min-h-[36px] cursor-pointer"
        >
          <span>View Recipe</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#8E968F]" />
        </button>
      </div>
    </div>
  );
};
