'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePantry } from '@/lib/store';
import { useToast } from '@/components/Toast';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { FoodDetailModal } from '@/components/FoodDetailModal';
import { FOOD_LIBRARY_CATALOG } from '@/lib/food-library/food-catalog';
import { searchFoodLibrary } from '@/lib/food-library/normalizer';
import { FoodLibraryItem, FoodCategory } from '@/types';
import {
  Search,
  Plus,
  Check,
  ShoppingCart,
  BookOpen,
  Clock,
  Archive,
  Sparkles,
  TrendingUp,
  History,
  CheckCircle2,
  X,
  Filter,
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Produce',
  'Dairy & Eggs',
  'Pantry Staples',
  'Spices & Condiments',
  'Bakery & Snacks',
  'Beverages',
];

export default function FoodLibraryPage() {
  const {
    activeUser,
    items: pantryItems,
    groceryItems,
    addGroceryItem,
    purchaseHistory,
    purchaseStats,
    recentlyBought,
    frequentlyBought,
    dueSoon,
    isHydrated,
  } = usePantry();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFood, setSelectedFood] = useState<FoodLibraryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Determine if this is an established user or new user
  const isEstablishedUser = purchaseHistory.length >= 2 || purchaseStats.length >= 2;

  // Active shopping list food IDs and normalized names
  const activeGroceryFoodIds = useMemo(() => {
    return new Set(
      groceryItems
        .filter((g) => !g.checked)
        .map((g) => g.foodId || g.name.toLowerCase())
    );
  }, [groceryItems]);

  // Pantry food IDs and normalized names
  const pantryFoodIds = useMemo(() => {
    return new Set(
      pantryItems.map((p) => p.foodId || p.name.toLowerCase())
    );
  }, [pantryItems]);

  // Catalog filtered by search and category
  const filteredCatalog = useMemo(() => {
    let result = FOOD_LIBRARY_CATALOG;

    if (searchQuery.trim()) {
      result = searchFoodLibrary(searchQuery, FOOD_LIBRARY_CATALOG, 60);
    }

    if (selectedCategory !== 'All') {
      result = result.filter(
        (item) => item.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    return result;
  }, [searchQuery, selectedCategory]);

  const handleOpenDetail = (food: FoodLibraryItem) => {
    setSelectedFood(food);
    setIsModalOpen(true);
  };

  const handleQuickAdd = (e: React.MouseEvent, food: FoodLibraryItem) => {
    e.stopPropagation();
    const defaultQty = food.defaultUnit === 'g' ? 500 : 1;
    addGroceryItem({
      foodId: food.id,
      name: food.name,
      quantity: defaultQty,
      unit: food.defaultUnit || 'pcs',
      category: food.category as FoodCategory,
      source: 'library',
    });
    showToast(`Added ${food.name} to shopping list.`);
  };

  // Helper to find catalog item by ID
  const getCatalogItem = (foodId: string): FoodLibraryItem | undefined => {
    return FOOD_LIBRARY_CATALOG.find((c) => c.id === foodId);
  };

  if (!isHydrated) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-32 bg-[#181C19] border border-[#28302A] rounded-xs"></div>
          <div className="h-10 w-64 bg-[#181C19] border border-[#28302A] rounded-xs"></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-28 bg-[#181C19] border border-[#28302A] rounded-xs"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl space-y-8 animate-in fade-in duration-200">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Grocery', href: '/grocery' },
          { label: 'Food Library' },
        ]}
      />

      {/* Header & Sub-Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#28302A] pb-5">
        <div>
          <div className="text-[11px] font-mono tracking-widest text-[#8E968F] uppercase mb-1">
            Reference Catalog &amp; Restock
          </div>
          <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#EFF1EC] tracking-tight">
            Food Library
          </h1>
          <p className="text-sm text-[#8E968F] mt-1">
            Discover household staples, check pantry stock, and quickly restock your list.
          </p>
        </div>

        {/* Segmented Sub-Nav: Shopping List <-> Food Library */}
        <div className="inline-flex p-1 bg-[#141715] rounded-xs border border-[#28302A] text-xs font-mono self-start sm:self-auto">
          <Link
            href="/grocery"
            className="px-4 py-2 rounded-xs text-[#8E968F] hover:text-[#EFF1EC] transition-colors flex items-center gap-1.5"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Shopping List
            {groceryItems.filter((g) => !g.checked).length > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#3B6647] text-[#EFF1EC] flex items-center justify-center text-[10px]">
                {groceryItems.filter((g) => !g.checked).length}
              </span>
            )}
          </Link>
          <div className="px-4 py-2 rounded-xs bg-[#1E2420] text-[#EFF1EC] flex items-center gap-1.5 border border-[#3B6647]/50 shadow-2xs">
            <BookOpen className="w-3.5 h-3.5 text-[#86EFAC]" />
            Food Library
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CONTEXTUAL INTELLIGENCE SECTIONS */}
      {/* ========================================================================= */}

      {isEstablishedUser ? (
        <div className="space-y-8">
          {/* SECTION 1: MAY BE DUE SOON */}
          {dueSoon.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#FDE047]" />
                <h2 className="font-serif font-bold text-lg text-[#EFF1EC]">
                  May Be Due Soon
                </h2>
                <span className="text-[10px] font-mono text-[#FDE047] bg-[#282115] px-2 py-0.5 rounded-xs border border-[#42331C] uppercase tracking-wider">
                  Cycle restock
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {dueSoon.map((stat) => {
                  const cat = getCatalogItem(stat.foodId);
                  const name = cat?.name || stat.foodId.replace('food-', '');
                  const isOnList = activeGroceryFoodIds.has(stat.foodId) || activeGroceryFoodIds.has(name.toLowerCase());
                  const inPantry = pantryFoodIds.has(stat.foodId) || pantryFoodIds.has(name.toLowerCase());

                  return (
                    <div
                      key={stat.foodId}
                      onClick={() => cat && handleOpenDetail(cat)}
                      className="bg-[#181C19] p-3.5 rounded-xs border border-[#28302A] hover:border-[#3B6647]/60 transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-mono text-[#8E968F] uppercase tracking-wider">
                            {cat?.category || 'Pantry'}
                          </span>
                          {inPantry && (
                            <span className="text-[10px] font-mono text-[#86EFAC] bg-[#16261B] px-1.5 py-0.5 rounded-xs border border-[#23432B]">
                              In pantry
                            </span>
                          )}
                        </div>
                        <h3 className="font-serif font-bold text-[#EFF1EC] text-base mt-1">
                          {name}
                        </h3>
                        <p className="text-xs font-mono text-[#8E968F] mt-0.5">
                          Regular cycle: ~{Math.round(stat.averageDaysBetweenPurchases || 7)} days
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-[#28302A] flex items-center justify-between">
                        <span className="text-xs font-mono text-[#8E968F]">
                          Avg: {stat.averageQuantity || 1} {cat?.defaultUnit || 'pack'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => cat && handleQuickAdd(e, cat)}
                          className={`p-1.5 rounded-xs text-xs font-mono transition-colors ${
                            isOnList
                              ? 'bg-[#16261B] text-[#86EFAC] border border-[#23432B]'
                              : 'bg-[#141715] hover:bg-[#3B6647] text-[#8E968F] hover:text-[#EFF1EC] border border-[#28302A]'
                          }`}
                          title={isOnList ? 'Already on list' : 'Add to shopping list'}
                        >
                          {isOnList ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* SECTION 2: YOU BUY OFTEN */}
          {frequentlyBought.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#86EFAC]" />
                <h2 className="font-serif font-bold text-lg text-[#EFF1EC]">
                  You Buy Often
                </h2>
                <span className="text-[10px] font-mono text-[#86EFAC] bg-[#16261B] px-2 py-0.5 rounded-xs border border-[#23432B] uppercase tracking-wider">
                  Household staples
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {frequentlyBought.slice(0, 6).map((stat) => {
                  const cat = getCatalogItem(stat.foodId);
                  const name = cat?.name || stat.foodId.replace('food-', '');
                  const isOnList = activeGroceryFoodIds.has(stat.foodId) || activeGroceryFoodIds.has(name.toLowerCase());

                  return (
                    <div
                      key={stat.foodId}
                      onClick={() => cat && handleOpenDetail(cat)}
                      className="bg-[#181C19] p-3 rounded-xs border border-[#28302A] hover:border-[#3B6647]/60 transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <h3 className="font-serif font-semibold text-[#EFF1EC] text-sm leading-tight line-clamp-1">
                          {name}
                        </h3>
                        <p className="text-[11px] font-mono text-[#8E968F] mt-0.5">
                          Bought {stat.purchaseCount}x
                        </p>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-[#28302A] flex items-center justify-between">
                        <span className="text-[11px] font-mono text-[#8E968F]">
                          {cat?.defaultUnit || 'pack'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => cat && handleQuickAdd(e, cat)}
                          className={`p-1 rounded-xs text-xs font-mono transition-colors ${
                            isOnList
                              ? 'bg-[#16261B] text-[#86EFAC] border border-[#23432B]'
                              : 'bg-[#141715] hover:bg-[#3B6647] text-[#8E968F] hover:text-[#EFF1EC] border border-[#28302A]'
                          }`}
                        >
                          {isOnList ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* SECTION 3: RECENTLY BOUGHT */}
          {recentlyBought.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#8E968F]" />
                <h2 className="font-serif font-bold text-lg text-[#EFF1EC]">
                  Recently Bought
                </h2>
                <span className="text-xs font-mono text-[#8E968F]">Quick re-add</span>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
                {recentlyBought.slice(0, 8).map((hist) => {
                  const cat = getCatalogItem(hist.foodId);
                  const isOnList = activeGroceryFoodIds.has(hist.foodId) || activeGroceryFoodIds.has(hist.name.toLowerCase());

                  return (
                    <div
                      key={hist.id}
                      onClick={() => cat && handleOpenDetail(cat)}
                      className="bg-[#181C19] px-3 py-2 rounded-xs border border-[#28302A] hover:border-[#3B6647]/60 transition-all cursor-pointer shrink-0 flex items-center gap-3 text-xs"
                    >
                      <div>
                        <div className="font-serif font-medium text-[#EFF1EC]">{hist.name}</div>
                        <div className="text-[10px] font-mono text-[#8E968F]">
                          {hist.quantity} {hist.unit}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => cat ? handleQuickAdd(e, cat) : undefined}
                        className={`p-1.5 rounded-xs text-xs font-mono transition-colors ${
                          isOnList
                            ? 'bg-[#16261B] text-[#86EFAC] border border-[#23432B]'
                            : 'bg-[#141715] hover:bg-[#3B6647] text-[#8E968F] hover:text-[#EFF1EC] border border-[#28302A]'
                        }`}
                        title="Add to shopping list"
                      >
                        {isOnList ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      ) : (
        /* SECTION FOR NEW USER: POPULAR ESSENTIALS */
        <section className="space-y-3 bg-[#181C19] p-5 rounded-xs border border-[#28302A]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#86EFAC]" />
            <h2 className="font-serif font-bold text-lg text-[#EFF1EC]">
              Popular Household Essentials
            </h2>
            <span className="text-[10px] font-mono text-[#86EFAC] bg-[#16261B] px-2 py-0.5 rounded-xs border border-[#23432B] uppercase tracking-wider">
              Pantry starters
            </span>
          </div>
          <p className="text-xs text-[#8E968F]">
            Starting fresh? Add everyday cooking essentials to begin tracking your home stock.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
            {['food-milk-cow', 'food-tomato', 'food-onion', 'food-potato', 'food-atta', 'food-sunflower-oil'].map((id) => {
              const cat = getCatalogItem(id);
              if (!cat) return null;
              const isOnList = activeGroceryFoodIds.has(cat.id);

              return (
                <div
                  key={cat.id}
                  onClick={() => handleOpenDetail(cat)}
                  className="bg-[#141715] p-3 rounded-xs border border-[#28302A] hover:border-[#3B6647]/60 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <h3 className="font-serif font-semibold text-[#EFF1EC] text-sm leading-tight">
                      {cat.name}
                    </h3>
                    <p className="text-[11px] font-mono text-[#8E968F] mt-0.5">
                      {cat.category}
                    </p>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-[#28302A] flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[#8E968F]">
                      {cat.defaultUnit}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleQuickAdd(e, cat)}
                      className={`p-1 rounded-xs text-xs font-mono transition-colors ${
                        isOnList
                          ? 'bg-[#16261B] text-[#86EFAC] border border-[#23432B]'
                          : 'bg-[#181C19] hover:bg-[#3B6647] text-[#8E968F] hover:text-[#EFF1EC] border border-[#28302A]'
                      }`}
                    >
                      {isOnList ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* BROWSE ALL FOODS & SEARCH */}
      {/* ========================================================================= */}

      <section className="space-y-4 pt-4 border-t border-[#28302A]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif font-bold text-xl text-[#EFF1EC]">
              Browse All Foods
            </h2>
            <p className="text-xs font-mono text-[#8E968F] mt-0.5">
              Showing {filteredCatalog.length} canonical ingredients &amp; staples
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#8E968F] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search foods, aliases, spices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-[#141715] border border-[#28302A] rounded-xs text-xs text-[#EFF1EC] placeholder:text-[#5A635B] focus:outline-none focus:border-[#4B7A58]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E968F] hover:text-[#EFF1EC]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xs text-xs font-mono shrink-0 transition-all ${
                selectedCategory === cat
                  ? 'bg-[#1E2420] text-[#EFF1EC] border border-[#3B6647]'
                  : 'bg-[#141715] hover:bg-[#181C19] text-[#8E968F] hover:text-[#EFF1EC] border border-[#28302A]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Food Catalog Grid */}
        {filteredCatalog.length === 0 ? (
          <div className="text-center py-12 bg-[#181C19] rounded-xs border border-[#28302A]">
            <p className="font-serif text-[#EFF1EC] text-base">No matching food found</p>
            <p className="text-xs text-[#8E968F] mt-1">
              Try searching with another keyword or pick a different category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredCatalog.map((food) => {
              const isOnList = activeGroceryFoodIds.has(food.id) || activeGroceryFoodIds.has(food.name.toLowerCase());
              const inPantry = pantryFoodIds.has(food.id) || pantryFoodIds.has(food.name.toLowerCase());

              return (
                <div
                  key={food.id}
                  onClick={() => handleOpenDetail(food)}
                  className="bg-[#181C19] p-3.5 rounded-xs border border-[#28302A] hover:border-[#3B6647]/60 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-1.5">
                      <span className="text-[10px] font-mono text-[#8E968F] uppercase tracking-wider line-clamp-1">
                        {food.category}
                      </span>
                      {inPantry && (
                        <span className="text-[9px] font-mono text-[#86EFAC] bg-[#16261B] px-1.5 py-0.5 rounded-xs border border-[#23432B] shrink-0 font-medium">
                          In pantry
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif font-bold text-[#EFF1EC] text-sm mt-1 group-hover:text-[#86EFAC] transition-colors">
                      {food.name}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-[#8E968F] mt-1.5">
                      <span>~{food.typicalShelfLifeDays}d shelf life</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#28302A] flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[#8E968F]">
                      {food.defaultUnit}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleQuickAdd(e, food)}
                      className={`p-1.5 rounded-xs text-xs font-mono flex items-center gap-1 transition-colors ${
                        isOnList
                          ? 'bg-[#16261B] text-[#86EFAC] border border-[#23432B]'
                          : 'bg-[#141715] hover:bg-[#3B6647] text-[#8E968F] hover:text-[#EFF1EC] border border-[#28302A]'
                      }`}
                      title={isOnList ? 'Already on list' : 'Add to shopping list'}
                    >
                      {isOnList ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Food Detail Modal */}
      <FoodDetailModal
        food={selectedFood}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedFood(null);
        }}
      />
    </div>
  );
}
