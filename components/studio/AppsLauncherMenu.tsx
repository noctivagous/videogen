'use client';

import { AppsLauncherGrid } from '@/components/studio/AppsLauncherGrid';
import { useAppsLauncher } from '@/hooks/use-apps-launcher';
import type { StudioLauncherItemId } from '@/lib/constants/studio-launcher';

export function AppsLauncherMenu({ onDismiss }: { onDismiss?: () => void }) {
  const { items, activeItemId, selectItem } = useAppsLauncher();

  const handleSelect = (id: StudioLauncherItemId) => {
    selectItem(id, onDismiss);
  };

  return (
    <AppsLauncherGrid
      items={items}
      activeItemId={activeItemId}
      onSelect={handleSelect}
    />
  );
}
