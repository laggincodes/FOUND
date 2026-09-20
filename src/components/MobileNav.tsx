'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, Box, ShoppingCart, Award } from 'lucide-react';
import { usePantry } from '@/lib/store';

export const MobileNav: React.FC = () => {
  const pathname = usePathname();
  const { items, groceryItems, getItemAssessment, isHydrated, durableItems } = usePantry();

  // Urgent attention count for pantry
  const attentionCount = isHydrated
    ? items.filter((item) => {
        const t = getItemAssessment(item).tier;
        return t === 'USE_FIRST' || t === 'EXPIRED';
      }).length
    : 0;

  // Unchecked grocery count
  const uncheckedGroceryCount = isHydrated
    ? groceryItems.filter((g) => !g.checked).length
    : 0;

  // Clean 5-item mobile bottom navigation strictly required:
  // HOME | PANTRY | INVENTORY | GROCERY | IMPACT
  const navItems = [
    {
      href: '/',
      label: 'Home',
      icon: Home,
    },
    {
      href: '/pantry',
      label: 'Pantry',
      icon: Package,
      badge: attentionCount > 0 ? attentionCount : undefined,
      badgeColor: 'bg-[#E57A22]', // warm urgency pill
    },
    {
      href: '/inventory',
      label: 'Inventory',
      icon: Box,
      count: isHydrated && durableItems.length > 0 ? durableItems.length : undefined,
    },
    {
      href: '/grocery',
      label: 'Grocery',
      icon: ShoppingCart,
      badge: uncheckedGroceryCount > 0 ? uncheckedGroceryCount : undefined,
      badgeColor: 'bg-primary',
    },
    {
      href: '/impact',
      label: 'Impact',
      icon: Award,
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#FBFBFA]/95 backdrop-blur-lg border-t border-[#E2E5E1] px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(0,0,0,0.03)]"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] py-1.5 transition-all relative ${
                isActive
                  ? 'text-primary font-bold'
                  : 'text-[#5F6762] hover:text-[#191C1B]'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative flex items-center justify-center">
                <div
                  className={`w-9 h-6 rounded-full flex items-center justify-center transition-colors ${
                    isActive ? 'bg-[#E3F2E9] text-primary' : 'bg-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.75]'}`} />
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`absolute -top-1 -right-1 text-white text-[9px] font-extrabold min-w-[15px] h-[15px] px-1 rounded-full flex items-center justify-center shadow-xs ${
                      item.badgeColor || 'bg-primary'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-0.5 tracking-tight truncate max-w-[56px] text-center ${
                  isActive ? 'font-bold text-primary' : 'font-medium text-[#5F6762]'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
