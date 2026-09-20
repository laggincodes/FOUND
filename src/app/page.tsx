'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  UtensilsCrossed,
  Loader2,
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
  const [semanticConcepts, setSemanticConcepts] = useState<Record<string, string[]>>({});
  const [isSearchingSemantic, setIsSearchingSemantic] = useState(false);

  const demoChips = ['notebook', 'milk', 'toothpaste', 'USB hub', 'spinach'];

  // Pure direct search result first
  const directResult: SearchMatchResult | null = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return null;
    return checkItemInventory(q);
  }, [searchQuery, checkItemInventory]);

  // Semantic query understanding when pure search finds no match & query has >= 3 words
  useEffect(() => {
    const q = searchQuery.trim();
    const words = q.split(/\s+/).filter(Boolean);

    // Only invoke semantic helper for natural queries (>= 3 words) when pure direct search is negative
    if (words.length < 3 || (directResult && directResult.found)) {
      return;
    }

    const lowerQ = q.toLowerCase();
    const cacheKey = `found_semantic_${lowerQ}`;

    if (semanticConcepts[lowerQ]) {
      return;
    }

    // Check sessionStorage
    try {
      const cached = typeof window !== 'undefined' ? sessionStorage.getItem(cacheKey) : null;
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSemanticConcepts((prev) => ({ ...prev, [lowerQ]: parsed }));
          return;
        }
      }
    } catch {
      // Ignore sessionStorage error
    }

    let active = true;
    const timer = setTimeout(async () => {
      try {
        setIsSearchingSemantic(true);
        const res = await fetch('/api/inventory/semantic-match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q }),
        });

        if (!res.ok) return;
        const data = await res.json();
        if (active && data?.concepts && Array.isArray(data.concepts) && data.concepts.length > 0) {
          setSemanticConcepts((prev) => ({ ...prev, [lowerQ]: data.concepts }));
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(data.concepts));
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.warn('Semantic search error:', err);
      } finally {
        if (active) setIsSearchingSemantic(false);
      }
    }, 450);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery, directResult, semanticConcepts]);

  // Combined result: pure match takes immediate precedence, fallback to semantic concepts
  const searchResult: SearchMatchResult | null = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return null;
    if (directResult && directResult.found) return directResult;

    const concepts = semanticConcepts[q.toLowerCase()];
    if (concepts && concepts.length > 0) {
      return checkItemInventory(q, concepts);
    }
    return directResult;
  }, [searchQuery, directResult, semanticConcepts, checkItemInventory]);

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
    <div className="min-h-screen pb-24 overflow-x-hidden bg-[#121513] bg-editorial-pattern text-[#EFF1EC]">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8">
        {/* STUDENT GREETING HEADER */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[10px] font-mono font-medium uppercase tracking-widest text-[#7DB88F] mb-1">
              FOUND — Gives your stuff a memory.
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#EFF1EC]">
              {greeting}, {activeUser?.firstName || 'Student'}
            </h1>
            <p className="text-xs sm:text-sm text-[#8E968F] mt-0.5">
              Check what you own before you spend.
            </p>
          </div>

          <Link
            href="/profile"
            className="w-9 h-9 rounded-full bg-[#1E2420] text-[#7DB88F] flex items-center justify-center font-bold text-xs border border-[#2B352E] shadow-subtle hover:bg-[#252D27] transition-colors"
            title="Profile settings"
          >
            {(activeUser?.firstName || 'S')[0].toUpperCase()}
          </Link>
        </div>

        {/* Onboarding Welcome State for New Empty Accounts */}
        {isHydrated && items.length === 0 && durableItems.length === 0 && (
          <section className="mb-7 p-6 sm:p-8 bg-[#181C19] border border-[#28302A] rounded-xl shadow-card text-center animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-[#1E2721] text-[#7DB88F] flex items-center justify-center mx-auto mb-3 border border-[#2A3B2F]">
              <Sparkles className="w-6 h-6 stroke-[1.8]" />
            </div>
            <h2 className="font-serif font-bold text-2xl text-[#EFF1EC]">
              WELCOME TO FOUND
            </h2>
            <p className="text-xs sm:text-sm text-[#8E968F] mt-1.5 max-w-sm mx-auto leading-relaxed">
              Let&apos;s remember what you already have. Start by adding your first pantry food or personal item.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Link
                href="/add"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-sm bg-primary hover:bg-primary-hover text-[#EFF1EC] text-xs font-semibold shadow-subtle transition-colors border border-[#3E684A]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add your first item</span>
              </Link>
            </div>
          </section>
        )}

        {/* 1. HERO SEARCH / BEFORE YOU BUY */}
        <section aria-labelledby="search-heading" className="mb-7">
          <div className="bg-[#181C19] rounded-xl border border-[#28302A] p-4 sm:p-5 shadow-card">
            <h2 id="search-heading" className="font-serif text-base sm:text-lg font-bold text-[#EFF1EC]">
              What are you looking for?
            </h2>
            <p className="text-xs text-[#8E968F] mt-0.5 mb-3">
              Check before you buy. Find what you already have.
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
                placeholder="Check before you buy… (e.g. notebook, cables, milk)"
                className="w-full bg-[#141715] hover:bg-[#171B18] focus:bg-[#141715] border border-[#2A332C] focus:border-[#416E4E] focus:ring-1 focus:ring-[#416E4E]/30 rounded-lg px-4 py-3 sm:py-3.5 text-sm sm:text-base text-[#EFF1EC] placeholder:text-[#68736A] outline-none transition-all pl-10 pr-14"
              />
              <Search className="w-4 h-4 text-[#727C74] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {isSearchingSemantic && (
                <Loader2 className="w-4 h-4 text-[#7DB88F] animate-spin absolute right-9 top-1/2 -translate-y-1/2" />
              )}
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveChip(null);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#727C74] hover:text-[#EFF1EC] text-xs font-bold p-1 cursor-pointer"
                  title="Clear"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Demo Chips */}
            <div className="mt-3 flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-[11px] text-[#727C74] mr-0.5">Try:</span>
              {demoChips.map((chip) => {
                const isSelected =
                  activeChip === chip || searchQuery.toLowerCase().trim() === chip.toLowerCase();
                return (
                  <button
                    key={chip}
                    onClick={() => handleChipClick(chip)}
                    className={`px-2.5 py-1 rounded-xs font-mono text-xs transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#243B2B] text-[#86C99B] border-[#385B42] font-semibold'
                        : 'bg-[#1C211D] hover:bg-[#232924] text-[#8E968F] hover:text-[#EFF1EC] border-[#28302A]'
                    }`}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>

            {/* INSTANT RESULT CARD */}
            {searchResult && (
              <div className="mt-4 pt-4 border-t border-[#262E28]">
                <div
                  className={`rounded-lg p-4 transition-all border ${
                    searchResult.decision === 'WAIT'
                      ? 'bg-[#241D13] border-[#44361E] text-[#DEAB57]'
                      : searchResult.decision === 'USE'
                      ? 'bg-[#271815] border-[#4A2721] text-[#E06D53]'
                      : 'bg-[#162319] border-[#28412F] text-[#7DB88F]'
                  }`}
                >
                  {/* Top line: Name + Type Tag */}
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#EFF1EC]">
                      {searchResult.name || searchResult.query}
                    </span>
                    <span className="font-mono text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-xs bg-[#141715]/70 border border-white/5 text-[#8E968F]">
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
                  <div className="my-2 flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-mono text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-xs border shadow-subtle ${
                        searchResult.decision === 'WAIT'
                          ? 'bg-[#3A2C15] text-[#E5B568] border-[#543F1F]'
                          : searchResult.decision === 'USE'
                          ? 'bg-[#381B15] text-[#E2765E] border-[#5E2B20]'
                          : 'bg-[#1D3022] text-[#86C99B] border-[#2C4A34]'
                      }`}
                    >
                      ● {searchResult.decision === 'WAIT'
                        ? 'WAIT'
                        : searchResult.decision === 'USE'
                        ? 'USE FIRST'
                        : 'NOT FOUND'}
                    </span>
                    <span className="text-xs font-medium text-[#EFF1EC]">
                      {searchResult.decision === 'WAIT'
                        ? "You don't need to buy this right now."
                        : searchResult.decision === 'USE'
                        ? 'Use existing stock first.'
                        : 'Safe to buy or log.'}
                    </span>
                  </div>

                  {/* Quantity & Stock Details */}
                  {searchResult.found ? (
                    <div className="text-xs sm:text-sm text-[#EFF1EC] mt-2 space-y-1">
                      <div className="font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-[#7DB88F] shrink-0" />
                        <span>{searchResult.headline}</span>
                      </div>
                      {searchResult.subline && (
                        <p className="text-xs text-[#9AA29B] pl-5.5 font-mono">
                          {searchResult.subline}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-[#9AA29B] mt-1.5 font-mono">
                      You don’t currently have this logged in your inventory or pantry.
                    </p>
                  )}

                  {/* Spending Memory / Purchase Memory */}
                  {searchResult.purchaseMemory && (
                    <div className="mt-3 p-2 bg-[#141715]/80 rounded-md border border-white/5 font-mono text-[11px] text-[#8E968F] flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#727C74] shrink-0" />
                      <span>
                        <strong className="text-[#EFF1EC]">Last purchased:</strong> {searchResult.purchaseMemory.lastPurchasedAt}
                        {searchResult.purchaseMemory.lastPrice
                          ? ` • ₹${searchResult.purchaseMemory.lastPrice}`
                          : ''}{' '}
                        ({searchResult.purchaseMemory.lastQuantity || 1} units)
                      </span>
                    </div>
                  )}

                  {/* Quick Add Buttons for NOT FOUND */}
                  {searchResult.decision === 'BUY' && (
                    <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleAddNotFoundToGrocery(searchResult.query)}
                        className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-[#EFF1EC] text-xs font-semibold rounded-sm shadow-subtle border border-[#3D684A] transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Grocery List</span>
                      </button>
                      <button
                        onClick={() => handleAddNotFoundToDurable(searchResult.query)}
                        className="px-3 py-1.5 bg-[#1C211D] hover:bg-[#232924] border border-[#28302A] text-[#EFF1EC] text-xs font-semibold rounded-sm transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Box className="w-3.5 h-3.5 text-[#88928A]" />
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
            <h2 id="attention-heading" className="font-mono text-xs font-bold uppercase tracking-wider text-[#8E968F]">
              What Needs Attention
            </h2>
            <Link
              href="/priority"
              className="text-xs font-semibold text-[#7DB88F] hover:underline flex items-center gap-0.5"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-[#181C19] rounded-xl border border-[#28302A] divide-y divide-[#212622] shadow-card overflow-hidden">
            {attentionList.length > 0 ? (
              attentionList.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-[#1C211D] transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl sm:text-2xl shrink-0" role="img" aria-hidden="true">
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-xs sm:text-sm text-[#EFF1EC] truncate">
                        {item.name}
                      </h3>
                      <p className="font-mono text-[11px] sm:text-xs text-[#8E968F] truncate mt-0.5">
                        {item.detail}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs shrink-0 border ${
                      item.pill === 'USE FIRST'
                        ? 'bg-[#2E1A16] text-[#E2765E] border-[#4F2A21]'
                        : item.pill === 'USE SOON'
                        ? 'bg-[#2B2213] text-[#DEAB57] border-[#47381E]'
                        : 'bg-[#262215] text-[#D6A24D] border-[#44381C]'
                    }`}
                  >
                    ● {item.pill}
                  </span>
                </Link>
              ))
            ) : (
              <div className="p-5 text-center text-xs text-[#8E968F]">
                <CheckCircle2 className="w-5 h-5 text-[#7DB88F] mx-auto mb-1.5" />
                <span>Your food is fresh and in order. Nothing needs urgent attention.</span>
              </div>
            )}
          </div>
        </section>

        {/* 3. BOUGHT AHEAD: Personal Shelf Surplus */}
        <section aria-labelledby="bought-ahead-heading" className="mb-7">
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <div>
              <h2 id="bought-ahead-heading" className="font-mono text-xs font-bold uppercase tracking-wider text-[#8E968F]">
                Bought Ahead
              </h2>
              <p className="text-[11px] text-[#727C74]">You already have extra stock. Don&apos;t rebuy!</p>
            </div>
            <Link
              href="/inventory"
              className="text-xs font-semibold text-[#7DB88F] hover:underline flex items-center gap-0.5 shrink-0"
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
                  className="bg-[#181C19] p-3.5 rounded-xl border border-[#28302A] shadow-card flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="text-lg shrink-0 mt-0.5" role="img" aria-hidden="true">
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-xs sm:text-sm text-[#EFF1EC] truncate">
                        {item.name}
                      </h3>
                      <p className="font-mono text-[11px] text-[#8E968F] truncate mt-0.5">
                        {item.quantity} {item.unit} • {item.location}
                      </p>
                      <p className="font-mono text-[10px] text-[#727C74] truncate mt-0.5">
                        {item.status}
                      </p>
                    </div>
                  </div>

                  <span className="font-mono text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-xs bg-[#262215] text-[#D6A24D] border border-[#44381C] shrink-0">
                    ● WAIT
                  </span>
                </div>
              ))
            ) : (
              <div className="col-span-full p-4 bg-[#181C19] rounded-xl border border-[#28302A] text-center text-xs text-[#8E968F]">
                No surplus items logged.
              </div>
            )}
          </div>
        </section>

        {/* 4. QUICK ACTIONS: Useful, thumb-friendly shortcuts */}
        <section aria-labelledby="quick-actions-heading" className="mb-7">
          <h2 id="quick-actions-heading" className="font-mono text-xs font-bold uppercase tracking-wider text-[#8E968F] mb-2.5 px-0.5">
            Quick Actions
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <Link
              href="/add"
              className="p-3 bg-[#181C19] hover:bg-[#1E231F] border border-[#28302A] hover:border-[#3E684A] rounded-xl text-center transition-all group flex flex-col items-center justify-center min-h-[68px]"
            >
              <Plus className="w-5 h-5 text-[#7DB88F] mb-1 group-hover:scale-105 transition-transform" />
              <span className="text-xs font-semibold text-[#EFF1EC]">Add Item</span>
            </Link>

            <Link
              href="/inventory"
              className="p-3 bg-[#181C19] hover:bg-[#1E231F] border border-[#28302A] hover:border-[#3E684A] rounded-xl text-center transition-all group flex flex-col items-center justify-center min-h-[68px]"
            >
              <Box className="w-5 h-5 text-[#7DB88F] mb-1 group-hover:scale-105 transition-transform" />
              <span className="text-xs font-semibold text-[#EFF1EC]">Check Inventory</span>
            </Link>

            <Link
              href="/recipes"
              className="p-3 bg-[#181C19] hover:bg-[#1E231F] border border-[#28302A] hover:border-[#3E684A] rounded-xl text-center transition-all group flex flex-col items-center justify-center min-h-[68px]"
            >
              <UtensilsCrossed className="w-5 h-5 text-[#7DB88F] mb-1 group-hover:scale-105 transition-transform" />
              <span className="text-xs font-semibold text-[#EFF1EC]">What Can I Cook?</span>
            </Link>

            <Link
              href="/grocery"
              className="p-3 bg-[#181C19] hover:bg-[#1E231F] border border-[#28302A] hover:border-[#3E684A] rounded-xl text-center transition-all group flex flex-col items-center justify-center min-h-[68px]"
            >
              <ShoppingCart className="w-5 h-5 text-[#7DB88F] mb-1 group-hover:scale-105 transition-transform" />
              <span className="text-xs font-semibold text-[#EFF1EC]">Grocery List</span>
            </Link>
          </div>
        </section>

        {/* 5. SMALL IMPACT SUMMARY: Human-centered, Student-scale */}
        <section aria-labelledby="impact-heading" className="mb-6">
          <div className="bg-[#151D17] border border-[#253629] rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#7DB88F] flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Small Choices. Big Impact.</span>
              </span>
              <Link
                href="/impact"
                className="text-xs font-semibold text-[#7DB88F] hover:underline"
              >
                Details →
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2 text-center">
              <div className="bg-[#181C19] rounded-lg p-2.5 border border-[#26372B]">
                <div className="font-mono text-lg sm:text-xl font-bold text-[#EFF1EC]">
                  {isHydrated ? impactMetrics.itemsUsedBeforePriority : 0}
                </div>
                <div className="font-mono text-[10px] font-medium text-[#8E968F] mt-0.5">
                  Items Rescued
                </div>
              </div>

              <div className="bg-[#181C19] rounded-lg p-2.5 border border-[#26372B]">
                <div className="font-mono text-lg sm:text-xl font-bold text-[#7DB88F]">
                  ₹{isHydrated ? impactMetrics.estimatedFoodValueINR : 0}
                </div>
                <div className="font-mono text-[10px] font-medium text-[#8E968F] mt-0.5">
                  Money Saved
                </div>
              </div>

              <div className="bg-[#181C19] rounded-lg p-2.5 border border-[#26372B]">
                <div className="font-mono text-lg sm:text-xl font-bold text-[#EFF1EC]">
                  {durableItems.length}
                </div>
                <div className="font-mono text-[10px] font-medium text-[#8E968F] mt-0.5">
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
