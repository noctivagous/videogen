import type { StudioPanelId } from '@/lib/studio/studio-routes';

const RIGHT_SIDEBAR_ENABLED_PANELS = new Set<StudioPanelId>([
  'shot-designer',
  'media-library',
  'character-sheet-generator',
  'location-manager',
]);

export function usesStudioRightSidebar(panel: StudioPanelId): boolean {
  return RIGHT_SIDEBAR_ENABLED_PANELS.has(panel);
}
