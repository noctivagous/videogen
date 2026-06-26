'use client';

import { STUDIO_LAUNCHER_ICONS } from '@/components/studio/studio-launcher-icons';
import { InstantTooltip } from '@/components/ui/InstantTooltip';
import { useAppsLauncher } from '@/hooks/use-apps-launcher';

export function StudioLauncherIconBar() {
  const { items, activeItemId, selectItem } = useAppsLauncher();

  return (
    <div className="flex items-center gap-[3px]" role="toolbar" aria-label="Studio apps">
      {items.map((item) => {
        const Icon = STUDIO_LAUNCHER_ICONS[item.id];
        const active = activeItemId === item.id;

        return (
          <InstantTooltip key={item.id} label={item.title}>
            <button
              type="button"
              onClick={() => selectItem(item.id)}
              aria-label={item.title}
              aria-pressed={active}
              className={`p-1.5 rounded-[9px] border transition-all ${
                active
                  ? 'bg-brand-600/20 border-brand-500/50 text-brand-300'
                  : 'bg-surface-800/60 border-transparent text-gray-400 hover:text-gray-200 hover:bg-surface-700 hover:border-surface-600'
              }`}
            >
              <Icon className="size-[18px]" aria-hidden />
            </button>
          </InstantTooltip>
        );
      })}
    </div>
  );
}
