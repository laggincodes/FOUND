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
  LogOut,
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
    isAuthenticated,
    signOut,
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
        <div className="h-6 w-32 bg-[#181C19] border border-[#28302A] rounded-xs"></div>
        <div className="h-10 w-64 bg-[#181C19] border border-[#28302A] rounded-xs"></div>
        <div className="h-48 bg-[#181C19] border border-[#28302A] rounded-xs"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl space-y-8 animate-in fade-in duration-200">
      <Breadcrumbs items={[{ label: 'Household Settings' }]} />

      {/* Header */}
      <div className="border-b border-[#28302A] pb-5">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2 py-0.5 rounded-xs bg-[#16261B] text-[#86EFAC] text-[10px] font-mono uppercase tracking-wider border border-[#23432B]">
            Household Profile
          </span>
          <span className="text-xs font-mono text-[#8E968F]">Private &amp; Local</span>
        </div>
        <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#EFF1EC] tracking-tight">
          {activeUser.householdName || `${activeUser.firstName}'s Household`}
        </h1>
        <p className="text-sm text-[#8E968F] mt-1 max-w-xl">
          Configure household size, dietary choices, and manage excluded food recommendations.
        </p>
      </div>

      {/* Household Size & Dietary Preferences */}
      <section className="bg-[#181C19] p-6 rounded-xs border border-[#28302A] space-y-6">
        <div>
          <h2 className="font-serif font-bold text-xl text-[#EFF1EC] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#86EFAC]" />
            Household Members
          </h2>
          <p className="text-xs font-mono text-[#8E968F] mt-0.5">
            Adjusts default recipe portions and typical consumption cycles.
          </p>
          <div className="flex items-center gap-2 mt-3">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleHouseholdSizeChange(num)}
                className={`w-11 h-11 rounded-xs text-sm font-mono border transition-all flex items-center justify-center ${
                  householdSize === num
                    ? 'bg-[#1E2420] text-[#EFF1EC] border-[#3B6647] shadow-2xs scale-105'
                    : 'bg-[#141715] text-[#8E968F] border-[#28302A] hover:border-[#3B6647]/50 hover:text-[#EFF1EC]'
                }`}
              >
                {num}{num === 6 ? '+' : ''}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-[#28302A] pt-6">
          <h2 className="font-serif font-bold text-xl text-[#EFF1EC] flex items-center gap-2">
            <Utensils className="w-5 h-5 text-[#86EFAC]" />
            Dietary Preferences
          </h2>
          <p className="text-xs font-mono text-[#8E968F] mt-0.5">
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
                  className={`px-3.5 py-1.5 rounded-xs text-xs font-mono border transition-all flex items-center gap-1.5 ${
                    active
                      ? 'bg-[#1E2420] text-[#EFF1EC] border-[#3B6647] shadow-2xs'
                      : 'bg-[#141715] text-[#8E968F] border-[#28302A] hover:border-[#3B6647]/50 hover:text-[#EFF1EC]'
                  }`}
                >
                  {active && <Check className="w-3.5 h-3.5 text-[#86EFAC]" />}
                  {diet}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Excluded / Hidden Recommendations */}
      <section className="bg-[#181C19] p-6 rounded-xs border border-[#28302A] space-y-5">
        <div>
          <h2 className="font-serif font-bold text-xl text-[#EFF1EC] flex items-center gap-2">
            <Ban className="w-5 h-5 text-[#F87171]" />
            Excluded Recommendations (&quot;Don&apos;t Suggest&quot;)
          </h2>
          <p className="text-xs font-mono text-[#8E968F] mt-0.5">
            Items you have asked FOUND never to suggest. You can restore them anytime.
          </p>
        </div>

        {/* Add custom exclusion */}
        <form onSubmit={handleAddCustomExclude} className="flex gap-2">
          <input
            type="text"
            placeholder="Add ingredient to never suggest (e.g. Bitter Gourd)..."
            value={customExclude}
            onChange={(e) => setCustomExclude(e.target.value)}
            className="flex-1 px-3.5 py-2 text-xs bg-[#141715] border border-[#28302A] rounded-xs text-[#EFF1EC] placeholder:text-[#5A635B] focus:outline-none focus:border-[#4B7A58]"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#1E2420] hover:bg-[#262E28] text-[#EFF1EC] text-xs font-mono uppercase tracking-wider rounded-xs border border-[#28302A] transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Exclude
          </button>
        </form>

        {/* Excluded items list */}
        {excludedItems.length === 0 ? (
          <div className="p-4 bg-[#141715] rounded-xs border border-[#28302A] text-xs font-mono text-[#8E968F] text-center">
            No excluded items. Use the &quot;Don&apos;t suggest&quot; button on any food card or recommendation to exclude foods.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            {excludedItems.map((foodId) => (
              <div
                key={foodId}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#2D1915] border border-[#4D241D] rounded-xs text-xs font-mono text-[#F87171]"
              >
                <span>{getReadableFoodName(foodId)}</span>
                <button
                  type="button"
                  onClick={() => handleRestoreFood(foodId)}
                  className="text-[#F87171] hover:text-[#EFF1EC] p-0.5 rounded hover:bg-[#3D221D] transition-colors"
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
      <section className="bg-[#181C19] p-6 rounded-xs border border-[#28302A] space-y-4">
        <h2 className="font-serif font-bold text-lg text-[#EFF1EC] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#86EFAC]" />
          Household Intelligence Overview
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-[#141715] p-3 rounded-xs border border-[#28302A]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E968F] block">Purchase Records</span>
            <span className="font-serif font-bold text-base text-[#EFF1EC] mt-0.5 block">
              {purchaseHistory.length} logs
            </span>
          </div>
          <div className="bg-[#141715] p-3 rounded-xs border border-[#28302A]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E968F] block">Learned Cycles</span>
            <span className="font-serif font-bold text-base text-[#EFF1EC] mt-0.5 block">
              {purchaseStats.filter((s) => s.averageDaysBetweenPurchases).length} staples
            </span>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-[#141715] p-3 rounded-xs border border-[#28302A]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E968F] block">Active Household</span>
            <span className="font-serif font-bold text-base text-[#EFF1EC] mt-0.5 block truncate">
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
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#141715] hover:bg-[#1E2420] border border-[#28302A] text-[#8E968F] hover:text-[#EFF1EC] text-xs font-mono uppercase tracking-wider rounded-xs transition-colors shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset {activeUser.firstName}&apos;s Data to Demo Baseline
          </button>
        </div>
      </section>

      {/* Account & Session */}
      <section className="bg-[#181C19] p-6 rounded-xs border border-[#28302A] space-y-4">
        <h2 className="font-serif font-bold text-lg text-[#EFF1EC] flex items-center gap-2">
          <Users className="w-4 h-4 text-[#86EFAC]" />
          <span>Account &amp; Session</span>
        </h2>
        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between py-2 border-b border-[#28302A]">
            <span className="text-[#8E968F]">Display Name</span>
            <span className="font-serif font-semibold text-[#EFF1EC]">{activeUser.firstName}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[#28302A]">
            <span className="text-[#8E968F]">Email</span>
            <span className="font-mono text-[#EFF1EC]">{activeUser.email || 'Not provided'}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[#28302A]">
            <span className="text-[#8E968F]">Account Status</span>
            <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-xs bg-[#16261B] text-[#86EFAC] border border-[#23432B]">
              {isAuthenticated ? 'Authenticated (Supabase)' : 'Demo Session'}
            </span>
          </div>
        </div>

        {isAuthenticated && (
          <div className="pt-2">
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2D1915] hover:bg-[#3D221D] text-[#F87171] border border-[#4D241D] text-xs font-mono uppercase tracking-wider rounded-xs transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out of FOUND</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
