'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log service error for diagnostic monitoring
    console.error('Application Error Boundary caught error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-md w-full text-center bg-white rounded-md p-8 border border-[#E3E2E6] shadow-subtle">
        <div className="w-12 h-12 rounded-sm bg-[#FFDBD0] text-secondary flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6 stroke-[2]" />
        </div>

        <span className="text-[11px] font-bold uppercase tracking-wider text-secondary block mb-1">
          Service Notice
        </span>

        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1C1E] tracking-tight mb-2">
          Something interrupted your kitchen larder.
        </h1>

        <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed mb-6">
          We encountered a temporary application error while processing your request. Your pantry
          inventory and data remain safe.
        </p>

        {/* Retry & Recovery Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-semibold rounded-xs shadow-subtle transition-colors min-h-[40px] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-surface-container hover:bg-surface-container-high text-[#1A1C1E] text-xs sm:text-sm font-medium rounded-xs transition-colors min-h-[40px]"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
