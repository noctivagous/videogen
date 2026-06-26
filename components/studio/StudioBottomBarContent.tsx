'use client';

import { ShotDesignerBottomBarContent } from '@/components/studio/BottomBar';
import type { StudioPanelId } from '@/lib/studio/studio-routes';

export function BottomPanelContent({ panel }: { panel: StudioPanelId }) {
  if (panel === 'shot-designer') {
    return <ShotDesignerBottomBarContent />;
  }

  return null;
}

export const StudioBottomBarContent = BottomPanelContent;
