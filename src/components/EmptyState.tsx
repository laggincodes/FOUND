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
  onSecondaryActionClick?: () => void;
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
  onSecondaryActionClick,
}) => {
  const handleSecondaryClick = onSecondaryActionClick || (actionHref ? onActionClick : undefined);

  return (
    <div className="bg-[#181C19] rounded-sm p-8 sm:p-12 text-center border border-[#28302A] max-w-md mx-auto my-8">
      <div className="w-12 h-12 rounded-xs bg-[#1E2420] text-[#8E968F] border border-[#28302A] flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6 stroke-[1.8]" />
      </div>
      <h3 className="font-serif font-bold text-xl text-[#EFF1EC] mb-2">{title}</h3>
      <p className="text-sm text-[#8E968F] font-sans leading-relaxed mb-6">{description}</p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {actionHref && actionText && (
          <Link
            href={actionHref}
            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-[#3B6647] hover:bg-[#467854] text-[#EFF1EC] text-xs uppercase tracking-wider font-mono font-medium rounded-xs border border-[#4E805B]/30 transition-colors min-h-[40px]"
          >
            {actionText}
          </Link>
        )}

        {onActionClick && actionText && !actionHref && (
          <button
            type="button"
            onClick={onActionClick}
            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-[#3B6647] hover:bg-[#467854] text-[#EFF1EC] text-xs uppercase tracking-wider font-mono font-medium rounded-xs border border-[#4E805B]/30 transition-colors min-h-[40px] cursor-pointer"
          >
            {actionText}
          </button>
        )}

        {secondaryActionHref && secondaryActionText && (
          <Link
            href={secondaryActionHref}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 bg-[#1E2420] hover:bg-[#262E28] text-[#EFF1EC] text-xs font-mono font-medium rounded-xs border border-[#28302A] transition-colors min-h-[40px]"
          >
            {secondaryActionText}
          </Link>
        )}

        {!secondaryActionHref && secondaryActionText && handleSecondaryClick && (
          <button
            type="button"
            onClick={handleSecondaryClick}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 bg-[#1E2420] hover:bg-[#262E28] text-[#EFF1EC] text-xs font-mono font-medium rounded-xs border border-[#28302A] transition-colors min-h-[40px] cursor-pointer"
          >
            {secondaryActionText}
          </button>
        )}
      </div>
    </div>
  );
};
