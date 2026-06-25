import { STUDIO_APPS, type StudioAppId } from '@/lib/constants/studio-apps';
export type StudioPanelId =
  | 'app-summary'
  | 'settings'
  | 'shot-designer'
  | 'media-library'
  | StudioAppId;

export const STUDIO_PANEL_IDS: readonly StudioPanelId[] = [
  'app-summary',
  'settings',
  'shot-designer',
  'media-library',
  ...STUDIO_APPS.map((app) => app.id),
] as const;

export const IMPLEMENTED_STUDIO_PANELS = new Set<StudioPanelId>([
  'app-summary',
  'settings',
  'shot-designer',
  'media-library',
  'character-sheet-generator',
  'location-manager',
]);

export const DEFAULT_STUDIO_PANEL: StudioPanelId = 'shot-designer';

export function isStudioPanelId(value: string): value is StudioPanelId {
  return (STUDIO_PANEL_IDS as readonly string[]).includes(value);
}

export function studioPanelRoute(panel: StudioPanelId): string {
  return `/studio/${panel}`;
}

export interface StudioRouteTarget {
  panel: StudioPanelId;
  mediaAssetId?: string;
  generatedVideoId?: string;
}

export function studioMediaLibraryVideoRoute(assetId: string): string {
  return `/studio/media-library/generated/video/${encodeURIComponent(assetId)}`;
}

export function studioShotDesignerGeneratedVideoRoute(generatedVideoId: string): string {
  return `/studio/shot-designer/generated/video/${encodeURIComponent(generatedVideoId)}`;
}

export function parseStudioPathname(pathname: string): StudioRouteTarget | null {
  const match = pathname.match(/^\/studio\/([^/]+)(?:\/(.*))?$/);
  if (!match) return null;

  const slug = match[1];
  if (!isStudioPanelId(slug)) return null;

  const rest = match[2]?.replace(/\/$/, '');
  if (!rest) return { panel: slug };

  const mediaLibraryVideoMatch = rest.match(/^generated\/video\/([^/]+)$/);
  if (mediaLibraryVideoMatch && slug === 'media-library') {
    return {
      panel: slug,
      mediaAssetId: decodeURIComponent(mediaLibraryVideoMatch[1]),
    };
  }

  const shotDesignerVideoMatch = rest.match(/^generated\/video\/([^/]+)$/);
  if (shotDesignerVideoMatch && slug === 'shot-designer') {
    return {
      panel: slug,
      generatedVideoId: decodeURIComponent(shotDesignerVideoMatch[1]),
    };
  }

  return null;
}

export function panelFromPathname(pathname: string): StudioPanelId | null {
  return parseStudioPathname(pathname)?.panel ?? null;
}

export function isShotDesignerPanel(panel: StudioPanelId): boolean {
  return panel === 'shot-designer';
}

export function isStudioAppPanel(panel: StudioPanelId): panel is StudioAppId {
  return STUDIO_APPS.some((app) => app.id === panel);
}

export function isImplementedStudioPanel(panel: StudioPanelId): boolean {
  return IMPLEMENTED_STUDIO_PANELS.has(panel);
}

/** @deprecated alias — use StudioPanelId */
export type WorkspaceView = StudioPanelId;
