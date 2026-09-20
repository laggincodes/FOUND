'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, AlertOctagon, UtensilsCrossed, ShoppingCart, Award } from 'lucide-react';
import { usePantry } from '@/lib/store';

export const MobileNav: React.FC = () => {
  const pathname = usePathname();
  const { items, groceryItems, getItemAssessment, isHydrated } = usePantry();

  const useFirstCount = isHydrated
    ? items.filter((item) => {
        const t = getItemAssessment(item).tier;
        return t === 'USE_FIRST' || t === 'EXPIRED';
      }).length
    : 0;

  const uncheckedGroceryCount = isHydrated
    ? groceryItems.filter((g) => !g.checked).length
    : 0;

  const itemsList = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/pantry', label: 'Pantry', icon: Package },
    {
      href: '/priority',
      label: 'Use First',
      icon: AlertOctagon,
      badge: useFirstCount > 0 ? useFirstCount : undefined,
    },
    { href: '/recipes', label: 'Recipes', icon: UtensilsCrossed },
    {
      href: '/grocery',
      label: 'Groceries',
      icon: ShoppingCart,
      badge: uncheckedGroceryCount > 0 ? uncheckedGroceryCount : undefined,
    },
    { href: '/impact', label: 'Impact', icon: Award },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#FAF9FC]/95 backdrop-blur-md border-t border-[#E3E2E6] shadow-card px-1 pb-[env(safe-area-inset-bottom)]"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around h-16">
        {itemsList.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] py-1 transition-colors relative ${
                isActive ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-[#1A1C1E]'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 bg-secondary text-white text-[10px] font-extrabold w-4 h-4 rounded-xs flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-[64px] text-center">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
