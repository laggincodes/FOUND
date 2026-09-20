import React from 'react';
import { PriorityTier } from '@/types';
import { AlertOctagon, Clock, ShieldCheck } from 'lucide-react';

interface PriorityBadgeProps {
  tier: PriorityTier;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  tier,
  size = 'md',
  showIcon = true,
}) => {
  const configs = {
    EXPIRED: {
      label: 'EXPIRED',
      icon: AlertOctagon,
      classes: 'bg-[#FFDAD6] text-[#BA1A1A] border-[#FFB4AB] font-bold',
      ariaDescription: 'Best before date has passed. Check smell and texture before consuming.',
    },
    USE_FIRST: {
      label: 'USE FIRST',
      icon: AlertOctagon,
      classes: 'bg-[#FFDBD0] text-[#97472E] border-[#F5C2B4] font-bold',
      ariaDescription: 'Highest planning priority. Needs immediate attention.',
    },
    USE_SOON: {
      label: 'USE SOON',
      icon: Clock,
      classes: 'bg-[#FFDEAE] text-[#664500] border-[#FAD090] font-semibold',
      ariaDescription: 'Secondary planning priority. Plan meals around this soon.',
    },
    SAFE_FOR_NOW: {
      label: 'SAFE FOR NOW',
      icon: ShieldCheck,
      classes: 'bg-[#C7ECCE] text-[#32533C] border-[#A8DEB4] font-medium',
      ariaDescription: 'Low planning priority according to entered data.',
    },
  };

  const current = configs[tier] || configs.SAFE_FOR_NOW;
  const Icon = current.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1 border rounded-xs',
    md: 'text-xs px-2.5 py-1 gap-1.5 border rounded-xs',
    lg: 'text-sm px-3.5 py-1.5 gap-2 border rounded-sm',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  return (
    <span
      className={`inline-flex items-center uppercase tracking-wider transition-all shadow-subtle ${current.classes} ${sizeClasses}`}
      title={current.ariaDescription}
      role="status"
      aria-label={`${current.label}: ${current.ariaDescription}`}
    >
      {showIcon && <Icon className={`${iconSizes} shrink-0 stroke-[2.2]`} aria-hidden="true" />}
      <span>{current.label}</span>
    </span>
  );
};
