'use client';

import { ChevronLeft, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { ShortcutChip } from '@/components/ui/ShortcutChip';
import type { StudioLauncherItemId } from '@/lib/constants/studio-launcher';
import { getStudioLauncherTheme } from '@/lib/studio/studio-launcher-theme';

export interface StudioPanelHeaderProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  onBack?: () => void;
  backTitle?: string;
  shortcut?: string | null;
  launcherItemId?: StudioLauncherItemId;
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
  shortcut,
  launcherItemId,
  titleTrailing,
  actions,
  className = '',
}: StudioPanelHeaderProps) {
  const theme = launcherItemId ? getStudioLauncherTheme(launcherItemId) : null;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 h-[62px] border-b border-surface-700 flex-shrink-0 bg-surface-900 ${className}`.trim()}
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
      <div
        className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0"
        style={theme?.panelIconStyle}
      >
        <Icon className="w-4 h-4 text-white" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-sm font-semibold text-gray-100 truncate" style={theme?.panelTitleStyle}>{title}</h1>
          {shortcut ? <ShortcutChip>{shortcut}</ShortcutChip> : null}
          {titleTrailing ? <span className="shrink-0">{titleTrailing}</span> : null}
        </div>
        <p className={`text-[10px] leading-3 truncate ${description ? 'text-gray-500' : 'text-transparent'}`}>
          {description ?? 'placeholder'}
        </p>
      </div>
      {actions}
    </div>
  );
}
