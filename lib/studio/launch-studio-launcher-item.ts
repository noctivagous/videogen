import type { StudioLauncherItemId } from '@/lib/constants/studio-launcher';
import type { StudioPanelId } from '@/lib/studio/studio-routes';

export function launchStudioLauncherItem(
  id: StudioLauncherItemId,
  actions: {
    navigateToPanel: (panel: StudioPanelId) => void;
    openSettings: () => void;
    showToast: (message: string, type?: 'success' | 'error') => void;
  },
): void {
  switch (id) {
    case 'shot-designer':
      actions.navigateToPanel('shot-designer');
      return;
    case 'media-library':
      actions.navigateToPanel('media-library');
      return;
    case 'settings':
      actions.openSettings();
      return;
    default:
      actions.navigateToPanel(id);
  }
}
