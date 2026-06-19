import {
  hueToColorName,
  normalizeHue,
} from '@/lib/constants/color-palette';
import { buildBwTonalPrompt } from '@/lib/constants/bw-tonal';
import type { ColorPaletteSettings } from '@/lib/types/studio';

function spectrumBiasDescriptor(value: number): string {
  if (value < 30) return 'narrow surreal spectrum';
  if (value > 70) return 'wide exaggerated false-color spectrum';
  return 'shifted false-color spectrum';
}

function duotoneBalanceDescriptor(value: number): string {
  if (value < 35) return 'primary-dominant duotone';
  if (value > 65) return 'secondary-dominant duotone';
  return 'balanced duotone split';
}

function accentStrengthDescriptor(value: number): string {
  if (value < 35) return 'subtle accent isolation';
  if (value > 70) return 'bold selective color accent';
  return 'moderate accent isolation';
}

export function buildFalseColorPrompt(
  palette: ColorPaletteSettings,
  lightingStyle?: string,
): string {
  const dominantName = hueToColorName(palette.dominantHue);
  const parts: string[] = [];
  if (lightingStyle) {
    parts.push(`${lightingStyle.replace(/-/g, ' ')} lighting`);
  }
  parts.push(
    'false color grading, surreal spectrum remap',
    `dominant ${dominantName} false-color cast`,
    spectrumBiasDescriptor(palette.spectrumBias),
    palette.saturation > 70 ? 'hyper-saturated false color' : 'saturated false color',
  );
  return parts.join(', ');
}

export function buildDuotonePrompt(
  palette: ColorPaletteSettings,
  lightingStyle?: string,
): string {
  const primary = hueToColorName(palette.dominantHue);
  const secondary = hueToColorName(palette.secondaryHue);
  const parts: string[] = [];
  if (lightingStyle) {
    parts.push(`${lightingStyle.replace(/-/g, ' ')} lighting`);
  }
  parts.push(
    `full-frame duotone color grading with ${primary} shadows and ${secondary} highlights across subject and environment`,
    duotoneBalanceDescriptor(palette.duotoneBalance),
    palette.saturation < 35 ? 'muted duotone' : 'rich duotone color grading',
    'strong visible two-tone color split, not naturalistic color',
  );
  return parts.join(', ');
}

export function buildAccentSplashPrompt(
  palette: ColorPaletteSettings,
  lightingStyle?: string,
): string {
  const accentHue = normalizeHue(palette.accentHue ?? palette.dominantHue);
  const accentName = hueToColorName(accentHue);
  const tonal = buildBwTonalPrompt(
    palette.bw,
    palette.brightness,
    palette.keyLightWarmth,
    lightingStyle,
    { includeWarmthBias: true, includeStyleGrade: Boolean(lightingStyle) },
  );
  const parts = [
    tonal,
    `selective color, isolated ${accentName} accent only`,
    accentStrengthDescriptor(palette.accentStrength),
  ];
  return parts.join(', ');
}

export function buildFxColorPrompt(
  palette: ColorPaletteSettings,
  lightingStyle?: string,
): string {
  switch (palette.mode) {
    case 'false-color':
      return buildFalseColorPrompt(palette, lightingStyle);
    case 'duotone':
      return buildDuotonePrompt(palette, lightingStyle);
    case 'accent-splash':
      return buildAccentSplashPrompt(palette, lightingStyle);
    default:
      return '';
  }
}