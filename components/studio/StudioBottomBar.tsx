'use client';

import { BottomPanelContent } from '@/components/studio/StudioBottomBarContent';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { usesStudioBottomBar } from '@/lib/studio/bottom-bar-panels';
import { useStudioStore } from '@/store/useStudioStore';

export function BottomPanelSlot() {
  const workspaceView = useStudioStore((s) => s.workspaceView);

  if (!usesStudioBottomBar(workspaceView)) {
    return null;
  }

  return (
    <div className="border-t border-surface-700" {...uiSectionProps(UI_SECTIONS.studioBottomBar)}>
      <div className="p-2.5 space-y-2">
        <BottomPanelContent panel={workspaceView} />
      </div>
    </div>
  );
}

export const StudioBottomBar = BottomPanelSlot;
