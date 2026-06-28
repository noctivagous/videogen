import { STUDIO_APPS, type StudioAppId } from '@/lib/constants/studio-apps';
import type { StudioPanelId } from '@/lib/studio/studio-routes';

export type StudioLauncherItemId = 'shot-designer' | 'media-library' | StudioAppId | 'settings';

export interface StudioLauncherItem {
  id: StudioLauncherItemId;
  title: string;
  description: string;
  backgroundImage: string;
}

const STUDIO_LAUNCHER_BACKGROUND_BASE = '/stock/app-styling/studio-launcher';

export function getStudioLauncherBackgroundUrl(id: StudioLauncherItemId): string {
  return `${STUDIO_LAUNCHER_BACKGROUND_BASE}/${id}-2.jpg`;
}

const STUDIO_LAUNCHER_ITEM_DEFINITIONS = [
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
] as const satisfies readonly Omit<StudioLauncherItem, 'backgroundImage'>[];

export const STUDIO_LAUNCHER_ITEMS: readonly StudioLauncherItem[] = STUDIO_LAUNCHER_ITEM_DEFINITIONS.map(
  (item) => ({
    ...item,
    backgroundImage: getStudioLauncherBackgroundUrl(item.id),
  }),
);

export function getStudioLauncherItem(id: StudioLauncherItemId): StudioLauncherItem {
  const item = STUDIO_LAUNCHER_ITEMS.find((entry) => entry.id === id);
  if (!item) throw new Error(`Unknown studio launcher item: ${id}`);
  return item;
}

export function getStudioPanelTitle(panel: StudioPanelId): string {
  if (panel === 'app-summary') return 'Apps';
  const item = STUDIO_LAUNCHER_ITEMS.find((entry) => entry.id === panel);
  return item?.title ?? 'App';
}