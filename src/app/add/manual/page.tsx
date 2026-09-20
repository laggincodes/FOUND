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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Add Food', href: '/add' },
          { label: 'Manual Entry' },
        ]}
      />

      <div className="mt-4 mb-8">
        <Link
          href="/add"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to choices</span>
        </Link>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
          Add Food Manually
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          Record item details. The priority engine will immediately assess its planning urgency.
        </p>
      </div>

      {/* Success State */}
      {addedItem ? (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-surface-border shadow-soft animate-in fade-in">
          <div className="w-12 h-12 rounded-2xl bg-[#EAF5EE] text-[#1E7245] flex items-center justify-center mb-4">
            <CheckCircle2 className="w-6 h-6 stroke-[2]" />
          </div>

          <h2 className="font-serif font-bold text-2xl text-ink">
            &ldquo;{addedItem.name}&rdquo; added to pantry
          </h2>
          <p className="text-sm text-ink-muted mt-1">
            Added {addedItem.quantity} {addedItem.unit} to your {addedItem.storageLocation}.
          </p>

          {/* Computed priority pill */}
          <div className="mt-4 p-4 rounded-xl bg-earth-50 border border-surface-border text-xs">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-semibold text-ink">Assigned Planning Priority:</span>
              <PriorityBadge tier={getItemAssessment(addedItem).tier} size="sm" />
            </div>
            <p className="text-ink-muted">
              <strong>Rationale: </strong>
              {getItemAssessment(addedItem).primaryReason}
            </p>
          </div>

          {/* Next Action Links */}
          <div className="mt-6 pt-6 border-t border-earth-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleResetForAnother}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#C84B31] hover:bg-[#b03e26] text-white font-semibold text-sm rounded-xl transition-colors min-h-[44px]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Another Item</span>
            </button>

            <Link
              href="/pantry"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-earth-100 hover:bg-earth-200 text-ink font-medium text-sm rounded-xl transition-colors min-h-[44px]"
            >
              <Package className="w-4 h-4 text-ink-muted" />
              <span>View in Pantry</span>
            </Link>

            <Link
              href="/priority"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs text-ink-muted hover:text-ink font-semibold transition-colors min-h-[44px]"
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
          className="bg-white rounded-2xl p-6 sm:p-8 border border-surface-border shadow-soft space-y-5"
          noValidate
        >
          {errorMsg && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FEE2E2] rounded-xl text-xs text-[#DC2626] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Food Name with Library Autocomplete */}
          <div className="relative">
            <label htmlFor="food-name" className="block text-xs font-bold text-ink mb-1.5 uppercase tracking-wide">
              Food Name <span className="text-[#C84B31]">*</span>
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
              className="w-full px-3.5 py-2.5 bg-earth-50 border border-surface-border rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#C84B31]"
              autoComplete="off"
            />

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-surface-border rounded-xl shadow-soft z-50 overflow-hidden divide-y divide-surface-border max-h-52 overflow-y-auto">
                <div className="px-3 py-1.5 bg-earth-50 text-[10px] uppercase font-bold text-ink-muted">
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
                    className="w-full px-3 py-2 text-left hover:bg-earth-50 flex items-center justify-between text-xs cursor-pointer transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-ink">{item.name}</span>
                      {item.aliases.length > 0 && (
                        <span className="text-[10px] text-ink-muted ml-1.5">
                          ({item.aliases.slice(0, 2).join(', ')})
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-ink-muted font-medium px-1.5 py-0.5 rounded-md bg-earth-100">
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
              <label htmlFor="quantity" className="block text-xs font-bold text-ink mb-1.5 uppercase tracking-wide">
                Quantity <span className="text-[#C84B31]">*</span>
              </label>
              <input
                id="quantity"
                type="number"
                step="any"
                min="0.1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-earth-50 border border-surface-border rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#C84B31]"
              />
            </div>
            <div>
              <label htmlFor="unit" className="block text-xs font-bold text-ink mb-1.5 uppercase tracking-wide">
                Unit <span className="text-[#C84B31]">*</span>
              </label>
              <input
                id="unit"
                type="text"
                required
                placeholder="e.g. g, kg, L, ml, pcs, bunch"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-earth-50 border border-surface-border rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#C84B31]"
              />
            </div>
          </div>

          {/* Category & Storage Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-xs font-bold text-ink mb-1.5 uppercase tracking-wide">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as FoodCategory)}
                className="w-full px-3.5 py-2.5 bg-earth-50 border border-surface-border rounded-xl text-sm focus:bg-white focus:outline-hidden text-ink cursor-pointer"
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
              <label htmlFor="storage-location" className="block text-xs font-bold text-ink mb-1.5 uppercase tracking-wide">
                Storage Location
              </label>
              <select
                id="storage-location"
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value as StorageLocation)}
                className="w-full px-3.5 py-2.5 bg-earth-50 border border-surface-border rounded-xl text-sm focus:bg-white focus:outline-hidden text-ink cursor-pointer"
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
              <label htmlFor="best-before" className="block text-xs font-bold text-ink mb-1.5 uppercase tracking-wide">
                Best-Before / Use-By Date
              </label>
              <input
                id="best-before"
                type="date"
                value={bestBefore}
                onChange={(e) => setBestBefore(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-earth-50 border border-surface-border rounded-xl text-sm focus:bg-white focus:outline-hidden"
              />
              <p className="text-[11px] text-ink-faint mt-1">Optional. System never invents a date.</p>
            </div>

            <div>
              <label htmlFor="purchase-date" className="block text-xs font-bold text-ink mb-1.5 uppercase tracking-wide">
                Purchase Date
              </label>
              <input
                id="purchase-date"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-earth-50 border border-surface-border rounded-xl text-sm focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          {/* Opened Checkbox */}
          <div className="p-3.5 bg-earth-50/70 border border-surface-border rounded-xl">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={opened}
                onChange={(e) => setOpened(e.target.checked)}
                className="rounded border-surface-border text-[#C84B31] focus:ring-[#C84B31] w-4 h-4 mt-0.5"
              />
              <div>
                <span className="text-sm font-semibold text-ink block">Package is currently opened</span>
                <span className="text-xs text-ink-muted block mt-0.5">
                  Opened items (especially dairy and fresh produce) oxidize faster and are scored with higher priority.
                </span>
              </div>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-xs font-bold text-ink mb-1.5 uppercase tracking-wide">
              Notes (Optional)
            </label>
            <input
              id="notes"
              type="text"
              placeholder="e.g. Opened yesterday, seal tightly, ripe for cooking"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-earth-50 border border-surface-border rounded-xl text-sm focus:bg-white focus:outline-hidden"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-earth-100">
            <Link
              href="/add"
              className="px-4 py-2.5 text-sm text-ink-muted hover:text-ink font-medium rounded-xl hover:bg-earth-100 transition-colors min-h-[44px] inline-flex items-center"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 bg-[#C84B31] hover:bg-[#b03e26] text-white font-semibold px-6 py-2.5 rounded-xl shadow-xs transition-colors text-sm min-h-[44px]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Save to Pantry</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
