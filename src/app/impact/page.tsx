'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePantry } from '@/lib/store';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import {
  CheckCircle2,
  Scale,
  IndianRupee,
  UtensilsCrossed,
  Clock,
  ArrowRight,
  Package,
  Sparkles,
} from 'lucide-react';

export default function ImpactPage() {
  const { usageEvents, impactMetrics, isHydrated, durableItems, items } = usePantry();

  // Factual personal insight calculated from real user inventory
  const personalInsightText = useMemo(() => {
    const unusedDurables = durableItems.filter(
      (d) => (d.notes && /unused|backup|spare/i.test(d.notes)) || d.quantity >= 2
    );
    const unopenedFood = items.filter((f) => !f.opened);

    if (unusedDurables.length > 0 && unopenedFood.length > 0) {
      return `You have ${unusedDurables[0].quantity} ${unusedDurables[0].name} in storage and unopened ${unopenedFood[0].name} in your pantry. Checking FOUND prevents duplicate purchases.`;
    }
    if (unusedDurables.length > 0) {
      return `You currently have ${unusedDurables[0].quantity} ${unusedDurables[0].name} in storage. You don't need to purchase more stationery or supplies right now.`;
    }
    if (impactMetrics.itemsUsedBeforePriority > 0) {
      return `You've used ${impactMetrics.itemsUsedBeforePriority} ingredients before their best-before date, keeping ₹${impactMetrics.estimatedFoodValueINR} in your wallet.`;
    }
    return `You're tracking ${durableItems.length} personal items and ${items.length} pantry ingredients. Every item logged prevents accidental double-buying.`;
  }, [durableItems, items, impactMetrics]);

  // Format date readable
  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="min-h-screen pb-24 overflow-x-hidden bg-[#121513] bg-editorial-pattern text-[#EFF1EC]">
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {/* Small Breadcrumb */}
        <Breadcrumbs items={[{ label: 'My Impact' }]} />

        {/* Page Header */}
        <div className="mt-2 mb-6 sm:mb-8">
          <span className="text-[10px] font-mono font-medium uppercase tracking-widest text-[#78B48B] bg-[#1A261E] px-2 py-0.5 rounded-xs border border-[#273B2E] inline-block mb-2">
            RESOURCE ACCOUNTING
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#EFF1EC]">
            My Impact
          </h1>
          <p className="text-xs sm:text-sm text-[#8E968F] font-sans mt-1 max-w-2xl leading-relaxed">
            See what you&apos;ve kept in use by remembering what you already have.
          </p>
        </div>

        {/* 4 Metrics Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
          {/* Metric 1: Food items rescued */}
          <div className="bg-[#181C19] rounded-sm p-4 sm:p-5 border border-[#28302A] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#8E968F] mb-3">
              <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider">
                Food Rescued
              </span>
              <CheckCircle2 className="w-4 h-4 text-[#78B48B] shrink-0" />
            </div>
            <div>
              <div className="font-mono font-bold text-2xl sm:text-3xl text-[#EFF1EC]">
                {isHydrated ? impactMetrics.itemsUsedBeforePriority : 0}
              </div>
              <p className="text-[11px] font-sans text-[#5A635B] mt-0.5">
                items eaten before expiry
              </p>
            </div>
          </div>

          {/* Metric 2: Estimated money saved */}
          <div className="bg-[#181C19] rounded-sm p-4 sm:p-5 border border-[#28302A] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#8E968F] mb-3">
              <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider">
                Money Saved
              </span>
              <IndianRupee className="w-4 h-4 text-[#78B48B] shrink-0" />
            </div>
            <div>
              <div className="font-mono font-bold text-2xl sm:text-3xl text-[#78B48B]">
                ₹{isHydrated ? impactMetrics.estimatedFoodValueINR : 0}
              </div>
              <p className="text-[11px] font-sans text-[#5A635B] mt-0.5">
                food value protected
              </p>
            </div>
          </div>

          {/* Metric 3: Weight prevented from waste */}
          <div className="bg-[#181C19] rounded-sm p-4 sm:p-5 border border-[#28302A] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#8E968F] mb-3">
              <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider">
                Waste Avoided
              </span>
              <Scale className="w-4 h-4 text-[#5A635B] shrink-0" />
            </div>
            <div>
              <div className="font-mono font-bold text-2xl sm:text-3xl text-[#EFF1EC]">
                {isHydrated ? `${impactMetrics.estimatedFoodRescuedKg} kg` : '0 kg'}
              </div>
              <p className="text-[11px] font-sans text-[#5A635B] mt-0.5">
                groceries preserved
              </p>
            </div>
          </div>

          {/* Metric 4: Meals cooked from pantry */}
          <div className="bg-[#181C19] rounded-sm p-4 sm:p-5 border border-[#28302A] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#8E968F] mb-3">
              <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider">
                Home Meals
              </span>
              <UtensilsCrossed className="w-4 h-4 text-[#5A635B] shrink-0" />
            </div>
            <div>
              <div className="font-mono font-bold text-2xl sm:text-3xl text-[#EFF1EC]">
                {isHydrated ? impactMetrics.mealsMadeFromPantry : 0}
              </div>
              <p className="text-[11px] font-sans text-[#5A635B] mt-0.5">
                cooked from pantry
              </p>
            </div>
          </div>
        </div>

        {/* Personal Insight: Factual, calculated observation from real user inventory */}
        <div className="bg-[#181C19] border border-[#28302A] rounded-sm p-4 sm:p-5 mb-8 flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xs bg-[#1A261E] text-[#78B48B] border border-[#273B2E] flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#78B48B] font-bold">
              Personal Insight
            </div>
            <p className="text-xs sm:text-sm font-sans font-medium text-[#EFF1EC] mt-0.5 leading-relaxed">
              {personalInsightText}
            </p>
            <p className="text-[11px] font-mono text-[#5A635B] mt-1">
              FOUND monitors your stock so you never rebuy things you already have at home.
            </p>
          </div>
        </div>

        {/* 2-Column Section: Personal Resources & Cooking History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 & 2: Recent Food Rescued / Cooking Log */}
          <section aria-labelledby="history-heading" className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3 px-0.5">
              <h2 id="history-heading" className="text-xs font-mono uppercase tracking-wider text-[#8E968F]">
                Recent Food Utilization
              </h2>
              <Link
                href="/pantry"
                className="text-xs font-mono uppercase tracking-wider text-[#78B48B] hover:text-[#93D4A8] flex items-center gap-1"
              >
                <span>Pantry</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="bg-[#181C19] rounded-sm border border-[#28302A] divide-y divide-[#222824] overflow-hidden">
              {usageEvents.length > 0 ? (
                usageEvents.slice(0, 6).map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-[#1E2420]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xs bg-[#1A261E] text-[#78B48B] border border-[#273B2E] flex items-center justify-center shrink-0">
                        <UtensilsCrossed className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-sm text-[#EFF1EC] truncate">
                            {evt.foodName}
                          </span>
                          {evt.wasPriorityItem && (
                            <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded-xs bg-[#2D1915] text-[#FF9E90] border border-[#482520]">
                              Priority Rescued
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-sans text-[#8E968F] truncate mt-0.5">
                          Used {evt.quantityUsed} {evt.unit}
                          {evt.recipeName ? ` for ${evt.recipeName}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono">
                      <span className="font-bold text-xs text-[#78B48B] block">
                        +₹{evt.estimatedValueINR}
                      </span>
                      <span className="text-[10px] text-[#5A635B] block mt-0.5">
                        {formatDate(evt.usedAt)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-[#8E968F] font-sans">
                  <Clock className="w-5 h-5 text-[#5A635B] mx-auto mb-1.5" />
                  <p>No cooking usage logged yet.</p>
                  <p className="text-[11px] text-[#5A635B] mt-0.5">
                    When you cook with pantry items, your rescued food and savings appear here.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Column 3: Durable Resources Protected */}
          <section aria-labelledby="durable-impact-heading">
            <div className="flex items-center justify-between mb-3 px-0.5">
              <h2 id="durable-impact-heading" className="text-xs font-mono uppercase tracking-wider text-[#8E968F]">
                Tracked Goods
              </h2>
              <Link
                href="/inventory"
                className="text-xs font-mono uppercase tracking-wider text-[#78B48B] hover:text-[#93D4A8] flex items-center gap-1"
              >
                <span>Shelf</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="bg-[#181C19] rounded-sm border border-[#28302A] p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#222824] pb-2.5">
                <span className="text-xs text-[#8E968F] font-sans">Personal items logged</span>
                <span className="font-mono font-bold text-xs text-[#EFF1EC]">{durableItems.length} items</span>
              </div>
              <div className="flex items-center justify-between border-b border-[#222824] pb-2.5">
                <span className="text-xs text-[#8E968F] font-sans">Surplus/backup stock</span>
                <span className="font-mono font-bold text-xs text-[#78B48B]">
                  {durableItems.filter((d) => d.quantity >= 2 || /unused|stored/i.test(d.notes || '')).length} items
                </span>
              </div>
              <p className="text-[11px] font-sans text-[#5A635B] leading-relaxed pt-1">
                By checking your shelf before you buy, you avoid spending on extra notebooks, cables, and supplies you already own.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
