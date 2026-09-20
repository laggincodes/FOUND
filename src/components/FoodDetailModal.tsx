'use client';

import React, { useState, useEffect } from 'react';
import { FoodLibraryItem, FoodCategory } from '@/types';
import { usePantry } from '@/lib/store';
import { Modal } from './Modal';
import {
  ShoppingCart,
  Plus,
  Minus,
  Check,
  Ban,
  Clock,
  Archive,
  Thermometer,
  BookOpen,
  Info,
} from 'lucide-react';

interface FoodDetailModalProps {
  food: FoodLibraryItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const FoodDetailModal: React.FC<FoodDetailModalProps> = ({
  food,
  isOpen,
  onClose,
}) => {
  const {
    items: pantryItems,
    groceryItems,
    addGroceryItem,
    dontSuggestFood,
  } = usePantry();

  const [quantity, setQuantity] = useState<number>(1);
  const [selectedUnit, setSelectedUnit] = useState<string>('pcs');
  const [justAdded, setJustAdded] = useState(false);
  const [justHidden, setJustHidden] = useState(false);

  // Check if item is in pantry
  const pantryItem = food
    ? pantryItems.find(
        (p) =>
          p.foodId === food.id ||
          p.name.toLowerCase() === food.name.toLowerCase() ||
          food.aliases?.some((a) => p.name.toLowerCase().includes(a.toLowerCase()))
      )
    : undefined;

  // Check if item is currently on shopping list
  const activeGroceryItem = food
    ? groceryItems.find(
        (g) =>
          !g.checked &&
          (g.foodId === food.id ||
            g.name.toLowerCase() === food.name.toLowerCase() ||
            food.aliases?.some((a) => g.name.toLowerCase().includes(a.toLowerCase())))
      )
    : undefined;

  useEffect(() => {
    if (food) {
      if (activeGroceryItem) {
        setQuantity(activeGroceryItem.quantity ?? (food.defaultUnit === 'g' ? 500 : 1));
        setSelectedUnit(activeGroceryItem.unit ?? (food.defaultUnit || 'pcs'));
      } else {
        const defaultQty = food.defaultUnit === 'g' ? 500 : 1;
        setQuantity(defaultQty);
        setSelectedUnit(food.defaultUnit || 'pcs');
      }
      setJustAdded(false);
      setJustHidden(false);
    }
  }, [food, activeGroceryItem]);

  if (!food) return null;

  const handleIncrement = () => {
    const step = selectedUnit === 'g' || selectedUnit === 'ml' ? 100 : 1;
    setQuantity((prev) => Number((prev + step).toFixed(1)));
  };

  const handleDecrement = () => {
    const step = selectedUnit === 'g' || selectedUnit === 'ml' ? 100 : 1;
    setQuantity((prev) => Math.max(step, Number((prev - step).toFixed(1))));
  };

  const handleAddOrUpdateGrocery = () => {
    addGroceryItem({
      foodId: food.id,
      name: food.name,
      quantity,
      unit: selectedUnit,
      category: food.category as FoodCategory,
      source: 'manual',
    });
    setJustAdded(true);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const handleDontSuggest = () => {
    dontSuggestFood(food.id);
    setJustHidden(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={food.name}
      description={`${food.category} • ${food.subcategory || 'Staple'}`}
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Status Banners */}
        {pantryItem ? (
          <div className="p-3 bg-olive-50 border border-olive-200 rounded-xl flex items-center gap-3 text-xs text-olive-900">
            <Archive className="w-4 h-4 text-olive-700 shrink-0" />
            <div>
              <span className="font-semibold">In your pantry: </span>
              {pantryItem.quantity} {pantryItem.unit} in {pantryItem.storageLocation || 'kitchen'}
              {pantryItem.bestBefore && (
                <span className="text-olive-700 ml-1">
                  (best before {new Date(pantryItem.bestBefore).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-earth-50 border border-earth-200 rounded-xl flex items-center gap-3 text-xs text-earth-700">
            <Info className="w-4 h-4 text-earth-500 shrink-0" />
            <span>Not currently in your pantry stock.</span>
          </div>
        )}

        {activeGroceryItem && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-xs text-amber-900">
            <ShoppingCart className="w-4 h-4 text-amber-700 shrink-0" />
            <div>
              <span className="font-semibold">Already on your shopping list: </span>
              {activeGroceryItem.quantity} {activeGroceryItem.unit}. Updating will adjust the planned quantity.
            </div>
          </div>
        )}

        {/* Food Attributes Grid */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-earth-50/80 p-2.5 rounded-xl border border-surface-border">
            <div className="text-ink-muted flex items-center gap-1.5 mb-1">
              <Thermometer className="w-3.5 h-3.5 text-earth-600" />
              Storage
            </div>
            <div className="font-medium text-ink capitalize">{food.storageType || 'Pantry'}</div>
          </div>
          <div className="bg-earth-50/80 p-2.5 rounded-xl border border-surface-border">
            <div className="text-ink-muted flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-earth-600" />
              Shelf Life
            </div>
            <div className="font-medium text-ink">~{food.typicalShelfLifeDays} days</div>
          </div>
          <div className="bg-earth-50/80 p-2.5 rounded-xl border border-surface-border">
            <div className="text-ink-muted flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-olive-600" />
              Perishability
            </div>
            <div className="font-medium text-ink capitalize">{food.perishability}</div>
          </div>
        </div>

        {/* Common Uses */}
        {food.commonUses && food.commonUses.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-earth-600" />
              Common Meal Ideas
            </div>
            <div className="flex flex-wrap gap-1.5">
              {food.commonUses.map((use) => (
                <span
                  key={use}
                  className="text-xs px-2.5 py-1 bg-white border border-surface-border rounded-lg text-ink font-medium shadow-2xs"
                >
                  {use}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Quantity & Unit Selection */}
        <div className="border-t border-surface-border pt-4">
          <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
            Add to Grocery List
          </label>
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-surface-border rounded-xl bg-earth-50/50 p-1">
              <button
                type="button"
                onClick={handleDecrement}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink hover:bg-white transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min="0.1"
                step={selectedUnit === 'g' || selectedUnit === 'ml' ? '50' : '0.5'}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                className="w-16 text-center text-sm font-semibold text-ink bg-transparent focus:outline-none"
              />
              <button
                type="button"
                onClick={handleIncrement}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink hover:bg-white transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Units */}
            {food.commonUnits && food.commonUnits.length > 1 ? (
              <div className="flex gap-1">
                {food.commonUnits.map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setSelectedUnit(u)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      selectedUnit === u
                        ? 'bg-ink text-white border-ink shadow-2xs'
                        : 'bg-white text-ink-muted border-surface-border hover:border-earth-400'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-xs font-medium text-ink-muted px-2 py-1 bg-earth-100 rounded-lg">
                {selectedUnit}
              </span>
            )}
          </div>
        </div>

        {/* Primary and Exclusion Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleAddOrUpdateGrocery}
            disabled={justAdded}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
              justAdded
                ? 'bg-olive-600 text-white'
                : 'bg-olive-800 text-white hover:bg-olive-900 active:scale-[0.99] shadow-sm'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4" />
                {activeGroceryItem ? 'Updated on Shopping List' : 'Added to Shopping List'}
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                {activeGroceryItem ? 'Update List Quantity' : 'Add to Shopping List'}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDontSuggest}
            disabled={justHidden}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs text-terracotta-700 bg-terracotta-50 hover:bg-terracotta-100 border border-terracotta-200 transition-colors"
            title="Exclude this item from future recommendations"
          >
            <Ban className="w-3.5 h-3.5" />
            {justHidden ? 'Excluded' : "Don't suggest"}
          </button>
        </div>
      </div>
    </Modal>
  );
};
