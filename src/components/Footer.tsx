import React from 'react';
import Link from 'next/link';
import { ShieldAlert, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#FAF9FC] border-t border-[#E3E2E6] mt-16 pt-12 pb-24 md:pb-12 text-on-surface-variant">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-sm bg-primary text-white flex items-center justify-center font-bold text-xs">
                UF
              </div>
              <span className="font-serif font-bold text-lg text-[#1A1C1E]">USE IT FIRST</span>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-sm leading-relaxed">
              See what you have. Use what matters first. Household food intelligence to make the most
              of the food already in your home.
            </p>
          </div>

          {/* Quick Nav */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#1A1C1E] mb-3">Kitchen Larder</h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/pantry" className="hover:text-primary transition-colors">
                  My Pantry
                </Link>
              </li>
              <li>
                <Link href="/priority" className="hover:text-primary transition-colors">
                  Use First
                </Link>
              </li>
              <li>
                <Link href="/recipes" className="hover:text-primary transition-colors">
                  What Can I Eat?
                </Link>
              </li>
              <li>
                <Link href="/impact" className="hover:text-primary transition-colors">
                  My Impact
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Central Loop */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#1A1C1E] mb-3">Core Loop</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
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
        <div className="p-4 rounded-xs bg-white border border-[#E3E2E6] text-xs text-on-surface-variant mb-8 flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-tertiary shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-[#1A1C1E] font-semibold">Household Planning Disclaimer: </strong>
            Use It First provides heuristic kitchen planning suggestions based on user-entered dates and
            typical ingredient perishability. It is a planning tool, not a food-safety certification system.
            Always follow packaging labels, inspect appearance and aroma, and use your own judgment.
          </div>
        </div>

        <div className="pt-6 border-t border-[#E3E2E6] flex flex-col sm:flex-row items-center justify-between text-xs text-outline gap-4">
          <p>© {new Date().getFullYear()} USE IT FIRST. Kitchen Larder Food Intelligence.</p>
          <p className="flex items-center gap-1 text-on-surface-variant">
            See what you have. Use what matters first.
          </p>
        </div>
      </div>
    </footer>
  );
};
