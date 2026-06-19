import { buildBwTonalPrompt } from '@/lib/constants/bw-tonal';
import {
  hueToColorName,
  isColorPaletteActive,
  isColorPaletteBw,
  isColorPaletteFx,
  resolvePaletteHues,
  schemePromptName,
} from '@/lib/constants/color-palette';
import { getLookRecipe } from '@/lib/constants/look-recipes';
import { resolveThemeTransformLightingInclusion } from '@/lib/constants/theme-transform-lighting';
import { buildFxColorPrompt } from '@/lib/studio/fx-color-prompt';
import type { LightingSettings, ThemeTransformLightingInclusion } from '@/lib/types/studio';

function saturationDescriptor(value: number): string {
  if (value < 30) return 'muted saturation';
  if (value > 70) return 'vivid saturation';
  return 'balanced saturation';
}

function brightnessDescriptor(value: number, style: string): string {
  if (value < 30 || style === 'low-key') return 'moody low-key brightness';
  if (value > 70 || style === 'high-key') return 'bright high-key exposure';
  return 'balanced brightness';
}

function warmthDescriptor(warmth: number): string {
  if (warmth > 25) return 'warm key light';
  if (warmth < -25) return 'cool key light';
  if (warmth > 8) return 'slightly warm key light';
  if (warmth < -8) return 'slightly cool key light';
  return 'neutral key light';
}

function uniqueColorNames(hues: number[]): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const hue of hues) {
    const name = hueToColorName(hue);
    if (!seen.has(name)) {
      seen.add(name);
      names.push(name);
    }
  }
  return names;
}

function appendGarnish(base: string, recipeId: string | null): string {
  const garnish = getLookRecipe(recipeId)?.promptGarnish?.trim();
  if (!garnish) return base;
  return base ? `${base}, ${garnish}` : garnish;
}

function buildPalettePrompt(
  lighting: LightingSettings,
  include: ThemeTransformLightingInclusion,
): string {
  const palette = lighting.colorPalette;
  if (!palette || !isColorPaletteActive(palette)) return '';

  const styleForPalette = include.style ? lighting.style : undefined;
  const recipeId = palette.activeLookRecipeId ?? null;

  if (isColorPaletteFx(palette)) {
    return appendGarnish(buildFxColorPrompt(palette, styleForPalette), recipeId);
  }

  if (isColorPaletteBw(palette)) {
    const tonal = buildBwTonalPrompt(
      palette.bw,
      palette.brightness,
      palette.keyLightWarmth,
      styleForPalette,
      {
        includeWarmthBias: include.colorTemp,
        includeStyleGrade: include.style,
      },
    );
    const prefix = styleForPalette ? `${styleForPalette.replace(/-/g, ' ')} lighting, ` : '';
    return appendGarnish(`${prefix}${tonal}`, recipeId);
  }

  const { dominant, accents } = resolvePaletteHues(palette);
  const dominantName = hueToColorName(dominant);
  const accentNames = uniqueColorNames(accents).filter((n) => n !== dominantName);

  const schemePart = accentNames.length
    ? `${schemePromptName(palette.scheme)} color scheme with dominant ${dominantName} and ${accentNames.join(' and ')} accents for practical lights and highlights`
    : `${schemePromptName(palette.scheme)} color scheme with dominant ${dominantName}`;

  const brightnessStyle = include.style ? lighting.style : '';
  const parts: string[] = [schemePart, saturationDescriptor(palette.saturation)];

  if (include.style) {
    parts.unshift(`${lighting.style.replace(/-/g, ' ')} lighting`);
  }

  parts.push(brightnessDescriptor(palette.brightness, brightnessStyle));

  if (include.colorTemp) {
    parts.push(warmthDescriptor(palette.keyLightWarmth));
  }

  if (
    include.style &&
    ['cinematic', 'dramatic', 'neon'].includes(lighting.style)
  ) {
    parts.push('filmic color grading');
  }

  return appendGarnish(parts.join(', '), recipeId);
}

function buildOptionalLightingPhrases(
  lighting: LightingSettings,
  include: ThemeTransformLightingInclusion,
): string[] {
  const palette = lighting.colorPalette;
  const phrases: string[] = [];

  if (include.keyLight) {
    phrases.push(`${lighting.keyLight.replace(/-/g, ' ')} key light`);
  }
  if (include.timeOfDay) {
    phrases.push(`${lighting.timeOfDay.replace(/-/g, ' ')} time of day`);
  }
  if (
    include.colorTemp &&
    palette &&
    isColorPaletteFx(palette)
  ) {
    phrases.push(`${lighting.colorTemp}K color temperature`);
  }
  if (include.atmosphere) {
    phrases.push(`${lighting.atmosphere.replace(/-/g, ' ')} atmosphere`);
  }

  return phrases;
}

/** Palette + opt-in lighting phrases for Theme Transformer image-reference prompts. */
export function buildThemeTransformLookPrompt(lighting: LightingSettings): string {
  const include = resolveThemeTransformLightingInclusion(lighting);
  const palettePart = buildPalettePrompt(lighting, include);
  const lightingParts = buildOptionalLightingPhrases(lighting, include);

  const combined = [palettePart, ...lightingParts].filter(Boolean).join(', ');

  if (!combined) return '';

  // Avoid duplicate phrases when style is enabled in both palette and lighting sections.
  const seen = new Set<string>();
  return combined
    .split(', ')
    .filter((phrase) => {
      const key = phrase.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(', ');
}