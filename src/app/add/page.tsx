'use client';

import React from 'react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Camera, Edit3, ArrowRight, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function AddFoodPage() {
  return (
    <div className="min-h-screen pb-24 overflow-x-hidden bg-[#FBFBFA]">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8">
        <Breadcrumbs items={[{ label: 'Add Food' }]} />

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mt-4 mb-10">
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
          How would you like to add food?
        </h1>
        <p className="text-sm sm:text-base text-ink-muted mt-2 leading-relaxed">
          Record your household groceries so Use It First can tell you what needs cooking attention
          before it gets pushed to the back and forgotten.
        </p>
      </div>

      {/* Two Choice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Option 1: Scan Pantry */}
        <Link
          href="/scan"
          className="bg-white rounded-2xl p-6 sm:p-8 border border-surface-border shadow-soft hover:border-[#C84B31] editorial-shadow-hover transition-all flex flex-col justify-between group text-left"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#FDF2EF] text-[#C84B31] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Camera className="w-6 h-6 stroke-[1.8]" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-earth-100 text-ink-muted text-[11px] font-semibold mb-2">
              <span>Fastest for multiple items</span>
            </div>

            <h2 className="font-serif font-bold text-2xl text-ink group-hover:text-[#C84B31] transition-colors">
              Scan Pantry or Fridge
            </h2>

            <p className="text-sm text-ink-muted mt-2 leading-relaxed">
              Take or upload a photo of your shelves, crisper drawer, or grocery haul. Recognizes visible food items
              which you can then review and confirm.
            </p>

            <ul className="mt-5 space-y-2 text-xs text-ink-muted">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1E7245]" />
                <span>Identifies visible ingredients</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1E7245]" />
                <span>You confirm quantities and dates</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1E7245]" />
                <span>Never guesses safety or hidden dates</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-earth-100 flex items-center justify-between text-sm font-semibold text-[#C84B31]">
            <span>Start photo scan</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Option 2: Add Manually */}
        <Link
          href="/add/manual"
          className="bg-white rounded-2xl p-6 sm:p-8 border border-surface-border shadow-soft hover:border-earth-500 editorial-shadow-hover transition-all flex flex-col justify-between group text-left"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-earth-100 text-earth-800 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Edit3 className="w-6 h-6 stroke-[1.8]" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-earth-100 text-ink-muted text-[11px] font-semibold mb-2">
              <span>Precise entry</span>
            </div>

            <h2 className="font-serif font-bold text-2xl text-ink group-hover:text-earth-900 transition-colors">
              Add Manually
            </h2>

            <p className="text-sm text-ink-muted mt-2 leading-relaxed">
              Enter individual food items with exact weights, purchase dates, best-before dates, and opened package status.
            </p>

            <ul className="mt-5 space-y-2 text-xs text-ink-muted">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1E7245]" />
                <span>Clean, validated single-page form</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1E7245]" />
                <span>Include optional notes and storage location</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1E7245]" />
                <span>Instant priority calculation</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-earth-100 flex items-center justify-between text-sm font-semibold text-ink">
            <span>Fill manual form</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
      </main>
    </div>
  );
}
