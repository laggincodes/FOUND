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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumbs items={[{ label: 'Grocery List' }]} />

      {/* Header */}
      <div className="mt-4 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E3E2E6]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded-xs bg-[#FFDBD0] text-[#97472E] text-[11px] font-bold uppercase tracking-wider">
              Shopping Checklist
            </span>
            <span className="text-xs text-outline font-medium">Household Sync</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1A1C1E] tracking-tight">
            Grocery List
          </h1>
          <p className="text-sm sm:text-base text-on-surface-variant mt-2 max-w-2xl leading-relaxed">
            Plan what to buy to complete prioritized meals or restock essentials. Ticking items off automatically logs them into your kitchen pantry.
          </p>
        </div>

        {/* Sub-Nav & Action buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Segmented Sub-Nav: Shopping List <-> Food Library */}
          <div className="inline-flex p-1 bg-surface-container rounded-xs border border-[#E3E2E6] text-xs font-semibold">
            <div className="px-3.5 py-1.5 rounded-xs bg-white text-[#1A1C1E] shadow-subtle flex items-center gap-1.5 border border-[#E3E2E6]">
              <ShoppingCart className="w-3.5 h-3.5 text-primary" />
              Shopping List
              {toBuyItems.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">
                  {toBuyItems.length}
                </span>
              )}
            </div>
            <Link
              href="/grocery/library"
              className="px-3.5 py-1.5 rounded-xs text-on-surface-variant hover:text-[#1A1C1E] transition-colors flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Food Library
            </Link>
          </div>

          <Link
            href="/recipes"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-surface-container border border-[#C2C8C0] text-[#1A1C1E] text-xs font-semibold rounded-xs shadow-subtle transition-all"
          >
            <UtensilsCrossed className="w-3.5 h-3.5 text-primary" />
            <span>Recipes</span>
          </Link>
          <Link
            href="/pantry"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xs shadow-subtle transition-all"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Pantry</span>
          </Link>
        </div>
      </div>

      {/* Metrics / Status strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xs border border-[#E3E2E6] shadow-subtle">
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">
            Items to Buy
          </span>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-[#97472E] mt-1">
            {isHydrated ? toBuyItems.length : '—'}
          </div>
          <span className="text-[11px] text-outline mt-0.5 block">Needed in kitchen</span>
        </div>

        <div className="bg-white p-4 rounded-xs border border-[#E3E2E6] shadow-subtle">
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">
            Purchased Today
          </span>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-primary mt-1">
            {isHydrated ? purchasedItems.length : '—'}
          </div>
          <span className="text-[11px] text-outline mt-0.5 block">Synced to pantry inventory</span>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white p-4 rounded-xs border border-[#E3E2E6] shadow-subtle">
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">
            Linked Recipes
          </span>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1C1E] mt-1">
            {isHydrated ? linkedRecipes.length : '—'}
          </div>
          <span className="text-[11px] text-outline mt-0.5 block truncate">
            {linkedRecipes.length > 0 ? linkedRecipes.join(', ') : 'No recipe items'}
          </span>
        </div>
      </div>

      {/* SECTION: SUGGESTED FOR YOUR NEXT SHOP */}
      {recommendations.length > 0 && (
        <section className="bg-white rounded-xs p-5 sm:p-6 border border-[#E3E2E6] shadow-subtle mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-[#E3E2E6]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xs bg-[#FFDBD0] text-[#97472E] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-xl text-[#1A1C1E]">
                  Suggested for your next shop
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Calculated from {activeUser.householdName || 'your household'}&apos;s recurring purchase cycles, recipe plans, and low pantry stock.
                </p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-xs bg-[#FFDBD0] text-[#97472E] font-bold self-start sm:self-auto">
              {recommendations.length} item{recommendations.length > 1 ? 's' : ''} due
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-xs border border-[#E3E2E6] bg-[#FAF9FC] hover:border-primary transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-serif font-bold text-base text-[#1A1C1E] block group-hover:text-primary transition-colors">
                        {rec.name}
                      </span>
                      <span className="text-[11px] text-outline block mt-0.5">
                        Suggested: <strong>{rec.suggestedQuantity} {rec.suggestedUnit}</strong> • {rec.category}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase tracking-wider shrink-0 border ${
                        rec.level === 1
                          ? 'bg-[#FFDBD0] text-[#97472E] border-[#97472E]/20'
                          : rec.level === 2
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : rec.level === 3
                          ? 'bg-primary/10 text-primary border-primary/20'
                          : 'bg-surface-container text-on-surface-variant border-[#E3E2E6]'
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

                  <p className="text-xs text-on-surface-variant mt-3 font-normal leading-relaxed">
                    {rec.explanation}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E3E2E6] flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      addRecommendationToGrocery(rec);
                      showToast(`Added "${rec.name}" to your shopping list.`);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xs transition-colors shadow-subtle cursor-pointer min-h-[34px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add to list</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      dismissRecommendation(rec.foodId);
                      showToast(`Dismissed "${rec.name}" for this session.`);
                    }}
                    className="px-2.5 py-2 bg-white hover:bg-surface-container border border-[#C2C8C0] text-on-surface-variant hover:text-[#1A1C1E] text-xs font-medium rounded-xs transition-colors min-h-[34px]"
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
                    className="p-2 text-outline hover:text-[#97472E] hover:bg-[#FFDBD0]/40 rounded-xs transition-colors min-h-[34px]"
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
      <section className="bg-white rounded-xs p-5 border border-[#E3E2E6] shadow-subtle mb-8">
        <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-primary" />
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
              className="w-full px-3.5 py-2 bg-surface-container-low border border-[#C2C8C0] focus:border-primary rounded-xs text-sm text-[#1A1C1E] focus:outline-none"
              autoComplete="off"
            />

            {/* Food Library Autocomplete Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#C2C8C0] rounded-xs shadow-card z-50 overflow-hidden divide-y divide-[#E3E2E6] max-h-60 overflow-y-auto">
                <div className="px-3 py-1.5 bg-surface-container-low text-[10px] uppercase font-bold text-outline">
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
                    className="w-full px-3 py-2 text-left hover:bg-[#FAF9FC] flex items-center justify-between text-xs cursor-pointer transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-[#1A1C1E]">{item.name}</span>
                      {item.aliases.length > 0 && (
                        <span className="text-[10px] text-outline ml-1.5">
                          ({item.aliases.slice(0, 2).join(', ')})
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-outline font-medium px-1.5 py-0.5 rounded-xs bg-surface-container">
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
                className="w-full px-2.5 py-2 bg-surface-container-low border border-[#C2C8C0] focus:border-primary rounded-xs text-sm text-[#1A1C1E] text-center focus:outline-none"
              />
            </div>
            <div className="w-1/2">
              <label htmlFor="grocery-unit" className="sr-only">Unit</label>
              <select
                id="grocery-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-1.5 py-2 bg-surface-container-low border border-[#C2C8C0] focus:border-primary rounded-xs text-xs text-[#1A1C1E] focus:outline-none"
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
              className="w-full px-3 py-2 bg-surface-container-low border border-[#C2C8C0] focus:border-primary rounded-xs text-sm text-[#1A1C1E] focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full h-full min-h-[40px] px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-semibold rounded-xs shadow-subtle transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
        </form>
      </section>

      {/* Category Filter Pills */}
      {toBuyItems.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-xs text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-primary text-white'
                : 'bg-white text-on-surface-variant border border-[#E3E2E6] hover:bg-surface-container'
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
                className={`px-3 py-1.5 rounded-xs text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-primary text-white'
                    : 'bg-white text-on-surface-variant border border-[#E3E2E6] hover:bg-surface-container'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* TO BUY SECTION */}
      <section className="bg-white rounded-xs border border-[#E3E2E6] shadow-subtle mb-8 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E3E2E6] bg-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-primary" />
            <h2 className="font-serif font-bold text-xl text-[#1A1C1E]">To Buy</h2>
            <span className="text-xs px-2 py-0.5 rounded-xs bg-[#FFDBD0] text-[#97472E] font-bold">
              {filteredToBuy.length}
            </span>
          </div>
          <span className="text-xs text-outline hidden sm:inline">
            Click checkbox when purchased to transfer to pantry
          </span>
        </div>

        {filteredToBuy.length > 0 ? (
          <ul className="divide-y divide-[#E3E2E6]">
            {filteredToBuy.map((item) => (
              <li
                key={item.id}
                className="p-4 sm:p-5 hover:bg-[#FAF9FC] transition-colors flex items-start sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                  {/* Custom Checkbox */}
                  <button
                    type="button"
                    onClick={() => handleToggle(item.id)}
                    className="w-5 h-5 rounded-xs border-2 border-[#C2C8C0] hover:border-primary flex items-center justify-center transition-colors shrink-0 mt-0.5 sm:mt-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={`Mark ${item.name} as purchased`}
                  >
                    {item.checked && <Check className="w-3.5 h-3.5 text-primary stroke-[3]" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-base text-[#1A1C1E]">{item.name}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-xs bg-surface-container text-[#1A1C1E]">
                        {item.quantity} {item.unit}
                      </span>
                      {item.category && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-xs bg-[#FAF9FC] border border-[#E3E2E6] text-outline">
                          {item.category}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-on-surface-variant">
                      {item.source === 'recipe' && item.recipeName && (
                        <span className="inline-flex items-center gap-1 text-primary font-medium">
                          <Sparkles className="w-3 h-3" />
                          <span>Needed for {item.recipeName}</span>
                        </span>
                      )}
                      {item.source === 'pantry_restock' && (
                        <span className="inline-flex items-center gap-1 text-[#4A6B53] font-medium">
                          <Package className="w-3 h-3" />
                          <span>Restock staple</span>
                        </span>
                      )}
                      {item.notes && item.source === 'manual' && (
                        <span className="text-outline italic">{item.notes}</span>
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
                  className="p-1.5 text-outline hover:text-[#BA1A1A] hover:bg-red-50 rounded-xs transition-colors shrink-0 cursor-pointer"
                  aria-label={`Delete ${item.name}`}
                  title="Remove from list"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-2.5 stroke-[1.5]" />
            <h3 className="font-serif font-bold text-lg text-[#1A1C1E]">
              {selectedCategory === 'All' ? 'No items on your shopping list' : `No items in ${selectedCategory}`}
            </h3>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1 max-w-md mx-auto leading-relaxed">
              Add staples manually above, restock items from your pantry, or add missing ingredients directly from any recipe.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Link
                href="/recipes"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
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
        <section className="bg-white rounded-xs border border-[#E3E2E6] shadow-subtle overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#E3E2E6] bg-surface-container-low flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowPurchased(!showPurchased)}
              className="flex items-center gap-2 text-left font-serif font-bold text-lg text-[#1A1C1E] hover:text-primary transition-colors cursor-pointer"
            >
              <span>Purchased & Added to Pantry ({purchasedItems.length})</span>
              {showPurchased ? (
                <ChevronUp className="w-4 h-4 text-outline" />
              ) : (
                <ChevronDown className="w-4 h-4 text-outline" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsConfirmingClear(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-outline hover:text-[#BA1A1A] transition-colors px-2 py-1 rounded-xs hover:bg-red-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear purchased</span>
            </button>
          </div>

          {showPurchased && (
            <ul className="divide-y divide-[#E3E2E6] bg-[#FAF9FC]">
              {purchasedItems.map((item) => (
                <li
                  key={item.id}
                  className="p-4 sm:p-5 flex items-center justify-between gap-3 text-on-surface-variant"
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    {/* Uncheck button */}
                    <button
                      type="button"
                      onClick={() => handleToggle(item.id)}
                      className="w-5 h-5 rounded-xs bg-primary text-white flex items-center justify-center shrink-0 cursor-pointer"
                      title="Uncheck (item remains in pantry)"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-base line-through text-outline">
                          {item.name}
                        </span>
                        <span className="text-xs text-outline line-through">
                          {item.quantity} {item.unit}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-xs bg-primary-fixed text-primary">
                          In Pantry
                        </span>
                      </div>
                      {item.checkedAt && (
                        <span className="text-[11px] text-outline block mt-0.5">
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
                    className="p-1.5 text-outline hover:text-[#BA1A1A] hover:bg-red-50 rounded-xs transition-colors shrink-0 cursor-pointer"
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
            <div className="p-3.5 bg-surface-container-low rounded-xs border border-[#E3E2E6] text-xs sm:text-sm">
              <p className="text-[#1A1C1E] leading-relaxed">
                You currently have{' '}
                <strong className="text-primary font-bold">
                  {duplicateData.existingPantryItem.quantity} {duplicateData.existingPantryItem.unit}
                </strong>{' '}
                of <strong className="text-[#1A1C1E]">{duplicateData.existingPantryItem.name}</strong> in your pantry ({duplicateData.existingPantryItem.storageLocation}).
              </p>
              <p className="text-on-surface-variant mt-2">
                You just bought <strong className="text-[#1A1C1E]">{duplicateData.groceryItem.quantity} {duplicateData.groceryItem.unit}</strong> of {duplicateData.groceryItem.name}.
                How would you like to update your kitchen stock?
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => handleResolveChoice('merge')}
                className="w-full p-3.5 text-left rounded-xs border-2 border-primary bg-[#FAF9FC] hover:bg-[#C7ECCE]/20 transition-all flex items-start gap-3 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xs bg-primary text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-sm text-[#1A1C1E] group-hover:text-primary">
                    Add to existing item (Merge quantities)
                  </div>
                  <div className="text-xs text-on-surface-variant mt-0.5">
                    Updates existing {duplicateData.existingPantryItem.name} to{' '}
                    <strong>
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
                className="w-full p-3.5 text-left rounded-xs border border-[#C2C8C0] hover:border-[#1A1C1E] bg-white transition-all flex items-start gap-3 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xs bg-surface-container text-[#1A1C1E] flex items-center justify-center shrink-0 mt-0.5">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-sm text-[#1A1C1E]">
                    Keep as a separate item (New batch)
                  </div>
                  <div className="text-xs text-on-surface-variant mt-0.5">
                    Creates a second entry with its own fresh shelf-life date and storage location.
                  </div>
                </div>
              </button>
            </div>

            <div className="pt-3 border-t border-[#E3E2E6] flex justify-end">
              <button
                type="button"
                onClick={() => setDuplicateData(null)}
                className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:text-[#1A1C1E] rounded-xs"
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
          <p className="text-[#1A1C1E] leading-relaxed">
            This will remove all {purchasedItems.length} purchased items from your shopping list.
            The items that were transferred to your pantry will remain safely in your pantry inventory.
          </p>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsConfirmingClear(false)}
              className="px-3.5 py-2 bg-surface-container hover:bg-surface-container-high text-[#1A1C1E] text-xs font-medium rounded-xs min-h-[36px] cursor-pointer"
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
              className="px-3.5 py-2 bg-[#BA1A1A] hover:bg-red-800 text-white text-xs font-semibold rounded-xs min-h-[36px] cursor-pointer"
            >
              Clear Completed
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
