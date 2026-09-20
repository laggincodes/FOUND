'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePantry } from '@/lib/store';
import { Plus, Settings, ChevronDown, Sparkles, BookOpen } from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const {
    items,
    durableItems,
    groceryItems,
    isHydrated,
    activeUser,
    availableUsers,
    switchUser,
  } = usePantry();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Unchecked grocery count
  const uncheckedGroceryCount = isHydrated
    ? groceryItems.filter((g) => !g.checked).length
    : 0;

  // Primary 5 Navigation links ONLY
  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/pantry', label: 'Pantry' },
    { href: '/inventory', label: 'Inventory' },
    {
      href: '/grocery',
      label: 'Grocery',
      badge: uncheckedGroceryCount > 0 ? uncheckedGroceryCount : undefined,
    },
    { href: '/impact', label: 'Impact' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FBFBFA]/95 backdrop-blur-md border-b border-[#E2E5E1] transition-all">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[68px]">
          {/* LEFT: FOUND Wordmark & Tagline */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="group flex flex-col justify-center focus-visible:ring-2 focus-visible:ring-primary rounded-xs"
              aria-label="FOUND Home"
            >
              <span className="font-serif font-bold text-xl sm:text-2xl tracking-tight text-[#191C1B] group-hover:text-primary transition-colors leading-none">
                FOUND
              </span>
              <span className="text-[9px] font-bold tracking-widest text-[#727972] uppercase block mt-1 leading-none">
                Find what you have
              </span>
            </Link>
          </div>

          {/* CENTER: Primary Navigation Only (5 items) */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {navLinks.map((link) => {
              const isActive =
                link.href === '/'
                  ? pathname === '/'
                  : pathname === link.href || pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#E3F2E9] text-primary font-bold shadow-2xs'
                      : 'text-[#5F6762] hover:text-[#191C1B] hover:bg-[#F2F4F1]'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge !== undefined && link.badge > 0 && (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-primary text-white">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* RIGHT: Profile, More Menu & Add Item */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Secondary Pages dropdown for desktop (Recipes, Priority, About) */}
            <div className="relative hidden lg:block">
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-xs text-[#5F6762] hover:text-[#191C1B] hover:bg-[#F2F4F1] px-2.5 py-1.5 rounded-full transition-colors flex items-center gap-1 cursor-pointer font-medium"
                aria-expanded={isMenuOpen}
              >
                <span>More</span>
                <ChevronDown className="w-3 h-3 text-[#8A928D]" />
              </button>

              {isMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl border border-[#E2E5E1] shadow-card py-1.5 z-20 text-xs">
                    <Link
                      href="/priority"
                      onClick={() => setIsMenuOpen(false)}
                      className="px-3.5 py-2 hover:bg-[#FAFBF9] text-[#191C1B] flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-secondary" />
                      <span>Use First Priority</span>
                    </Link>
                    <Link
                      href="/recipes"
                      onClick={() => setIsMenuOpen(false)}
                      className="px-3.5 py-2 hover:bg-[#FAFBF9] text-[#191C1B] flex items-center gap-2"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-primary" />
                      <span>What Can I Eat?</span>
                    </Link>
                    <Link
                      href="/about"
                      onClick={() => setIsMenuOpen(false)}
                      className="px-3.5 py-2 hover:bg-[#FAFBF9] text-[#191C1B] flex items-center gap-2"
                    >
                      <span>About FOUND</span>
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* Profile / Household Selector */}
            <div className="flex items-center gap-1 bg-[#F2F4F1] border border-[#E2E5E1] rounded-full px-2 py-1">
              <select
                value={activeUser.id}
                onChange={(e) => switchUser(e.target.value)}
                className="text-xs font-semibold bg-transparent text-[#191C1B] focus:outline-none cursor-pointer pr-1 max-w-[90px] sm:max-w-[130px] truncate"
                aria-label="Active profile"
              >
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName || u.householdName}
                  </option>
                ))}
              </select>

              <Link
                href="/profile"
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                  pathname === '/profile'
                    ? 'bg-primary text-white'
                    : 'text-[#5F6762] hover:text-[#191C1B]'
                }`}
                title="Profile & Settings"
                aria-label="Settings"
              >
                <Settings className="w-3 h-3" />
              </Link>
            </div>

            {/* Primary Action Button: Add Item */}
            <Link
              href="/add"
              className="inline-flex items-center gap-1 bg-primary hover:bg-primary-hover text-white font-semibold px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full shadow-2xs hover:shadow-xs transition-all text-xs touch-manipulation shrink-0"
              aria-label="Add item"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Add Item</span>
              <span className="sm:hidden">Add</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
