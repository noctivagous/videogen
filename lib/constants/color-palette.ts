import { DEFAULT_BW_TONAL, bwTonalSwatchLightness, normalizeBwTonal } from '@/lib/constants/bw-tonal';
import type {
  ColorPaletteMode,
  ColorPaletteSettings,
  ColorScheme,
  FxColorMode,
} from '@/lib/types/studio';

export const DEFAULT_COLOR_PALETTE: ColorPaletteSettings = {
  mode: 'color',
  dominantHue: 195,
  scheme: 'split-complementary',
  saturation: 65,
  brightness: 35,
  keyLightWarmth: 15,
  accentHue: null,
  secondaryHue: 45,
  duotoneBalance: 50,
  accentStrength: 75,
  spectrumBias: 50,
  activeLookRecipeId: null,
  bw: { ...DEFAULT_BW_TONAL },
};

export const FX_COLOR_MODES: FxColorMode[] = ['false-color', 'duotone', 'accent-splash'];

export const FX_MODE_LABELS: Record<FxColorMode, string> = {
  'false-color': 'False Color',
  duotone: 'Duotone',
  'accent-splash': 'Accent Splash',
};

export function isFxColorMode(mode: ColorPaletteMode): mode is FxColorMode {
  return FX_COLOR_MODES.includes(mode as FxColorMode);
}

export function parentColorMode(mode: ColorPaletteMode): 'color' | 'bw' | 'fx' | 'off' {
  if (isFxColorMode(mode)) return 'fx';
  return mode;
}

const SCHEME_OFFSETS: Record<ColorScheme, number[]> = {
  analogous: [-30, 30],
  complementary: [180],
  'split-complementary': [150, 210],
  triadic: [120, 240],
  tetradic: [90, 180, 270],
  monochromatic: [],
};

export const COLOR_SCHEME_LABELS: Record<ColorScheme, string> = {
  analogous: 'Analogous',
  complementary: 'Complementary',
  'split-complementary': 'Split-Comp',
  triadic: 'Triadic',
  tetradic: 'Tetradic',
  monochromatic: 'Mono',
};

export function normalizeHue(hue: number): number {
  return ((hue % 360) + 360) % 360;
}

export function schemeHueOffsets(scheme: ColorScheme): number[] {
  return SCHEME_OFFSETS[scheme];
}

export function harmonyAccentHues(palette: ColorPaletteSettings): number[] {
  const dominant = normalizeHue(palette.dominantHue);
  return schemeHueOffsets(palette.scheme).map((offset) => normalizeHue(dominant + offset));
}

export function resolvePaletteHues(palette: ColorPaletteSettings): {
  dominant: number;
  accents: number[];
} {
  const dominant = normalizeHue(palette.dominantHue);
  if (palette.accentHue != null) {
    return { dominant, accents: [normalizeHue(palette.accentHue)] };
  }
  return { dominant, accents: harmonyAccentHues(palette) };
}

export function hueToColorName(hue: number): string {
  const h = normalizeHue(hue);
  if (h < 15 || h >= 345) return 'red';
  if (h < 35) return 'orange-red';
  if (h < 50) return 'orange';
  if (h < 65) return 'amber';
  if (h < 80) return 'gold';
  if (h < 95) return 'yellow';
  if (h < 110) return 'chartreuse';
  if (h < 135) return 'lime';
  if (h < 155) return 'green';
  if (h < 175) return 'teal-green';
  if (h < 205) return 'teal';
  if (h < 220) return 'cyan';
  if (h < 235) return 'azure';
  if (h < 255) return 'blue';
  if (h < 275) return 'indigo';
  if (h < 295) return 'violet';
  if (h < 315) return 'magenta';
  if (h < 335) return 'rose';
  return 'crimson';
}

export function schemePromptName(scheme: ColorScheme): string {
  return scheme.replace(/-/g, ' ');
}

function hueToRgb(h: number, s: number, l: number): [number, number, number] {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

export function hslToHex(h: number, s: number, l: number): string {
  const [r, g, b] = hueToRgb(normalizeHue(h), s, l);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function paletteSwatchColor(palette: ColorPaletteSettings, hue?: number): string {
  const h = hue ?? palette.dominantHue;
  return hslToHex(h, palette.saturation, Math.max(20, palette.brightness));
}

export function warmthToKelvin(warmth: number): number {
  const clamped = Math.max(-100, Math.min(100, warmth));
  if (clamped >= 0) return Math.round(5500 + (clamped / 100) * 4500);
  return Math.round(5500 + (clamped / 100) * 3500);
}

export function kelvinToWarmth(kelvin: number): number {
  const k = Math.max(2000, Math.min(10000, kelvin));
  if (k >= 5500) return Math.round(((k - 5500) / 4500) * 100);
  return Math.round(((k - 5500) / 3500) * 100);
}

export function isColorPaletteActive(palette: ColorPaletteSettings): boolean {
  return palette.mode !== 'off';
}

export function isColorPaletteBw(palette: ColorPaletteSettings): boolean {
  return palette.mode === 'bw';
}

export function isColorPaletteFx(palette: ColorPaletteSettings): boolean {
  return isFxColorMode(palette.mode);
}

export interface PaletteDisplayEntry {
  value: number;
  name: string;
}

const BW_SWATCH_NAMES = ['Shadow', 'Mid-tone', 'Highlight'] as const;

function falseColorSpectrumHues(palette: ColorPaletteSettings): number[] {
  const base = normalizeHue(palette.dominantHue);
  const bias = palette.spectrumBias / 100;
  const spread = 40 + bias * 50;
  return [
    normalizeHue(base - spread),
    normalizeHue(base - spread * 0.35),
    base,
    normalizeHue(base + spread * 0.45),
    normalizeHue(base + spread),
  ];
}

function duotoneSwatchLightness(palette: ColorPaletteSettings): [number, number] {
  const balance = palette.duotoneBalance / 100;
  const primaryL = Math.round(28 + (1 - balance) * 42);
  const secondaryL = Math.round(28 + balance * 42);
  return [primaryL, secondaryL];
}

export function paletteDisplayValues(palette: ColorPaletteSettings): number[] {
  if (isColorPaletteBw(palette)) {
    return bwTonalSwatchLightness(palette.bw, palette.brightness);
  }
  if (palette.mode === 'false-color') {
    return falseColorSpectrumHues(palette);
  }
  if (palette.mode === 'duotone') {
    const [primaryL, secondaryL] = duotoneSwatchLightness(palette);
    return [primaryL, secondaryL];
  }
  if (palette.mode === 'accent-splash') {
    const grays = bwTonalSwatchLightness(palette.bw, palette.brightness);
    const accentHue = palette.accentHue ?? palette.dominantHue;
    return [...grays, normalizeHue(accentHue)];
  }
  const dominant = normalizeHue(palette.dominantHue);
  return [dominant, ...harmonyAccentHues(palette)];
}

export function paletteDisplayEntries(palette: ColorPaletteSettings): PaletteDisplayEntry[] {
  const values = paletteDisplayValues(palette);
  if (isColorPaletteBw(palette)) {
    return values.map((value, i) => ({
      value,
      name: BW_SWATCH_NAMES[i] ?? `Gray ${Math.round(value)}%`,
    }));
  }
  if (palette.mode === 'false-color') {
    const labels = ['Shadow cast', 'Cool shift', 'Dominant', 'Warm shift', 'Highlight cast'];
    return values.map((value, i) => ({
      value,
      name: labels[i] ?? hueToColorName(value),
    }));
  }
  if (palette.mode === 'duotone') {
    return [
      { value: values[0], name: `Primary ${hueToColorName(palette.dominantHue)}` },
      { value: values[1], name: `Secondary ${hueToColorName(palette.secondaryHue)}` },
    ];
  }
  if (palette.mode === 'accent-splash') {
    const accentHue = palette.accentHue ?? palette.dominantHue;
    return values.map((value, i) => {
      if (i < 3) {
        return { value, name: BW_SWATCH_NAMES[i] ?? `Gray ${Math.round(value)}%` };
      }
      return { value, name: `Accent ${hueToColorName(accentHue)}` };
    });
  }
  return values.map((value) => ({
    value,
    name: hueToColorName(value),
  }));
}

export function paletteSwatchCss(palette: ColorPaletteSettings, value: number, index?: number): string {
  if (isColorPaletteBw(palette)) {
    return hslToHex(0, 0, value);
  }
  if (palette.mode === 'false-color') {
    const sat = Math.min(100, palette.saturation + 10);
    const light = index === 0 ? 22 : index === 4 ? 78 : 48 + (palette.brightness - 50) * 0.25;
    return hslToHex(value, sat, Math.max(15, Math.min(90, light)));
  }
  if (palette.mode === 'duotone') {
    const hue = index === 1 ? palette.secondaryHue : palette.dominantHue;
    return hslToHex(hue, palette.saturation, value);
  }
  if (palette.mode === 'accent-splash') {
    if (index !== undefined && index >= 3) {
      const accentHue = palette.accentHue ?? palette.dominantHue;
      const strength = palette.accentStrength / 100;
      return hslToHex(accentHue, Math.round(40 + strength * 55), 52);
    }
    return hslToHex(0, 0, value);
  }
  return paletteSwatchColor(palette, value);
}

function normalizePaletteMode(
  palette?: Partial<ColorPaletteSettings> & { enabled?: boolean } | null,
): ColorPaletteMode {
  if (palette?.mode) return palette.mode;
  if (palette?.enabled === false) return 'off';
  return DEFAULT_COLOR_PALETTE.mode;
}

export function normalizeColorPalette(
  palette?: Partial<ColorPaletteSettings> & { enabled?: boolean } | null,
): ColorPaletteSettings {
  const { enabled: _enabled, bw, ...rest } = palette ?? {};
  return {
    ...DEFAULT_COLOR_PALETTE,
    ...rest,
    mode: normalizePaletteMode(palette),
    dominantHue: normalizeHue(palette?.dominantHue ?? DEFAULT_COLOR_PALETTE.dominantHue),
    accentHue:
      palette?.accentHue != null ? normalizeHue(palette.accentHue) : palette?.accentHue ?? null,
    secondaryHue: normalizeHue(palette?.secondaryHue ?? DEFAULT_COLOR_PALETTE.secondaryHue),
    duotoneBalance: Math.max(0, Math.min(100, palette?.duotoneBalance ?? DEFAULT_COLOR_PALETTE.duotoneBalance)),
    accentStrength: Math.max(0, Math.min(100, palette?.accentStrength ?? DEFAULT_COLOR_PALETTE.accentStrength)),
    spectrumBias: Math.max(0, Math.min(100, palette?.spectrumBias ?? DEFAULT_COLOR_PALETTE.spectrumBias)),
    activeLookRecipeId: palette?.activeLookRecipeId ?? null,
    bw: normalizeBwTonal(bw ?? palette?.bw),
  };
}