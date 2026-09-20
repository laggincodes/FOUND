'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePantry } from '@/lib/store';
import { FoodCategory, StorageLocation, FoodItem } from '@/types';
import { FOOD_LIBRARY_CATALOG } from '@/lib/food-library/food-catalog';
import { searchFoodLibrary } from '@/lib/food-library/normalizer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PriorityBadge } from '@/components/PriorityBadge';
import {
  CheckCircle2,
  PlusCircle,
  ArrowRight,
  ArrowLeft,
  Calendar,
  AlertCircle,
  Package,
} from 'lucide-react';

export default function ManualAddPage() {
  const router = useRouter();
  const { addItem, getItemAssessment } = usePantry();

  // Form states
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [category, setCategory] = useState<FoodCategory>('Produce');
  const [bestBefore, setBestBefore] = useState('');
  const [opened, setOpened] = useState(false);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [storageLocation, setStorageLocation] = useState<StorageLocation>('Fridge');
  const [notes, setNotes] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = React.useMemo(() => {
    if (name.trim().length < 2) return [];
    return searchFoodLibrary(name, FOOD_LIBRARY_CATALOG, 5);
  }, [name]);

  // UI status
  const [errorMsg, setErrorMsg] = useState('');
  const [addedItem, setAddedItem] = useState<FoodItem | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter a food name.');
      return;
    }

    const qtyNum = parseFloat(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setErrorMsg('Please provide a valid quantity greater than zero.');
      return;
    }

    if (bestBefore && purchaseDate) {
      const expDate = new Date(bestBefore);
      const purDate = new Date(purchaseDate);
      if (expDate < purDate) {
        setErrorMsg('Expiry date cannot be before purchase date.');
        return;
      }
    }

    // Save item
    const newItem = addItem({
      name: name.trim(),
      quantity: qtyNum,
      unit: unit.trim() || 'pcs',
      category,
      bestBefore: bestBefore || undefined,
      opened,
      openedDate: opened ? new Date().toISOString().split('T')[0] : undefined,
      purchaseDate: purchaseDate || undefined,
      storageLocation,
      notes: notes.trim() || undefined,
    });

    setAddedItem(newItem);
  };

  const handleResetForAnother = () => {
    setName('');
    setQuantity('1');
    setUnit('pcs');
    setBestBefore('');
    setOpened(false);
    setNotes('');
    setAddedItem(null);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen pb-24 overflow-x-hidden bg-[#121513] bg-editorial-pattern text-[#EFF1EC]">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8">
        <Breadcrumbs
        items={[
          { label: 'Add Food', href: '/add' },
          { label: 'Manual Entry' },
        ]}
      />

      <div className="mt-4 mb-8">
        <Link
          href="/add"
          className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#8E968F] hover:text-[#EFF1EC] mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to choices</span>
        </Link>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#EFF1EC] tracking-tight">
          Add Food Manually
        </h1>
        <p className="text-sm text-[#8E968F] font-sans mt-1">
          Record item details. The priority engine will immediately assess its planning urgency.
        </p>
      </div>

      {/* Success State */}
      {addedItem ? (
        <div className="bg-[#181C19] rounded-sm p-6 sm:p-8 border border-[#28302A] shadow-card animate-in fade-in">
          <div className="w-12 h-12 rounded-xs bg-[#16261B] text-[#78B48B] border border-[#243F2C] flex items-center justify-center mb-4">
            <CheckCircle2 className="w-6 h-6 stroke-[2]" />
          </div>

          <h2 className="font-serif font-bold text-2xl text-[#EFF1EC] tracking-tight">
            &ldquo;{addedItem.name}&rdquo; added to pantry
          </h2>
          <p className="text-sm text-[#8E968F] font-sans mt-1">
            Added {addedItem.quantity} {addedItem.unit} to your {addedItem.storageLocation}.
          </p>

          {/* Computed priority pill */}
          <div className="mt-4 p-4 rounded-xs bg-[#141715] border border-[#28302A] text-xs">
            <div className="flex items-center justify-between gap-2 mb-2 font-mono">
              <span className="text-[#EFF1EC]">Assigned Planning Priority:</span>
              <PriorityBadge tier={getItemAssessment(addedItem).tier} size="sm" />
            </div>
            <p className="text-[#8E968F] font-sans">
              <strong className="text-[#EFF1EC]">Rationale: </strong>
              {getItemAssessment(addedItem).primaryReason}
            </p>
          </div>

          {/* Next Action Links */}
          <div className="mt-6 pt-6 border-t border-[#222824] flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleResetForAnother}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3B6647] hover:bg-[#467854] text-[#EFF1EC] font-mono text-xs uppercase tracking-wider font-medium rounded-xs border border-[#4E805B]/30 shadow-subtle transition-colors min-h-[44px] cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Another Item</span>
            </button>

            <Link
              href="/pantry"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1E2420] hover:bg-[#262E28] text-[#EFF1EC] font-mono text-xs rounded-xs border border-[#28302A] transition-colors min-h-[44px]"
            >
              <Package className="w-4 h-4 text-[#8E968F]" />
              <span>View in Pantry</span>
            </Link>

            <Link
              href="/priority"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-[#78B48B] hover:text-[#93D4A8] transition-colors min-h-[44px]"
            >
              <span>Check Priority Board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        /* The Validated Form */
        <form
          onSubmit={handleSubmit}
          className="bg-[#181C19] rounded-sm p-6 sm:p-8 border border-[#28302A] space-y-5"
          noValidate
        >
          {errorMsg && (
            <div className="p-3 bg-[#2D1915] border border-[#482520] rounded-xs text-xs font-mono text-[#FF9E90] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Food Name with Library Autocomplete */}
          <div className="relative">
            <label htmlFor="food-name" className="block text-xs font-mono uppercase tracking-wider text-[#8E968F] mb-1.5">
              Food Name <span className="text-[#FF9E90]">*</span>
            </label>
            <input
              id="food-name"
              type="text"
              required
              placeholder="e.g. Baby Spinach, Cottage Cheese, Milk, Sliced Bread"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full px-3.5 py-2.5 bg-[#141715] border border-[#28302A] rounded-xs text-sm text-[#EFF1EC] focus:border-[#4B7A58] focus:outline-none placeholder-[#5A635B]"
              autoComplete="off"
            />

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#181C19] border border-[#28302A] rounded-xs shadow-card z-50 overflow-hidden divide-y divide-[#222824] max-h-52 overflow-y-auto">
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
                      if (item.storageType === 'refrigerator') setStorageLocation('Fridge');
                      else if (item.storageType === 'freezer') setStorageLocation('Freezer');
                      else if (item.storageType === 'pantry') setStorageLocation('Cupboard / Pantry');
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

          {/* Quantity and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="quantity" className="block text-xs font-mono uppercase tracking-wider text-[#8E968F] mb-1.5">
                Quantity <span className="text-[#FF9E90]">*</span>
              </label>
              <input
                id="quantity"
                type="number"
                step="any"
                min="0.1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#141715] border border-[#28302A] rounded-xs text-sm text-[#EFF1EC] focus:border-[#4B7A58] focus:outline-none font-mono"
              />
            </div>
            <div>
              <label htmlFor="unit" className="block text-xs font-mono uppercase tracking-wider text-[#8E968F] mb-1.5">
                Unit <span className="text-[#FF9E90]">*</span>
              </label>
              <input
                id="unit"
                type="text"
                required
                placeholder="e.g. g, kg, L, ml, pcs, bunch"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#141715] border border-[#28302A] rounded-xs text-sm text-[#EFF1EC] focus:border-[#4B7A58] focus:outline-none font-mono placeholder-[#5A635B]"
              />
            </div>
          </div>

          {/* Category & Storage Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-xs font-mono uppercase tracking-wider text-[#8E968F] mb-1.5">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as FoodCategory)}
                className="w-full px-3.5 py-2.5 bg-[#141715] border border-[#28302A] rounded-xs text-sm focus:border-[#4B7A58] focus:outline-none text-[#EFF1EC] cursor-pointer"
              >
                <option value="Produce">Produce (Vegetables / Fruits)</option>
                <option value="Dairy & Eggs">Dairy & Eggs</option>
                <option value="Bakery">Bakery & Bread</option>
                <option value="Pantry & Grains">Pantry & Grains</option>
                <option value="Meat & Protein">Meat & Protein</option>
                <option value="Canned & Jars">Canned & Jars</option>
                <option value="Beverages">Beverages</option>
                <option value="Spices & Condiments">Spices & Condiments</option>
                <option value="Frozen">Frozen</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="storage-location" className="block text-xs font-mono uppercase tracking-wider text-[#8E968F] mb-1.5">
                Storage Location
              </label>
              <select
                id="storage-location"
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value as StorageLocation)}
                className="w-full px-3.5 py-2.5 bg-[#141715] border border-[#28302A] rounded-xs text-sm focus:border-[#4B7A58] focus:outline-none text-[#EFF1EC] cursor-pointer"
              >
                <option value="Fridge">Fridge</option>
                <option value="Cupboard / Pantry">Cupboard / Pantry</option>
                <option value="Countertop">Countertop</option>
                <option value="Freezer">Freezer</option>
              </select>
            </div>
          </div>

          {/* Dates: Best-Before & Purchase */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="best-before" className="block text-xs font-mono uppercase tracking-wider text-[#8E968F] mb-1.5">
                Best-Before / Use-By Date
              </label>
              <input
                id="best-before"
                type="date"
                value={bestBefore}
                onChange={(e) => setBestBefore(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#141715] border border-[#28302A] rounded-xs text-sm text-[#EFF1EC] focus:border-[#4B7A58] focus:outline-none font-mono"
              />
              <p className="text-[11px] font-mono text-[#5A635B] mt-1">Optional. System never invents a date.</p>
            </div>

            <div>
              <label htmlFor="purchase-date" className="block text-xs font-mono uppercase tracking-wider text-[#8E968F] mb-1.5">
                Purchase Date
              </label>
              <input
                id="purchase-date"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#141715] border border-[#28302A] rounded-xs text-sm text-[#EFF1EC] focus:border-[#4B7A58] focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Opened Checkbox */}
          <div className="p-3.5 bg-[#141715] border border-[#28302A] rounded-xs">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={opened}
                onChange={(e) => setOpened(e.target.checked)}
                className="rounded-xs border-[#28302A] bg-[#121513] text-[#3B6647] focus:ring-0 w-4 h-4 mt-0.5"
              />
              <div>
                <span className="text-sm font-semibold text-[#EFF1EC] block font-sans">Package is currently opened</span>
                <span className="text-xs text-[#8E968F] block mt-0.5 font-sans">
                  Opened items (especially dairy and fresh produce) oxidize faster and are scored with higher priority.
                </span>
              </div>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-xs font-mono uppercase tracking-wider text-[#8E968F] mb-1.5">
              Notes (Optional)
            </label>
            <input
              id="notes"
              type="text"
              placeholder="e.g. Opened yesterday, seal tightly, ripe for cooking"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#141715] border border-[#28302A] rounded-xs text-sm text-[#EFF1EC] focus:border-[#4B7A58] focus:outline-none placeholder-[#5A635B]"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[#222824]">
            <Link
              href="/add"
              className="px-4 py-2 text-xs font-mono text-[#8E968F] hover:text-[#EFF1EC] font-medium rounded-xs hover:bg-[#1E2420] transition-colors min-h-[40px] inline-flex items-center"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 bg-[#3B6647] hover:bg-[#467854] text-[#EFF1EC] font-mono text-xs uppercase tracking-wider font-medium px-6 py-2.5 rounded-xs border border-[#4E805B]/30 shadow-subtle transition-colors min-h-[40px] cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Save to Pantry</span>
            </button>
          </div>
        </form>
      )}
      </main>
    </div>
  );
}
