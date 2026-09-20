'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePantry } from '@/lib/store';
import { useToast } from '@/components/Toast';
import {
  Search,
  Clock,
  ArrowRight,
  Plus,
  AlertCircle,
  CheckCircle2,
  Package,
  Box,
  ShoppingCart,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { SearchMatchResult } from '@/types';

export default function DashboardPage() {
  const {
    activeUser,
    items,
    durableItems,
    purchaseHistory,
    impactMetrics,
    getItemAssessment,
    checkItemInventory,
    addGroceryItem,
    addDurableItem,
    isHydrated,
  } = usePantry();
  const { showToast } = useToast();

  // Search state for "BEFORE YOU BUY"
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChip, setActiveChip] = useState<string | null>(null);

  const demoChips = ['notebook', 'milk', 'toothpaste', 'USB hub', 'spinach'];

  // Real-time search result from store
  const searchResult: SearchMatchResult | null = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return null;
    return checkItemInventory(q);
  }, [searchQuery, checkItemInventory]);

  const handleChipClick = (chip: string) => {
    setActiveChip(chip);
    setSearchQuery(chip);
  };

  const handleAddNotFoundToGrocery = (name: string) => {
    addGroceryItem({
      name,
      quantity: 1,
      unit: 'pcs',
      category: 'General' as any,
      source: 'manual',
      notes: 'Added from Before You Buy search',
    });
    showToast(`Added "${name}" to your grocery list.`);
  };

  const handleAddNotFoundToDurable = (name: string) => {
    addDurableItem({
      name,
      category: 'Electronics',
      quantity: 1,
      unit: 'pcs',
      location: 'Desk',
      notes: 'Added from Before You Buy search',
    });
    showToast(`Added "${name}" to your inventory.`);
  };

  // 1. WHAT NEEDS ATTENTION: Fast vertical list
  const attentionList = useMemo(() => {
    const list: Array<{
      id: string;
      icon: string;
      name: string;
      detail: string;
      pill: 'USE FIRST' | 'USE SOON' | 'BOUGHT AHEAD';
      pillColor: string;
      href: string;
    }> = [];

    // Food items with urgent expiry
    items.forEach((item) => {
      const assessment = getItemAssessment(item);
      let icon = '🥫';
      const low = item.name.toLowerCase();
      if (low.includes('milk')) icon = '🥛';
      else if (low.includes('spinach') || low.includes('palak')) icon = '🥬';
      else if (low.includes('paneer') || low.includes('curd')) icon = '🧀';
      else if (low.includes('tomato')) icon = '🍅';
      else if (low.includes('bread')) icon = '🍞';
      else if (low.includes('egg')) icon = '🥚';
      else if (low.includes('toothpaste')) icon = '🧴';

      if (assessment.tier === 'EXPIRED') {
        list.push({
          id: item.id,
          icon,
          name: item.name,
          detail: `${item.quantity} ${item.unit} passed best-before`,
          pill: 'USE FIRST',
          pillColor: 'bg-[#FFDBD0] text-[#97472E]',
          href: '/priority',
        });
      } else if (assessment.tier === 'USE_FIRST') {
        list.push({
          id: item.id,
          icon,
          name: item.name,
          detail: assessment.primaryReason || `${item.quantity} ${item.unit} • Use first`,
          pill: 'USE FIRST',
          pillColor: 'bg-[#FFDBD0] text-[#97472E]',
          href: '/priority',
        });
      } else if (assessment.tier === 'USE_SOON') {
        list.push({
          id: item.id,
          icon,
          name: item.name,
          detail: assessment.primaryReason || `${item.quantity} ${item.unit} • Use soon`,
          pill: 'USE SOON',
          pillColor: 'bg-[#FFDEAE] text-[#664500]',
          href: '/priority',
        });
      }
    });

    // Check for bought ahead toiletries/staples
    items.forEach((item) => {
      if (item.name.toLowerCase().includes('toothpaste') || (item.quantity >= 2 && !item.opened)) {
        list.push({
          id: `ahead-${item.id}`,
          icon: '🧴',
          name: item.name,
          detail: item.notes || `${item.quantity} ${item.unit} stored in stock`,
          pill: 'BOUGHT AHEAD',
          pillColor: 'bg-[#FEF3C7] text-[#92400E]',
          href: '/pantry',
        });
      }
    });

    return list.slice(0, 5);
  }, [items, getItemAssessment]);

  // 2. BOUGHT AHEAD ITEMS: Personal shelf surplus
  const boughtAheadList = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      icon: string;
      category: string;
      quantity: number;
      unit: string;
      status: string;
      location: string;
    }> = [];

    durableItems.forEach((d) => {
      if (d.quantity >= 2 || (d.notes && /unused|stored|backup|spare/i.test(d.notes))) {
        let icon = '📦';
        const low = d.name.toLowerCase();
        if (low.includes('notebook')) icon = '📓';
        else if (low.includes('pen')) icon = '🖊️';
        else if (low.includes('cable') || low.includes('charger')) icon = '🔌';

        list.push({
          id: d.id,
          name: d.name,
          icon,
          category: d.category,
          quantity: d.quantity,
          unit: d.unit || 'pcs',
          status: d.notes || `${d.quantity} units available`,
          location: d.location || 'Storage',
        });
      }
    });

    items.forEach((f) => {
      if (f.name.toLowerCase().includes('toothpaste') || (f.quantity >= 2 && !f.opened)) {
        list.push({
          id: f.id,
          name: f.name,
          icon: '🧴',
          category: 'Personal Care',
          quantity: f.quantity,
          unit: f.unit,
          status: f.notes || `${f.quantity} in stock`,
          location: f.storageLocation,
        });
      }
    });

    return list.slice(0, 4);
  }, [durableItems, items]);

  // Time-aware student greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <div className="min-h-screen pb-24 overflow-x-hidden bg-[#FBFBFA]">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8">
        {/* STUDENT GREETING HEADER */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#191C1B]">
              {greeting}, {activeUser?.firstName || 'Student'}
            </h1>
            <p className="text-xs sm:text-sm text-[#5F6762] mt-0.5">
              Check what you own before you spend.
            </p>
          </div>

          <Link
            href="/profile"
            className="w-9 h-9 rounded-full bg-[#E3F2E9] text-primary flex items-center justify-center font-bold text-xs border border-[#C7ECCE] shadow-2xs hover:bg-[#D2EBD9] transition-colors"
            title="Profile settings"
          >
            {(activeUser?.firstName || 'S')[0].toUpperCase()}
          </Link>
        </div>

        {/* Onboarding Welcome State for New Empty Accounts */}
        {isHydrated && items.length === 0 && durableItems.length === 0 && (
          <section className="mb-7 p-6 sm:p-8 bg-white border border-[#E2E5E1] rounded-2xl shadow-2xs text-center animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-[#E3F2E9] text-primary flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 stroke-[2]" />
            </div>
            <h2 className="font-serif font-bold text-2xl text-[#191C1B]">
              WELCOME TO FOUND
            </h2>
            <p className="text-xs sm:text-sm text-[#5F6762] mt-1.5 max-w-sm mx-auto leading-relaxed">
              Let&apos;s remember what you already have. Start by adding your first pantry food or personal item.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Link
                href="/add"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add your first item</span>
              </Link>
            </div>
          </section>
        )}

        {/* 1. HERO SEARCH / BEFORE YOU BUY */}
        <section aria-labelledby="search-heading" className="mb-7">
          <div className="bg-white rounded-2xl border border-[#E2E5E1] p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <h2 id="search-heading" className="text-sm sm:text-base font-bold text-[#191C1B]">
              What are you looking for?
            </h2>
            <p className="text-xs text-[#5F6762] mt-0.5 mb-3">
              Check before you buy.
            </p>

            {/* Prominent Search Input */}
            <div className="relative">
              <input
                id="student-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActiveChip(null);
                }}
                placeholder="Search notebook, milk, toothpaste, cables..."
                className="w-full bg-[#F4F5F3] hover:bg-[#EEF0EC] focus:bg-white border border-[#D5D9D4] focus:border-primary focus:ring-3 focus:ring-primary/10 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base text-[#191C1B] placeholder:text-[#8A928D] outline-none transition-all pl-10 pr-9"
              />
              <Search className="w-4 h-4 text-[#8A928D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveChip(null);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A928D] hover:text-[#191C1B] text-xs font-bold p-1"
                  title="Clear"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Demo Chips */}
            <div className="mt-3 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-[#5F6762] mr-0.5">Try:</span>
              {demoChips.map((chip) => {
                const isSelected =
                  activeChip === chip || searchQuery.toLowerCase().trim() === chip.toLowerCase();
                return (
                  <button
                    key={chip}
                    onClick={() => handleChipClick(chip)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-white shadow-2xs font-semibold'
                        : 'bg-[#F2F4F1] hover:bg-[#E5E9E3] text-[#2A2F2D]'
                    }`}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>

            {/* INSTANT RESULT CARD */}
            {searchResult && (
              <div className="mt-4 pt-4 border-t border-[#E2E5E1]">
                <div
                  className={`rounded-xl p-4 transition-all border ${
                    searchResult.decision === 'WAIT'
                      ? 'bg-[#FEFBF3] border-[#FCD34D] text-[#78350F]'
                      : searchResult.decision === 'USE'
                      ? 'bg-[#FDF4FF] border-[#E879F9] text-[#701A75]'
                      : 'bg-[#F0FDF4] border-[#86EFAC] text-[#14532D]'
                  }`}
                >
                  {/* Top line: Name + Type Tag */}
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#191C1B]">
                      {searchResult.name || searchResult.query}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/80 border border-black/5 text-[#5F6762]">
                      {searchResult.type === 'food'
                        ? 'Food • Pantry'
                        : searchResult.type === 'durable'
                        ? 'Durable • Stationery/Personal'
                        : searchResult.type === 'both'
                        ? 'Food & Durable'
                        : 'Item'}
                    </span>
                  </div>

                  {/* Large Prominent Decision Badge */}
                  <div className="my-2 flex items-center gap-2">
                    <span
                      className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full text-white shadow-2xs ${
                        searchResult.decision === 'WAIT'
                          ? 'bg-[#D97706]'
                          : searchResult.decision === 'USE'
                          ? 'bg-[#9333EA]'
                          : 'bg-primary'
                      }`}
                    >
                      {searchResult.decision === 'WAIT'
                        ? 'WAIT'
                        : searchResult.decision === 'USE'
                        ? 'USE FIRST'
                        : 'NOT FOUND'}
                    </span>
                    <span className="text-xs font-semibold text-[#191C1B]">
                      {searchResult.decision === 'WAIT'
                        ? "You don't need to buy this right now."
                        : searchResult.decision === 'USE'
                        ? 'Use existing stock first.'
                        : 'Safe to buy or log.'}
                    </span>
                  </div>

                  {/* Quantity & Stock Details */}
                  {searchResult.found ? (
                    <div className="text-xs sm:text-sm text-[#191C1B] mt-2 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        <span>{searchResult.headline}</span>
                      </div>
                      {searchResult.subline && (
                        <p className="text-xs text-[#4A514D] pl-5.5 font-medium">
                          {searchResult.subline}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-[#4A514D] mt-1.5">
                      You don’t currently have this logged in your inventory or pantry.
                    </p>
                  )}

                  {/* Spending Memory / Purchase Memory */}
                  {searchResult.purchaseMemory && (
                    <div className="mt-3 p-2 bg-white/85 rounded-lg border border-black/5 text-[11px] text-[#2A2F2D] flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#5F6762] shrink-0" />
                      <span>
                        <strong>Last purchased:</strong> {searchResult.purchaseMemory.lastPurchasedAt}
                        {searchResult.purchaseMemory.lastPrice
                          ? ` • ₹${searchResult.purchaseMemory.lastPrice}`
                          : ''}{' '}
                        ({searchResult.purchaseMemory.lastQuantity || 1} units)
                      </span>
                    </div>
                  )}

                  {/* Quick Add Buttons for NOT FOUND */}
                  {searchResult.decision === 'BUY' && (
                    <div className="mt-3 pt-2.5 border-t border-black/5 flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleAddNotFoundToGrocery(searchResult.query)}
                        className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg shadow-2xs hover:bg-primary-hover transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Grocery List</span>
                      </button>
                      <button
                        onClick={() => handleAddNotFoundToDurable(searchResult.query)}
                        className="px-3 py-1.5 bg-white border border-[#D5D9D4] text-[#191C1B] text-xs font-semibold rounded-lg shadow-2xs hover:bg-[#F2F4F1] transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Box className="w-3.5 h-3.5 text-[#5F6762]" />
                        <span>+ Log to Inventory</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 2. WHAT NEEDS ATTENTION: Fast Vertical List */}
        <section aria-labelledby="attention-heading" className="mb-7">
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <h2 id="attention-heading" className="text-xs font-bold uppercase tracking-wider text-[#5F6762]">
              What Needs Attention
            </h2>
            <Link
              href="/priority"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E5E1] divide-y divide-[#F2F4F1] shadow-[0_1px_4px_rgba(0,0,0,0.03)] overflow-hidden">
            {attentionList.length > 0 ? (
              attentionList.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-[#FAFBF9] transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl sm:text-2xl shrink-0" role="img" aria-hidden="true">
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-xs sm:text-sm text-[#191C1B] truncate">
                        {item.name}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-[#5F6762] truncate mt-0.5">
                        {item.detail}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${item.pillColor}`}
                  >
                    {item.pill}
                  </span>
                </Link>
              ))
            ) : (
              <div className="p-5 text-center text-xs text-[#5F6762]">
                <CheckCircle2 className="w-5 h-5 text-primary mx-auto mb-1.5" />
                <span>Your food is fresh and in order. Nothing needs urgent attention.</span>
              </div>
            )}
          </div>
        </section>

        {/* 3. BOUGHT AHEAD: Personal Shelf Surplus */}
        <section aria-labelledby="bought-ahead-heading" className="mb-7">
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <div>
              <h2 id="bought-ahead-heading" className="text-xs font-bold uppercase tracking-wider text-[#5F6762]">
                Bought Ahead
              </h2>
              <p className="text-[11px] text-[#8A928D]">You already have extra stock. Don&apos;t rebuy!</p>
            </div>
            <Link
              href="/inventory"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5 shrink-0"
            >
              <span>Inventory</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {boughtAheadList.length > 0 ? (
              boughtAheadList.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-3.5 rounded-xl border border-[#E2E5E1] shadow-[0_1px_4px_rgba(0,0,0,0.03)] flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="text-lg shrink-0 mt-0.5" role="img" aria-hidden="true">
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-xs sm:text-sm text-[#191C1B] truncate">
                        {item.name}
                      </h3>
                      <p className="text-[11px] text-[#5F6762] truncate mt-0.5">
                        {item.quantity} {item.unit} • {item.location}
                      </p>
                      <p className="text-[10px] text-[#8A928D] truncate mt-0.5">
                        {item.status}
                      </p>
                    </div>
                  </div>

                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] shrink-0 border border-[#FDE68A]">
                    WAIT
                  </span>
                </div>
              ))
            ) : (
              <div className="col-span-full p-4 bg-white rounded-xl border border-[#E2E5E1] text-center text-xs text-[#5F6762]">
                No surplus items logged.
              </div>
            )}
          </div>
        </section>

        {/* 4. QUICK ACTIONS: Useful, thumb-friendly shortcuts */}
        <section aria-labelledby="quick-actions-heading" className="mb-7">
          <h2 id="quick-actions-heading" className="text-xs font-bold uppercase tracking-wider text-[#5F6762] mb-2.5 px-0.5">
            Quick Actions
          </h2>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            <Link
              href="/add"
              className="p-3 bg-white hover:bg-[#F4F5F3] border border-[#E2E5E1] hover:border-primary rounded-xl text-center transition-all group flex flex-col items-center justify-center min-h-[68px]"
            >
              <Package className="w-5 h-5 text-primary mb-1 group-hover:scale-105 transition-transform" />
              <span className="text-xs font-bold text-[#191C1B]">+ Food</span>
            </Link>

            <Link
              href="/inventory"
              className="p-3 bg-white hover:bg-[#F4F5F3] border border-[#E2E5E1] hover:border-primary rounded-xl text-center transition-all group flex flex-col items-center justify-center min-h-[68px]"
            >
              <Box className="w-5 h-5 text-primary mb-1 group-hover:scale-105 transition-transform" />
              <span className="text-xs font-bold text-[#191C1B]">+ Inventory</span>
            </Link>

            <Link
              href="/grocery"
              className="p-3 bg-white hover:bg-[#F4F5F3] border border-[#E2E5E1] hover:border-primary rounded-xl text-center transition-all group flex flex-col items-center justify-center min-h-[68px]"
            >
              <ShoppingCart className="w-5 h-5 text-primary mb-1 group-hover:scale-105 transition-transform" />
              <span className="text-xs font-bold text-[#191C1B]">+ Grocery</span>
            </Link>
          </div>
        </section>

        {/* 5. SMALL IMPACT SUMMARY: Human-centered, Student-scale */}
        <section aria-labelledby="impact-heading" className="mb-6">
          <div className="bg-[#E3F2E9]/60 border border-[#C7ECCE] rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Small Choices. Big Impact.</span>
              </span>
              <Link
                href="/impact"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Details →
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2 text-center">
              <div className="bg-white/80 rounded-xl p-2.5 border border-[#D2EBD9]">
                <div className="text-lg sm:text-xl font-bold text-[#191C1B]">
                  {isHydrated ? impactMetrics.itemsUsedBeforePriority : 0}
                </div>
                <div className="text-[10px] font-medium text-[#5F6762] mt-0.5">
                  Items Rescued
                </div>
              </div>

              <div className="bg-white/80 rounded-xl p-2.5 border border-[#D2EBD9]">
                <div className="text-lg sm:text-xl font-bold text-primary">
                  ₹{isHydrated ? impactMetrics.estimatedFoodValueINR : 0}
                </div>
                <div className="text-[10px] font-medium text-[#5F6762] mt-0.5">
                  Money Saved
                </div>
              </div>

              <div className="bg-white/80 rounded-xl p-2.5 border border-[#D2EBD9]">
                <div className="text-lg sm:text-xl font-bold text-[#191C1B]">
                  {durableItems.length}
                </div>
                <div className="text-[10px] font-medium text-[#5F6762] mt-0.5">
                  Resources Tracked
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
