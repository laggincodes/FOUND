'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePantry } from '@/lib/store';
import { useToast } from '@/components/Toast';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { FOOD_LIBRARY_CATALOG } from '@/lib/food-library/food-catalog';
import {
  Users,
  Utensils,
  Ban,
  RotateCcw,
  Check,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';

const DIETARY_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'High Protein',
  'Eggitarian',
  'Gluten-Free',
  'Dairy-Free',
  'Low Carb',
  'Jain Friendly',
];

export default function ProfilePage() {
  const {
    activeUser,
    userProfile,
    updateUserProfile,
    allowSuggestFood,
    dontSuggestFood,
    resetToDemoData,
    purchaseHistory,
    purchaseStats,
    isHydrated,
  } = usePantry();
  const { showToast } = useToast();

  const [householdSize, setHouseholdSize] = useState<number>(userProfile.householdSize || 2);
  const [selectedDiets, setSelectedDiets] = useState<string[]>(userProfile.dietaryPreferences || []);
  const [customExclude, setCustomExclude] = useState('');

  // Combined excluded items list
  const excludedItems = Array.from(
    new Set([...(userProfile.hiddenFoodIds || []), ...(userProfile.dislikedFoods || [])])
  );

  const handleToggleDiet = (diet: string) => {
    const updated = selectedDiets.includes(diet)
      ? selectedDiets.filter((d) => d !== diet)
      : [...selectedDiets, diet];
    setSelectedDiets(updated);
    updateUserProfile({ dietaryPreferences: updated });
    showToast(`Updated dietary preferences.`);
  };

  const handleHouseholdSizeChange = (size: number) => {
    setHouseholdSize(size);
    updateUserProfile({ householdSize: size });
    showToast(`Updated household size to ${size}.`);
  };

  const handleAddCustomExclude = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customExclude.trim()) return;
    dontSuggestFood(customExclude.trim());
    showToast(`Excluded "${customExclude.trim()}" from recommendations.`);
    setCustomExclude('');
  };

  const handleRestoreFood = (foodId: string) => {
    allowSuggestFood(foodId);
    showToast(`Restored suggestions for "${foodId}".`);
  };

  // Helper to get readable food name for an ID
  const getReadableFoodName = (id: string): string => {
    const cat = FOOD_LIBRARY_CATALOG.find((c) => c.id === id);
    if (cat) return cat.name;
    return id.replace(/^food-/, '').replace(/-/g, ' ');
  };

  if (!isHydrated) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl animate-pulse space-y-6">
        <div className="h-6 w-32 bg-earth-200 rounded"></div>
        <div className="h-10 w-64 bg-earth-200 rounded"></div>
        <div className="h-48 bg-white rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl space-y-8 animate-in fade-in duration-200">
      <Breadcrumbs items={[{ label: 'Household Settings' }]} />

      {/* Header */}
      <div className="border-b border-surface-border pb-5">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2 py-0.5 rounded-full bg-olive-100 text-olive-800 text-[11px] font-bold uppercase tracking-wider">
            Household Profile
          </span>
          <span className="text-xs text-ink-muted">Private & Local</span>
        </div>
        <h1 className="font-serif font-bold text-3xl sm:text-4xl text-ink tracking-tight">
          {activeUser.householdName || `${activeUser.firstName}'s Household`}
        </h1>
        <p className="text-sm text-ink-muted mt-1 max-w-xl">
          Configure household size, dietary choices, and manage excluded food recommendations.
        </p>
      </div>

      {/* Household Size & Dietary Preferences */}
      <section className="bg-white p-6 rounded-2xl border border-surface-border shadow-xs space-y-6">
        <div>
          <h2 className="font-serif font-bold text-xl text-ink flex items-center gap-2">
            <Users className="w-5 h-5 text-olive-700" />
            Household Members
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Adjusts default recipe portions and typical consumption cycles.
          </p>
          <div className="flex items-center gap-2 mt-3">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleHouseholdSizeChange(num)}
                className={`w-11 h-11 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center ${
                  householdSize === num
                    ? 'bg-olive-800 text-white border-olive-800 shadow-2xs scale-105'
                    : 'bg-earth-50 text-ink border-surface-border hover:border-earth-400'
                }`}
              >
                {num}{num === 6 ? '+' : ''}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-surface-border pt-6">
          <h2 className="font-serif font-bold text-xl text-ink flex items-center gap-2">
            <Utensils className="w-5 h-5 text-olive-700" />
            Dietary Preferences
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Helps prioritize suitable recipes and filter out ingredients you don&apos;t consume.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {DIETARY_OPTIONS.map((diet) => {
              const active = selectedDiets.includes(diet);
              return (
                <button
                  key={diet}
                  type="button"
                  onClick={() => handleToggleDiet(diet)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
                    active
                      ? 'bg-olive-700 text-white border-olive-700 shadow-2xs'
                      : 'bg-white text-ink border-surface-border hover:border-earth-400'
                  }`}
                >
                  {active && <Check className="w-3.5 h-3.5" />}
                  {diet}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Excluded / Hidden Recommendations */}
      <section className="bg-white p-6 rounded-2xl border border-surface-border shadow-xs space-y-5">
        <div>
          <h2 className="font-serif font-bold text-xl text-ink flex items-center gap-2">
            <Ban className="w-5 h-5 text-terracotta-600" />
            Excluded Recommendations (&quot;Don&apos;t Suggest&quot;)
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Items you have asked Use It First never to suggest. You can restore them anytime.
          </p>
        </div>

        {/* Add custom exclusion */}
        <form onSubmit={handleAddCustomExclude} className="flex gap-2">
          <input
            type="text"
            placeholder="Add ingredient to never suggest (e.g. Bitter Gourd)..."
            value={customExclude}
            onChange={(e) => setCustomExclude(e.target.value)}
            className="flex-1 px-3.5 py-2 text-xs bg-earth-50/50 border border-surface-border rounded-xl text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-olive-600"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-earth-100 hover:bg-earth-200 text-ink text-xs font-semibold rounded-xl border border-surface-border transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Exclude
          </button>
        </form>

        {/* Excluded items list */}
        {excludedItems.length === 0 ? (
          <div className="p-4 bg-earth-50/50 rounded-xl border border-surface-border text-xs text-ink-muted text-center">
            No excluded items. Use the &quot;Don&apos;t suggest&quot; button on any food card or recommendation to exclude foods.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            {excludedItems.map((foodId) => (
              <div
                key={foodId}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-terracotta-50/70 border border-terracotta-200 rounded-xl text-xs text-terracotta-900 font-medium"
              >
                <span>{getReadableFoodName(foodId)}</span>
                <button
                  type="button"
                  onClick={() => handleRestoreFood(foodId)}
                  className="text-terracotta-700 hover:text-terracotta-900 p-0.5 rounded hover:bg-terracotta-100 transition-colors"
                  title="Allow suggestions again"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Household Data & Reset */}
      <section className="bg-earth-50/50 p-6 rounded-2xl border border-surface-border space-y-4">
        <h2 className="font-serif font-bold text-lg text-ink flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-olive-700" />
          Household Intelligence Overview
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white p-3 rounded-xl border border-surface-border">
            <span className="text-ink-muted block">Purchase Records</span>
            <span className="font-serif font-bold text-base text-ink mt-0.5 block">
              {purchaseHistory.length} logs
            </span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-surface-border">
            <span className="text-ink-muted block">Learned Cycles</span>
            <span className="font-serif font-bold text-base text-ink mt-0.5 block">
              {purchaseStats.filter((s) => s.averageDaysBetweenPurchases).length} staples
            </span>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-white p-3 rounded-xl border border-surface-border">
            <span className="text-ink-muted block">Active Household</span>
            <span className="font-serif font-bold text-base text-ink mt-0.5 block truncate">
              {activeUser.firstName} ({activeUser.id})
            </span>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset this household data to initial demo state?')) {
                resetToDemoData();
                showToast('Reset to demo baseline.');
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-earth-100 border border-surface-border text-ink-muted hover:text-ink text-xs font-semibold rounded-xl transition-colors shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset {activeUser.firstName}&apos;s Data to Demo Baseline
          </button>
        </div>
      </section>
    </div>
  );
}
