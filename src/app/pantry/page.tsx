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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'My Pantry' }]} />

      {/* Header section with Stitch terminology */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-3 mb-8">
        <div>
          <span className="text-[11px] font-bold tracking-widest text-primary uppercase block mb-1">
            Kitchen Larder Inventory
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1C1E] tracking-tight">
            My Pantry
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1 max-w-xl">
            Everything currently recorded in your home. Use It First tracks urgency so you always know
            what deserves attention before it is forgotten.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/scan"
            className="inline-flex items-center gap-1.5 bg-white hover:bg-surface-container border border-[#C2C8C0] text-[#1A1C1E] font-medium px-3.5 py-2 rounded-sm shadow-subtle transition-all text-xs sm:text-sm min-h-[40px]"
          >
            <Camera className="w-4 h-4 text-outline" />
            <span>Scan Pantry</span>
          </Link>
          <Link
            href="/add/manual"
            className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white font-semibold px-4 py-2 rounded-sm shadow-subtle hover:shadow-card transition-all text-xs sm:text-sm min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Food</span>
          </Link>
        </div>
      </div>

      {/* Search & Sort Toolbar */}
      <div className="bg-white p-4 rounded-sm border border-[#E3E2E6] shadow-subtle mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              placeholder="Search pantry items, categories, storage notes…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-surface-container-low border border-[#E3E2E6] rounded-xs focus:bg-white focus:outline-hidden focus:border-primary transition-colors"
              aria-label="Search pantry inventory"
            />
          </div>

          {/* Sort Dropdown & View Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-outline" />
              <label htmlFor="sort-select" className="text-xs font-semibold text-on-surface-variant sr-only">
                Sort by
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs font-medium bg-surface-container-low border border-[#E3E2E6] rounded-xs focus:bg-white focus:outline-hidden text-[#1A1C1E] cursor-pointer"
              >
                <option value="priority">Sort by Priority (Urgent First)</option>
                <option value="date">Sort by Date Proximity</option>
                <option value="name">Sort Alphabetically (A–Z)</option>
                <option value="recently-added">Sort by Recently Added</option>
              </select>
            </div>

            {/* ViewToggle (Grid vs List) */}
            <div className="flex items-center bg-surface-container-low border border-[#E3E2E6] rounded-xs p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-xs transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-primary shadow-subtle font-bold'
                    : 'text-outline hover:text-[#1A1C1E]'
                }`}
                title="Grid view"
                aria-label="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-xs transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-primary shadow-subtle font-bold'
                    : 'text-outline hover:text-[#1A1C1E]'
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
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar border-t border-[#E3E2E6] pt-3">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'ALL'
                ? 'bg-primary text-white font-bold'
                : 'bg-surface-container text-[#1A1C1E] hover:bg-surface-container-high'
            }`}
          >
            All Items ({tabCounts.all})
          </button>
          <button
            onClick={() => setActiveTab('USE_FIRST')}
            className={`px-3 py-1.5 rounded-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'USE_FIRST'
                ? 'bg-secondary text-white font-bold'
                : 'bg-[#FFDBD0] text-[#97472E] hover:bg-[#fad0c4]'
            }`}
          >
            <span>Use First</span>
            <span className="text-[10px] px-1 rounded-xs bg-white/30 font-bold">{tabCounts.first}</span>
          </button>
          <button
            onClick={() => setActiveTab('USE_SOON')}
            className={`px-3 py-1.5 rounded-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'USE_SOON'
                ? 'bg-tertiary text-white font-bold'
                : 'bg-[#FFDEAE] text-[#664500] hover:bg-[#fad197]'
            }`}
          >
            <span>Use Soon</span>
            <span className="text-[10px] px-1 rounded-xs bg-white/30 font-bold">{tabCounts.soon}</span>
          </button>
          <button
            onClick={() => setActiveTab('SAFE_FOR_NOW')}
            className={`px-3 py-1.5 rounded-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'SAFE_FOR_NOW'
                ? 'bg-primary text-white font-bold'
                : 'bg-[#C7ECCE] text-[#32533C] hover:bg-[#b5e6be]'
            }`}
          >
            <span>Safe for now</span>
            <span className="text-[10px] px-1 rounded-xs bg-white/30 font-bold">{tabCounts.safe}</span>
          </button>
          <button
            onClick={() => setActiveTab('OPENED')}
            className={`px-3 py-1.5 rounded-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'OPENED'
                ? 'bg-[#1A1C1E] text-white font-bold'
                : 'bg-surface-container text-[#1A1C1E] hover:bg-surface-container-high'
            }`}
          >
            Opened Packages ({tabCounts.opened})
          </button>
          <button
            onClick={() => setActiveTab('RECENT')}
            className={`px-3 py-1.5 rounded-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'RECENT'
                ? 'bg-[#1A1C1E] text-white font-bold'
                : 'bg-surface-container text-[#1A1C1E] hover:bg-surface-container-high'
            }`}
          >
            Recently Added
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
          <div className="bg-white rounded-sm border border-[#E3E2E6] shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs" aria-label="Kitchen Larder Inventory List">
                <thead className="bg-surface-container-low border-b border-[#E3E2E6] text-on-surface-variant uppercase font-bold text-[10px] tracking-wider">
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
                <tbody className="divide-y divide-[#E3E2E6]">
                  {filteredAndSortedItems.map((item) => {
                    const assessment = getItemAssessment(item);
                    return (
                      <tr key={item.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <PriorityBadge tier={assessment.tier} size="sm" />
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#1A1C1E]">
                          <div>{item.name}</div>
                          {item.notes && (
                            <div className="text-[11px] font-normal italic text-outline line-clamp-1">
                              {item.notes}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-medium text-on-surface-variant whitespace-nowrap">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-3 px-4 text-on-surface-variant whitespace-nowrap">
                          {item.category} • {item.storageLocation}
                        </td>
                        <td className="py-3 px-4 text-on-surface-variant whitespace-nowrap">
                          {item.bestBefore ? (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-outline" />
                              <span>{item.bestBefore}</span>
                              {assessment.daysRemaining !== null && (
                                <span className="text-outline text-[10px]">
                                  ({assessment.daysRemaining <= 0 ? 'due' : `${assessment.daysRemaining}d`})
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-outline italic">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {item.opened ? (
                            <span className="px-1.5 py-0.2 rounded-xs bg-[#FFDBD0] text-[#97472E] text-[10px] font-bold">
                              Opened
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded-xs bg-[#F4F3F7] text-on-surface-variant text-[10px]">
                              Sealed
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditDrawer(item)}
                              className="p-1.5 text-on-surface-variant hover:text-[#1A1C1E] rounded-xs hover:bg-surface-container"
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
                              className="p-1.5 text-primary hover:text-primary-hover rounded-xs hover:bg-[#C7ECCE]/30"
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
                              className="p-1.5 text-outline hover:text-[#BA1A1A] rounded-xs hover:bg-red-50"
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
      <div className="mt-10 p-3.5 rounded-sm bg-surface-container-low border border-[#E3E2E6] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
        <div>
          Showing <strong className="text-[#1A1C1E]">{filteredAndSortedItems.length}</strong> of{' '}
          <strong className="text-[#1A1C1E]">{items.length}</strong> total pantry items in Kitchen Larder.
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              resetToDemoData();
              showToast('Demo pantry restored.');
            }}
            className="inline-flex items-center gap-1.5 text-primary hover:text-primary-hover font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Pantry</span>
          </button>
          <span className="text-[#C2C8C0]">|</span>
          <button
            onClick={() => {
              clearAllData();
              showToast('Pantry cleared.');
            }}
            className="text-[#BA1A1A] hover:underline font-medium cursor-pointer"
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
            <label className="block text-xs font-bold text-[#1A1C1E] mb-1">Food Name *</label>
            <input
              type="text"
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-3 py-2 bg-surface-container-low border border-[#E3E2E6] rounded-xs text-sm focus:bg-white focus:outline-hidden focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1A1C1E] mb-1">Quantity *</label>
              <input
                type="number"
                step="any"
                min="0.1"
                required
                value={editForm.quantity}
                onChange={(e) => setEditForm({ ...editForm, quantity: parseFloat(e.target.value) || 1 })}
                className="w-full px-3 py-2 bg-surface-container-low border border-[#E3E2E6] rounded-xs text-sm focus:bg-white focus:outline-hidden focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1A1C1E] mb-1">Unit *</label>
              <input
                type="text"
                required
                value={editForm.unit}
                onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                className="w-full px-3 py-2 bg-surface-container-low border border-[#E3E2E6] rounded-xs text-sm focus:bg-white focus:outline-hidden focus:border-primary"
                placeholder="e.g. g, kg, L, pcs, bunch"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1A1C1E] mb-1">Category</label>
              <select
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value as FoodCategory })}
                className="w-full px-3 py-2 bg-surface-container-low border border-[#E3E2E6] rounded-xs text-sm focus:bg-white focus:outline-hidden text-[#1A1C1E] cursor-pointer"
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
              <label className="block text-xs font-bold text-[#1A1C1E] mb-1">Storage Location</label>
              <select
                value={editForm.storageLocation}
                onChange={(e) => setEditForm({ ...editForm, storageLocation: e.target.value as StorageLocation })}
                className="w-full px-3 py-2 bg-surface-container-low border border-[#E3E2E6] rounded-xs text-sm focus:bg-white focus:outline-hidden text-[#1A1C1E] cursor-pointer"
              >
                <option value="Fridge">Fridge</option>
                <option value="Cupboard / Pantry">Cupboard / Pantry</option>
                <option value="Countertop">Countertop</option>
                <option value="Freezer">Freezer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1A1C1E] mb-1">Best-Before / Use-By Date</label>
            <input
              type="date"
              value={editForm.bestBefore}
              onChange={(e) => setEditForm({ ...editForm, bestBefore: e.target.value })}
              className="w-full px-3 py-2 bg-surface-container-low border border-[#E3E2E6] rounded-xs text-sm focus:bg-white focus:outline-hidden focus:border-primary"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={editForm.opened}
                onChange={(e) => setEditForm({ ...editForm, opened: e.target.checked })}
                className="rounded-xs border-[#C2C8C0] text-primary focus:ring-primary w-4 h-4"
              />
              <span className="text-[#1A1C1E] font-medium">Package is currently opened</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1A1C1E] mb-1">Notes</label>
            <input
              type="text"
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              placeholder="e.g. Crisp leaves, store airtight"
              className="w-full px-3 py-2 bg-surface-container-low border border-[#E3E2E6] rounded-xs text-sm focus:bg-white focus:outline-hidden focus:border-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E3E2E6]">
            <button
              type="button"
              onClick={() => setEditingItem(null)}
              className="px-4 py-2 text-xs sm:text-sm text-on-surface-variant hover:text-[#1A1C1E] font-medium rounded-xs hover:bg-surface-container transition-colors min-h-[38px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs sm:text-sm bg-primary hover:bg-primary-hover text-white font-semibold rounded-xs shadow-subtle transition-colors min-h-[38px]"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
