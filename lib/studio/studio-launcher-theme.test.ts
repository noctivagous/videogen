import { describe, expect, it } from 'vitest';
import { getStudioLauncherTheme, getStudioLauncherThemeForPanel } from '@/lib/studio/studio-launcher-theme';

describe('studio-launcher-theme', () => {
  it('loads per-item accent styles from json config', () => {
    const theme = getStudioLauncherTheme('media-library');
    expect(theme.accent).toBe('#3b82f6');
    expect(theme.splitPrimaryStyle).toHaveProperty('color');
    expect(theme.panelIconStyle).toHaveProperty('backgroundImage');
  });

  it('returns launcher theme only for launcher panels', () => {
    expect(getStudioLauncherThemeForPanel('settings')).toBeTruthy();
    expect(getStudioLauncherThemeForPanel('app-summary')).toBeNull();
  });
});
