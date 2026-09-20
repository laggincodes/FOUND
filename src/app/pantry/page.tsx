'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePantry } from '@/lib/store';
import { useToast } from '@/components/Toast';
import { FoodItem, FoodCategory, StorageLocation } from '@/types';
import { FoodCard } from '@/components/FoodCard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Modal } from '@/components/Modal';
import { EmptyState } from '@/components/EmptyState';
import { PriorityBadge } from '@/components/PriorityBadge';
import {
  Search,
  Plus,
  Camera,
  Filter,
  ArrowUpDown,
  RotateCcw,
  PackageOpen,
  LayoutGrid,
  List,
  Edit3,
  Trash2,
  Check,
  Calendar,
} from 'lucide-react';

export default function PantryPage() {
  const { items, updateItem, deleteItem, markIngredientsUsed, resetToDemoData, clearAllData, getItemAssessment } =
    usePantry();
  const { showToast } = useToast();

  // Search, Filter & View States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<
    'ALL' | 'USE_FIRST' | 'USE_SOON' | 'SAFE_FOR_NOW' | 'OPENED' | 'RECENT'
  >('ALL');
  const [sortBy, setSortBy] = useState<'priority' | 'date' | 'name' | 'recently-added'>('priority');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Edit Drawer/Modal State
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    quantity: number;
    unit: string;
    category: FoodCategory;
    bestBefore: string;
    opened: boolean;
    storageLocation: StorageLocation;
    notes: string;
  }>({
    name: '',
    quantity: 1,
    unit: 'pcs',
    category: 'Produce',
    bestBefore: '',
    opened: false,
    storageLocation: 'Fridge',
    notes: '',
  });

  const openEditDrawer = (item: FoodItem) => {
    setEditingItem(item);
    setEditForm({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      bestBefore: item.bestBefore || '',
      opened: item.opened,
      storageLocation: item.storageLocation,
      notes: item.notes || '',
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    updateItem(editingItem.id, {
      name: editForm.name.trim(),
      quantity: Number(editForm.quantity),
      unit: editForm.unit.trim(),
      category: editForm.category,
      bestBefore: editForm.bestBefore || undefined,
      opened: editForm.opened,
      storageLocation: editForm.storageLocation,
      notes: editForm.notes.trim() || undefined,
    });
    showToast(`Updated "${editForm.name.trim()}" in pantry.`);
    setEditingItem(null);
  };

  // Filter & Sort Items
  const filteredAndSortedItems = useMemo(() => {
    return items
      .filter((item) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = item.name.toLowerCase().includes(q);
          const matchCat = item.category.toLowerCase().includes(q);
          const matchNotes = item.notes?.toLowerCase().includes(q);
          const matchId = item.foodId?.toLowerCase().includes(q.replace(/\s+/g, '-'));
          if (!matchName && !matchCat && !matchNotes && !matchId) return false;
        }

        const assessment = getItemAssessment(item);
        if (activeTab === 'USE_FIRST') return assessment.tier === 'USE_FIRST' || assessment.tier === 'EXPIRED';
        if (activeTab === 'USE_SOON') return assessment.tier === 'USE_SOON';
        if (activeTab === 'SAFE_FOR_NOW') return assessment.tier === 'SAFE_FOR_NOW';
        if (activeTab === 'OPENED') return item.opened;
        if (activeTab === 'RECENT') {
          const itemDate = new Date(item.createdAt).getTime();
          const dayAgo = Date.now() - 2 * 86400000;
          return itemDate >= dayAgo;
        }

        return true;
      })
      .sort((a, b) => {
        const assessA = getItemAssessment(a);
        const assessB = getItemAssessment(b);

        if (sortBy === 'priority') {
          return assessB.score - assessA.score;
        }
        if (sortBy === 'date') {
          if (!a.bestBefore) return 1;
          if (!b.bestBefore) return -1;
          return a.bestBefore.localeCompare(b.bestBefore);
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'recently-added') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
      });
  }, [items, searchQuery, activeTab, sortBy, getItemAssessment]);

  // Tab counts
  const tabCounts = useMemo(() => {
    let first = 0;
    let soon = 0;
    let safe = 0;
    let opened = 0;

    items.forEach((item) => {
      const a = getItemAssessment(item);
      if (a.tier === 'USE_FIRST' || a.tier === 'EXPIRED') first++;
      else if (a.tier === 'USE_SOON') soon++;
      else safe++;
      if (item.opened) opened++;
    });

    return { all: items.length, first, soon, safe, opened };
  }, [items, getItemAssessment]);

  return (
    <div className="min-h-screen pb-24 overflow-x-hidden bg-[#121513] bg-editorial-pattern text-[#EFF1EC]">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'My Pantry' }]} />

      {/* Header section with Editorial grouping */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-3 mb-8">
        <div>
          <span className="font-mono text-[10px] font-bold tracking-widest text-[#7DB88F] uppercase block mb-1">
            Personal Shelf
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#EFF1EC] tracking-tight">
            My Pantry
          </h1>
          <p className="text-xs sm:text-sm text-[#8E968F] mt-1 max-w-xl">
            Everything currently stored at home. FOUND tracks urgency and shelf-life so you use what matters first.
          </p>
          <div className="font-mono text-xs text-[#8E968F] mt-2 flex items-center gap-3">
            <span><strong className="text-[#EFF1EC]">{items.length}</strong> ITEMS</span>
            <span className="text-[#727C74]">•</span>
            <span><strong className="text-[#DE755D]">{tabCounts.first}</strong> NEED ATTENTION</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/scan"
            className="inline-flex items-center gap-1.5 bg-[#1C211D] hover:bg-[#232924] border border-[#28302A] text-[#EFF1EC] font-medium px-3.5 py-2 rounded-sm shadow-subtle transition-all text-xs sm:text-sm min-h-[40px]"
          >
            <Camera className="w-4 h-4 text-[#727C74]" />
            <span>Scan Pantry</span>
          </Link>
          <Link
            href="/add/manual"
            className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-[#EFF1EC] font-semibold px-4 py-2 rounded-sm shadow-subtle transition-all text-xs sm:text-sm min-h-[40px] border border-[#3E684A]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Food</span>
          </Link>
        </div>
      </div>

      {/* Search & Sort Toolbar */}
      <div className="bg-[#181C19] p-4 rounded-xl border border-[#28302A] shadow-card mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#727C74] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              placeholder="Search pantry items, categories, storage notes…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-[#141715] border border-[#2A332C] rounded-sm text-[#EFF1EC] placeholder:text-[#68736A] focus:outline-none focus:border-[#427351] transition-colors"
              aria-label="Search pantry inventory"
            />
          </div>

          {/* Sort Dropdown & View Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#727C74]" />
              <label htmlFor="sort-select" className="text-xs font-semibold text-[#8E968F] sr-only">
                Sort by
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs font-mono bg-[#141715] border border-[#2A332C] rounded-xs focus:outline-none text-[#EFF1EC] cursor-pointer"
              >
                <option value="priority" className="bg-[#181C19]">Priority (Urgent First)</option>
                <option value="date" className="bg-[#181C19]">Date Proximity</option>
                <option value="name" className="bg-[#181C19]">Alphabetical (A–Z)</option>
                <option value="recently-added" className="bg-[#181C19]">Recently Added</option>
              </select>
            </div>

            {/* ViewToggle (Grid vs List) */}
            <div className="flex items-center bg-[#141715] border border-[#2A332C] rounded-xs p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-xs transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#222824] text-[#7DB88F] font-bold'
                    : 'text-[#727C74] hover:text-[#EFF1EC]'
                }`}
                title="Grid view"
                aria-label="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-xs transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-[#222824] text-[#7DB88F] font-bold'
                    : 'text-[#727C74] hover:text-[#EFF1EC]'
                }`}
                title="List view"
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar border-t border-[#262E28] pt-3">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-xs font-mono text-xs transition-colors whitespace-nowrap border cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-[#243B2B] text-[#86C99B] border-[#385B42] font-bold'
                : 'bg-[#1C211D] text-[#8E968F] hover:text-[#EFF1EC] border-[#28302A]'
            }`}
          >
            All Items ({tabCounts.all})
          </button>
          <button
            onClick={() => setActiveTab('USE_FIRST')}
            className={`px-3 py-1.5 rounded-xs font-mono text-xs transition-colors whitespace-nowrap flex items-center gap-1.5 border cursor-pointer ${
              activeTab === 'USE_FIRST'
                ? 'bg-[#2E1A16] text-[#E2765E] border-[#4F2A21] font-bold'
                : 'bg-[#1C211D] text-[#8E968F] hover:text-[#DE755D] border-[#28302A]'
            }`}
          >
            <span>● Use First</span>
            <span className="text-[10px] px-1 rounded-xs bg-[#2E1A16] font-bold text-[#E2765E]">{tabCounts.first}</span>
          </button>
          <button
            onClick={() => setActiveTab('USE_SOON')}
            className={`px-3 py-1.5 rounded-xs font-mono text-xs transition-colors whitespace-nowrap flex items-center gap-1.5 border cursor-pointer ${
              activeTab === 'USE_SOON'
                ? 'bg-[#2B2213] text-[#DEAB57] border-[#47381E] font-bold'
                : 'bg-[#1C211D] text-[#8E968F] hover:text-[#DEAB57] border-[#28302A]'
            }`}
          >
            <span>● Use Soon</span>
            <span className="text-[10px] px-1 rounded-xs bg-[#2B2213] font-bold text-[#DEAB57]">{tabCounts.soon}</span>
          </button>
          <button
            onClick={() => setActiveTab('SAFE_FOR_NOW')}
            className={`px-3 py-1.5 rounded-xs font-mono text-xs transition-colors whitespace-nowrap flex items-center gap-1.5 border cursor-pointer ${
              activeTab === 'SAFE_FOR_NOW'
                ? 'bg-[#17261C] text-[#7DB88F] border-[#27402F] font-bold'
                : 'bg-[#1C211D] text-[#8E968F] hover:text-[#7DB88F] border-[#28302A]'
            }`}
          >
            <span>● Safe</span>
            <span className="text-[10px] px-1 rounded-xs bg-[#17261C] font-bold text-[#7DB88F]">{tabCounts.safe}</span>
          </button>
          <button
            onClick={() => setActiveTab('OPENED')}
            className={`px-3 py-1.5 rounded-xs font-mono text-xs transition-colors whitespace-nowrap border cursor-pointer ${
              activeTab === 'OPENED'
                ? 'bg-[#222824] text-[#EFF1EC] border-[#323D35] font-bold'
                : 'bg-[#1C211D] text-[#8E968F] hover:text-[#EFF1EC] border-[#28302A]'
            }`}
          >
            Opened ({tabCounts.opened})
          </button>
          <button
            onClick={() => setActiveTab('RECENT')}
            className={`px-3 py-1.5 rounded-xs font-mono text-xs transition-colors whitespace-nowrap border cursor-pointer ${
              activeTab === 'RECENT'
                ? 'bg-[#222824] text-[#EFF1EC] border-[#323D35] font-bold'
                : 'bg-[#1C211D] text-[#8E968F] hover:text-[#EFF1EC] border-[#28302A]'
            }`}
          >
            Recent
          </button>
        </div>
      </div>

      {/* Grid or List of Food Items or Empty States */}
      {filteredAndSortedItems.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAndSortedItems.map((item) => (
              <FoodCard key={item.id} item={item} onEdit={openEditDrawer} />
            ))}
          </div>
        ) : (
          /* High-density List View */
          <div className="bg-[#181C19] rounded-sm border border-[#28302A] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs" aria-label="Kitchen Larder Inventory List">
                <thead className="bg-[#141715] border-b border-[#28302A] text-[#8E968F] uppercase font-mono text-[10px] tracking-wider">
                  <tr>
                    <th scope="col" className="py-3 px-4">Priority</th>
                    <th scope="col" className="py-3 px-4">Item Name</th>
                    <th scope="col" className="py-3 px-4">Quantity</th>
                    <th scope="col" className="py-3 px-4">Location</th>
                    <th scope="col" className="py-3 px-4">Best-Before</th>
                    <th scope="col" className="py-3 px-4">Status</th>
                    <th scope="col" className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222824]">
                  {filteredAndSortedItems.map((item) => {
                    const assessment = getItemAssessment(item);
                    return (
                      <tr key={item.id} className="hover:bg-[#1E2420]/60 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <PriorityBadge tier={assessment.tier} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-[#EFF1EC]">
                          <div className="font-serif font-bold text-sm tracking-tight">{item.name}</div>
                          {item.notes && (
                            <div className="text-[11px] font-sans italic text-[#8E968F] line-clamp-1">
                              {item.notes}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#C4CCC4] whitespace-nowrap">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-3 px-4 text-[#8E968F] whitespace-nowrap font-sans">
                          {item.category} • {item.storageLocation}
                        </td>
                        <td className="py-3 px-4 text-[#8E968F] whitespace-nowrap font-mono">
                          {item.bestBefore ? (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-[#5A635B]" />
                              <span>{item.bestBefore}</span>
                              {assessment.daysRemaining !== null && (
                                <span className="text-[#5A635B] text-[10px]">
                                  ({assessment.daysRemaining <= 0 ? 'due' : `${assessment.daysRemaining}d`})
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#5A635B] italic">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-mono">
                          {item.opened ? (
                            <span className="px-1.5 py-0.5 rounded-xs bg-[#2D1915] text-[#FF9E90] border border-[#482520] text-[10px] uppercase font-bold">
                              Opened
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded-xs bg-[#1E2420] text-[#8E968F] border border-[#2B342D] text-[10px] uppercase">
                              Sealed
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditDrawer(item)}
                              className="p-1.5 text-[#8E968F] hover:text-[#EFF1EC] rounded-xs hover:bg-[#222824] transition-colors"
                              title={`Edit ${item.name}`}
                              aria-label={`Edit ${item.name}`}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                markIngredientsUsed([{ name: item.name, amountUsed: item.quantity, unit: item.unit }]);
                                showToast(`${item.name} marked as used.`);
                              }}
                              className="p-1.5 text-[#78B48B] hover:text-[#93D4A8] rounded-xs hover:bg-[#1E2822] transition-colors"
                              title={`Mark ${item.name} as used`}
                              aria-label={`Mark ${item.name} as used`}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                deleteItem(item.id);
                                showToast(`Deleted ${item.name}.`);
                              }}
                              className="p-1.5 text-[#8E968F] hover:text-[#E06C6C] rounded-xs hover:bg-[#2A1D1C] transition-colors"
                              title={`Delete ${item.name}`}
                              aria-label={`Delete ${item.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : searchQuery ? (
        <EmptyState
          icon={Search}
          title="No ingredients found"
          description={`No items in your pantry match "${searchQuery}". Check the spelling or try a different search.`}
          actionText="Clear Search"
          onActionClick={() => setSearchQuery('')}
        />
      ) : items.length === 0 ? (
        /* Exact Stitch Empty State: Your pantry is waiting. */
        <EmptyState
          icon={PackageOpen}
          title="Your pantry is waiting."
          description="Add what you have at home. As soon as you log ingredients, Use It First evaluates perishability and dates so you always know what needs attention first."
          actionText="+ Add your first food"
          actionHref="/add"
          secondaryActionText="Restore Demo Pantry"
          onActionClick={() => {
            resetToDemoData();
            showToast('Demo pantry restored.');
          }}
        />
      ) : (
        <EmptyState
          icon={Filter}
          title="No items in this view"
          description="There are currently no items matching the selected tab filter."
          actionText="View All Items"
          onActionClick={() => setActiveTab('ALL')}
        />
      )}

      {/* Footer info & demo restore */}
      <div className="mt-10 p-3.5 rounded-sm bg-[#181C19] border border-[#28302A] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8E968F] font-mono">
        <div>
          Showing <strong className="text-[#EFF1EC]">{filteredAndSortedItems.length}</strong> of{' '}
          <strong className="text-[#EFF1EC]">{items.length}</strong> total pantry items in Kitchen Larder.
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              resetToDemoData();
              showToast('Demo pantry restored.');
            }}
            className="inline-flex items-center gap-1.5 text-[#78B48B] hover:text-[#93D4A8] font-medium cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Pantry</span>
          </button>
          <span className="text-[#28302A]">|</span>
          <button
            onClick={() => {
              clearAllData();
              showToast('Pantry cleared.');
            }}
            className="text-[#E06C6C] hover:underline cursor-pointer transition-colors"
          >
            Clear All (Test Empty State)
          </button>
        </div>
      </div>

      {/* Pantry Edit Drawer / Modal */}
      <Modal
        isOpen={editingItem !== null}
        onClose={() => setEditingItem(null)}
        title="Edit Pantry Item"
        description="Update information to ensure accurate priority planning in your Kitchen Larder."
        maxWidth="md"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#8E968F] mb-1">Food Name *</label>
            <input
              type="text"
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-3 py-2 bg-[#141715] border border-[#28302A] rounded-xs text-sm text-[#EFF1EC] focus:border-[#4B7A58] focus:outline-none placeholder-[#5A635B]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#8E968F] mb-1">Quantity *</label>
              <input
                type="number"
                step="any"
                min="0.1"
                required
                value={editForm.quantity}
                onChange={(e) => setEditForm({ ...editForm, quantity: parseFloat(e.target.value) || 1 })}
                className="w-full px-3 py-2 bg-[#141715] border border-[#28302A] rounded-xs text-sm text-[#EFF1EC] focus:border-[#4B7A58] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#8E968F] mb-1">Unit *</label>
              <input
                type="text"
                required
                value={editForm.unit}
                onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                className="w-full px-3 py-2 bg-[#141715] border border-[#28302A] rounded-xs text-sm text-[#EFF1EC] focus:border-[#4B7A58] focus:outline-none placeholder-[#5A635B]"
                placeholder="e.g. g, kg, L, pcs, bunch"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#8E968F] mb-1">Category</label>
              <select
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value as FoodCategory })}
                className="w-full px-3 py-2 bg-[#141715] border border-[#28302A] rounded-xs text-sm text-[#EFF1EC] focus:border-[#4B7A58] focus:outline-none cursor-pointer"
              >
                <option value="Produce">Produce</option>
                <option value="Dairy & Eggs">Dairy & Eggs</option>
                <option value="Bakery">Bakery</option>
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
              <label className="block text-xs font-mono uppercase tracking-wider text-[#8E968F] mb-1">Storage Location</label>
              <select
                value={editForm.storageLocation}
                onChange={(e) => setEditForm({ ...editForm, storageLocation: e.target.value as StorageLocation })}
                className="w-full px-3 py-2 bg-[#141715] border border-[#28302A] rounded-xs text-sm text-[#EFF1EC] focus:border-[#4B7A58] focus:outline-none cursor-pointer"
              >
                <option value="Fridge">Fridge</option>
                <option value="Cupboard / Pantry">Cupboard / Pantry</option>
                <option value="Countertop">Countertop</option>
                <option value="Freezer">Freezer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#8E968F] mb-1">Best-Before / Use-By Date</label>
            <input
              type="date"
              value={editForm.bestBefore}
              onChange={(e) => setEditForm({ ...editForm, bestBefore: e.target.value })}
              className="w-full px-3 py-2 bg-[#141715] border border-[#28302A] rounded-xs text-sm text-[#EFF1EC] focus:border-[#4B7A58] focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={editForm.opened}
                onChange={(e) => setEditForm({ ...editForm, opened: e.target.checked })}
                className="rounded-xs border-[#28302A] bg-[#141715] text-[#3B6647] focus:ring-0 w-4 h-4"
              />
              <span className="text-[#EFF1EC] font-medium text-xs">Package is currently opened</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#8E968F] mb-1">Notes</label>
            <input
              type="text"
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              placeholder="e.g. Crisp leaves, store airtight"
              className="w-full px-3 py-2 bg-[#141715] border border-[#28302A] rounded-xs text-sm text-[#EFF1EC] focus:border-[#4B7A58] focus:outline-none placeholder-[#5A635B]"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#28302A]">
            <button
              type="button"
              onClick={() => setEditingItem(null)}
              className="px-4 py-2 text-xs font-mono text-[#8E968F] hover:text-[#EFF1EC] font-medium rounded-xs hover:bg-[#1E2420] transition-colors min-h-[38px] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-mono uppercase tracking-wider bg-[#3B6647] hover:bg-[#467854] text-[#EFF1EC] font-medium rounded-xs border border-[#4E805B]/30 shadow-subtle transition-colors min-h-[38px] cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
      </main>
    </div>
  );
}
