import { getStudioApp, type StudioAppId } from '@/lib/constants/studio-apps';

export function launchStudioApp(
  id: StudioAppId,
  showToast: (message: string, type?: 'success' | 'error') => void,
): void {
  showToast(`${getStudioApp(id).title} — coming soon`);
}
