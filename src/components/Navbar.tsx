'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePantry } from '@/lib/store';
import { Plus, Settings } from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const {
    items,
    groceryItems,
    getItemAssessment,
    isHydrated,
    activeUser,
    availableUsers,
    switchUser,
  } = usePantry();

  // Count active Use First items for attention indicator
  const useFirstCount = isHydrated
    ? items.filter((item) => {
        const t = getItemAssessment(item).tier;
        return t === 'USE_FIRST' || t === 'EXPIRED';
      }).length
    : 0;

  // Count unchecked grocery items
  const uncheckedGroceryCount = isHydrated
    ? groceryItems.filter((g) => !g.checked).length
    : 0;

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/pantry', label: 'My Pantry', count: isHydrated ? items.length : undefined },
    {
      href: '/priority',
      label: 'Use First',
      badge: useFirstCount > 0 ? useFirstCount : undefined,
    },
    { href: '/recipes', label: 'What Can I Eat?' },
    {
      href: '/grocery',
      label: 'Grocery List',
      count: uncheckedGroceryCount > 0 ? uncheckedGroceryCount : undefined,
    },
    { href: '/impact', label: 'My Impact' },
    { href: '/about', label: 'About' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9FC]/95 backdrop-blur-md border-b border-[#E3E2E6] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Brand & Logo mark (Pantry jar / hourglass silhouette) */}
          <div className="flex items-center gap-6 lg:gap-8">
            <Link
              href="/"
              className="group flex items-center gap-2.5 rounded-sm p-1 focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="USE IT FIRST Home"
            >
              {/* Subtle pantry jar / hourglass mark */}
              <div className="w-8 h-8 rounded-sm bg-primary text-white flex items-center justify-center shadow-subtle group-hover:bg-primary-hover transition-colors">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white"
                >
                  <path d="M7 3h10v2a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V3z" />
                  <path d="M5 7h14a1 1 0 0 1 1 1v11a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V8a1 1 0 0 1 1-1z" />
                  <line x1="12" y1="12" x2="12" y2="16" />
                  <circle cx="12" cy="14" r="1.5" fill="currentColor" />
                </svg>
              </div>

              <div>
                <span className="font-serif font-bold text-lg tracking-tight text-[#1A1C1E] block leading-none">
                  USE IT FIRST
                </span>
                <span className="text-[10px] font-medium tracking-wider text-on-surface-variant uppercase block mt-1">
                  Kitchen Larder
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links with Stitch bottom border active indicator */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2 h-16 sm:h-18">
              {navLinks.map((link) => {
                const isActive =
                  pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-3 py-2 text-xs lg:text-sm font-medium transition-colors flex items-center gap-1.5 h-full border-b-2 ${
                      isActive
                        ? 'text-primary font-bold border-primary'
                        : 'text-on-surface-variant hover:text-[#1A1C1E] border-transparent hover:border-[#C2C8C0]'
                    }`}
                  >
                    <span>{link.label}</span>
                    {link.count !== undefined && (
                      <span className="text-[11px] px-1.5 py-0.2 rounded-xs bg-surface-container text-on-surface-variant font-semibold">
                        {link.count}
                      </span>
                    )}
                    {link.badge !== undefined && link.badge > 0 && (
                      <span
                        className="text-[11px] font-bold px-1.5 py-0.2 rounded-xs bg-secondary text-white animate-pulse"
                        title={`${link.badge} item(s) need your immediate attention`}
                      >
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Household Switcher & Primary Action Button */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Household Switcher & Settings */}
            <div className="flex items-center gap-1">
              <select
                value={activeUser.id}
                onChange={(e) => switchUser(e.target.value)}
                className="text-[11px] sm:text-xs font-semibold bg-surface-container-low border border-[#C2C8C0] hover:border-primary text-[#1A1C1E] rounded-xs px-2 sm:px-2.5 py-1.5 focus:border-primary focus:outline-none cursor-pointer shadow-subtle min-h-[38px] transition-colors"
                aria-label="Select active household"
                title="Switch household profile"
              >
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.householdName || u.firstName}
                  </option>
                ))}
              </select>

              <Link
                href="/profile"
                className={`p-2 rounded-xs border transition-colors ${
                  pathname === '/profile'
                    ? 'bg-olive-100 border-olive-400 text-olive-800'
                    : 'bg-surface-container-low border-[#C2C8C0] text-outline hover:text-ink hover:border-primary'
                }`}
                title="Household Settings & Preferences"
                aria-label="Household Settings"
              >
                <Settings className="w-4 h-4" />
              </Link>
            </div>

            <Link
              href="/add"
              className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white font-medium px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-sm shadow-subtle hover:shadow-card transition-all text-xs sm:text-sm min-h-[40px] touch-manipulation"
              aria-label="Add food to pantry"
            >
              <Plus className="w-4 h-4" />
              <span className="font-semibold">+ Add Food</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
