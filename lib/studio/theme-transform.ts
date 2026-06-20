import { isColorPaletteActive } from '@/lib/constants/color-palette';
import { resolveThemeTransformLightingInclusion } from '@/lib/constants/theme-transform-lighting';
import { buildThemeTransformLookPrompt } from '@/lib/studio/theme-transform-prompt';
import type {
  LightingSettings,
  ReferenceRole,
  Shot,
  ThemeTransformSlotStatus,
} from '@/lib/types/studio';

export const THEME_TRANSFORM_SLOT_COUNT = 3;

export function emptyThemeTransformArray<T>(fill: T): T[] {
  return Array.from({ length: THEME_TRANSFORM_SLOT_COUNT }, () => fill);
}

export function ensureSlotArrayLength<T>(arr: T[] | undefined, length: number, fill: T): T[] {
  const next = [...(arr ?? [])];
  while (next.length < length) next.push(fill);
  return next;
}

export function defaultThemeTransformStatus(): ThemeTransformSlotStatus[] {
  return emptyThemeTransformArray('idle');
}

export function defaultThemeTransformRefs(): (string | null)[] {
  return emptyThemeTransformArray(null);
}

/** Theme Transformer is active when color palette or Look Library recipe is on. */
export function needsThemeTransformer(lighting: LightingSettings): boolean {
  const palette = lighting.colorPalette;
  return isColorPaletteActive(palette) || Boolean(palette?.activeLookRecipeId);
}

function hashString(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h) ^ input.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

export function buildThemeTransformFingerprint(
  sourceUrl: string,
  lighting: LightingSettings,
): string {
  const include = resolveThemeTransformLightingInclusion(lighting);
  const { colorPalette, style, timeOfDay, colorTemp, atmosphere, keyLight } = lighting;
  return hashString(
    JSON.stringify({
      sourceUrl,
      colorPalette,
      themeTransformLighting: include,
      ...(include.keyLight ? { keyLight } : {}),
      ...(include.style ? { style } : {}),
      ...(include.timeOfDay ? { timeOfDay } : {}),
      ...(include.colorTemp ? { colorTemp } : {}),
      ...(include.atmosphere ? { atmosphere } : {}),
    }),
  );
}

export function getThemeTransformStatus(
  shot: Shot,
  index: number,
): ThemeTransformSlotStatus {
  return shot.themeTransformStatus?.[index] ?? 'idle';
}

export function isSlotTransformReady(shot: Shot, index: number, lighting: LightingSettings): boolean {
  const status = getThemeTransformStatus(shot, index);
  if (status !== 'ready') return false;
  const source = shot.references[index];
  const transformed = shot.transformedReferences?.[index];
  const fingerprint = shot.themeTransformFingerprint?.[index];
  if (!source || !transformed || !fingerprint) return false;
  return fingerprint === buildThemeTransformFingerprint(source, lighting);
}

export function effectiveReferenceUrl(shot: Shot, index: number, lighting: LightingSettings): string | null {
  const raw = shot.references[index];
  if (!raw) return null;
  if (isSlotTransformReady(shot, index, lighting)) {
    return shot.transformedReferences?.[index] ?? raw;
  }
  return raw;
}

export { buildThemeTransformLookPrompt } from '@/lib/studio/theme-transform-prompt';

export function buildTransformPromptForSlot(role: ReferenceRole, lighting: LightingSettings): string {
  const look = buildThemeTransformLookPrompt(lighting);

  switch (role) {
    case 'Subject':
      return (
        'Apply this cinematic color grade and lighting mood to the subject. ' +
        'Preserve identity, pose, body proportions, and wardrobe structure. ' +
        look
      );
    case 'Backdrop':
      return (
        'Apply this cinematic color grade and lighting mood to the environment and backdrop. ' +
        'Preserve spatial layout, geometry, and composition. ' +
        look
      );
    case 'Style':
      return `Transform into a style reference plate embodying this cinematic look. ${look}`;
    default:
      return `Apply this cinematic color grade and lighting mood. ${look}`;
  }
}

export function hasStaleLinkedTransforms(shot: Shot, lighting: LightingSettings): boolean {
  const linked = shot.themeTransformLinked ?? emptyThemeTransformArray(false);
  for (let i = 0; i < THEME_TRANSFORM_SLOT_COUNT; i++) {
    if (!linked[i]) continue;
    const status = getThemeTransformStatus(shot, i);
    if (status === 'applying') continue;
    if (!shot.references[i]) continue;
    if (status === 'stale' || status === 'error' || !isSlotTransformReady(shot, i, lighting)) {
      return true;
    }
  }
  return false;
}

export function patchThemeTransformInvalidation(
  shot: Shot,
  slotIndices: number[],
  reason: 'source' | 'lighting',
): Partial<Shot> {
  const status = [...(shot.themeTransformStatus ?? defaultThemeTransformStatus())];
  const fingerprints = [...(shot.themeTransformFingerprint ?? emptyThemeTransformArray(null))];
  const errors = [...(shot.themeTransformError ?? emptyThemeTransformArray(null))];
  const linked = shot.themeTransformLinked ?? emptyThemeTransformArray(false);

  for (const i of slotIndices) {
    if (!linked[i] && reason === 'lighting') continue;
    if (status[i] === 'ready' || status[i] === 'stale' || status[i] === 'error') {
      status[i] = 'stale';
      errors[i] = null;
    }
    if (reason === 'source') {
      fingerprints[i] = null;
      if (linked[i]) status[i] = 'idle';
    }
  }

  return {
    themeTransformStatus: status,
    themeTransformFingerprint: fingerprints,
    themeTransformError: errors,
  };
}