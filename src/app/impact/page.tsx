'use client';

import React from 'react';
import Link from 'next/link';
import { usePantry } from '@/lib/store';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { EmptyState } from '@/components/EmptyState';
import {
  Award,
  TrendingUp,
  Scale,
  IndianRupee,
  UtensilsCrossed,
  Calendar,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';

export default function ImpactPage() {
  const { usageEvents, impactMetrics, resetToDemoData, isHydrated } = usePantry();

  // Format date readable
  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'My Impact' }]} />

      {/* Header */}
      <div className="mt-3 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF5EE] text-[#1E7245] border border-[#B7E0C6] text-xs font-semibold mb-2.5">
          <Award className="w-3.5 h-3.5" />
          <span>Personal Waste Prevention</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink tracking-tight">
          My Impact
        </h1>
        <p className="text-sm sm:text-base text-ink-muted mt-2 max-w-2xl leading-relaxed">
          See the tangible results of prioritizing your kitchen inventory. Every ingredient used on time
          is food saved from household waste.
        </p>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {/* Metric 1: Items Used On Time */}
        <div className="bg-white rounded-2xl p-6 border border-surface-border shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-muted mb-4">
            <span className="text-xs font-bold uppercase tracking-wider">Used on Time</span>
            <CheckCircle2 className="w-5 h-5 text-[#C84B31]" />
          </div>
          <div>
            <div className="font-serif text-4xl font-extrabold text-ink">
              {isHydrated ? impactMetrics.itemsUsedBeforePriority : '—'}
            </div>
            <p className="text-xs text-ink-muted mt-1">food items cooked before priority date</p>
          </div>
        </div>

        {/* Metric 2: Estimated Weight Rescued */}
        <div className="bg-white rounded-2xl p-6 border border-surface-border shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-muted mb-4">
            <span className="text-xs font-bold uppercase tracking-wider">Estimated Rescued</span>
            <Scale className="w-5 h-5 text-[#1E7245]" />
          </div>
          <div>
            <div className="font-serif text-4xl font-extrabold text-[#1E7245]">
              {isHydrated ? `${impactMetrics.estimatedFoodRescuedKg} kg` : '—'}
            </div>
            <p className="text-xs text-ink-muted mt-1">
              estimated household food prevented from waste
            </p>
          </div>
        </div>

        {/* Metric 3: Estimated Food Value Saved */}
        <div className="bg-white rounded-2xl p-6 border border-surface-border shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-muted mb-4">
            <span className="text-xs font-bold uppercase tracking-wider">Estimated Value</span>
            <IndianRupee className="w-5 h-5 text-[#B45309]" />
          </div>
          <div>
            <div className="font-serif text-4xl font-extrabold text-[#B45309]">
              {isHydrated ? `₹${impactMetrics.estimatedFoodValueINR}` : '—'}
            </div>
            <p className="text-xs text-ink-muted mt-1">
              estimated grocery money saved from spoil
            </p>
          </div>
        </div>

        {/* Metric 4: Meals Made */}
        <div className="bg-white rounded-2xl p-6 border border-surface-border shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-muted mb-4">
            <span className="text-xs font-bold uppercase tracking-wider">Meals Prepared</span>
            <UtensilsCrossed className="w-5 h-5 text-earth-700" />
          </div>
          <div>
            <div className="font-serif text-4xl font-extrabold text-ink">
              {isHydrated ? impactMetrics.mealsMadeFromPantry : '—'}
            </div>
            <p className="text-xs text-ink-muted mt-1">meals made from existing pantry contents</p>
          </div>
        </div>
      </div>

      {/* Activity Timeline Section */}
      <section className="bg-white rounded-2xl p-6 sm:p-8 border border-surface-border shadow-soft mb-8">
        <div className="flex items-center justify-between pb-4 border-b border-surface-border mb-6">
          <div>
            <h2 className="font-serif font-bold text-2xl text-ink">Usage Activity Timeline</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Live record of ingredients marked as used from recipes and kitchen cooking.
            </p>
          </div>

          <Link
            href="/recipes"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C84B31] hover:underline"
          >
            <span>Cook another meal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {usageEvents.length > 0 ? (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-earth-200">
            {usageEvents.map((event) => (
              <div key={event.id} className="relative group">
                {/* Timeline node */}
                <div
                  className={`absolute -left-6 top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                    event.wasPriorityItem ? 'bg-[#C84B31]' : 'bg-[#1E7245]'
                  }`}
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <span className="text-xs font-bold text-ink-muted block sm:inline mr-2">
                      {formatDate(event.usedAt)}:
                    </span>
                    <strong className="text-ink font-semibold">{event.foodName}</strong>
                    <span className="text-xs text-ink-muted ml-1.5">
                      ({event.quantityUsed} {event.unit} used)
                    </span>
                    {event.recipeName && (
                      <span className="text-xs text-earth-700 ml-2 block sm:inline">
                        — cooked in <em>{event.recipeName}</em>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-ink-muted">
                    <span className="text-[#1E7245] font-medium">
                      ~{(event.estimatedWeightGrams / 1000).toFixed(2)} kg rescued
                    </span>
                    <span>•</span>
                    <span className="text-[#B45309] font-medium">~₹{event.estimatedValueINR}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Award}
            title="No activity recorded yet"
            description="When you mark ingredients as used while cooking recipes or updating your pantry, your impact milestones will appear here."
            actionText="Browse Recipes to Cook"
            actionHref="/recipes"
            secondaryActionText="Reset Demo Data"
            onActionClick={resetToDemoData}
          />
        )}
      </section>

      {/* Estimation Transparency Box */}
      <div className="p-4 rounded-xl bg-earth-50 border border-surface-border text-xs text-ink-muted flex items-start gap-2.5">
        <Info className="w-4 h-4 text-ink-faint shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-ink font-semibold">Estimation Label: </strong>
          Food weight and monetary savings figures are labeled as estimated. They are calculated from typical ingredient
          densities and prevailing Indian grocery retail values (e.g. ₹90 for 200g paneer, ₹35 for milk, ₹30 for spinach).
          Use It First avoids manufacturing false precision or artificial carbon statistics.
        </p>
      </div>
    </div>
  );
}
