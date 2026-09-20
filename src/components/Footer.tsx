import React from 'react';
import Link from 'next/link';
import { ShieldAlert, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#141815] border-t border-[#262E28] mt-16 pt-12 pb-24 md:pb-12 text-[#8E968F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xs bg-[#243B2B] text-[#7DB88F] border border-[#32523C] flex items-center justify-center font-bold text-xs font-mono">
                FD
              </div>
              <span className="font-serif font-bold text-lg text-[#EFF1EC]">FOUND</span>
            </div>
            <p className="text-xs sm:text-sm text-[#8E968F] max-w-sm leading-relaxed">
              Before you buy it. Find what you already have. Personal and household inventory to avoid duplicate purchases and food waste.
            </p>
          </div>

          {/* Quick Nav */}
          <div>
            <h4 className="font-mono font-bold text-xs uppercase tracking-wider text-[#EFF1EC] mb-3">Kitchen Larder</h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/pantry" className="text-[#8E968F] hover:text-[#EFF1EC] transition-colors">
                  My Pantry
                </Link>
              </li>
              <li>
                <Link href="/priority" className="text-[#8E968F] hover:text-[#EFF1EC] transition-colors">
                  Use First
                </Link>
              </li>
              <li>
                <Link href="/recipes" className="text-[#8E968F] hover:text-[#EFF1EC] transition-colors">
                  What Can I Cook?
                </Link>
              </li>
              <li>
                <Link href="/impact" className="text-[#8E968F] hover:text-[#EFF1EC] transition-colors">
                  My Impact
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-[#8E968F] hover:text-[#EFF1EC] transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Central Loop */}
          <div>
            <h4 className="font-mono font-bold text-xs uppercase tracking-wider text-[#EFF1EC] mb-3">Core Loop</h4>
            <p className="text-xs text-[#8E968F] leading-relaxed font-mono">
              Add Food <br />
              → Track Pantry <br />
              → Prioritize <br />
              → Find What To Cook <br />
              → Use Food <br />
              → Track Impact
            </p>
          </div>
        </div>

        {/* Disclaimer Box */}
        <div className="p-4 rounded-sm bg-[#181C19] border border-[#28302A] text-xs text-[#8E968F] mb-8 flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-tertiary shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-[#EFF1EC] font-semibold">Household Planning Disclaimer: </strong>
            FOUND provides heuristic kitchen planning suggestions based on user-entered dates and
            typical ingredient perishability. It is a planning tool, not a food-safety certification system.
            Always follow packaging labels, inspect appearance and aroma, and use your own judgment.
          </div>
        </div>

        <div className="pt-6 border-t border-[#262E28] flex flex-col sm:flex-row items-center justify-between text-xs text-[#727C74] gap-4">
          <p>© {new Date().getFullYear()} FOUND. Household Memory &amp; Resource Intelligence.</p>
          <p className="flex items-center gap-1 text-[#8E968F] font-mono text-[11px]">
            See what you have. Use what matters first.
          </p>
        </div>
      </div>
    </footer>
  );
};
