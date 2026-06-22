import { STUDIO_APPS, type StudioAppId } from '@/lib/constants/studio-apps';

export type StudioLauncherItemId = 'shot-designer' | 'media-library' | StudioAppId | 'settings';

export interface StudioLauncherItem {
  id: StudioLauncherItemId;
  title: string;
  description: string;
}

export const STUDIO_LAUNCHER_ITEMS: readonly StudioLauncherItem[] = [
  {
    id: 'shot-designer',
    title: 'Shot Designer',
    description: 'Design shots, block framing, and generate video',
  },
  {
    id: 'media-library',
    title: 'Media Library',
    description: 'Browse project media assets, references, and generated clips',
  },
  ...STUDIO_APPS.map((app) => ({
    id: app.id,
    title: app.title,
    description: app.description,
  })),
  {
    id: 'settings',
    title: 'Settings',
    description: 'AI providers, models, and API keys',
  },
] as const;

export function getStudioLauncherItem(id: StudioLauncherItemId): StudioLauncherItem {
  const item = STUDIO_LAUNCHER_ITEMS.find((entry) => entry.id === id);
  if (!item) throw new Error(`Unknown studio launcher item: ${id}`);
  return item;
}
