import type { LightingSettings, ThemeTransformLightingInclusion } from '@/lib/types/studio';

export const DEFAULT_THEME_TRANSFORM_LIGHTING_INCLUSION: ThemeTransformLightingInclusion = {
  keyLight: false,
  style: false,
  timeOfDay: false,
  colorTemp: false,
  atmosphere: false,
};

export function resolveThemeTransformLightingInclusion(
  lighting: LightingSettings,
): ThemeTransformLightingInclusion {
  return {
    ...DEFAULT_THEME_TRANSFORM_LIGHTING_INCLUSION,
    ...lighting.themeTransformLighting,
  };
}

export function normalizeThemeTransformLighting(
  value?: Partial<ThemeTransformLightingInclusion> | null,
): ThemeTransformLightingInclusion {
  return {
    ...DEFAULT_THEME_TRANSFORM_LIGHTING_INCLUSION,
    ...value,
  };
}