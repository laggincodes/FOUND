import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onActionClick?: () => void;
  secondaryActionText?: string;
  secondaryActionHref?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  actionHref,
  onActionClick,
  secondaryActionText,
  secondaryActionHref,
}) => {
  return (
    <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-surface-border max-w-md mx-auto my-8 editorial-shadow">
      <div className="w-12 h-12 rounded-2xl bg-earth-100 text-[#C84B31] flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6 stroke-[1.8]" />
      </div>
      <h3 className="font-serif font-bold text-xl text-ink mb-2">{title}</h3>
      <p className="text-sm text-ink-muted leading-relaxed mb-6">{description}</p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {actionHref && actionText && (
          <Link
            href={actionHref}
            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-[#C84B31] hover:bg-[#b03e26] text-white text-sm font-semibold rounded-xl shadow-xs transition-colors min-h-[44px]"
          >
            {actionText}
          </Link>
        )}

        {onActionClick && actionText && !actionHref && (
          <button
            type="button"
            onClick={onActionClick}
            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-[#C84B31] hover:bg-[#b03e26] text-white text-sm font-semibold rounded-xl shadow-xs transition-colors min-h-[44px]"
          >
            {actionText}
          </button>
        )}

        {secondaryActionHref && secondaryActionText && (
          <Link
            href={secondaryActionHref}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 bg-earth-100 hover:bg-earth-200 text-ink text-sm font-medium rounded-xl transition-colors min-h-[44px]"
          >
            {secondaryActionText}
          </Link>
        )}
      </div>
    </div>
  );
};
