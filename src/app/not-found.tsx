import React from 'react';
import Link from 'next/link';
import { PackageOpen, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-md w-full text-center bg-white rounded-3xl p-8 sm:p-12 border border-surface-border shadow-soft">
        {/* Distinctive Pantry Illustration / Icon */}
        <div className="relative w-20 h-20 rounded-3xl bg-earth-100 text-[#C84B31] flex items-center justify-center mx-auto mb-6 border border-surface-border">
          <PackageOpen className="w-10 h-10 stroke-[1.5]" />
          <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#C84B31] text-white text-xs font-bold flex items-center justify-center shadow-xs">
            ?
          </div>
        </div>

        <div className="text-xs font-bold uppercase tracking-wider text-[#C84B31] mb-2">
          Error 404
        </div>

        <h1 className="font-serif text-3xl font-extrabold text-ink tracking-tight mb-3">
          Looks like this ingredient went missing.
        </h1>

        <p className="text-sm text-ink-muted leading-relaxed mb-8">
          We couldn&apos;t find the page you&apos;re looking for. It might have been consumed, moved,
          or never existed in this pantry.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#C84B31] hover:bg-[#b03e26] text-white text-sm font-semibold rounded-xl shadow-xs transition-colors min-h-[44px]"
          >
            <Home className="w-4 h-4" />
            <span>Back home</span>
          </Link>
          <Link
            href="/pantry"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-earth-100 hover:bg-earth-200 text-ink text-sm font-medium rounded-xl transition-colors min-h-[44px]"
          >
            <span>Open pantry</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
