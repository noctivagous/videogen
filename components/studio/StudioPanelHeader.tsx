'use client';

import { ChevronLeft, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export interface StudioPanelHeaderProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  onBack?: () => void;
  backTitle?: string;
  titleTrailing?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function StudioPanelHeader({
  title,
  description,
  icon: Icon,
  onBack,
  backTitle = 'Back',
  titleTrailing,
  actions,
  className = '',
}: StudioPanelHeaderProps) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 border-b border-surface-700 flex-shrink-0 bg-surface-900 ${className}`.trim()}
    >
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-surface-700 text-gray-400 hover:text-gray-200 transition-colors"
          title={backTitle}
        >
          <ChevronLeft className="w-4 h-4" aria-hidden />
        </button>
      ) : null}
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-white" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-sm font-semibold text-gray-100 shrink-0">{title}</h1>
          {titleTrailing}
        </div>
        {description ? <p className="text-[10px] text-gray-500">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}
