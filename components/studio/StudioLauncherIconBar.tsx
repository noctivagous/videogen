'use client';

import { useState } from 'react';
import { STUDIO_LAUNCHER_ICONS } from '@/components/studio/studio-launcher-icons';
import { InstantTooltip } from '@/components/ui/InstantTooltip';
import { ShortcutChip } from '@/components/ui/ShortcutChip';
import { useAppsLauncher } from '@/hooks/use-apps-launcher';
import { getLauncherShortcutLabelForItem } from '@/lib/studio/studio-launcher-keybindings';
import { getStudioLauncherTheme } from '@/lib/studio/studio-launcher-theme';

export function StudioLauncherIconBar() {
  const { items, activeItemId, selectItem } = useAppsLauncher();
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  return (
    <div className="relative flex items-center gap-[3px] overflow-visible" role="toolbar" aria-label="Studio apps">
      {items.map((item) => {
        const Icon = STUDIO_LAUNCHER_ICONS[item.id];
        const active = activeItemId === item.id;
        const shortcut = getLauncherShortcutLabelForItem(item.id);
        const theme = getStudioLauncherTheme(item.id);
        const isHovered = hoveredItemId === item.id;
        const style = active
          ? theme.iconActiveStyle
          : isHovered
            ? { ...theme.iconInactiveStyle, ...theme.iconHoverStyle }
            : theme.iconInactiveStyle;

        return (
          <InstantTooltip key={item.id} label={item.title} shortcut={shortcut}>
            <span className="relative inline-flex overflow-visible">
              <button
                type="button"
                onClick={() => selectItem(item.id)}
                onMouseEnter={() => setHoveredItemId(item.id)}
                onMouseLeave={() => setHoveredItemId((prev) => (prev === item.id ? null : prev))}
                onFocus={() => setHoveredItemId(item.id)}
                onBlur={() => setHoveredItemId((prev) => (prev === item.id ? null : prev))}
                aria-label={shortcut ? `${item.title} (${shortcut})` : item.title}
                aria-pressed={active}
                style={style}
                className={`relative h-[30px] w-[30px] rounded-[9px] border transition-all ${
                  active
                    ? ''
                    : 'bg-surface-800/60 border-transparent'
                }`}
              >
                <Icon className="absolute top-[4px] left-1/2 size-[18px] -translate-x-1/2" aria-hidden />
              </button>
              {shortcut ? (
                <span className="pointer-events-none absolute z-10 left-1/2 top-[24px] -translate-x-1/2">
                  <ShortcutChip>{shortcut}</ShortcutChip>
                </span>
              ) : null}
            </span>
          </InstantTooltip>
        );
      })}
    </div>
  );
}