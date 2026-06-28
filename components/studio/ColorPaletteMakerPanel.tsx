'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ColorPaletteMakerContent } from '@/components/studio/ColorPaletteMakerContent';
import { ColorPaletteMakerLibraryContent } from '@/components/studio/ColorPaletteMakerLibraryContent';
import { ColorPaletteMakerTabSegment } from '@/components/studio/ColorPaletteMakerTabSegment';
import { ManagerScopeSegment } from '@/components/studio/ManagerScopeSegment';
import type { MediaLibraryScopeFilter } from '@/components/studio/media-library/MediaLibraryToolbar';
import { StudioPanelHeader } from '@/components/studio/StudioPanelHeader';
import { STUDIO_LAUNCHER_ICONS } from '@/components/studio/studio-launcher-icons';
import { getStudioApp } from '@/lib/constants/studio-apps';
import {
  colorPaletteMakerTabRoute,
  COLOR_PALETTE_MAKER_TAB_DESCRIPTIONS,
  parseColorPaletteMakerPathname,
  resolveColorPaletteMakerPathRedirect,
  type ColorPaletteMakerTab,
} from '@/lib/studio/color-palette-maker-routes';
import { getLauncherShortcutLabelForItem } from '@/lib/studio/studio-launcher-keybindings';
import { useNavigateToStudioPanel } from '@/hooks/use-studio-panel-navigation';

export function ColorPaletteMakerPanel() {
  const pathname = usePathname();
  const router = useRouter();
  const navigateToPanel = useNavigateToStudioPanel();
  const colorPaletteApp = getStudioApp('color-palette-maker');
  const [scopeFilter, setScopeFilter] = useState<MediaLibraryScopeFilter>('project');

  useEffect(() => {
    const redirect = resolveColorPaletteMakerPathRedirect(pathname);
    if (redirect) router.replace(redirect);
  }, [pathname, router]);

  const activeTab = useMemo<ColorPaletteMakerTab>(
    () => parseColorPaletteMakerPathname(pathname)?.tab ?? 'maker',
    [pathname],
  );

  const handleTabChange = (tab: ColorPaletteMakerTab) => {
    router.push(colorPaletteMakerTabRoute(tab));
  };

  const headerDescription =
    activeTab === 'library'
      ? `${scopeFilter === 'project' ? 'Project' : 'Global'} color palette collections`
      : COLOR_PALETTE_MAKER_TAB_DESCRIPTIONS[activeTab];

  return (
    <div className="h-full min-h-0 flex flex-col bg-surface-900">
      <StudioPanelHeader
        title={colorPaletteApp.title}
        description={headerDescription}
        icon={STUDIO_LAUNCHER_ICONS['color-palette-maker']}
        launcherItemId="color-palette-maker"
        shortcut={getLauncherShortcutLabelForItem('color-palette-maker')}
        onBack={() => navigateToPanel('shot-designer')}
        backTitle="Back to Shot Designer"
        titleTrailing={
          <div className="flex items-center gap-2">
            <ColorPaletteMakerTabSegment value={activeTab} onChange={handleTabChange} />
            {activeTab === 'library' ? (
              <ManagerScopeSegment
                value={scopeFilter}
                onChange={setScopeFilter}
                ariaLabel="Color palette library scope"
              />
            ) : null}
          </div>
        }
      />

      {activeTab === 'maker' ? (
        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          <ColorPaletteMakerContent />
        </div>
      ) : (
        <ColorPaletteMakerLibraryContent scopeFilter={scopeFilter} />
      )}
    </div>
  );
}