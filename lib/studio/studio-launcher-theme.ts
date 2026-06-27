import type { CSSProperties } from 'react';
import type { StudioLauncherItemId } from '@/lib/constants/studio-launcher';
import type { StudioPanelId } from '@/lib/studio/studio-routes';
import colorConfig from '@/lib/constants/studio-launcher-colors.json';

interface LauncherColorConfigEntry {
  accent: string;
}

type LauncherColorConfig = Partial<Record<StudioLauncherItemId, LauncherColorConfigEntry>>;

const launcherColorConfig = colorConfig as LauncherColorConfig;
const DEFAULT_ACCENT = '#818cf8';

export interface StudioLauncherTheme {
  accent: string;
  iconActiveStyle: CSSProperties;
  iconInactiveStyle: CSSProperties;
  iconHoverStyle: CSSProperties;
  splitPrimaryStyle: CSSProperties;
  splitMenuStyle: CSSProperties;
  panelTitleStyle: CSSProperties;
  panelIconStyle: CSSProperties;
}

export function getStudioLauncherTheme(itemId: StudioLauncherItemId): StudioLauncherTheme {
  const accent = normalizeHexColor(launcherColorConfig[itemId]?.accent) ?? DEFAULT_ACCENT;

  return {
    accent,
    iconActiveStyle: {
      color: toRgba(accent, 0.98),
      borderColor: toRgba(accent, 0.55),
      backgroundColor: toRgba(accent, 0.2),
    },
    iconInactiveStyle: {
      color: toRgba(accent, 0.72),
    },
    iconHoverStyle: {
      color: toRgba(accent, 0.96),
      borderColor: toRgba(accent, 0.38),
      backgroundColor: toRgba(accent, 0.12),
    },
    splitPrimaryStyle: {
      color: toRgba(accent, 0.95),
      borderColor: toRgba(accent, 0.45),
      backgroundColor: toRgba(accent, 0.12),
    },
    splitMenuStyle: {
      borderColor: toRgba(accent, 0.45),
      color: toRgba(accent, 0.85),
      backgroundColor: toRgba(accent, 0.1),
    },
    panelTitleStyle: {
      color: toRgba(accent, 0.95),
    },
    panelIconStyle: {
      backgroundImage: `linear-gradient(135deg, ${toRgba(accent, 0.98)} 0%, ${toRgba(accent, 0.7)} 100%)`,
    },
  };
}

export function getStudioLauncherThemeForPanel(panel: StudioPanelId): StudioLauncherTheme | null {
  return isStudioLauncherItemId(panel) ? getStudioLauncherTheme(panel) : null;
}

function normalizeHexColor(value: string | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim();
  if (!/^#(?:[A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(normalized)) return null;
  return normalized.length === 4
    ? `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`
    : normalized;
}

function toRgba(hex: string, alpha: number): string {
  const normalized = normalizeHexColor(hex) ?? DEFAULT_ACCENT;
  const r = Number.parseInt(normalized.slice(1, 3), 16);
  const g = Number.parseInt(normalized.slice(3, 5), 16);
  const b = Number.parseInt(normalized.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function isStudioLauncherItemId(value: string): value is StudioLauncherItemId {
  return Object.prototype.hasOwnProperty.call(launcherColorConfig, value);
}
