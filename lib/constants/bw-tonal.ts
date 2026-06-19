import type { BwFilmGrain, BwTonalLook, BwTonalSettings } from '@/lib/types/studio';

export const DEFAULT_BW_TONAL: BwTonalSettings = {
  look: 'natural',
  contrast: 50,
  shadowDepth: 55,
  highlightTone: 50,
  grain: 'none',
};

export const BW_TONAL_LOOK_LABELS: Record<BwTonalLook, string> = {
  natural: 'Natural Grayscale',
  'high-key': 'High Key',
  'low-key': 'Low Key',
  'film-noir': 'Film Noir',
  silhouette: 'Silhouette',
};

/** Tonal slider + mid-tone defaults applied when a look is selected. */
export const BW_TONAL_LOOK_PRESETS: Record<
  BwTonalLook,
  BwTonalSettings & { midToneExposure: number }
> = {
  natural: {
    look: 'natural',
    contrast: 50,
    shadowDepth: 55,
    highlightTone: 50,
    grain: 'none',
    midToneExposure: 50,
  },
  'high-key': {
    look: 'high-key',
    contrast: 22,
    shadowDepth: 18,
    highlightTone: 82,
    grain: 'none',
    midToneExposure: 72,
  },
  'low-key': {
    look: 'low-key',
    contrast: 65,
    shadowDepth: 82,
    highlightTone: 28,
    grain: 'none',
    midToneExposure: 28,
  },
  'film-noir': {
    look: 'film-noir',
    contrast: 88,
    shadowDepth: 88,
    highlightTone: 40,
    grain: 'subtle',
    midToneExposure: 32,
  },
  silhouette: {
    look: 'silhouette',
    contrast: 92,
    shadowDepth: 96,
    highlightTone: 78,
    grain: 'none',
    midToneExposure: 18,
  },
};

export function getBwLookPreset(look: BwTonalLook) {
  return BW_TONAL_LOOK_PRESETS[look];
}

/** Prompt fragments models reliably pick up (Runway/Artlist/Grok-style guides). */
export const BW_TONAL_LOOK_PROMPTS: Record<BwTonalLook, string> = {
  natural: 'black and white cinematography, natural grayscale tonal range',
  'high-key': 'high key black and white, bright and airy monochrome, low contrast, clean white tones',
  'low-key': 'low key monochrome, deep shadows, moody dark tonal range',
  'film-noir': 'film noir, black and white, chiaroscuro lighting, high contrast monochrome, dramatic shadows',
  silhouette: 'silhouette style, backlit subject, high contrast monochrome, pitch black shadows',
};

export const BW_FILM_GRAIN_LABELS: Record<BwFilmGrain, string> = {
  none: 'None',
  subtle: 'Subtle',
  heavy: 'Heavy',
};

function contrastPrompt(value: number): string {
  if (value < 30) return 'soft low contrast grayscale';
  if (value > 70) return 'high contrast monochrome';
  return 'balanced contrast';
}

function shadowDepthPrompt(value: number): string {
  if (value < 30) return 'lifted shadows, soft gray blacks';
  if (value > 70) return 'crushed blacks, deep ink-black shadows';
  if (value > 50) return 'rich deep blacks';
  return 'natural shadow depth';
}

function highlightTonePrompt(value: number): string {
  if (value < 30) return 'muted highlights, subdued whites';
  if (value > 70) return 'bright clean white highlights';
  return 'natural highlight roll-off';
}

function grainPrompt(grain: BwFilmGrain): string {
  if (grain === 'subtle') return 'subtle film grain, analog silver halide texture';
  if (grain === 'heavy') return 'heavy film grain, gritty analog monochrome texture';
  return '';
}

function midTonePrompt(brightness: number): string {
  if (brightness < 30) return 'dark mid-tones, underexposed grayscale';
  if (brightness > 70) return 'bright mid-tones, luminous grayscale';
  return 'balanced mid-tone exposure';
}

function toneBiasPrompt(warmth: number): string {
  if (warmth > 25) return 'warm ivory-toned black and white';
  if (warmth < -25) return 'cool blue-tinted monochrome';
  if (warmth > 8) return 'slightly warm monochrome toning';
  if (warmth < -8) return 'slightly cool monochrome toning';
  return 'neutral gray toning';
}

export function bwTonalSwatchLightness(bw: BwTonalSettings, brightness: number): number[] {
  const contrast = bw.contrast / 100;
  const shadowDepth = bw.shadowDepth / 100;
  const highlightTone = bw.highlightTone / 100;

  const shadowBase = 42 - shadowDepth * 36;
  const highlightBase = 48 + highlightTone * 46;
  const spread = 0.55 + contrast * 0.55;

  let shadowL = Math.max(2, Math.round(shadowBase - spread * 6));
  let midL = brightness;
  let highlightL = Math.min(98, Math.round(highlightBase + spread * 4));

  if (bw.look === 'high-key') {
    shadowL = Math.max(18, Math.round(28 + (1 - shadowDepth) * 22));
    highlightL = Math.min(98, Math.round(82 + highlightTone * 14));
    midL = Math.max(midL, 58);
  } else if (bw.look === 'low-key') {
    shadowL = Math.max(2, Math.round(6 + shadowDepth * 14));
    highlightL = Math.min(55, Math.round(22 + highlightTone * 22));
    midL = Math.min(midL, 42);
  } else if (bw.look === 'film-noir') {
    shadowL = Math.max(2, Math.round(4 + shadowDepth * 10));
    highlightL = Math.min(88, Math.round(38 + highlightTone * 28));
  } else if (bw.look === 'silhouette') {
    shadowL = Math.max(0, Math.round(2 + (1 - shadowDepth) * 4));
    highlightL = Math.min(98, Math.round(70 + highlightTone * 26));
    midL = Math.min(midL, 28);
  }

  return [shadowL, midL, highlightL];
}

export function buildBwTonalPrompt(
  bw: BwTonalSettings,
  brightness: number,
  warmth: number,
  lightingStyle?: string,
  options?: { includeWarmthBias?: boolean; includeStyleGrade?: boolean },
): string {
  const includeWarmthBias = options?.includeWarmthBias !== false;
  const includeStyleGrade = options?.includeStyleGrade !== false;
  const parts = ['grayscale only, no color', BW_TONAL_LOOK_PROMPTS[bw.look]];

  const lookSetsContrast = bw.look === 'high-key' || bw.look === 'film-noir' || bw.look === 'silhouette';
  if (!lookSetsContrast) {
    parts.push(contrastPrompt(bw.contrast));
  }

  const lookSetsShadows = bw.look === 'low-key' || bw.look === 'film-noir' || bw.look === 'silhouette';
  if (!lookSetsShadows) {
    parts.push(shadowDepthPrompt(bw.shadowDepth));
  }

  const lookSetsHighlights = bw.look === 'high-key';
  if (!lookSetsHighlights) {
    parts.push(highlightTonePrompt(bw.highlightTone));
  }

  parts.push(midTonePrompt(brightness));
  if (includeWarmthBias) parts.push(toneBiasPrompt(warmth));

  const grain = grainPrompt(bw.grain);
  if (grain) parts.push(grain);

  if (
    includeStyleGrade &&
    lightingStyle &&
    ['cinematic', 'dramatic'].includes(lightingStyle) &&
    bw.look !== 'film-noir'
  ) {
    parts.push('cinematic monochrome grading');
  }

  return parts.filter(Boolean).join(', ');
}

export function normalizeBwTonal(
  bw?: Partial<BwTonalSettings> | null,
): BwTonalSettings {
  return {
    ...DEFAULT_BW_TONAL,
    ...bw,
  };
}