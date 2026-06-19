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
import { buildFxColorPrompt } from '@/lib/studio/fx-color-prompt';
import type { LightingSettings } from '@/lib/types/studio';

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

export function buildColorMoodPrompt(lighting: LightingSettings): string {
  const palette = lighting.colorPalette;
  if (!palette || !isColorPaletteActive(palette)) return '';

  if (isColorPaletteFx(palette)) {
    return appendGarnish(buildFxColorPrompt(palette, lighting.style), palette.activeLookRecipeId);
  }

  if (isColorPaletteBw(palette)) {
    const tonal = buildBwTonalPrompt(
      palette.bw,
      palette.brightness,
      palette.keyLightWarmth,
      lighting.style,
    );
    return appendGarnish(
      `${lighting.style.replace(/-/g, ' ')} lighting, ${tonal}`,
      palette.activeLookRecipeId,
    );
  }

  const { dominant, accents } = resolvePaletteHues(palette);
  const dominantName = hueToColorName(dominant);
  const accentNames = uniqueColorNames(accents).filter((n) => n !== dominantName);

  const schemePart = accentNames.length
    ? `${schemePromptName(palette.scheme)} color scheme with dominant ${dominantName} and ${accentNames.join(' and ')} accents for practical lights and highlights`
    : `${schemePromptName(palette.scheme)} color scheme with dominant ${dominantName}`;

  const parts: string[] = [
    `${lighting.style.replace(/-/g, ' ')} lighting`,
    schemePart,
    saturationDescriptor(palette.saturation),
    brightnessDescriptor(palette.brightness, lighting.style),
    warmthDescriptor(palette.keyLightWarmth),
  ];

  if (['cinematic', 'dramatic', 'neon'].includes(lighting.style)) {
    parts.push('filmic color grading');
  }

  return appendGarnish(parts.join(', '), palette.activeLookRecipeId);
}