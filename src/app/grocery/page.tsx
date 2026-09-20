'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePantry } from '@/lib/store';
import { useToast } from '@/components/Toast';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Modal } from '@/components/Modal';
import { FoodCategory, DuplicateResolutionData, GroceryRecommendation } from '@/types';
import { FOOD_LIBRARY_CATALOG } from '@/lib/food-library/food-catalog';
import { searchFoodLibrary } from '@/lib/food-library/normalizer';
import {
  ShoppingCart,
  Plus,
  Check,
  Trash2,
  AlertCircle,
  Package,
  UtensilsCrossed,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Clock,
  BookOpen,
  Ban,
  X,
} from 'lucide-react';

const CATEGORIES: FoodCategory[] = [
  'Produce',
  'Dairy & Eggs',
  'Pantry & Grains',
  'Meat & Protein',
  'Bakery',
  'Spices & Condiments',
  'Frozen',
  'Other',
];

export default function GroceryListPage() {
  const {
    activeUser,
    groceryItems,
    items: pantryItems,
    recommendations,
    addRecommendationToGrocery,
    dismissRecommendation,
    dontSuggestFood,
    addGroceryItem,
    toggleGroceryItem,
    resolveDuplicate,
    deleteGroceryItem,
    clearPurchasedGroceries,
    isHydrated,
  } = usePantry();
  const { showToast } = useToast();

  // Quick Add State
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [category, setCategory] = useState<FoodCategory>('Produce');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = useMemo(() => {
    if (name.trim().length < 2) return [];
    return searchFoodLibrary(name, FOOD_LIBRARY_CATALOG, 5);
  }, [name]);

  // Filter State
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showPurchased, setShowPurchased] = useState(true);

  // Duplicate Resolution Modal State
  const [duplicateData, setDuplicateData] = useState<DuplicateResolutionData | null>(null);

  // Clear Confirmation Modal State
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const qty = parseFloat(quantity) || 1;
    const addedOrUpdated = addGroceryItem({
      name: name.trim(),
      quantity: qty,
      unit: unit.trim() || 'pcs',
      category: category,
      source: 'manual',
    });

    if ((addedOrUpdated as unknown as { wasMerged?: boolean }).wasMerged) {
      showToast(`Already on your list — updated "${addedOrUpdated.name}" quantity to ${addedOrUpdated.quantity} ${addedOrUpdated.unit}.`);
    } else {
      showToast(`Added "${name.trim()}" to shopping list.`);
    }
    setName('');
    setQuantity('1');
  };

  const handleToggle = (id: string) => {
    const item = groceryItems.find((g) => g.id === id);
    if (!item) return;

    if (item.checked) {
      toggleGroceryItem(id);
      showToast(`Marked "${item.name}" as to buy.`);
      return;
    }

    const result = toggleGroceryItem(id);
    if (result.duplicateDetected) {
      setDuplicateData(result.duplicateDetected);
    } else if (result.addedToPantry) {
      if (result.merged) {
        showToast(`Bought "${item.name}". Merged into existing pantry stock (now ${result.newTotal} ${result.unit}).`);
      } else if (result.separateBatch) {
        showToast(`Bought "${item.name}". Added as separate batch (${result.newTotal} ${result.unit}) in pantry.`);
      } else {
        showToast(`Bought "${item.name}". Added to your pantry (${result.newTotal} ${result.unit}).`);
      }
    }
  };

  const handleResolveChoice = (choice: 'merge' | 'separate') => {
    if (!duplicateData) return;
    const result = resolveDuplicate(duplicateData, choice);
    showToast(result.message);
    setDuplicateData(null);
  };

  const toBuyItems = groceryItems.filter((g) => !g.checked);
  const purchasedItems = groceryItems.filter((g) => g.checked);

  // Filtered To Buy
  const filteredToBuy = toBuyItems.filter((g) => {
    if (selectedCategory === 'All') return true;
    return g.category === selectedCategory;
  });

  // Unique recipes linked to grocery list
  const linkedRecipes = Array.from(
    new Set(toBuyItems.filter((g) => g.recipeName).map((g) => g.recipeName))
  );

  return (
    <div className="min-h-screen pb-24 overflow-x-hidden bg-[#121513] bg-editorial-pattern text-[#EFF1EC]">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8">
        <Breadcrumbs items={[{ label: 'Grocery List' }]} />

      {/* Header */}
      <div className="mt-4 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#28302A]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded-xs bg-[#2D1915] text-[#FF9E90] border border-[#482520] text-[10px] font-mono uppercase tracking-wider font-bold">
              Shopping Checklist
            </span>
            <span className="text-xs text-[#8E968F] font-mono">Household Sync</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#EFF1EC] tracking-tight">
            Grocery List
          </h1>
          <p className="text-sm sm:text-base text-[#8E968F] mt-2 max-w-2xl font-sans leading-relaxed">
            Plan what to buy to complete prioritized meals or restock essentials. Ticking items off automatically logs them into your kitchen pantry.
          </p>
        </div>

        {/* Sub-Nav & Action buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Segmented Sub-Nav: Shopping List <-> Food Library */}
          <div className="inline-flex p-1 bg-[#181C19] rounded-xs border border-[#28302A] text-xs font-mono">
            <div className="px-3.5 py-1.5 rounded-xs bg-[#222824] text-[#EFF1EC] flex items-center gap-1.5 border border-[#323D35] font-bold">
              <ShoppingCart className="w-3.5 h-3.5 text-[#78B48B]" />
              <span>Shopping List</span>
              {toBuyItems.length > 0 && (
                <span className="w-4 h-4 rounded-xs bg-[#3B6647] text-[#EFF1EC] flex items-center justify-center text-[10px] font-mono font-bold">
                  {toBuyItems.length}
                </span>
              )}
            </div>
            <Link
              href="/grocery/library"
              className="px-3.5 py-1.5 rounded-xs text-[#8E968F] hover:text-[#EFF1EC] transition-colors flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Food Library</span>
            </Link>
          </div>

          <Link
            href="/recipes"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#181C19] hover:bg-[#222824] border border-[#28302A] text-[#EFF1EC] text-xs font-mono uppercase tracking-wider rounded-xs transition-colors"
          >
            <UtensilsCrossed className="w-3.5 h-3.5 text-[#78B48B]" />
            <span>Recipes</span>
          </Link>
          <Link
            href="/pantry"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#3B6647] hover:bg-[#467854] text-[#EFF1EC] text-xs font-mono uppercase tracking-wider font-medium rounded-xs border border-[#4E805B]/30 shadow-subtle transition-colors"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Pantry</span>
          </Link>
        </div>
      </div>

      {/* Metrics / Status strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#181C19] p-4 rounded-sm border border-[#28302A]">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#8E968F] block">
            Items to Buy
          </span>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-[#FF9E90] mt-1">
            {isHydrated ? toBuyItems.length : '—'}
          </div>
          <span className="text-[11px] font-mono text-[#5A635B] mt-0.5 block">Needed in kitchen</span>
        </div>

        <div className="bg-[#181C19] p-4 rounded-sm border border-[#28302A]">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#8E968F] block">
            Purchased Today
          </span>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-[#78B48B] mt-1">
            {isHydrated ? purchasedItems.length : '—'}
          </div>
          <span className="text-[11px] font-mono text-[#5A635B] mt-0.5 block">Synced to pantry inventory</span>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-[#181C19] p-4 rounded-sm border border-[#28302A]">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#8E968F] block">
            Linked Recipes
          </span>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-[#EFF1EC] mt-1">
            {isHydrated ? linkedRecipes.length : '—'}
          </div>
          <span className="text-[11px] font-mono text-[#5A635B] mt-0.5 block truncate">
            {linkedRecipes.length > 0 ? linkedRecipes.join(', ') : 'No recipe items'}
          </span>
        </div>
      </div>

      {/* SECTION: SUGGESTED FOR YOUR NEXT SHOP */}
      {recommendations.length > 0 && (
        <section className="bg-[#181C19] rounded-sm p-5 sm:p-6 border border-[#28302A] mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-[#28302A]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xs bg-[#2D1915] text-[#FF9E90] border border-[#482520] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-xl text-[#EFF1EC]">
                  Suggested for your next shop
                </h2>
                <p className="text-xs text-[#8E968F] font-sans mt-0.5">
                  Calculated from {activeUser.householdName || 'your household'}&apos;s recurring purchase cycles, recipe plans, and low pantry stock.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-xs bg-[#2D1915] text-[#FF9E90] border border-[#482520] font-bold self-start sm:self-auto">
              {recommendations.length} item{recommendations.length > 1 ? 's' : ''} due
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-xs border border-[#28302A] bg-[#141715] hover:border-[#38463B] transition-colors flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-serif font-bold text-base text-[#EFF1EC] block group-hover:text-[#78B48B] transition-colors tracking-tight">
                        {rec.name}
                      </span>
                      <span className="text-[11px] font-mono text-[#8E968F] block mt-0.5">
                        Suggested: <strong className="text-[#EFF1EC]">{rec.suggestedQuantity} {rec.suggestedUnit}</strong> • {rec.category}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-xs text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 border ${
                        rec.level === 1
                          ? 'bg-[#2D1915] text-[#FF9E90] border-[#482520]'
                          : rec.level === 2
                          ? 'bg-[#282115] text-[#E5B567] border-[#453620]'
                          : rec.level === 3
                          ? 'bg-[#16261B] text-[#78B48B] border-[#243F2C]'
                          : 'bg-[#1E2420] text-[#8E968F] border-[#28302A]'
                      }`}
                    >
                      {rec.level === 1
                        ? rec.reason === 'recipe-needed' ? 'Recipe Need' : 'Low Stock'
                        : rec.level === 2
                        ? 'Due Restock'
                        : rec.level === 3
                        ? 'Staple'
                        : 'Discovery'}
                    </span>
                  </div>

                  <p className="text-xs text-[#8E968F] font-sans mt-3 font-normal leading-relaxed">
                    {rec.explanation}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#222824] flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      addRecommendationToGrocery(rec);
                      showToast(`Added "${rec.name}" to your shopping list.`);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#3B6647] hover:bg-[#467854] text-[#EFF1EC] text-xs font-mono uppercase tracking-wider font-medium rounded-xs border border-[#4E805B]/30 transition-colors shadow-subtle cursor-pointer min-h-[34px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to list</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      dismissRecommendation(rec.foodId);
                      showToast(`Dismissed "${rec.name}" for this session.`);
                    }}
                    className="px-2.5 py-2 bg-[#1E2420] hover:bg-[#262E28] border border-[#28302A] text-[#8E968F] hover:text-[#EFF1EC] text-xs font-mono rounded-xs transition-colors min-h-[34px] cursor-pointer"
                    title="Hide this recommendation for now"
                  >
                    Not now
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      dontSuggestFood(rec.foodId);
                      showToast(`"${rec.name}" won't be suggested again.`);
                    }}
                    className="p-2 text-[#5A635B] hover:text-[#FF9E90] hover:bg-[#2D1915] rounded-xs transition-colors min-h-[34px] cursor-pointer"
                    title="Never suggest this food again"
                  >
                    <Ban className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Add Form with Food Library Autocomplete */}
      <section className="bg-[#181C19] rounded-sm p-5 border border-[#28302A] mb-8">
        <h2 className="text-xs font-mono uppercase tracking-wider text-[#8E968F] mb-3 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-[#78B48B]" />
          <span>Add Item to Shopping List</span>
        </h2>
        <form onSubmit={handleQuickAdd} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5 relative">
            <label htmlFor="grocery-name" className="sr-only">Item Name</label>
            <input
              id="grocery-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search or enter item (e.g. Tomatoes, Paneer, Coriander)"
              required
              className="w-full px-3.5 py-2 bg-[#141715] border border-[#28302A] focus:border-[#4B7A58] rounded-xs text-sm text-[#EFF1EC] focus:outline-none placeholder-[#5A635B]"
              autoComplete="off"
            />

            {/* Food Library Autocomplete Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#181C19] border border-[#28302A] rounded-xs shadow-card z-50 overflow-hidden divide-y divide-[#222824] max-h-60 overflow-y-auto">
                <div className="px-3 py-1.5 bg-[#141715] text-[10px] font-mono uppercase font-bold text-[#8E968F]">
                  Library Suggestions
                </div>
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setName(item.name);
                      setCategory(item.category as FoodCategory);
                      if (item.defaultUnit) setUnit(item.defaultUnit);
                      setShowSuggestions(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-[#1E2420] flex items-center justify-between text-xs cursor-pointer transition-colors"
                  >
                    <div>
                      <span className="font-serif font-bold text-sm text-[#EFF1EC]">{item.name}</span>
                      {item.aliases.length > 0 && (
                        <span className="text-[10px] font-sans text-[#8E968F] ml-1.5">
                          ({item.aliases.slice(0, 2).join(', ')})
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-[#8E968F] px-1.5 py-0.5 rounded-xs bg-[#222824] border border-[#2B342D]">
                      {item.category}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="sm:col-span-2 flex gap-1.5">
            <div className="w-1/2">
              <label htmlFor="grocery-qty" className="sr-only">Quantity</label>
              <input
                id="grocery-qty"
                type="number"
                step="any"
                min="0.1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Qty"
                className="w-full px-2.5 py-2 bg-[#141715] border border-[#28302A] focus:border-[#4B7A58] rounded-xs text-sm text-[#EFF1EC] text-center focus:outline-none font-mono"
              />
            </div>
            <div className="w-1/2">
              <label htmlFor="grocery-unit" className="sr-only">Unit</label>
              <select
                id="grocery-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-1.5 py-2 bg-[#141715] border border-[#28302A] focus:border-[#4B7A58] rounded-xs text-xs text-[#EFF1EC] focus:outline-none font-mono cursor-pointer"
              >
                <option value="pcs">pcs</option>
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="L">L</option>
                <option value="bunch">bunch</option>
                <option value="pack">pack</option>
              </select>
            </div>
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="grocery-cat" className="sr-only">Category</label>
            <select
              id="grocery-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value as FoodCategory)}
              className="w-full px-3 py-2 bg-[#141715] border border-[#28302A] focus:border-[#4B7A58] rounded-xs text-sm text-[#EFF1EC] focus:outline-none cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full h-full min-h-[40px] px-4 py-2 bg-[#3B6647] hover:bg-[#467854] text-[#EFF1EC] text-xs font-mono uppercase tracking-wider font-medium rounded-xs border border-[#4E805B]/30 shadow-subtle transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
        </form>
      </section>

      {/* Category Filter Pills */}
      {toBuyItems.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-xs font-mono text-xs whitespace-nowrap transition-colors border cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-[#222824] text-[#EFF1EC] border-[#323D35] font-bold'
                : 'bg-[#1C211D] text-[#8E968F] hover:text-[#EFF1EC] border-[#28302A]'
            }`}
          >
            All Items ({toBuyItems.length})
          </button>
          {CATEGORIES.filter((cat) => toBuyItems.some((g) => g.category === cat)).map((cat) => {
            const count = toBuyItems.filter((g) => g.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xs font-mono text-xs whitespace-nowrap transition-colors border cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#222824] text-[#EFF1EC] border-[#323D35] font-bold'
                    : 'bg-[#1C211D] text-[#8E968F] hover:text-[#EFF1EC] border-[#28302A]'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* TO BUY SECTION */}
      <section className="bg-[#181C19] rounded-sm border border-[#28302A] mb-8 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#28302A] bg-[#141715] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-[#78B48B]" />
            <h2 className="font-serif font-bold text-xl text-[#EFF1EC]">To Buy</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-xs bg-[#2D1915] text-[#FF9E90] border border-[#482520] font-bold">
              {filteredToBuy.length}
            </span>
          </div>
          <span className="text-xs font-mono text-[#5A635B] hidden sm:inline">
            Click checkbox when purchased to transfer to pantry
          </span>
        </div>

        {filteredToBuy.length > 0 ? (
          <ul className="divide-y divide-[#222824]">
            {filteredToBuy.map((item) => (
              <li
                key={item.id}
                className="p-4 sm:p-5 hover:bg-[#1E2420]/50 transition-colors flex items-start sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  {/* Checkbox */}
                  <button
                    type="button"
                    onClick={() => handleToggle(item.id)}
                    className={`w-6 h-6 rounded-xs border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                      item.checked
                        ? 'bg-[#3B6647] border-[#4E805B] text-[#EFF1EC]'
                        : 'border-[#3A453D] hover:border-[#78B48B] bg-[#141715]'
                    }`}
                    aria-label={`Mark ${item.name} as purchased`}
                  >
                    {item.checked && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-serif font-bold text-sm sm:text-base text-[#EFF1EC]">{item.name}</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded-xs bg-[#222824] text-[#C4CCC4] border border-[#2B342D]">
                        {item.quantity} {item.unit}
                      </span>
                      {/* Priority Tag */}
                      <span
                        className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs border ${
                          item.source === 'recipe' || (item.recipeName && item.recipeName.length > 0)
                            ? 'bg-[#2D1915] text-[#FF9E90] border-[#482520]'
                            : item.source === 'pantry_restock'
                            ? 'bg-[#282115] text-[#E5B567] border-[#453620]'
                            : 'bg-[#16261B] text-[#78B48B] border-[#243F2C]'
                        }`}
                      >
                        {item.source === 'recipe' || (item.recipeName && item.recipeName.length > 0)
                          ? 'HIGH'
                          : item.source === 'pantry_restock'
                          ? 'MEDIUM'
                          : 'LOW'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-[#8E968F]">
                      {item.source === 'recipe' && item.recipeName && (
                        <span className="inline-flex items-center gap-1 text-[#78B48B] font-mono text-[10px]">
                          <Sparkles className="w-3 h-3" />
                          <span>Needed for {item.recipeName}</span>
                        </span>
                      )}
                      {item.source === 'pantry_restock' && (
                        <span className="inline-flex items-center gap-1 text-[#78B48B] font-mono text-[10px]">
                          <Package className="w-3 h-3" />
                          <span>Restock staple</span>
                        </span>
                      )}
                      {item.notes && item.source === 'manual' && (
                        <span className="text-[#5A635B] font-sans italic">{item.notes}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => {
                    deleteGroceryItem(item.id);
                    showToast(`Removed "${item.name}" from shopping list.`);
                  }}
                  className="p-1.5 text-[#5A635B] hover:text-[#E06C6C] hover:bg-[#2A1D1C] rounded-xs transition-colors shrink-0 cursor-pointer"
                  aria-label={`Delete ${item.name}`}
                  title="Remove from list"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-8 sm:p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-[#78B48B] mx-auto mb-2.5 stroke-[1.5]" />
            <h3 className="font-serif font-bold text-lg text-[#EFF1EC]">
              {selectedCategory === 'All' ? 'No items on your shopping list' : `No items in ${selectedCategory}`}
            </h3>
            <p className="text-xs sm:text-sm text-[#8E968F] font-sans mt-1 max-w-md mx-auto leading-relaxed">
              Add staples manually above, restock items from your pantry, or add missing ingredients directly from any recipe.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Link
                href="/recipes"
                className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-[#78B48B] hover:underline"
              >
                <span>Find recipe ingredients</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* PURCHASED SECTION */}
      {purchasedItems.length > 0 && (
        <section className="bg-[#181C19] rounded-sm border border-[#28302A] overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#28302A] bg-[#141715] flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowPurchased(!showPurchased)}
              className="flex items-center gap-2 text-left font-serif font-bold text-lg text-[#EFF1EC] hover:text-[#78B48B] transition-colors cursor-pointer"
            >
              <span>Purchased & Added to Pantry ({purchasedItems.length})</span>
              {showPurchased ? (
                <ChevronUp className="w-4 h-4 text-[#8E968F]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#8E968F]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsConfirmingClear(true)}
              className="inline-flex items-center gap-1 text-xs font-mono text-[#8E968F] hover:text-[#E06C6C] transition-colors px-2 py-1 rounded-xs hover:bg-[#2A1D1C] cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear purchased</span>
            </button>
          </div>

          {showPurchased && (
            <ul className="divide-y divide-[#222824] bg-[#141715]">
              {purchasedItems.map((item) => (
                <li
                  key={item.id}
                  className="p-4 sm:p-5 flex items-center justify-between gap-3 text-[#8E968F]"
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    {/* Uncheck button */}
                    <button
                      type="button"
                      onClick={() => handleToggle(item.id)}
                      className="w-5 h-5 rounded-xs bg-[#3B6647] text-[#EFF1EC] flex items-center justify-center shrink-0 cursor-pointer"
                      title="Uncheck (item remains in pantry)"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-semibold text-base line-through text-[#5A635B]">
                          {item.name}
                        </span>
                        <span className="text-xs font-mono text-[#5A635B] line-through">
                          {item.quantity} {item.unit}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-xs bg-[#1A261E] text-[#78B48B] border border-[#273B2E]">
                          In Pantry
                        </span>
                      </div>
                      {item.checkedAt && (
                        <span className="text-[11px] font-mono text-[#5A635B] block mt-0.5">
                          Ticked {new Date(item.checkedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      deleteGroceryItem(item.id);
                      showToast(`Removed "${item.name}".`);
                    }}
                    className="p-1.5 text-[#5A635B] hover:text-[#E06C6C] hover:bg-[#2A1D1C] rounded-xs transition-colors shrink-0 cursor-pointer"
                    aria-label={`Delete ${item.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Duplicate Resolution Modal */}
      <Modal
        isOpen={duplicateData !== null}
        onClose={() => setDuplicateData(null)}
        title="Item Already in Pantry"
        maxWidth="md"
      >
        {duplicateData && (
          <div className="space-y-4 py-2">
            <div className="p-3.5 bg-[#141715] rounded-xs border border-[#28302A] text-xs sm:text-sm">
              <p className="text-[#EFF1EC] leading-relaxed">
                You currently have{' '}
                <strong className="text-[#78B48B] font-mono font-bold">
                  {duplicateData.existingPantryItem.quantity} {duplicateData.existingPantryItem.unit}
                </strong>{' '}
                of <strong className="text-[#EFF1EC]">{duplicateData.existingPantryItem.name}</strong> in your pantry ({duplicateData.existingPantryItem.storageLocation}).
              </p>
              <p className="text-[#8E968F] mt-2 font-sans">
                You just bought <strong className="text-[#EFF1EC] font-mono">{duplicateData.groceryItem.quantity} {duplicateData.groceryItem.unit}</strong> of {duplicateData.groceryItem.name}.
                How would you like to update your kitchen stock?
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => handleResolveChoice('merge')}
                className="w-full p-3.5 text-left rounded-xs border border-[#3B6647] bg-[#16261B] hover:bg-[#1C3224] transition-colors flex items-start gap-3 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xs bg-[#3B6647] text-[#EFF1EC] flex items-center justify-center shrink-0 mt-0.5">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-sm text-[#EFF1EC] group-hover:text-[#93D4A8]">
                    Add to existing item (Merge quantities)
                  </div>
                  <div className="text-xs text-[#8E968F] mt-0.5 font-sans">
                    Updates existing {duplicateData.existingPantryItem.name} to{' '}
                    <strong className="text-[#EFF1EC] font-mono">
                      {Number((duplicateData.existingPantryItem.quantity + (duplicateData.groceryItem.quantity || 1)).toFixed(1))}{' '}
                      {duplicateData.existingPantryItem.unit}
                    </strong>
                    . Keeps a single pantry entry.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleResolveChoice('separate')}
                className="w-full p-3.5 text-left rounded-xs border border-[#28302A] hover:border-[#38463B] bg-[#141715] transition-colors flex items-start gap-3 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xs bg-[#1E2420] text-[#8E968F] flex items-center justify-center shrink-0 mt-0.5">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-sm text-[#EFF1EC]">
                    Keep as a separate item (New batch)
                  </div>
                  <div className="text-xs text-[#8E968F] mt-0.5 font-sans">
                    Creates a second entry with its own fresh shelf-life date and storage location.
                  </div>
                </div>
              </button>
            </div>

            <div className="pt-3 border-t border-[#28302A] flex justify-end">
              <button
                type="button"
                onClick={() => setDuplicateData(null)}
                className="px-4 py-2 text-xs font-mono text-[#8E968F] hover:text-[#EFF1EC] rounded-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Clear Purchased Confirmation Modal */}
      <Modal
        isOpen={isConfirmingClear}
        onClose={() => setIsConfirmingClear(false)}
        title="Clear Purchased Items?"
        maxWidth="sm"
      >
        <div className="py-2 space-y-4 text-xs sm:text-sm">
          <p className="text-[#EFF1EC] font-sans leading-relaxed">
            This will remove all {purchasedItems.length} purchased items from your shopping list.
            The items that were transferred to your pantry will remain safely in your pantry inventory.
          </p>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsConfirmingClear(false)}
              className="px-3.5 py-2 bg-[#1E2420] hover:bg-[#262E28] text-[#EFF1EC] text-xs font-mono rounded-xs min-h-[36px] cursor-pointer border border-[#28302A]"
            >
              Keep List
            </button>
            <button
              type="button"
              onClick={() => {
                clearPurchasedGroceries();
                setIsConfirmingClear(false);
                showToast('Cleared purchased items from shopping list.');
              }}
              className="px-3.5 py-2 bg-[#BA1A1A] hover:bg-red-800 text-white text-xs font-mono uppercase tracking-wider font-semibold rounded-xs min-h-[36px] cursor-pointer"
            >
              Clear Completed
            </button>
          </div>
        </div>
      </Modal>
      </main>
    </div>
  );
}
