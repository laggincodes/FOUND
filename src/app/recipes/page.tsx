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
      <div className="min-h-screen pb-24 overflow-x-hidden bg-[#FBFBFA]">
        <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
          <Breadcrumbs items={[{ label: 'What Can I Cook?' }]} />

          <div className="mt-8 max-w-lg mx-auto text-center py-16 px-6 bg-white rounded-2xl border border-[#E2E5E1] shadow-2xs">
            <div className="w-16 h-16 rounded-full bg-[#E3F2E9] text-primary flex items-center justify-center mx-auto mb-4">
              <UtensilsCrossed className="w-8 h-8 stroke-[2]" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#191C1B] tracking-tight">
              YOUR PANTRY IS EMPTY
            </h1>
            <p className="text-sm text-[#5F6762] mt-2.5 max-w-sm mx-auto leading-relaxed">
              Add a few things you already have and we&apos;ll find recipes you can make.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/add"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-2xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Food</span>
              </Link>
              <button
                type="button"
                onClick={() => setExploreModeInZeroPantry(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-[#F2F4F1] hover:bg-[#E2E5E1] text-[#191C1B] font-semibold text-xs transition-colors cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Explore Recipes</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 overflow-x-hidden bg-[#FBFBFA]">
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-8">
        <Breadcrumbs items={[{ label: 'What Can I Cook?' }]} />

        {/* Page Header */}
        <div className="mt-4 mb-6 sm:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E3F2E9] text-primary text-xs font-bold mb-2">
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Pantry-Connected Kitchen</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#191C1B] tracking-tight">
              WHAT CAN I COOK?
            </h1>
            <p className="text-sm sm:text-base text-[#5F6762] mt-1.5 font-medium">
              Use what you already have.
            </p>
          </div>

          {/* Pantry Summary & Refresh Button */}
          <div className="flex items-center flex-wrap gap-2.5 sm:gap-3 bg-white p-2.5 sm:p-3 rounded-xl border border-[#E2E5E1] shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-medium text-[#191C1B]">
              <Package className="w-4 h-4 text-primary" />
              <span>
                <strong>{items.length}</strong> ingredient{items.length === 1 ? '' : 's'} in your pantry
              </span>
            </div>

            {attentionItems.length > 0 && (
              <span className="text-[11px] font-bold text-[#97472E] bg-[#FFDBD0] px-2 py-0.5 rounded-full border border-[#F5C2B4]">
                {attentionItems.length} need using soon
              </span>
            )}

            <button
              type="button"
              onClick={() => loadRecipes(true)}
              disabled={isLoading}
              className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary-hover bg-[#E3F2E9] hover:bg-[#D5EADF] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh AI recipe suggestions"
            >
              <RotateCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Generating…' : 'Refresh Ideas'}</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E2E5E1] shadow-2xs mb-6 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#727972] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              placeholder="Search recipes or ingredients (e.g. spinach, paneer, pasta)…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-[#FAFBF9] border border-[#E2E5E1] rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-[#191C1B]"
              aria-label="Search recipes"
            />
          </div>

          {/* Filter Pills with real counts */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-primary text-white shadow-2xs'
                  : 'bg-[#F2F4F1] text-[#5F6762] hover:text-[#191C1B]'
              }`}
            >
              All ({searchedRecipes.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('USE_FIRST')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'USE_FIRST'
                  ? 'bg-[#FFDBD0] text-[#97472E] border border-[#F5C2B4] font-bold shadow-2xs'
                  : 'bg-[#F2F4F1] text-[#5F6762] hover:text-[#191C1B]'
              }`}
            >
              <Sparkles className="w-3 h-3 text-[#97472E]" />
              <span>USE FIRST ({useFirstCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('COOK_NOW')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'COOK_NOW'
                  ? 'bg-[#E3F2E9] text-[#1B3D2F] border border-[#C8E6D3] font-bold shadow-2xs'
                  : 'bg-[#F2F4F1] text-[#5F6762] hover:text-[#191C1B]'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-[#1B3D2F]" />
              <span>COOK NOW ({cookNowCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ALMOST_THERE')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'ALMOST_THERE'
                  ? 'bg-[#FEF3D6] text-[#8F5A00] border border-[#F5E0A3] font-bold shadow-2xs'
                  : 'bg-[#F2F4F1] text-[#5F6762] hover:text-[#191C1B]'
              }`}
            >
              <span>ALMOST THERE ({almostThereCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('EXPLORE')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'EXPLORE'
                  ? 'bg-[#191C1B] text-white shadow-2xs'
                  : 'bg-[#F2F4F1] text-[#5F6762] hover:text-[#191C1B]'
              }`}
            >
              <span>EXPLORE ({exploreCount})</span>
            </button>
          </div>
        </div>

        {/* Loading Banner */}
        {isLoading && (
          <div className="mb-6 p-4 rounded-xl bg-[#E3F2E9] border border-[#C8E6D3] flex items-center gap-3 text-xs text-[#1B3D2F]">
            <RotateCw className="w-4 h-4 animate-spin text-primary shrink-0" />
            <span>Consulting Gemini for fresh recipe ideas tailored to your pantry…</span>
          </div>
        )}

        {/* Recipes Display Area */}
        {searchedRecipes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2E5E1] p-12 text-center max-w-lg mx-auto my-8">
            <UtensilsCrossed className="w-10 h-10 text-[#727972] mx-auto mb-3" />
            <h3 className="font-serif font-bold text-lg text-[#191C1B]">No matching recipes found</h3>
            <p className="text-xs text-[#5F6762] mt-1 max-w-xs mx-auto">
              Try adjusting your search query or switch back to &ldquo;All&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveTab('ALL');
              }}
              className="mt-4 px-4 py-2 rounded-full bg-[#F2F4F1] hover:bg-[#E2E5E1] text-[#191C1B] text-xs font-semibold transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : activeTab === 'ALL' && !searchQuery.trim() ? (
          /* Grouped Sections Layout for "ALL" View */
          <div className="space-y-10">
            {/* 1. USE FIRST SECTION */}
            {useFirstGroup.length > 0 && (
              <section aria-labelledby="use-first-heading">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#97472E]" />
                  <h2 id="use-first-heading" className="font-serif text-xl sm:text-2xl font-bold text-[#191C1B]">
                    USE FIRST
                  </h2>
                  <span className="text-xs text-[#97472E] font-semibold bg-[#FFDBD0] px-2 py-0.5 rounded-full">
                    {useFirstGroup.length}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#5F6762] mb-4">
                  Recipes that help use food that needs attention before it spoils.
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
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1B3D2F]" />
                  <h2 id="cook-now-heading" className="font-serif text-xl sm:text-2xl font-bold text-[#191C1B]">
                    COOK NOW
                  </h2>
                  <span className="text-xs text-[#1B3D2F] font-semibold bg-[#E3F2E9] px-2 py-0.5 rounded-full">
                    {cookNowGroup.length}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#5F6762] mb-4">
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
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8F5A00]" />
                  <h2 id="almost-there-heading" className="font-serif text-xl sm:text-2xl font-bold text-[#191C1B]">
                    ALMOST THERE
                  </h2>
                  <span className="text-xs text-[#8F5A00] font-semibold bg-[#FEF3D6] px-2 py-0.5 rounded-full">
                    {almostThereGroup.length}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#5F6762] mb-4">
                  Only one or two ingredients are missing. Add them to your grocery list with one tap.
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
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#5F6762]" />
                  <h2 id="explore-heading" className="font-serif text-xl sm:text-2xl font-bold text-[#191C1B]">
                    EXPLORE
                  </h2>
                  <span className="text-xs text-[#5F6762] font-semibold bg-[#F2F4F1] px-2 py-0.5 rounded-full">
                    {exploreGroup.length}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#5F6762] mb-4">
                  Other recipe ideas and inspirations for your next grocery trip.
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
