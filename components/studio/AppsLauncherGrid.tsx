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
          className={`apps-launcher-card text-left rounded-xl border bg-surface-800 hover:border-brand-500/40 p-4 transition-colors min-h-[5.8125rem] ${
            activeItemId === item.id
              ? 'border-brand-500/50 ring-1 ring-brand-500/30'
              : 'border-surface-700'
          }`}
        >
          <span
            className="apps-launcher-card__thumb"
            style={{ backgroundImage: `url(${item.backgroundImage})` }}
            aria-hidden
          />
          <span className="apps-launcher-card__shade" aria-hidden />
          <div className="apps-launcher-card__content">
            <div className="text-sm font-semibold text-gray-100">{item.title}</div>
            <div className="text-xs text-gray-400 mt-1.5 leading-snug">{item.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
