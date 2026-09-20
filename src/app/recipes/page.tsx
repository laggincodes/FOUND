'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePantry } from '@/lib/store';
import { RECIPES_DATA } from '@/lib/recipes-data';
import { RecipeCard } from '@/components/RecipeCard';
import { RecipeDetailModal } from '@/components/RecipeDetailModal';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { EmptyState } from '@/components/EmptyState';
import { evaluateRecipe, rankEvaluatedRecipes, EvaluatedRecipe, RecipeMatchState } from '@/lib/recipeMatcher';
import { Recipe } from '@/types';
import {
  UtensilsCrossed,
  Sparkles,
  Package,
  AlertTriangle,
  RotateCw,
  Plus,
  Compass,
  CheckCircle2,
  Clock,
  Search,
} from 'lucide-react';

const CACHE_KEY = 'found_gemini_recipes_cache_v1';

export default function RecipesPage() {
  const { items, getItemAssessment, isHydrated } = usePantry();

  // Recipe catalog state (from Gemini or local fallback)
  const [recipesList, setRecipesList] = useState<Recipe[]>(RECIPES_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [recipeSource, setRecipeSource] = useState<'gemini' | 'fallback' | 'cached'>('cached');
  const [selectedRecipe, setSelectedRecipe] = useState<EvaluatedRecipe | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | RecipeMatchState | 'EXPLORE'>('ALL');
  const [exploreModeInZeroPantry, setExploreModeInZeroPantry] = useState(false);

  // Compute pantry fingerprint to avoid unnecessary Gemini calls
  const pantryFingerprint = useMemo(() => {
    return items
      .map((i) => `${i.name.toLowerCase().trim()}:${i.quantity}:${i.unit}`)
      .sort()
      .join('|');
  }, [items]);

  // Priority items count
  const attentionItems = useMemo(() => {
    return items.filter((i) => {
      const a = getItemAssessment(i);
      return a.tier === 'USE_FIRST' || a.tier === 'USE_SOON' || a.tier === 'EXPIRED';
    });
  }, [items, getItemAssessment]);

  // Fetch or retrieve cached Gemini recipes
  const loadRecipes = useCallback(
    async (forceRefresh = false) => {
      if (items.length === 0) {
        setRecipesList(RECIPES_DATA);
        return;
      }

      // Check session cache first unless force refresh
      if (!forceRefresh) {
        try {
          const cachedRaw = sessionStorage.getItem(CACHE_KEY);
          if (cachedRaw) {
            const cached = JSON.parse(cachedRaw);
            // Cache valid if fingerprint matches and less than 30 minutes old
            if (
              cached.pantryFingerprint === pantryFingerprint &&
              Date.now() - cached.timestamp < 30 * 60 * 1000 &&
              Array.isArray(cached.recipes) &&
              cached.recipes.length > 0
            ) {
              setRecipesList(cached.recipes);
              setRecipeSource('cached');
              return;
            }
          }
        } catch {
          // Ignore cache read failures
        }
      }

      setIsLoading(true);
      try {
        const payload = {
          pantryItems: items.map((i) => {
            const assess = getItemAssessment(i);
            return {
              name: i.name,
              quantity: i.quantity,
              unit: i.unit,
              priority: assess.tier,
            };
          }),
        };

        const res = await fetch('/api/recipes/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        const incoming = Array.isArray(data.recipes) && data.recipes.length > 0 ? data.recipes : RECIPES_DATA;

        setRecipesList(incoming);
        setRecipeSource(data.source === 'gemini' ? 'gemini' : 'fallback');

        // Save to cache
        try {
          sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              pantryFingerprint,
              timestamp: Date.now(),
              recipes: incoming,
              source: data.source,
            })
          );
        } catch {
          // Ignore storage quota errors
        }
      } catch (err) {
        console.warn('Could not fetch Gemini recipes, using local catalog:', err);
        setRecipesList(RECIPES_DATA);
        setRecipeSource('fallback');
      } finally {
        setIsLoading(false);
      }
    },
    [items, pantryFingerprint, getItemAssessment]
  );

  useEffect(() => {
    if (isHydrated) {
      loadRecipes(false);
    }
  }, [isHydrated, loadRecipes]);

  // Pure local evaluation of all recipes against CURRENT pantry inventory
  const evaluatedRecipes = useMemo(() => {
    const evaluated = recipesList.map((recipe) =>
      evaluateRecipe(recipe, items, getItemAssessment)
    );
    return rankEvaluatedRecipes(evaluated);
  }, [recipesList, items, getItemAssessment]);

  // Filtered recipes by search query
  const searchedRecipes = useMemo(() => {
    if (!searchQuery.trim()) return evaluatedRecipes;
    const q = searchQuery.toLowerCase().trim();
    return evaluatedRecipes.filter(({ recipe }) => {
      const matchName = recipe.name.toLowerCase().includes(q);
      const matchDesc = (recipe.description || '').toLowerCase().includes(q);
      const matchIng = recipe.ingredients.some((i) => i.name.toLowerCase().includes(q));
      return matchName || matchDesc || matchIng;
    });
  }, [evaluatedRecipes, searchQuery]);

  // Category counts
  const useFirstCount = useMemo(
    () => evaluatedRecipes.filter((r) => r.state === 'USE_FIRST').length,
    [evaluatedRecipes]
  );
  const cookNowCount = useMemo(
    () => evaluatedRecipes.filter((r) => r.state === 'COOK_NOW').length,
    [evaluatedRecipes]
  );
  const almostThereCount = useMemo(
    () => evaluatedRecipes.filter((r) => r.state === 'ALMOST_THERE').length,
    [evaluatedRecipes]
  );
  const exploreCount = useMemo(
    () => evaluatedRecipes.filter((r) => r.state === 'NEEDS_INGREDIENTS').length,
    [evaluatedRecipes]
  );

  // Filter by active tab
  const displayedRecipes = useMemo(() => {
    if (activeTab === 'ALL') return searchedRecipes;
    if (activeTab === 'EXPLORE') return searchedRecipes.filter((r) => r.state === 'NEEDS_INGREDIENTS');
    return searchedRecipes.filter((r) => r.state === activeTab);
  }, [searchedRecipes, activeTab]);

  // Categorized groups for ALL view
  const useFirstGroup = useMemo(
    () => searchedRecipes.filter((r) => r.state === 'USE_FIRST'),
    [searchedRecipes]
  );
  const cookNowGroup = useMemo(
    () => searchedRecipes.filter((r) => r.state === 'COOK_NOW'),
    [searchedRecipes]
  );
  const almostThereGroup = useMemo(
    () => searchedRecipes.filter((r) => r.state === 'ALMOST_THERE'),
    [searchedRecipes]
  );
  const exploreGroup = useMemo(
    () => searchedRecipes.filter((r) => r.state === 'NEEDS_INGREDIENTS'),
    [searchedRecipes]
  );

  // Zero Pantry Guard
  if (isHydrated && items.length === 0 && !exploreModeInZeroPantry) {
    return (
      <div className="min-h-screen pb-24 overflow-x-hidden bg-[#121513] bg-editorial-pattern text-[#EFF1EC]">
        <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
          <Breadcrumbs items={[{ label: 'What Can I Cook?' }]} />

          <div className="mt-8 max-w-lg mx-auto text-center py-16 px-6 bg-[#181C19] rounded-sm border border-[#28302A]">
            <div className="w-14 h-14 rounded-xs bg-[#1E2420] text-[#78B48B] border border-[#28302A] flex items-center justify-center mx-auto mb-4">
              <UtensilsCrossed className="w-7 h-7 stroke-[1.8]" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#EFF1EC] tracking-tight">
              YOUR PANTRY IS EMPTY
            </h1>
            <p className="text-xs sm:text-sm text-[#8E968F] font-sans mt-2.5 max-w-sm mx-auto leading-relaxed">
              Add a few things you already have and we&apos;ll find recipes you can make.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/add"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xs bg-[#3B6647] hover:bg-[#467854] text-[#EFF1EC] font-mono text-xs uppercase tracking-wider font-medium border border-[#4E805B]/30 shadow-subtle transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Food</span>
              </Link>
              <button
                type="button"
                onClick={() => setExploreModeInZeroPantry(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xs bg-[#1E2420] hover:bg-[#262E28] text-[#EFF1EC] font-mono text-xs uppercase tracking-wider font-medium border border-[#28302A] transition-colors cursor-pointer"
              >
                <Compass className="w-4 h-4 text-[#8E968F]" />
                <span>Explore Recipes</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 overflow-x-hidden bg-[#121513] bg-editorial-pattern text-[#EFF1EC]">
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-8">
        <Breadcrumbs items={[{ label: 'What Can I Cook?' }]} />

        {/* Page Header */}
        <div className="mt-4 mb-6 sm:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-[#1A261E] text-[#78B48B] border border-[#273B2E] text-[10px] font-mono uppercase tracking-widest mb-2 font-medium">
              <UtensilsCrossed className="w-3 h-3" />
              <span>Pantry-Connected Kitchen</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#EFF1EC] tracking-tight">
              WHAT CAN I COOK?
            </h1>
            <p className="text-xs sm:text-sm text-[#8E968F] font-sans mt-1.5 font-medium">
              Use what you already have.
            </p>
          </div>

          {/* Pantry Summary & Refresh Button */}
          <div className="flex items-center flex-wrap gap-2.5 sm:gap-3 bg-[#181C19] p-2.5 sm:p-3 rounded-sm border border-[#28302A] font-mono text-xs">
            <div className="flex items-center gap-2 text-[#EFF1EC]">
              <Package className="w-4 h-4 text-[#78B48B]" />
              <span>
                <strong className="text-[#EFF1EC]">{items.length}</strong> ingredient{items.length === 1 ? '' : 's'} in pantry
              </span>
            </div>

            {attentionItems.length > 0 && (
              <span className="text-[10px] uppercase font-bold text-[#FF9E90] bg-[#2D1915] px-2 py-0.5 rounded-xs border border-[#482520]">
                {attentionItems.length} need attention
              </span>
            )}

            <button
              type="button"
              onClick={() => loadRecipes(true)}
              disabled={isLoading}
              className="ml-auto inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-mono text-[#78B48B] hover:text-[#93D4A8] bg-[#1E2420] hover:bg-[#252D27] px-2.5 py-1.5 rounded-xs border border-[#28302A] transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh recipe suggestions"
            >
              <RotateCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Generating…' : 'Refresh Ideas'}</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-[#181C19] p-3.5 sm:p-4 rounded-sm border border-[#28302A] mb-6 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#5A635B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              placeholder="Search recipes or ingredients (e.g. spinach, paneer, pasta)…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-[#141715] border border-[#28302A] rounded-xs focus:border-[#4B7A58] focus:outline-none text-[#EFF1EC] placeholder-[#5A635B] font-sans"
              aria-label="Search recipes"
            />
          </div>

          {/* Filter Pills with real counts */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-xs font-mono text-xs whitespace-nowrap transition-colors border cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-[#222824] text-[#EFF1EC] border-[#323D35] font-bold'
                  : 'bg-[#1C211D] text-[#8E968F] hover:text-[#EFF1EC] border-[#28302A]'
              }`}
            >
              All ({searchedRecipes.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('USE_FIRST')}
              className={`px-3 py-1.5 rounded-xs font-mono text-xs whitespace-nowrap transition-colors flex items-center gap-1.5 border cursor-pointer ${
                activeTab === 'USE_FIRST'
                  ? 'bg-[#2D1915] text-[#FF9E90] border-[#482520] font-bold'
                  : 'bg-[#1C211D] text-[#8E968F] hover:text-[#EFF1EC] border-[#28302A]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF9E90]" />
              <span>USE FIRST ({useFirstCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('COOK_NOW')}
              className={`px-3 py-1.5 rounded-xs font-mono text-xs whitespace-nowrap transition-colors flex items-center gap-1.5 border cursor-pointer ${
                activeTab === 'COOK_NOW'
                  ? 'bg-[#16261B] text-[#78B48B] border-[#243F2C] font-bold'
                  : 'bg-[#1C211D] text-[#8E968F] hover:text-[#EFF1EC] border-[#28302A]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#78B48B]" />
              <span>COOK NOW ({cookNowCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ALMOST_THERE')}
              className={`px-3 py-1.5 rounded-xs font-mono text-xs whitespace-nowrap transition-colors border cursor-pointer ${
                activeTab === 'ALMOST_THERE'
                  ? 'bg-[#282115] text-[#E5B567] border-[#453620] font-bold'
                  : 'bg-[#1C211D] text-[#8E968F] hover:text-[#EFF1EC] border-[#28302A]'
              }`}
            >
              <span>ALMOST THERE ({almostThereCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('EXPLORE')}
              className={`px-3 py-1.5 rounded-xs font-mono text-xs whitespace-nowrap transition-colors border cursor-pointer ${
                activeTab === 'EXPLORE'
                  ? 'bg-[#222824] text-[#EFF1EC] border-[#323D35] font-bold'
                  : 'bg-[#1C211D] text-[#8E968F] hover:text-[#EFF1EC] border-[#28302A]'
              }`}
            >
              <span>EXPLORE ({exploreCount})</span>
            </button>
          </div>
        </div>

        {/* Loading Banner */}
        {isLoading && (
          <div className="mb-6 p-3.5 rounded-xs bg-[#16261B] border border-[#243F2C] flex items-center gap-3 text-xs font-mono text-[#78B48B]">
            <RotateCw className="w-4 h-4 animate-spin text-[#78B48B] shrink-0" />
            <span>Consulting kitchen intelligence for recipes tailored to your pantry…</span>
          </div>
        )}

        {/* Recipes Display Area */}
        {searchedRecipes.length === 0 ? (
          <div className="bg-[#181C19] rounded-sm border border-[#28302A] p-12 text-center max-w-lg mx-auto my-8">
            <UtensilsCrossed className="w-10 h-10 text-[#5A635B] mx-auto mb-3" />
            <h3 className="font-serif font-bold text-lg text-[#EFF1EC]">No matching recipes found</h3>
            <p className="text-xs text-[#8E968F] font-sans mt-1 max-w-xs mx-auto">
              Try adjusting your search query or switch back to &ldquo;All&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveTab('ALL');
              }}
              className="mt-4 px-4 py-2 rounded-xs bg-[#1E2420] hover:bg-[#262E28] text-[#EFF1EC] text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer border border-[#28302A]"
            >
              Clear filters
            </button>
          </div>
        ) : activeTab === 'ALL' && !searchQuery.trim() ? (
          /* Grouped Sections Layout for "ALL" View */
          <div className="space-y-12">
            {/* 1. USE FIRST SECTION */}
            {useFirstGroup.length > 0 && (
              <section aria-labelledby="use-first-heading">
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#FF9E90]" />
                  <h2 id="use-first-heading" className="font-serif text-xl sm:text-2xl font-bold text-[#EFF1EC] tracking-tight">
                    USE FIRST
                  </h2>
                  <span className="text-xs font-mono text-[#FF9E90] font-bold bg-[#2D1915] border border-[#482520] px-2 py-0.5 rounded-xs">
                    {useFirstGroup.length}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#8E968F] font-sans mb-4">
                  Recipes that prioritize ingredients needing attention before they spoil.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {useFirstGroup.map((evaluated) => (
                    <RecipeCard
                      key={evaluated.recipe.id}
                      evaluated={evaluated}
                      onSelect={(rec) => setSelectedRecipe(rec)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 2. COOK NOW SECTION */}
            {cookNowGroup.length > 0 && (
              <section aria-labelledby="cook-now-heading">
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#78B48B]" />
                  <h2 id="cook-now-heading" className="font-serif text-xl sm:text-2xl font-bold text-[#EFF1EC] tracking-tight">
                    COOK NOW
                  </h2>
                  <span className="text-xs font-mono text-[#78B48B] font-bold bg-[#16261B] border border-[#243F2C] px-2 py-0.5 rounded-xs">
                    {cookNowGroup.length}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#8E968F] font-sans mb-4">
                  Everything needed is already available in your pantry.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {cookNowGroup.map((evaluated) => (
                    <RecipeCard
                      key={evaluated.recipe.id}
                      evaluated={evaluated}
                      onSelect={(rec) => setSelectedRecipe(rec)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 3. ALMOST THERE SECTION */}
            {almostThereGroup.length > 0 && (
              <section aria-labelledby="almost-there-heading">
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#E5B567]" />
                  <h2 id="almost-there-heading" className="font-serif text-xl sm:text-2xl font-bold text-[#EFF1EC] tracking-tight">
                    ALMOST THERE
                  </h2>
                  <span className="text-xs font-mono text-[#E5B567] font-bold bg-[#282115] border border-[#453620] px-2 py-0.5 rounded-xs">
                    {almostThereGroup.length}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#8E968F] font-sans mb-4">
                  Only one or two ingredients missing. Add them to your grocery list with one tap.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {almostThereGroup.map((evaluated) => (
                    <RecipeCard
                      key={evaluated.recipe.id}
                      evaluated={evaluated}
                      onSelect={(rec) => setSelectedRecipe(rec)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 4. EXPLORE SECTION */}
            {exploreGroup.length > 0 && (
              <section aria-labelledby="explore-heading">
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#8E968F]" />
                  <h2 id="explore-heading" className="font-serif text-xl sm:text-2xl font-bold text-[#EFF1EC] tracking-tight">
                    EXPLORE
                  </h2>
                  <span className="text-xs font-mono text-[#8E968F] font-bold bg-[#1C211D] border border-[#28302A] px-2 py-0.5 rounded-xs">
                    {exploreGroup.length}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#8E968F] font-sans mb-4">
                  Other recipe ideas and inspirations for your next kitchen run.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {exploreGroup.map((evaluated) => (
                    <RecipeCard
                      key={evaluated.recipe.id}
                      evaluated={evaluated}
                      onSelect={(rec) => setSelectedRecipe(rec)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          /* Tabbed or Searched Grid Layout */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {displayedRecipes.map((evaluated) => (
              <RecipeCard
                key={evaluated.recipe.id}
                evaluated={evaluated}
                onSelect={(rec) => setSelectedRecipe(rec)}
              />
            ))}
          </div>
        )}

        {/* Recipe Detail Modal */}
        <RecipeDetailModal
          evaluated={selectedRecipe}
          isOpen={Boolean(selectedRecipe)}
          onClose={() => setSelectedRecipe(null)}
          onCookCompleted={() => {
            // Re-evaluate current selected recipe against newly updated pantry
            if (selectedRecipe) {
              const updated = evaluateRecipe(selectedRecipe.recipe, items, getItemAssessment);
              setSelectedRecipe(updated);
            }
          }}
        />
      </main>
    </div>
  );
}
