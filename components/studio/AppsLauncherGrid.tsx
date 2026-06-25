'use client';

import type {
  StudioLauncherItem,
  StudioLauncherItemId,
} from '@/lib/constants/studio-launcher';

export function AppsLauncherGrid({
  items,
  onSelect,
  activeItemId,
  className = '',
}: {
  items: readonly StudioLauncherItem[];
  onSelect: (id: StudioLauncherItemId) => void;
  activeItemId?: string;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${className}`.trim()}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item.id)}
          className={`apps-launcher-card text-left rounded-xl border bg-surface-800/60 hover:border-brand-500/40 hover:bg-surface-800 p-4 transition-colors ${
            activeItemId === item.id
              ? 'border-brand-500/50 ring-1 ring-brand-500/30'
              : 'border-surface-700'
          }`}
        >
          <div className="text-sm font-semibold text-gray-100">{item.title}</div>
          <div className="text-xs text-gray-400 mt-1.5 leading-snug">{item.description}</div>
        </button>
      ))}
    </div>
  );
}
