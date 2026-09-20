import React from 'react';
import Link from 'next/link';
import { PackageOpen, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-md w-full text-center bg-[#181C19] rounded-xs p-8 sm:p-12 border border-[#28302A]">
        {/* Distinctive Illustration / Icon */}
        <div className="relative w-20 h-20 rounded-xs bg-[#141715] text-[#86EFAC] flex items-center justify-center mx-auto mb-6 border border-[#28302A]">
          <PackageOpen className="w-10 h-10 stroke-[1.5]" />
          <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#3B6647] text-[#EFF1EC] text-xs font-mono font-bold flex items-center justify-center shadow-xs">
            ?
          </div>
        </div>

        <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#86EFAC] mb-2">
          Error 404
        </div>

        <h1 className="font-serif text-3xl font-extrabold text-[#EFF1EC] tracking-tight mb-3">
          Looks like this item went missing.
        </h1>

        <p className="text-sm text-[#8E968F] leading-relaxed mb-8">
          We couldn&apos;t find the page you&apos;re looking for. It might have been consumed, moved,
          or never existed in this pantry or shelf.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#3B6647] hover:bg-[#467854] text-[#EFF1EC] text-xs font-mono uppercase tracking-wider rounded-xs border border-[#4E805B]/30 shadow-xs transition-colors min-h-[44px]"
          >
            <Home className="w-4 h-4" />
            <span>Back home</span>
          </Link>
          <Link
            href="/pantry"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1E2420] hover:bg-[#262E28] text-[#EFF1EC] text-xs font-mono uppercase tracking-wider border border-[#28302A] rounded-xs transition-colors min-h-[44px]"
          >
            <span>Open pantry</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
