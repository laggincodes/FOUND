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
    <div className="min-h-screen pb-24 overflow-x-hidden bg-[#FBFBFA]">
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {/* Small Breadcrumb */}
        <Breadcrumbs items={[{ label: 'My Impact' }]} />

        {/* Page Header */}
        <div className="mt-2 mb-6 sm:mb-8">
          <span className="text-[10px] sm:text-[11px] font-bold tracking-widest text-[#727972] uppercase block mb-1">
            Personal Resource Impact
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#191C1B]">
            My Impact
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6762] mt-1 max-w-2xl leading-relaxed">
            See what you&apos;ve kept in use by remembering what you already have.
          </p>
        </div>

        {/* 4 Metrics Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
          {/* Metric 1: Food items rescued */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#E2E5E1] shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#5F6762] mb-3">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                Food Rescued
              </span>
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            </div>
            <div>
              <div className="font-bold text-2xl sm:text-3xl text-[#191C1B]">
                {isHydrated ? impactMetrics.itemsUsedBeforePriority : 0}
              </div>
              <p className="text-[11px] text-[#5F6762] mt-0.5">
                items eaten before expiry
              </p>
            </div>
          </div>

          {/* Metric 2: Estimated money saved */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#E2E5E1] shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#5F6762] mb-3">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                Money Saved
              </span>
              <IndianRupee className="w-4 h-4 text-primary shrink-0" />
            </div>
            <div>
              <div className="font-bold text-2xl sm:text-3xl text-primary">
                ₹{isHydrated ? impactMetrics.estimatedFoodValueINR : 0}
              </div>
              <p className="text-[11px] text-[#5F6762] mt-0.5">
                food value protected
              </p>
            </div>
          </div>

          {/* Metric 3: Weight prevented from waste */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#E2E5E1] shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#5F6762] mb-3">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                Waste Avoided
              </span>
              <Scale className="w-4 h-4 text-[#8A928D] shrink-0" />
            </div>
            <div>
              <div className="font-bold text-2xl sm:text-3xl text-[#191C1B]">
                {isHydrated ? `${impactMetrics.estimatedFoodRescuedKg} kg` : '0 kg'}
              </div>
              <p className="text-[11px] text-[#5F6762] mt-0.5">
                groceries preserved
              </p>
            </div>
          </div>

          {/* Metric 4: Meals cooked from pantry */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#E2E5E1] shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#5F6762] mb-3">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                Home Meals
              </span>
              <UtensilsCrossed className="w-4 h-4 text-[#8A928D] shrink-0" />
            </div>
            <div>
              <div className="font-bold text-2xl sm:text-3xl text-[#191C1B]">
                {isHydrated ? impactMetrics.mealsMadeFromPantry : 0}
              </div>
              <p className="text-[11px] text-[#5F6762] mt-0.5">
                cooked from pantry
              </p>
            </div>
          </div>
        </div>

        {/* Personal Insight: Factual, calculated observation from real user inventory */}
        <div className="bg-[#E3F2E9]/70 border border-[#C7ECCE] rounded-2xl p-4 sm:p-5 mb-8 flex items-start gap-3.5 shadow-2xs">
          <div className="w-8 h-8 rounded-full bg-white text-primary flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
              Personal Insight
            </div>
            <p className="text-xs sm:text-sm font-semibold text-[#191C1B] mt-0.5">
              {personalInsightText}
            </p>
            <p className="text-[11px] text-[#5F6762] mt-1">
              FOUND monitors your stock so you never rebuy things you already have at home.
            </p>
          </div>
        </div>

        {/* 2-Column Section: Personal Resources & Cooking History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 & 2: Recent Food Rescued / Cooking Log */}
          <section aria-labelledby="history-heading" className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3 px-0.5">
              <h2 id="history-heading" className="text-xs font-bold uppercase tracking-wider text-[#5F6762]">
                Recent Food Utilization
              </h2>
              <Link
                href="/pantry"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
              >
                <span>Pantry</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="bg-white rounded-xl border border-[#E2E5E1] shadow-[0_1px_3px_rgba(0,0,0,0.03)] divide-y divide-[#F2F4F1] overflow-hidden">
              {usageEvents.length > 0 ? (
                usageEvents.slice(0, 6).map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-[#FAFBF9] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#E3F2E9] text-primary flex items-center justify-center shrink-0">
                        <UtensilsCrossed className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-[#191C1B] truncate">
                            {evt.foodName}
                          </span>
                          {evt.wasPriorityItem && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-[#FFDBD0] text-[#97472E]">
                              Priority Rescued
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#5F6762] truncate mt-0.5">
                          Used {evt.quantityUsed} {evt.unit}
                          {evt.recipeName ? ` for ${evt.recipeName}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold text-xs text-primary block">
                        +₹{evt.estimatedValueINR}
                      </span>
                      <span className="text-[10px] text-[#8A928D] block mt-0.5">
                        {formatDate(evt.usedAt)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-[#5F6762]">
                  <Clock className="w-5 h-5 text-[#8A928D] mx-auto mb-1.5" />
                  <p>No cooking usage logged yet.</p>
                  <p className="text-[11px] text-[#8A928D] mt-0.5">
                    When you cook with pantry items, your rescued food and savings appear here.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Column 3: Durable Resources Protected */}
          <section aria-labelledby="durable-impact-heading">
            <div className="flex items-center justify-between mb-3 px-0.5">
              <h2 id="durable-impact-heading" className="text-xs font-bold uppercase tracking-wider text-[#5F6762]">
                Tracked Goods
              </h2>
              <Link
                href="/inventory"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
              >
                <span>Shelf</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="bg-white rounded-xl border border-[#E2E5E1] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
              <div className="flex items-center justify-between border-b border-[#F2F4F1] pb-2.5">
                <span className="text-xs text-[#5F6762]">Personal items logged</span>
                <span className="font-bold text-xs text-[#191C1B]">{durableItems.length} items</span>
              </div>
              <div className="flex items-center justify-between border-b border-[#F2F4F1] pb-2.5">
                <span className="text-xs text-[#5F6762]">Surplus/backup stock</span>
                <span className="font-bold text-xs text-primary">
                  {durableItems.filter((d) => d.quantity >= 2 || /unused|stored/i.test(d.notes || '')).length} items
                </span>
              </div>
              <p className="text-[11px] text-[#727972] leading-relaxed pt-1">
                By checking your shelf before you buy, you avoid spending on extra notebooks, cables, and supplies you already own.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
