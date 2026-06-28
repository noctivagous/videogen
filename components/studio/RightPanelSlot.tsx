'use client';

import { RightPanelContent } from '@/components/studio/StudioWorkspaceRightPanel';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { usesStudioRightSidebar } from '@/lib/studio/right-sidebar-panels';
import { useStudioStore } from '@/store/useStudioStore';

export function RightPanelSlot() {
  const workspaceView = useStudioStore((s) => s.workspaceView);

  if (!usesStudioRightSidebar(workspaceView)) {
    return null;
  }

  return (
    <aside
      className="hidden lg:block w-72 pro-panel glass border-l border-surface-700 overflow-y-auto control-panel"
      {...uiSectionProps(UI_SECTIONS.studioLightingPanel)}
    >
      <RightPanelContent panel={workspaceView} />
    </aside>
  );
}
