import {
  STUDIO_LAUNCHER_ITEMS,
  type StudioLauncherItemId,
} from '@/lib/constants/studio-launcher';
import type { StudioPanelId } from '@/lib/studio/studio-routes';
import keybindingConfig from '@/lib/constants/studio-launcher-keybindings.json';
import { formatAltShortcut } from '@/lib/ui/shortcut-label';

type LauncherShortcutConfig = Partial<Record<StudioLauncherItemId, string>>;

const launcherShortcutConfig = keybindingConfig as LauncherShortcutConfig;
const launcherKeybindingMap = buildLauncherKeybindingMap();

export function getLauncherShortcutForItem(id: StudioLauncherItemId): string | null {
  const key = normalizeShortcutKey(launcherShortcutConfig[id]);
  if (!key) return null;
  return `alt+${key}`;
}

export function getLauncherShortcutLabelForItem(
  id: StudioLauncherItemId,
  userAgent?: string,
): string | null {
  const key = normalizeShortcutKey(launcherShortcutConfig[id]);
  if (!key) return null;
  return formatAltShortcut(key, userAgent);
}

export function getLauncherItemForShortcutKey(key: string): StudioLauncherItemId | null {
  const normalizedShortcut = normalizeShortcutString(key);
  if (!normalizedShortcut) return null;

  return launcherKeybindingMap.get(normalizedShortcut) ?? null;
}

export function buildLauncherKeybindingMap(): Map<string, StudioLauncherItemId> {
  const map = new Map<string, StudioLauncherItemId>();
  STUDIO_LAUNCHER_ITEMS.forEach((item) => {
    const shortcut = getLauncherShortcutForItem(item.id);
    if (shortcut) {
      map.set(shortcut, item.id);
    }
  });
  return map;
}

export function getAdjacentLauncherItemForPanel(
  panel: StudioPanelId,
  direction: 'previous' | 'next',
): StudioLauncherItemId | null {
  if (STUDIO_LAUNCHER_ITEMS.length === 0) return null;

  const currentIndex = STUDIO_LAUNCHER_ITEMS.findIndex((item) => item.id === panel);
  if (currentIndex < 0) {
    return direction === 'previous'
      ? STUDIO_LAUNCHER_ITEMS[STUDIO_LAUNCHER_ITEMS.length - 1]?.id ?? null
      : STUDIO_LAUNCHER_ITEMS[0]?.id ?? null;
  }

  const offset = direction === 'next' ? 1 : -1;
  const nextIndex = (currentIndex + offset + STUDIO_LAUNCHER_ITEMS.length) % STUDIO_LAUNCHER_ITEMS.length;
  return STUDIO_LAUNCHER_ITEMS[nextIndex]?.id ?? null;
}

function normalizeShortcutKey(key: string | undefined): string | null {
  if (!key) return null;
  const normalized = key.trim().toLowerCase();
  if (!/^[a-z0-9]$/.test(normalized)) return null;
  return normalized;
}

function normalizeShortcutString(key: string): string | null {
  const match = /^alt\+([a-z0-9])$/i.exec(key.trim());
  if (!match) return null;
  return `alt+${match[1].toLowerCase()}`;
}
