'use client';

import React, { useState, useMemo } from 'react';
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

  const openAddModal = () => {
    setName('');
    setCategory('Stationery');
    setQuantity('1');
    setUnit('pcs');
    setLocation('Desk');
    setPurchasePrice('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setNotes('');
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
    <div className="min-h-screen pb-24 overflow-x-hidden bg-[#FBFBFA]">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#191C1B]">
              Personal Shelf
            </h1>
            <p className="text-xs sm:text-sm text-[#5F6762] mt-0.5">
              Durable belongings &amp; stationery you already own.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1 bg-primary hover:bg-primary-hover text-white font-semibold px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-2xs hover:shadow-xs transition-all text-xs cursor-pointer touch-manipulation shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>

        {/* Search & Category Pills */}
        <div className="mb-4 space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8A928D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              placeholder="Search notebook, cable, pens, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white border border-[#D5D9D4] focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-xl outline-none transition-all placeholder:text-[#8A928D]"
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
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-primary text-white font-bold shadow-2xs'
                      : 'bg-[#F2F4F1] text-[#2A2F2D] hover:bg-[#E5E9E3]'
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
                className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E2E5E1] shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:border-[#D5D9D4] transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0" role="img" aria-hidden="true">
                    {getItemIcon(item)}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-bold text-xs sm:text-sm text-[#191C1B] truncate">
                        {item.name}
                      </h2>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F2F4F1] text-[#5F6762]">
                        {item.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-[#5F6762] mt-0.5 flex-wrap">
                      <span className="font-bold text-[#191C1B]">
                        {item.quantity} {item.unit || 'pcs'}
                      </span>
                      <span className="flex items-center gap-1 text-[#5F6762]">
                        <MapPin className="w-3 h-3 text-[#8A928D]" />
                        {item.location || 'Storage'}
                      </span>
                      {item.purchasePrice !== undefined && (
                        <span>₹{item.purchasePrice}</span>
                      )}
                    </div>

                    {item.notes && (
                      <p className="text-[10px] text-[#8A928D] mt-0.5 truncate max-w-sm">
                        {item.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="p-1.5 text-[#5F6762] hover:text-[#191C1B] hover:bg-[#F2F4F1] rounded-lg transition-colors cursor-pointer"
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
                    className="p-1.5 text-[#8A928D] hover:text-[#BA1A1A] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E2E5E1] p-8 text-center mt-4">
            <Box className="w-8 h-8 text-[#8A928D] mx-auto mb-2" />
            <h2 className="font-bold text-sm sm:text-base text-[#191C1B]">
              No inventory yet.
            </h2>
            <p className="text-xs text-[#5F6762] mt-1 max-w-sm mx-auto">
              Start by adding something you already own so FOUND can remind you before you buy.
            </p>
            <div className="mt-4">
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-full shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ADD ITEM</span>
              </button>
            </div>
          </div>
        )}

        {/* Quick Shelf Summary */}
        {isHydrated && durableItems.length > 0 && (
          <div className="mt-6 text-center text-xs text-[#8A928D]">
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
              <label className="block text-xs font-bold text-[#191C1B] mb-1">
                Item Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ruled Notebook, USB-C Cable..."
                className="w-full px-3 py-2 text-sm border border-[#D5D9D4] focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-lg outline-none"
                autoFocus
              />
            </div>

            {/* Category & Quantity */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#191C1B] mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as DurableCategory)}
                  className="w-full px-3 py-2 text-sm border border-[#D5D9D4] rounded-lg bg-white"
                >
                  {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191C1B] mb-1">
                  Quantity
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#D5D9D4] rounded-lg"
                  />
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="pcs"
                    className="w-16 px-2 py-2 text-xs border border-[#D5D9D4] rounded-lg text-center"
                  />
                </div>
              </div>
            </div>

            {/* Location with Student Presets */}
            <div>
              <label className="block text-xs font-bold text-[#191C1B] mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Desk, Hostel Room, Bag"
                className="w-full px-3 py-2 text-sm border border-[#D5D9D4] rounded-lg"
              />
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="text-[10px] text-[#8A928D]">Presets:</span>
                {LOCATION_PRESETS.map((loc) => (
                  <button
                    type="button"
                    key={loc}
                    onClick={() => setLocation(loc)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-[#F2F4F1] hover:bg-[#E5E9E3] text-[#2A2F2D] transition-colors"
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* Secondary Optional Fields */}
            <div className="pt-2 border-t border-[#E2E5E1] space-y-3">
              <span className="text-[11px] font-bold text-[#8A928D] uppercase tracking-wider block">
                Optional Details
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#5F6762] mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 150"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-[#D5D9D4] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#5F6762] mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-[#D5D9D4] rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#5F6762] mb-1">
                  Notes (e.g. 2 unused backup)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes, spares, condition..."
                  className="w-full px-3 py-1.5 text-xs border border-[#D5D9D4] rounded-lg"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {editingItem ? 'UPDATE ITEM' : 'ADD TO FOUND'}
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
}
