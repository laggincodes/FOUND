'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePantry } from '@/lib/store';
import { useToast } from '@/components/Toast';
import { DurableItem, DurableCategory } from '@/types';
import { Modal } from '@/components/Modal';
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  Box,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

const CATEGORIES: ('All' | DurableCategory)[] = [
  'All',
  'Stationery',
  'Electronics',
  'Books',
  'Clothing',
  'Toiletries',
  'Household',
  'Other',
];

const LOCATION_PRESETS = [
  'Desk',
  'Hostel Room',
  'College Bag',
  'Study Table',
  'Closet',
  'Bathroom',
];

export default function DurableInventoryPage() {
  const { durableItems, addDurableItem, updateDurableItem, deleteDurableItem, isHydrated } =
    usePantry();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | DurableCategory>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DurableItem | null>(null);

  // Form State: Item name immediately first!
  const [name, setName] = useState('');
  const [category, setCategory] = useState<DurableCategory>('Stationery');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [location, setLocation] = useState('Desk');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [suggestion, setSuggestion] = useState<{
    suggestedName?: string;
    category?: DurableCategory;
    aliases?: string[];
  } | null>(null);
  const [isCategorizing, setIsCategorizing] = useState(false);

  // Debounced smart category suggestion when typing item name
  useEffect(() => {
    const trimmed = name.trim();
    if (trimmed.length < 3 || editingItem) {
      setSuggestion(null);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      try {
        setIsCategorizing(true);
        const res = await fetch('/api/inventory/categorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trimmed }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (active && data.success && data.category) {
          let validCat: DurableCategory = 'Other';
          const catStr = data.category;
          if (CATEGORIES.includes(catStr as DurableCategory)) {
            validCat = catStr as DurableCategory;
          } else if (catStr === 'Personal Care') {
            validCat = 'Toiletries';
          } else if (catStr === 'Tools' || catStr === 'Kitchenware') {
            validCat = 'Household';
          }

          setSuggestion({
            suggestedName: data.suggestedName,
            category: validCat,
            aliases: data.aliases,
          });
        }
      } catch (err) {
        console.warn('Categorize error:', err);
      } finally {
        if (active) setIsCategorizing(false);
      }
    }, 500);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [name, editingItem]);

  const openAddModal = () => {
    setName('');
    setCategory('Stationery');
    setQuantity('1');
    setUnit('pcs');
    setLocation('Desk');
    setPurchasePrice('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setSuggestion(null);
    setEditingItem(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (item: DurableItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setQuantity(item.quantity.toString());
    setUnit(item.unit || 'pcs');
    setLocation(item.location || 'Desk');
    setPurchasePrice(item.purchasePrice ? item.purchasePrice.toString() : '');
    setPurchaseDate(item.purchaseDate || new Date().toISOString().split('T')[0]);
    setNotes(item.notes || '');
    setSuggestion(null);
    setIsAddModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const qty = parseFloat(quantity) || 1;
    const price = purchasePrice ? parseFloat(purchasePrice) : undefined;

    if (editingItem) {
      updateDurableItem(editingItem.id, {
        name: name.trim(),
        category,
        quantity: qty,
        unit: unit.trim() || 'pcs',
        location: location.trim() || 'Desk',
        purchasePrice: price,
        purchaseDate: purchaseDate || undefined,
        notes: notes.trim() || undefined,
      });
      showToast(`Updated "${name.trim()}".`);
    } else {
      addDurableItem({
        name: name.trim(),
        category,
        quantity: qty,
        unit: unit.trim() || 'pcs',
        location: location.trim() || 'Desk',
        purchasePrice: price,
        purchaseDate: purchaseDate || undefined,
        notes: notes.trim() || undefined,
      });
      showToast(`Added "${name.trim()}" to FOUND.`);
    }

    setIsAddModalOpen(false);
  };

  const filteredItems = useMemo(() => {
    return durableItems.filter((item) => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCat = item.category.toLowerCase().includes(q);
        const matchesLoc = (item.location || '').toLowerCase().includes(q);
        const matchesNotes = (item.notes || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCat && !matchesLoc && !matchesNotes) return false;
      }
      return true;
    });
  }, [durableItems, selectedCategory, searchQuery]);

  const getItemIcon = (item: DurableItem) => {
    const low = item.name.toLowerCase();
    const cat = item.category;
    if (low.includes('notebook') || low.includes('diary')) return '📓';
    if (low.includes('pen') || low.includes('pencil')) return '🖊️';
    if (low.includes('cable') || low.includes('charger') || cat === 'Electronics') return '🔌';
    if (low.includes('book') || cat === 'Books') return '📚';
    if (low.includes('bottle') || low.includes('flask')) return '🍶';
    if (low.includes('toothpaste') || low.includes('brush') || cat === 'Toiletries') return '🧴';
    return '📦';
  };

  return (
    <div className="min-h-screen pb-24 overflow-x-hidden bg-[#121513] bg-editorial-pattern text-[#EFF1EC]">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-medium uppercase tracking-widest text-[#78B48B] bg-[#1A261E] px-2 py-0.5 rounded-xs border border-[#273B2E]">
                DURABLE SHELF
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#EFF1EC]">
              Personal Shelf
            </h1>
            <p className="text-xs sm:text-sm text-[#8E968F] font-sans mt-0.5">
              Durable belongings &amp; stationery you already own.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 bg-[#3B6647] hover:bg-[#467854] text-[#EFF1EC] font-mono font-medium px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xs border border-[#4E805B]/30 shadow-subtle transition-colors text-xs uppercase tracking-wider cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>

        {/* Search & Category Pills */}
        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#5A635B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              placeholder="Search notebook, cable, pens, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-[#181C19] border border-[#28302A] focus:border-[#4B7A58] rounded-xs text-[#EFF1EC] outline-none transition-all placeholder:text-[#5A635B] font-sans"
              aria-label="Search inventory"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {CATEGORIES.map((cat) => {
              const count =
                cat === 'All'
                  ? durableItems.length
                  : durableItems.filter((d) => d.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xs font-mono text-xs transition-colors whitespace-nowrap border cursor-pointer ${
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
        </div>

        {/* Inventory Shelf List */}
        {filteredItems.length > 0 ? (
          <div className="space-y-2.5">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-[#181C19] p-3.5 sm:p-4 rounded-sm border border-[#28302A] hover:border-[#333E36] transition-colors flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-xs bg-[#141715] border border-[#242C26] flex items-center justify-center shrink-0 text-xl">
                    <span role="img" aria-hidden="true">
                      {getItemIcon(item)}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-serif font-bold text-sm sm:text-base text-[#EFF1EC] tracking-tight truncate">
                        {item.name}
                      </h2>
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-xs bg-[#222824] text-[#8E968F] border border-[#2B342D]">
                        {item.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#8E968F] mt-0.5 flex-wrap">
                      <span className="font-mono font-medium text-[#C4CCC4]">
                        {item.quantity} {item.unit || 'pcs'}
                      </span>
                      <span className="flex items-center gap-1 font-sans">
                        <MapPin className="w-3 h-3 text-[#5A635B]" />
                        {item.location || 'Storage'}
                      </span>
                      {item.purchasePrice !== undefined && (
                        <span className="font-mono text-[#8E968F]">₹{item.purchasePrice}</span>
                      )}
                    </div>

                    {item.notes && (
                      <p className="text-[11px] font-sans italic text-[#5A635B] mt-0.5 truncate max-w-sm">
                        {item.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="p-1.5 text-[#8E968F] hover:text-[#EFF1EC] hover:bg-[#222824] rounded-xs transition-colors cursor-pointer"
                    title="Edit item"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      deleteDurableItem(item.id);
                      showToast(`Removed "${item.name}".`);
                    }}
                    className="p-1.5 text-[#8E968F] hover:text-[#E06C6C] hover:bg-[#2A1D1C] rounded-xs transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#181C19] rounded-sm border border-[#28302A] p-8 sm:p-12 text-center mt-4">
            <div className="w-12 h-12 rounded-xs bg-[#1E2420] text-[#8E968F] border border-[#28302A] flex items-center justify-center mx-auto mb-3">
              <Box className="w-6 h-6" />
            </div>
            <h2 className="font-serif font-bold text-lg sm:text-xl text-[#EFF1EC]">
              No inventory yet.
            </h2>
            <p className="text-xs sm:text-sm text-[#8E968F] mt-1 max-w-sm mx-auto font-sans">
              Start by adding something you already own so FOUND can remind you before you buy.
            </p>
            <div className="mt-5">
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#3B6647] hover:bg-[#467854] text-[#EFF1EC] text-xs font-mono uppercase tracking-wider font-medium rounded-xs border border-[#4E805B]/30 shadow-subtle transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>
          </div>
        )}

        {/* Quick Shelf Summary */}
        {isHydrated && durableItems.length > 0 && (
          <div className="mt-8 text-center text-xs font-mono text-[#5A635B]">
            <span>Tracking {durableItems.length} personal durable resources</span>
          </div>
        )}

        {/* ADD / EDIT ITEM MODAL */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title={editingItem ? 'Edit Item' : 'Add to Shelf'}
        >
          <form onSubmit={handleSaveItem} className="space-y-4 pt-1">
            {/* 1. Item Name immediately first */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#8E968F] mb-1">
                Item Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ruled Notebook, USB-C Cable..."
                className="w-full px-3 py-2 text-sm bg-[#141715] border border-[#28302A] focus:border-[#4B7A58] text-[#EFF1EC] rounded-xs outline-none placeholder-[#5A635B]"
                autoFocus
              />
              {suggestion && (
                <div className="mt-2 flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-[11px] font-mono text-[#8E968F]">
                    Suggested: <strong className="text-[#EFF1EC]">{suggestion.category}</strong>
                  </span>
                  {category !== suggestion.category && (
                    <button
                      type="button"
                      onClick={() => suggestion.category && setCategory(suggestion.category)}
                      className="px-2 py-0.5 rounded-xs bg-[#1E2822] hover:bg-[#273B2E] text-[#78B48B] border border-[#2C4233] font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Apply Category
                    </button>
                  )}
                  {suggestion.suggestedName && suggestion.suggestedName.toLowerCase() !== name.toLowerCase() && (
                    <button
                      type="button"
                      onClick={() => setName(suggestion.suggestedName!)}
                      className="px-2 py-0.5 rounded-xs bg-[#1C211D] hover:bg-[#222824] text-[#8E968F] hover:text-[#EFF1EC] border border-[#28302A] text-[10px] font-mono transition-colors cursor-pointer"
                    >
                      Use &quot;{suggestion.suggestedName}&quot;
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Category & Quantity */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#8E968F] mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as DurableCategory)}
                  className="w-full px-3 py-2 text-sm bg-[#141715] border border-[#28302A] rounded-xs text-[#EFF1EC] focus:border-[#4B7A58] focus:outline-none cursor-pointer"
                >
                  {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#8E968F] mb-1">
                  Quantity
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#141715] border border-[#28302A] rounded-xs text-[#EFF1EC] focus:border-[#4B7A58] focus:outline-none"
                  />
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="pcs"
                    className="w-16 px-2 py-2 text-xs bg-[#141715] border border-[#28302A] rounded-xs text-center text-[#EFF1EC] focus:border-[#4B7A58] focus:outline-none placeholder-[#5A635B]"
                  />
                </div>
              </div>
            </div>

            {/* Location with Presets */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#8E968F] mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Desk, Hostel Room, Bag"
                className="w-full px-3 py-2 text-sm bg-[#141715] border border-[#28302A] rounded-xs text-[#EFF1EC] focus:border-[#4B7A58] focus:outline-none placeholder-[#5A635B]"
              />
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="text-[10px] font-mono text-[#5A635B]">Presets:</span>
                {LOCATION_PRESETS.map((loc) => (
                  <button
                    type="button"
                    key={loc}
                    onClick={() => setLocation(loc)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-xs bg-[#1C211D] hover:bg-[#222824] text-[#8E968F] hover:text-[#EFF1EC] border border-[#28302A] transition-colors cursor-pointer"
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* Secondary Optional Fields */}
            <div className="pt-3 border-t border-[#28302A] space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#5A635B] block">
                Optional Details
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#8E968F] mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 150"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-[#141715] border border-[#28302A] rounded-xs text-[#EFF1EC] focus:border-[#4B7A58] focus:outline-none placeholder-[#5A635B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#8E968F] mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-[#141715] border border-[#28302A] rounded-xs text-[#EFF1EC] focus:border-[#4B7A58] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#8E968F] mb-1">
                  Notes (e.g. 2 unused backup)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes, spares, condition..."
                  className="w-full px-3 py-1.5 text-xs bg-[#141715] border border-[#28302A] rounded-xs text-[#EFF1EC] focus:border-[#4B7A58] focus:outline-none placeholder-[#5A635B]"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                className="w-full py-2.5 bg-[#3B6647] hover:bg-[#467854] text-[#EFF1EC] font-mono text-xs uppercase tracking-wider font-medium rounded-xs border border-[#4E805B]/30 shadow-subtle transition-colors cursor-pointer"
              >
                {editingItem ? 'Update Item' : 'Add to Found'}
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
}
