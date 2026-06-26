import type { StudioPanelId } from '@/lib/studio/studio-routes';

const BOTTOM_BAR_ENABLED_PANELS = new Set<StudioPanelId>([
  'shot-designer',
]);

export function usesStudioBottomBar(panel: StudioPanelId): boolean {
  return BOTTOM_BAR_ENABLED_PANELS.has(panel);
}
