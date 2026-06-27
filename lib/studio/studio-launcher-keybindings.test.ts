import { describe, expect, it } from 'vitest';
import { STUDIO_LAUNCHER_ITEMS } from '@/lib/constants/studio-launcher';
import {
  buildLauncherKeybindingMap,
  getAdjacentLauncherItemForPanel,
  getLauncherItemForShortcutKey,
  getLauncherShortcutForItem,
  getLauncherShortcutLabelForItem,
} from '@/lib/studio/studio-launcher-keybindings';

describe('studio-launcher-keybindings', () => {
  it('maps launcher items to configured alt+key shortcuts', () => {
    expect(getLauncherShortcutForItem('shot-designer')).toBe('alt+d');
    expect(getLauncherShortcutForItem('media-library')).toBe('alt+m');
    expect(getLauncherShortcutForItem('settings')).toBe('alt+t');
  });

  it('formats platform-native shortcut labels', () => {
    expect(getLauncherShortcutLabelForItem('shot-designer', 'Mozilla/5.0 (Macintosh; Intel Mac OS X)')).toBe('⌥D');
    expect(getLauncherShortcutLabelForItem('media-library', 'Mozilla/5.0 (Windows NT 10.0)')).toBe('⎇M');
  });

  it('returns null for unknown shortcut strings', () => {
    expect(getLauncherItemForShortcutKey('alt+9')).toBeNull();
    expect(getLauncherItemForShortcutKey('alt+z')).toBeNull();
  });

  it('builds a keybinding map aligned with launcher items', () => {
    const map = buildLauncherKeybindingMap();
    expect(map.get('alt+d')).toBe('shot-designer');
    expect(map.get('alt+t')).toBe('settings');
    expect(map.size).toBe(STUDIO_LAUNCHER_ITEMS.length);
    expect(getLauncherItemForShortcutKey('alt+c')).toBe('character-sheet-generator');
    expect(getLauncherItemForShortcutKey('Alt+M')).toBe('media-library');
  });

  it('navigates to adjacent launcher items for panel cycling', () => {
    expect(getAdjacentLauncherItemForPanel('shot-designer', 'next')).toBe('media-library');
    expect(getAdjacentLauncherItemForPanel('shot-designer', 'previous')).toBe('settings');
    expect(getAdjacentLauncherItemForPanel('app-summary', 'next')).toBe('shot-designer');
    expect(getAdjacentLauncherItemForPanel('app-summary', 'previous')).toBe('settings');
  });
});
