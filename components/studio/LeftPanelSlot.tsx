'use client';

import { CameraPanel } from '@/components/studio/CameraPanel';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';

export function LeftPanelSlot() {
  return (
    <aside
      className="hidden lg:block w-72 pro-panel glass border-r border-surface-700 overflow-y-auto control-panel"
      {...uiSectionProps(UI_SECTIONS.studioCameraPanel)}
    >
      <CameraPanel />
    </aside>
  );
}
