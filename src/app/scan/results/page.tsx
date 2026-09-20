'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePantry } from '@/lib/store';
import { DetectedPantryItem, FoodCategory, StorageLocation } from '@/types';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import {
  Check,
  Trash2,
  Edit2,
  Plus,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  Calendar,
} from 'lucide-react';

export default function ScanResultsPage() {
  const router = useRouter();
  const { addItem } = usePantry();

  const [items, setItems] = useState<DetectedPantryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCommitted, setIsCommitted] = useState(false);
  const [addedCount, setAddedCount] = useState(0);

  // Load detected items from sessionStorage or fallback demo scan
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('detected_pantry_items_v1');
      if (stored) {
        setItems(JSON.parse(stored));
      } else {
        // Fallback default detected items if visited directly
        const fallback: DetectedPantryItem[] = [
          {
            id: 'det-1',
            name: 'Fresh Spinach',
            category: 'Produce',
            suggestedQuantity: 250,
            suggestedUnit: 'g',
            confidence: 0.94,
            confirmed: true,
            bestBefore: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
            opened: false,
            storageLocation: 'Fridge',
          },
          {
            id: 'det-2',
            name: 'Vine Tomatoes',
            category: 'Produce',
            suggestedQuantity: 4,
            suggestedUnit: 'pcs',
            confidence: 0.89,
            confirmed: true,
            bestBefore: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
            opened: false,
            storageLocation: 'Fridge',
          },
          {
            id: 'det-3',
            name: 'Whole Milk',
            category: 'Dairy & Eggs',
            suggestedQuantity: 1,
            suggestedUnit: 'L',
            confidence: 0.92,
            confirmed: true,
            bestBefore: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
            opened: true,
            storageLocation: 'Fridge',
          },
          {
            id: 'det-4',
            name: 'Fresh Paneer',
            category: 'Dairy & Eggs',
            suggestedQuantity: 200,
            suggestedUnit: 'g',
            confidence: 0.86,
            confirmed: true,
            bestBefore: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
            opened: false,
            storageLocation: 'Fridge',
          },
        ];
        setItems(fallback);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const handleUpdateItem = (id: string, updates: Partial<DetectedPantryItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleToggleConfirm = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, confirmed: !item.confirmed } : item))
    );
  };

  const handleAddNewItem = () => {
    const newItem: DetectedPantryItem = {
      id: `det-${Date.now()}`,
      name: 'New Item',
      category: 'Produce',
      suggestedQuantity: 1,
      suggestedUnit: 'pcs',
      confidence: 1.0,
      confirmed: true,
      opened: false,
      storageLocation: 'Fridge',
    };
    setItems([...items, newItem]);
  };

  const handleCommitAll = () => {
    const confirmedItems = items.filter((i) => i.confirmed && i.name.trim().length > 0);
    if (confirmedItems.length === 0) return;

    confirmedItems.forEach((c) => {
      addItem({
        name: c.name.trim(),
        quantity: c.suggestedQuantity || 1,
        unit: c.suggestedUnit || 'pcs',
        category: c.category,
        bestBefore: c.bestBefore || undefined,
        opened: c.opened,
        storageLocation: c.storageLocation,
        notes: 'Added from pantry photo scan.',
      });
    });

    // Clear session storage
    sessionStorage.removeItem('detected_pantry_items_v1');
    setAddedCount(confirmedItems.length);
    setIsCommitted(true);
  };

  if (!isLoaded) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#28302A] border-t-[#86EFAC] animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-mono text-[#8E968F]">Loading scan results…</p>
      </div>
    );
  }

  // Success state after saving to pantry
  if (isCommitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center animate-in fade-in">
        <div className="w-14 h-14 rounded-xs bg-[#16261B] text-[#86EFAC] border border-[#23432B] flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 stroke-[2]" />
        </div>
        <h1 className="font-serif font-bold text-3xl text-[#EFF1EC]">
          {addedCount} {addedCount === 1 ? 'item' : 'items'} added to your pantry!
        </h1>
        <p className="text-sm text-[#8E968F] mt-2 max-w-md mx-auto leading-relaxed">
          Your inventory and priority rankings have been updated. You can now view what needs attention
          or find recipes using these ingredients.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/priority"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#3B6647] hover:bg-[#467854] text-[#EFF1EC] font-mono text-xs uppercase tracking-wider rounded-xs border border-[#4E805B]/30 transition-colors min-h-[44px]"
          >
            <span>What Should I Use First?</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/pantry"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#1E2420] hover:bg-[#262E28] text-[#EFF1EC] font-mono text-xs uppercase tracking-wider border border-[#28302A] rounded-xs transition-colors min-h-[44px]"
          >
            <span>Go to My Pantry</span>
          </Link>
        </div>
      </div>
    );
  }

  const confirmedCount = items.filter((i) => i.confirmed).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumbs
        items={[
          { label: 'Add Food', href: '/add' },
          { label: 'Scan Pantry', href: '/scan' },
          { label: 'Review Results' },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-4 mb-8">
        <div>
          <div className="text-[11px] font-mono tracking-widest text-[#8E968F] uppercase mb-1">
            Verification Step
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#EFF1EC] tracking-tight">
            Review Recognized Items
          </h1>
          <p className="text-sm text-[#8E968F] mt-1 max-w-xl">
            Confirm detected items and fill in missing details (quantities, best-before dates, and opened status)
            before adding them to your pantry.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleAddNewItem}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#1E2420] hover:bg-[#262E28] text-[#EFF1EC] text-xs font-mono uppercase tracking-wider border border-[#28302A] rounded-xs transition-colors min-h-[40px]"
          >
            <Plus className="w-3.5 h-3.5 text-[#86EFAC]" />
            <span>Add Missing Item</span>
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-[#181C19] rounded-xs p-8 border border-[#28302A] text-center">
          <p className="font-serif font-bold text-lg text-[#EFF1EC]">No items in this scan review</p>
          <p className="text-xs font-mono text-[#8E968F] mt-1 mb-4">All detected items were removed.</p>
          <Link
            href="/scan"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#3B6647] hover:bg-[#467854] text-[#EFF1EC] text-xs font-mono uppercase tracking-wider rounded-xs min-h-[44px]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Scan Again</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`rounded-xs p-4 sm:p-5 border transition-all ${
                item.confirmed
                  ? 'bg-[#181C19] border-[#28302A] shadow-2xs'
                  : 'border-dashed border-[#28302A] opacity-60 bg-[#141715]'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left: Confirmation toggle and Name */}
                <div className="flex items-center gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={item.confirmed}
                    onChange={() => handleToggleConfirm(item.id)}
                    className="w-4 h-4 rounded-xs border-[#28302A] bg-[#141715] text-[#3B6647] focus:ring-[#3B6647] cursor-pointer shrink-0"
                    aria-label={`Confirm ${item.name}`}
                  />

                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                      className="font-serif font-bold text-base text-[#EFF1EC] bg-transparent border-b border-transparent hover:border-[#28302A] focus:border-[#3B6647] focus:outline-none w-full py-0.5"
                      aria-label="Food Name"
                    />
                    <div className="flex items-center gap-2 text-xs font-mono text-[#8E968F] mt-0.5">
                      <span>Confidence: {Math.round(item.confidence * 100)}%</span>
                      <span>•</span>
                      <select
                        value={item.category}
                        onChange={(e) =>
                          handleUpdateItem(item.id, { category: e.target.value as FoodCategory })
                        }
                        className="bg-[#141715] text-xs font-mono text-[#8E968F] border border-[#28302A] rounded-xs px-1 py-0.5 focus:outline-none cursor-pointer"
                      >
                        <option value="Produce">Produce</option>
                        <option value="Dairy & Eggs">Dairy & Eggs</option>
                        <option value="Bakery">Bakery</option>
                        <option value="Pantry & Grains">Pantry & Grains</option>
                        <option value="Meat & Protein">Meat & Protein</option>
                        <option value="Canned & Jars">Canned & Jars</option>
                        <option value="Beverages">Beverages</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Right: Quantity, Date, Opened, and Delete Action */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                  {/* Quantity & Unit */}
                  <div className="flex items-center gap-1.5 bg-[#141715] px-2.5 py-1.5 rounded-xs border border-[#28302A]">
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      value={item.suggestedQuantity}
                      onChange={(e) =>
                        handleUpdateItem(item.id, { suggestedQuantity: parseFloat(e.target.value) || 1 })
                      }
                      className="w-14 bg-[#181C19] border border-[#28302A] rounded-xs px-1.5 py-0.5 text-xs font-mono text-[#EFF1EC] text-center focus:outline-none focus:border-[#3B6647]"
                      aria-label="Quantity"
                    />
                    <input
                      type="text"
                      value={item.suggestedUnit}
                      onChange={(e) => handleUpdateItem(item.id, { suggestedUnit: e.target.value })}
                      className="w-12 bg-[#181C19] border border-[#28302A] rounded-xs px-1.5 py-0.5 text-xs font-mono text-[#EFF1EC] text-center focus:outline-none focus:border-[#3B6647]"
                      aria-label="Unit"
                    />
                  </div>

                  {/* Best Before Date */}
                  <div className="flex items-center gap-1.5 bg-[#141715] px-2.5 py-1.5 rounded-xs border border-[#28302A] text-xs font-mono">
                    <Calendar className="w-3.5 h-3.5 text-[#8E968F] shrink-0" />
                    <input
                      type="date"
                      value={item.bestBefore || ''}
                      onChange={(e) => handleUpdateItem(item.id, { bestBefore: e.target.value })}
                      className="bg-transparent text-xs font-mono text-[#EFF1EC] focus:outline-none"
                      aria-label="Best Before Date"
                    />
                  </div>

                  {/* Opened toggle */}
                  <label className="flex items-center gap-1.5 text-xs font-mono cursor-pointer px-2 py-1.5">
                    <input
                      type="checkbox"
                      checked={item.opened}
                      onChange={(e) => handleUpdateItem(item.id, { opened: e.target.checked })}
                      className="rounded-xs border-[#28302A] bg-[#141715] text-[#3B6647] focus:ring-[#3B6647]"
                    />
                    <span className="text-[#8E968F] whitespace-nowrap">Opened</span>
                  </label>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-2 text-[#8E968F] hover:text-[#F87171] rounded-xs hover:bg-[#2D1915] transition-colors"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Bottom Confirmation Bar */}
          <div className="mt-8 p-4 bg-[#181C19] rounded-xs border border-[#28302A] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs font-mono text-[#8E968F]">
              Ready to add <strong className="text-[#EFF1EC]">{confirmedCount}</strong> confirmed{' '}
              {confirmedCount === 1 ? 'item' : 'items'} to your pantry.
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                href="/scan"
                className="px-4 py-2 text-xs font-mono uppercase tracking-wider text-[#8E968F] hover:text-[#EFF1EC] rounded-xs hover:bg-[#1E2420] border border-transparent hover:border-[#28302A] transition-colors min-h-[44px] flex items-center justify-center"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={handleCommitAll}
                disabled={confirmedCount === 0}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xs font-mono text-xs uppercase tracking-wider transition-all min-h-[44px] ${
                  confirmedCount > 0
                    ? 'bg-[#3B6647] hover:bg-[#467854] text-[#EFF1EC] border border-[#4E805B]/30 shadow-xs cursor-pointer'
                    : 'bg-[#1E2420] text-[#5A635B] border border-[#28302A] cursor-not-allowed'
                }`}
              >
                <PackageCheck className="w-4 h-4" />
                <span>Add {confirmedCount} Items to Pantry</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
