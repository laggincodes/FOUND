'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePantry } from '@/lib/store';
import { RECIPES_DATA } from '@/lib/recipes-data';
import { RecipeCard } from '@/components/RecipeCard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { EmptyState } from '@/components/EmptyState';
import {
  UtensilsCrossed,
  Filter,
  Sparkles,
  Clock,
  Leaf,
  CheckCircle2,
  Package,
} from 'lucide-react';

export default function RecipesPage() {
  const { items, getItemAssessment, isHydrated } = usePantry();

  // Filter tag states
  const [selectedTag, setSelectedTag] = useState<string | null>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Priority ingredient names in user pantry
  const priorityItems = items.filter((i) => {
    const a = getItemAssessment(i);
    return a.tier === 'USE_FIRST' || a.tier === 'USE_SOON';
  });

  const priorityNames = priorityItems.map((p) => p.name.toLowerCase());

  // Rank recipes:
  // 1. How many priority items it rescues
  // 2. Total pantry match percentage
  // 3. Shortest prep time
  const rankedRecipes = useMemo(() => {
    return RECIPES_DATA.map((recipe) => {
      let priorityMatchCount = 0;
      let totalMatchCount = 0;

      recipe.ingredients.forEach((ing) => {
        const hasMatch = items.some(
          (pItem) =>
            pItem.name.toLowerCase().includes(ing.name.toLowerCase()) ||
            ing.name.toLowerCase().includes(pItem.name.toLowerCase())
        );

        if (hasMatch) {
          totalMatchCount++;
          const hasPriorityMatch = priorityNames.some(
            (pName) =>
              pName.includes(ing.name.toLowerCase()) || ing.name.toLowerCase().includes(pName)
          );
          if (hasPriorityMatch) priorityMatchCount++;
        }
      });

      const matchRatio = totalMatchCount / recipe.ingredients.length;

      return {
        recipe,
        priorityMatchCount,
        totalMatchCount,
        matchRatio,
      };
    })
      .filter(({ recipe, matchRatio }) => {
        // Text search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = recipe.name.toLowerCase().includes(q);
          const matchesIng = recipe.ingredients.some((i) => i.name.toLowerCase().includes(q));
          if (!matchesName && !matchesIng) return false;
        }

        // Tag filter
        if (selectedTag === 'Vegetarian') return recipe.isVegetarian;
        if (selectedTag === 'Under 30 min') return recipe.timeMinutes <= 30;
        if (selectedTag === 'Quick') return recipe.timeMinutes <= 20;
        if (selectedTag === 'Uses what I have') return matchRatio >= 0.3;

        return true;
      })
      .sort((a, b) => {
        // Priority ingredients rescue receives primary relevance
        if (b.priorityMatchCount !== a.priorityMatchCount) {
          return b.priorityMatchCount - a.priorityMatchCount;
        }
        // Then total pantry coverage ratio
        if (b.matchRatio !== a.matchRatio) {
          return b.matchRatio - a.matchRatio;
        }
        // Then quicker prep time
        return a.recipe.timeMinutes - b.recipe.timeMinutes;
      });
  }, [items, priorityNames, searchQuery, selectedTag]);

  const filterTabs = ['All', 'Uses what I have', 'Under 30 min', 'Vegetarian', 'Quick'];

  return (
    <div className="min-h-screen pb-24 overflow-x-hidden bg-[#FBFBFA]">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8">
        <Breadcrumbs items={[{ label: 'Pantry Recipes' }]} />

      {/* Header */}
      <div className="mt-3 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-earth-100 text-ink text-xs font-semibold mb-2.5">
          <UtensilsCrossed className="w-3.5 h-3.5 text-[#C84B31]" />
          <span>Cook With What You Own</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink tracking-tight">
          Pantry Recipes
        </h1>
        <p className="text-sm sm:text-base text-ink-muted mt-2 max-w-2xl leading-relaxed">
          Meals dynamically ranked by the ingredients currently in your pantry.
          Recipes that utilize your <strong className="text-ink">Use First</strong> ingredients appear at the top.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-surface-border shadow-soft mb-8 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search input */}
          <input
            type="search"
            placeholder="Search recipes or ingredients (e.g. spinach, paneer, pasta)…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:max-w-sm px-3.5 py-2 text-sm bg-earth-50/80 border border-surface-border rounded-xl focus:bg-white focus:outline-none"
            aria-label="Search recipes"
          />

          {/* Quick pantry stats */}
          <div className="text-xs text-ink-muted flex items-center gap-2">
            <Package className="w-4 h-4 text-ink-faint" />
            <span>
              Connected to <strong>{items.length}</strong> pantry items
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar pt-2 border-t border-earth-100">
          {filterTabs.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                selectedTag === tag
                  ? 'bg-ink text-white font-semibold'
                  : 'bg-earth-100 text-ink hover:bg-earth-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Recipes Grid */}
      {rankedRecipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rankedRecipes.map(({ recipe }) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={UtensilsCrossed}
          title="No recipes found"
          description="None of our recipes match the current filters. Try selecting 'All' or clearing your search term."
          actionText="Show All Recipes"
          onActionClick={() => {
            setSelectedTag('All');
            setSearchQuery('');
          }}
        />
      )}
      </main>
    </div>
  );
}
