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
          <div className="p-3 bg-[#16261B] border border-[#23432B] rounded-xs flex items-center gap-3 text-xs text-[#86EFAC]">
            <Archive className="w-4 h-4 text-[#86EFAC] shrink-0" />
            <div>
              <span className="font-medium text-[#EFF1EC]">In your pantry: </span>
              {pantryItem.quantity} {pantryItem.unit} in {pantryItem.storageLocation || 'kitchen'}
              {pantryItem.bestBefore && (
                <span className="text-[#86EFAC]/80 ml-1">
                  (best before {new Date(pantryItem.bestBefore).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-[#141715] border border-[#28302A] rounded-xs flex items-center gap-3 text-xs text-[#8E968F]">
            <Info className="w-4 h-4 text-[#5A635B] shrink-0" />
            <span>Not currently in your pantry stock.</span>
          </div>
        )}

        {activeGroceryItem && (
          <div className="p-3 bg-[#282115] border border-[#42331C] rounded-xs flex items-center gap-3 text-xs text-[#FDE047]">
            <ShoppingCart className="w-4 h-4 text-[#FDE047] shrink-0" />
            <div>
              <span className="font-medium text-[#EFF1EC]">Already on your shopping list: </span>
              {activeGroceryItem.quantity} {activeGroceryItem.unit}. Updating will adjust the planned quantity.
            </div>
          </div>
        )}

        {/* Food Attributes Grid */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-[#141715] p-2.5 rounded-xs border border-[#28302A]">
            <div className="text-[#8E968F] font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Thermometer className="w-3.5 h-3.5 text-[#5A635B]" />
              Storage
            </div>
            <div className="font-mono text-sm text-[#EFF1EC] capitalize">{food.storageType || 'Pantry'}</div>
          </div>
          <div className="bg-[#141715] p-2.5 rounded-xs border border-[#28302A]">
            <div className="text-[#8E968F] font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-[#5A635B]" />
              Shelf Life
            </div>
            <div className="font-mono text-sm text-[#EFF1EC]">~{food.typicalShelfLifeDays} days</div>
          </div>
          <div className="bg-[#141715] p-2.5 rounded-xs border border-[#28302A]">
            <div className="text-[#8E968F] font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#86EFAC]" />
              Perishability
            </div>
            <div className="font-mono text-sm text-[#EFF1EC] capitalize">{food.perishability}</div>
          </div>
        </div>

        {/* Common Uses */}
        {food.commonUses && food.commonUses.length > 0 && (
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#8E968F] mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#5A635B]" />
              Common Meal Ideas
            </div>
            <div className="flex flex-wrap gap-1.5">
              {food.commonUses.map((use) => (
                <span
                  key={use}
                  className="text-xs font-mono px-2.5 py-1 bg-[#141715] border border-[#28302A] rounded-xs text-[#EFF1EC]"
                >
                  {use}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Quantity & Unit Selection */}
        <div className="border-t border-[#28302A] pt-4">
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8E968F] mb-2">
            Add to Grocery List
          </label>
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-[#28302A] rounded-xs bg-[#141715] p-1">
              <button
                type="button"
                onClick={handleDecrement}
                className="w-8 h-8 rounded-xs flex items-center justify-center text-[#8E968F] hover:text-[#EFF1EC] hover:bg-[#1E2420] transition-colors"
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
                className="w-16 text-center text-sm font-mono text-[#EFF1EC] bg-transparent focus:outline-none"
              />
              <button
                type="button"
                onClick={handleIncrement}
                className="w-8 h-8 rounded-xs flex items-center justify-center text-[#8E968F] hover:text-[#EFF1EC] hover:bg-[#1E2420] transition-colors"
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
                    className={`px-3 py-1.5 text-xs font-mono rounded-xs border transition-all ${
                      selectedUnit === u
                        ? 'bg-[#1E2420] text-[#EFF1EC] border-[#3B6647]'
                        : 'bg-[#141715] text-[#8E968F] border-[#28302A] hover:border-[#3B6647]/50 hover:text-[#EFF1EC]'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-xs font-mono text-[#8E968F] px-2 py-1 bg-[#141715] border border-[#28302A] rounded-xs">
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
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xs text-xs font-mono uppercase tracking-wider transition-all ${
              justAdded
                ? 'bg-[#16261B] text-[#86EFAC] border border-[#23432B]'
                : 'bg-[#3B6647] text-[#EFF1EC] hover:bg-[#467854] border border-[#4E805B]/30 active:scale-[0.99]'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4 text-[#86EFAC]" />
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
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xs text-xs font-mono uppercase tracking-wider text-[#F87171] bg-[#2D1915] hover:bg-[#3D221D] border border-[#4D241D] transition-colors"
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
