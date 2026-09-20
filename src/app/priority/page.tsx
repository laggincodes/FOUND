'use client';

import React from 'react';
import Link from 'next/link';
import { usePantry } from '@/lib/store';
import { FoodCard } from '@/components/FoodCard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PriorityBadge } from '@/components/PriorityBadge';
import {
  AlertOctagon,
  Clock,
  ShieldCheck,
  ChefHat,
  ArrowRight,
  Info,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

export default function PriorityPage() {
  const { items, getItemAssessment, isHydrated } = usePantry();

  // Partition pantry items by deterministic priority tier
  const expiredItems = items
    .filter((item) => getItemAssessment(item).tier === 'EXPIRED')
    .sort((a, b) => getItemAssessment(b).score - getItemAssessment(a).score);

  const useFirstItems = items
    .filter((item) => getItemAssessment(item).tier === 'USE_FIRST')
    .sort((a, b) => getItemAssessment(b).score - getItemAssessment(a).score);

  const useSoonItems = items
    .filter((item) => getItemAssessment(item).tier === 'USE_SOON')
    .sort((a, b) => getItemAssessment(b).score - getItemAssessment(a).score);

  const safeItems = items
    .filter((item) => getItemAssessment(item).tier === 'SAFE_FOR_NOW')
    .sort((a, b) => getItemAssessment(b).score - getItemAssessment(a).score);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Use First' }]} />

      {/* Main Header */}
      <div className="mt-3 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDF2EF] text-[#C84B31] border border-[#F3C4B8] text-xs font-semibold mb-2.5">
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>Actionable Food Planning</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink tracking-tight">
          What should I use first?
        </h1>
        <p className="text-sm sm:text-base text-ink-muted mt-2 max-w-2xl leading-relaxed">
          Pantry items sorted by planning urgency. This deterministic view evaluates user-entered dates,
          known ingredient perishability, opened package status, and household quantities to prevent
          food waste before it starts.
        </p>
      </div>

      {/* Mandatory Food Safety Disclaimer Notice */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-surface-border editorial-shadow mb-10 flex items-start gap-3.5">
        <ShieldAlert className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-ink-muted leading-relaxed">
          <span className="font-bold text-ink block sm:inline">Planning Notice: </span>
          The priority system is a <strong>household planning tool</strong>, not a food-safety certification system.
          It does not declare food safe or unsafe. Always inspect packaging labels, smell, texture, and follow your own
          culinary judgment.
        </div>
      </div>

      {/* Section 0: EXPIRED (if any) */}
      {expiredItems.length > 0 && (
        <section className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#FFB4AB] mb-6 gap-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#FFDAD6] border border-[#FFB4AB] flex items-center justify-center text-[#BA1A1A]">
                <AlertOctagon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-serif font-bold text-2xl text-[#BA1A1A]">EXPIRED</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FFDAD6] text-[#BA1A1A] text-xs font-bold border border-[#FFB4AB]">
                    {expiredItems.length} {expiredItems.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <p className="text-xs text-ink-muted mt-0.5">Best-before date has passed — check smell, texture, and packaging before consuming</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {expiredItems.map((item) => (
              <FoodCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Section 1: USE FIRST */}
      <section className="mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F3C4B8] mb-6 gap-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#FDF2EF] border border-[#F3C4B8] flex items-center justify-center text-[#C84B31]">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-2xl text-ink">USE FIRST</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#FDF2EF] text-[#C84B31] text-xs font-bold border border-[#F3C4B8]">
                  {useFirstItems.length} {useFirstItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-0.5">Highest planning priority — cook with these today or tomorrow</p>
            </div>
          </div>

          {useFirstItems.length > 0 && (
            <Link
              href="/recipes"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C84B31] hover:underline"
            >
              <span>Find recipes for these ingredients</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {useFirstItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {useFirstItems.map((item) => (
              <FoodCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white border border-surface-border text-center">
            <ShieldCheck className="w-8 h-8 text-[#1E7245] mx-auto mb-2" />
            <p className="font-serif font-bold text-lg text-ink">No items in Use First</p>
            <p className="text-xs text-ink-muted mt-1 max-w-sm mx-auto">
              None of your pantry items currently show high date urgency or open perishable risk.
            </p>
          </div>
        )}
      </section>

      {/* Section 2: USE SOON */}
      <section className="mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#FCD34D] mb-6 gap-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] border border-[#FCD34D] flex items-center justify-center text-[#B45309]">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-2xl text-ink">USE SOON</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] text-xs font-bold border border-[#FCD34D]">
                  {useSoonItems.length} {useSoonItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-0.5">Secondary priority — items worth planning meals around this week</p>
            </div>
          </div>
        </div>

        {useSoonItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {useSoonItems.map((item) => (
              <FoodCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white border border-surface-border text-center">
            <p className="font-serif font-bold text-lg text-ink">No items in Use Soon</p>
            <p className="text-xs text-ink-muted mt-1">
              Your pantry currently has no secondary urgency items.
            </p>
          </div>
        )}
      </section>

      {/* Section 3: SAFE FOR NOW */}
      <section className="mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#B7E0C6] mb-6 gap-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#EAF5EE] border border-[#B7E0C6] flex items-center justify-center text-[#1E7245]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-2xl text-ink">SAFE FOR NOW</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#EAF5EE] text-[#1E7245] text-xs font-bold border border-[#B7E0C6]">
                  {safeItems.length} {safeItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-0.5">Low planning urgency according to the information currently entered</p>
            </div>
          </div>
        </div>

        {safeItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {safeItems.map((item) => (
              <FoodCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white border border-surface-border text-center">
            <p className="text-xs text-ink-muted">No items in this category.</p>
          </div>
        )}
      </section>

      {/* Priority Engine Explainer Box */}
      <section className="p-6 rounded-2xl bg-white border border-surface-border">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-ink-muted" />
          <h3 className="font-serif font-bold text-lg text-ink">How Priority Is Calculated</h3>
        </div>
        <p className="text-xs text-ink-muted leading-relaxed mb-4">
          Priority is 100% deterministic and transparent. Scores (0–100) are computed from four practical kitchen factors:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-earth-50 rounded-xl border border-surface-border">
            <strong className="text-ink font-semibold block">1. Date Proximity (0–60)</strong>
            <span className="text-ink-muted mt-1 block">
              User-entered best-before dates. Items expiring within 1–2 days receive high urgency. Never invented.
            </span>
          </div>
          <div className="p-3 bg-earth-50 rounded-xl border border-surface-border">
            <strong className="text-ink font-semibold block">2. Perishability (0–20)</strong>
            <span className="text-ink-muted mt-1 block">
              Leafy greens, dairy, and soft produce degrade rapidly compared to dry grains or spices.
            </span>
          </div>
          <div className="p-3 bg-earth-50 rounded-xl border border-surface-border">
            <strong className="text-ink font-semibold block">3. Opened Status (0–10)</strong>
            <span className="text-ink-muted mt-1 block">
              An opened carton of milk or bag of spinach oxidizes much faster than sealed packaging.
            </span>
          </div>
          <div className="p-3 bg-earth-50 rounded-xl border border-surface-border">
            <strong className="text-ink font-semibold block">4. Quantity Context (0–10)</strong>
            <span className="text-ink-muted mt-1 block">
              Large quantities of fresh food receive a small nudge to encourage batch meal cooking.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
