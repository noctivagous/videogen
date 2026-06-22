import type { StudioLauncherItemId } from '@/lib/constants/studio-launcher';
import { launchStudioApp } from '@/lib/studio/launch-studio-app';
import type { WorkspaceView } from '@/store/useStudioStore';

export function launchStudioLauncherItem(
  id: StudioLauncherItemId,
  actions: {
    setWorkspaceView: (view: WorkspaceView) => void;
    openSettings: () => void;
    showToast: (message: string, type?: 'success' | 'error') => void;
  },
): void {
  switch (id) {
    case 'shot-designer':
      actions.setWorkspaceView('shot');
      return;
    case 'media-library':
      actions.setWorkspaceView('media-library');
      return;
    case 'settings':
      actions.openSettings();
      return;
    default:
      launchStudioApp(id, actions.showToast);
  }
}
