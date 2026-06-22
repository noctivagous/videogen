import { STUDIO_APPS, type StudioAppId } from '@/lib/constants/studio-apps';
export type StudioPanelId = 'shot-designer' | 'media-library' | StudioAppId;

export const STUDIO_PANEL_IDS: readonly StudioPanelId[] = [
  'shot-designer',
  'media-library',
  ...STUDIO_APPS.map((app) => app.id),
] as const;

export const IMPLEMENTED_STUDIO_PANELS = new Set<StudioPanelId>([
  'shot-designer',
  'media-library',
]);

export const DEFAULT_STUDIO_PANEL: StudioPanelId = 'shot-designer';

export function isStudioPanelId(value: string): value is StudioPanelId {
  return (STUDIO_PANEL_IDS as readonly string[]).includes(value);
}

export function studioPanelRoute(panel: StudioPanelId): string {
  return `/studio/${panel}`;
}

export function panelFromPathname(pathname: string): StudioPanelId | null {
  const match = pathname.match(/^\/studio\/([^/]+)\/?$/);
  if (!match) return null;
  const slug = match[1];
  return isStudioPanelId(slug) ? slug : null;
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
