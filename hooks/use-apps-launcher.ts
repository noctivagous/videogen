'use client';

import { useCallback } from 'react';
import {
  STUDIO_LAUNCHER_ITEMS,
  type StudioLauncherItem,
  type StudioLauncherItemId,
} from '@/lib/constants/studio-launcher';
import { useNavigateToStudioPanel } from '@/hooks/use-studio-panel-navigation';
import { launchStudioLauncherItem } from '@/lib/studio/launch-studio-launcher-item';
import { useStudioStore } from '@/store/useStudioStore';

export function useAppsLauncher(): {
  items: readonly StudioLauncherItem[];
  activeItemId: string;
  selectItem: (id: StudioLauncherItemId, onDone?: () => void) => void;
} {
  const navigateToPanel = useNavigateToStudioPanel();
  const showToast = useStudioStore((s) => s.showToast);
  const workspaceView = useStudioStore((s) => s.workspaceView);

  const selectItem = useCallback(
    (id: StudioLauncherItemId, onDone?: () => void) => {
      launchStudioLauncherItem(id, { navigateToPanel, showToast });
      onDone?.();
    },
    [navigateToPanel, showToast],
  );

  return {
    items: STUDIO_LAUNCHER_ITEMS,
    activeItemId: workspaceView,
    selectItem,
  };
}
