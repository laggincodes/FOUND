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
      <div className="max-w-md w-full text-center bg-[#181C19] rounded-xs p-8 border border-[#28302A]">
        <div className="w-12 h-12 rounded-xs bg-[#2D1915] text-[#F87171] border border-[#4D241D] flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6 stroke-[2]" />
        </div>

        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#F87171] block mb-1">
          Service Notice
        </span>

        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#EFF1EC] tracking-tight mb-2">
          Something interrupted the system.
        </h1>

        <p className="text-xs sm:text-sm text-[#8E968F] leading-relaxed mb-6">
          We encountered a temporary application error while processing your request. Your inventory
          and data remain safe.
        </p>

        {/* Retry & Recovery Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#3B6647] hover:bg-[#467854] text-[#EFF1EC] text-xs font-mono uppercase tracking-wider rounded-xs border border-[#4E805B]/30 shadow-subtle transition-colors min-h-[40px] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#1E2420] hover:bg-[#262E28] text-[#EFF1EC] text-xs font-mono uppercase tracking-wider rounded-xs border border-[#28302A] transition-colors min-h-[40px]"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
