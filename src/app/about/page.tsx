'use client';

import React from 'react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import {
  ArrowRight,
  Sparkles,
  Package,
  AlertOctagon,
  UtensilsCrossed,
  CheckCircle2,
  Award,
  ShieldCheck,
} from 'lucide-react';

export default function AboutPage() {
  const steps = [
    {
      num: '01',
      title: 'Add what you have',
      description:
        'Log grocery purchases manually or scan your refrigerator shelves. The goal is simply to record what is already in your home before you go shopping for duplicates.',
      icon: Package,
    },
    {
      num: '02',
      title: 'See what needs attention',
      description:
        'Instead of an endless list of dates, Use It First groups items into transparent planning tiers: Use First, Use Soon, and Safe for Now. Highly perishable items and opened containers rise to the top.',
      icon: AlertOctagon,
    },
    {
      num: '03',
      title: 'Find a meal',
      description:
        'Browse recipes that match what you already own. Priority ingredients receive extra relevance, helping you choose meals that rescue food on the verge of spoiling.',
      icon: UtensilsCrossed,
    },
    {
      num: '04',
      title: 'Use it',
      description:
        'Cook the dish and mark ingredients as used with a single click. Pantry inventory and remaining quantities update immediately.',
      icon: CheckCircle2,
    },
    {
      num: '05',
      title: 'Track what you saved',
      description:
        'Watch your personal food-rescue timeline grow. See the real weight and estimated value of food consumed rather than thrown away.',
      icon: Award,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'About' }]} />

      {/* Editorial Headline */}
      <div className="mt-6 mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-earth-100 text-ink text-xs font-semibold mb-4">
          <span>The Philosophy</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-ink tracking-tight leading-tight">
          Food shouldn&apos;t become waste just because we forgot about it.
        </h1>
        <p className="text-base sm:text-xl text-ink-muted mt-5 leading-relaxed font-normal">
          Most food in homes isn&apos;t thrown away because people don&apos;t care. It gets pushed to the
          back of the vegetable crisper, hidden behind new jars, or forgotten once opened.
          Basic apps track dates. Use It First helps you make the next decision:
          <strong className="text-ink font-semibold"> What should I cook with right now?</strong>
        </p>
      </div>

      {/* The 5-Step Loop */}
      <section className="bg-white rounded-3xl p-6 sm:p-10 border border-surface-border shadow-soft mb-12">
        <h2 className="font-serif font-bold text-2xl text-ink mb-8">
          The 5-Step Culinary Loop
        </h2>

        <div className="space-y-8">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.num} className="flex items-start gap-4 sm:gap-6 group">
                <div className="w-12 h-12 rounded-2xl bg-earth-100 text-[#C84B31] font-serif font-bold text-base flex items-center justify-center shrink-0 border border-surface-border">
                  {step.num}
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg sm:text-xl text-ink">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-ink-muted mt-1.5 leading-relaxed max-w-2xl">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Grounded Principles (No fake founders/companies/awards) */}
      <section className="p-6 sm:p-8 rounded-2xl bg-earth-100/70 border border-surface-border mb-12">
        <h2 className="font-serif font-bold text-xl text-ink mb-3">Our Core Principles</h2>
        <ul className="space-y-3 text-xs sm:text-sm text-ink-muted leading-relaxed">
          <li className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C84B31] mt-2 shrink-0"></span>
            <span>
              <strong className="text-ink font-semibold">Planning, not policing: </strong>
              We calculate practical kitchen urgency, not food-safety certifications. We never make pseudo-scientific
              guarantees about food safety.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C84B31] mt-2 shrink-0"></span>
            <span>
              <strong className="text-ink font-semibold">Honest automation: </strong>
              When scanning a photo, we identify recognizable items and ask you to confirm details. We never pretend an image can know an expiration date or opened state.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C84B31] mt-2 shrink-0"></span>
            <span>
              <strong className="text-ink font-semibold">Start with what you have: </strong>
              Cooking shouldn&apos;t require buying ten new exotic ingredients just to make dinner. Recipes should start from what is already in your cupboards.
            </span>
          </li>
        </ul>
      </section>

      {/* CTA Box */}
      <div className="text-center bg-white p-8 rounded-2xl border border-surface-border shadow-soft">
        <h3 className="font-serif font-bold text-2xl text-ink mb-2">
          Ready to make use of your kitchen?
        </h3>
        <p className="text-xs sm:text-sm text-ink-muted mb-6">
          Check your prioritized inventory or add your first ingredients right now.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/priority"
            className="w-full sm:w-auto px-6 py-3 bg-[#C84B31] hover:bg-[#b03e26] text-white font-semibold text-sm rounded-xl transition-colors min-h-[44px] flex items-center justify-center gap-2"
          >
            <span>What Should I Use First?</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/pantry"
            className="w-full sm:w-auto px-5 py-3 bg-earth-100 hover:bg-earth-200 text-ink font-medium text-sm rounded-xl transition-colors min-h-[44px] flex items-center justify-center"
          >
            <span>Open My Pantry</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
