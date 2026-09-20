'use client';

import React from 'react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Camera, Edit3, ArrowRight, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function AddFoodPage() {
  return (
    <div className="min-h-screen pb-24 overflow-x-hidden bg-[#121513] bg-editorial-pattern text-[#EFF1EC]">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8">
        <Breadcrumbs items={[{ label: 'Add Food' }]} />

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mt-4 mb-10">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-[#1A261E] text-[#78B48B] border border-[#273B2E] text-[10px] font-mono uppercase tracking-widest font-medium mb-3">
          <span>Inventory Ingestion</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#EFF1EC] tracking-tight">
          How would you like to add food?
        </h1>
        <p className="text-sm sm:text-base text-[#8E968F] font-sans mt-2 leading-relaxed">
          Record your household groceries so Use It First can tell you what needs cooking attention
          before it gets pushed to the back and forgotten.
        </p>
      </div>

      {/* Two Choice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Option 1: Scan Pantry */}
        <Link
          href="/scan"
          className="bg-[#181C19] rounded-sm p-6 sm:p-8 border border-[#28302A] hover:border-[#38463B] transition-colors flex flex-col justify-between group text-left"
        >
          <div>
            <div className="w-12 h-12 rounded-xs bg-[#141715] text-[#78B48B] border border-[#28302A] flex items-center justify-center mb-5">
              <Camera className="w-6 h-6 stroke-[1.8]" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-[#1C211D] text-[#8E968F] border border-[#28302A] text-[10px] font-mono uppercase tracking-wider mb-3">
              <span>Fastest for multiple items</span>
            </div>

            <h2 className="font-serif font-bold text-2xl text-[#EFF1EC] group-hover:text-[#93D4A8] transition-colors tracking-tight">
              Scan Pantry or Fridge
            </h2>

            <p className="text-sm text-[#8E968F] font-sans mt-2 leading-relaxed">
              Take or upload a photo of your shelves, crisper drawer, or grocery haul. Recognizes visible food items
              which you can then review and confirm.
            </p>

            <ul className="mt-5 space-y-2 text-xs text-[#8E968F] font-sans">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#78B48B]" />
                <span>Identifies visible ingredients</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#78B48B]" />
                <span>You confirm quantities and dates</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#78B48B]" />
                <span>Never guesses safety or hidden dates</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-[#222824] flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#78B48B]">
            <span>Start photo scan</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Option 2: Add Manually */}
        <Link
          href="/add/manual"
          className="bg-[#181C19] rounded-sm p-6 sm:p-8 border border-[#28302A] hover:border-[#38463B] transition-colors flex flex-col justify-between group text-left"
        >
          <div>
            <div className="w-12 h-12 rounded-xs bg-[#141715] text-[#78B48B] border border-[#28302A] flex items-center justify-center mb-5">
              <Edit3 className="w-6 h-6 stroke-[1.8]" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-[#1C211D] text-[#8E968F] border border-[#28302A] text-[10px] font-mono uppercase tracking-wider mb-3">
              <span>Precise entry</span>
            </div>

            <h2 className="font-serif font-bold text-2xl text-[#EFF1EC] group-hover:text-[#93D4A8] transition-colors tracking-tight">
              Add Manually
            </h2>

            <p className="text-sm text-[#8E968F] font-sans mt-2 leading-relaxed">
              Enter individual food items with exact weights, purchase dates, best-before dates, and opened package status.
            </p>

            <ul className="mt-5 space-y-2 text-xs text-[#8E968F] font-sans">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#78B48B]" />
                <span>Clean, validated single-page form</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#78B48B]" />
                <span>Include optional notes and storage location</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#78B48B]" />
                <span>Instant priority calculation</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-[#222824] flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#EFF1EC]">
            <span>Fill manual form</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
      </main>
    </div>
  );
}
