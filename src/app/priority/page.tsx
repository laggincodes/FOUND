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
    <div className="min-h-screen pb-24 overflow-x-hidden bg-[#121513] bg-editorial-pattern text-[#EFF1EC]">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8">
        <Breadcrumbs items={[{ label: 'Use First' }]} />

      {/* Main Header */}
      <div className="mt-3 mb-8">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-xs bg-[#2D1915] text-[#FF9E90] border border-[#482520] text-[10px] font-mono uppercase tracking-widest font-medium mb-2.5">
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>Actionable Food Planning</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#EFF1EC] tracking-tight">
          What should I use first?
        </h1>
        <p className="text-sm sm:text-base text-[#8E968F] font-sans mt-2 max-w-2xl leading-relaxed">
          Pantry items sorted by planning urgency. This deterministic view evaluates user-entered dates,
          known ingredient perishability, opened package status, and household quantities to prevent
          food waste before it starts.
        </p>
      </div>

      {/* Mandatory Food Safety Disclaimer Notice */}
      <div className="p-4 sm:p-5 rounded-sm bg-[#181C19] border border-[#28302A] mb-10 flex items-start gap-3.5">
        <ShieldAlert className="w-5 h-5 text-[#E5B567] shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-[#8E968F] font-sans leading-relaxed">
          <span className="font-bold text-[#EFF1EC] block sm:inline">Planning Notice: </span>
          The priority system is a <strong className="text-[#EFF1EC]">household planning tool</strong>, not a food-safety certification system.
          It does not declare food safe or unsafe. Always inspect packaging labels, smell, texture, and follow your own
          culinary judgment.
        </div>
      </div>

      {/* Section 0: EXPIRED (if any) */}
      {expiredItems.length > 0 && (
        <section className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#3E211E] mb-6 gap-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xs bg-[#2D1915] border border-[#482520] flex items-center justify-center text-[#FF9E90]">
                <AlertOctagon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-serif font-bold text-2xl text-[#FF9E90] tracking-tight">EXPIRED</h2>
                  <span className="px-2 py-0.5 rounded-xs bg-[#2D1915] text-[#FF9E90] font-mono text-xs font-bold border border-[#482520]">
                    {expiredItems.length} {expiredItems.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <p className="text-xs text-[#8E968F] font-sans mt-0.5">Best-before date has passed — check smell, texture, and packaging before consuming</p>
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#3E211E] mb-6 gap-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xs bg-[#2D1915] border border-[#482520] flex items-center justify-center text-[#FF9E90]">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-2xl text-[#EFF1EC] tracking-tight">USE FIRST</h2>
                <span className="px-2 py-0.5 rounded-xs bg-[#2D1915] text-[#FF9E90] font-mono text-xs font-bold border border-[#482520]">
                  {useFirstItems.length} {useFirstItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <p className="text-xs text-[#8E968F] font-sans mt-0.5">Highest planning priority — cook with these today or tomorrow</p>
            </div>
          </div>

          {useFirstItems.length > 0 && (
            <Link
              href="/recipes"
              className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#78B48B] hover:underline"
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
          <div className="p-8 rounded-sm bg-[#181C19] border border-[#28302A] text-center">
            <ShieldCheck className="w-8 h-8 text-[#78B48B] mx-auto mb-2" />
            <p className="font-serif font-bold text-lg text-[#EFF1EC]">No items in Use First</p>
            <p className="text-xs text-[#8E968F] font-sans mt-1 max-w-sm mx-auto">
              None of your pantry items currently show high date urgency or open perishable risk.
            </p>
          </div>
        )}
      </section>

      {/* Section 2: USE SOON */}
      <section className="mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#3D311B] mb-6 gap-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xs bg-[#282115] border border-[#453620] flex items-center justify-center text-[#E5B567]">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-2xl text-[#EFF1EC] tracking-tight">USE SOON</h2>
                <span className="px-2 py-0.5 rounded-xs bg-[#282115] text-[#E5B567] font-mono text-xs font-bold border border-[#453620]">
                  {useSoonItems.length} {useSoonItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <p className="text-xs text-[#8E968F] font-sans mt-0.5">Secondary priority — items worth planning meals around this week</p>
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
          <div className="p-8 rounded-sm bg-[#181C19] border border-[#28302A] text-center">
            <p className="font-serif font-bold text-lg text-[#EFF1EC]">No items in Use Soon</p>
            <p className="text-xs text-[#8E968F] font-sans mt-1">
              Your pantry currently has no secondary urgency items.
            </p>
          </div>
        )}
      </section>

      {/* Section 3: SAFE FOR NOW */}
      <section className="mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#233527] mb-6 gap-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xs bg-[#16261B] border border-[#243F2C] flex items-center justify-center text-[#78B48B]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-2xl text-[#EFF1EC] tracking-tight">SAFE FOR NOW</h2>
                <span className="px-2 py-0.5 rounded-xs bg-[#16261B] text-[#78B48B] font-mono text-xs font-bold border border-[#243F2C]">
                  {safeItems.length} {safeItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <p className="text-xs text-[#8E968F] font-sans mt-0.5">Low planning urgency according to the information currently entered</p>
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
          <div className="p-8 rounded-sm bg-[#181C19] border border-[#28302A] text-center">
            <p className="text-xs text-[#8E968F] font-sans">No items in this category.</p>
          </div>
        )}
      </section>

      {/* Priority Engine Explainer Box */}
      <section className="p-6 rounded-sm bg-[#181C19] border border-[#28302A]">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-[#78B48B]" />
          <h3 className="font-serif font-bold text-lg text-[#EFF1EC] tracking-tight">How Priority Is Calculated</h3>
        </div>
        <p className="text-xs text-[#8E968F] font-sans leading-relaxed mb-4">
          Priority is 100% deterministic and transparent. Scores (0–100) are computed from four practical kitchen factors:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 bg-[#141715] rounded-xs border border-[#28302A]">
            <strong className="text-[#EFF1EC] font-mono uppercase tracking-wider block mb-1">1. Date Proximity (0–60)</strong>
            <span className="text-[#8E968F] font-sans mt-1 block">
              User-entered best-before dates. Items expiring within 1–2 days receive high urgency. Never invented.
            </span>
          </div>
          <div className="p-3.5 bg-[#141715] rounded-xs border border-[#28302A]">
            <strong className="text-[#EFF1EC] font-mono uppercase tracking-wider block mb-1">2. Perishability (0–20)</strong>
            <span className="text-[#8E968F] font-sans mt-1 block">
              Leafy greens, dairy, and soft produce degrade rapidly compared to dry grains or spices.
            </span>
          </div>
          <div className="p-3.5 bg-[#141715] rounded-xs border border-[#28302A]">
            <strong className="text-[#EFF1EC] font-mono uppercase tracking-wider block mb-1">3. Opened Status (0–10)</strong>
            <span className="text-[#8E968F] font-sans mt-1 block">
              An opened carton of milk or bag of spinach oxidizes much faster than sealed packaging.
            </span>
          </div>
          <div className="p-3.5 bg-[#141715] rounded-xs border border-[#28302A]">
            <strong className="text-[#EFF1EC] font-mono uppercase tracking-wider block mb-1">4. Quantity Context (0–10)</strong>
            <span className="text-[#8E968F] font-sans mt-1 block">
              Large quantities of fresh food receive a small nudge to encourage batch meal cooking.
            </span>
          </div>
        </div>
      </section>
      </main>
    </div>
  );
}
