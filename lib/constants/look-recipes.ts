import { getBwLookPreset } from '@/lib/constants/bw-tonal';
import { normalizeColorPalette } from '@/lib/constants/color-palette';
import type { ColorPaletteSettings, LightingSettings } from '@/lib/types/studio';

export type LookCategory =
  | 'daylight'
  | 'shadow'
  | 'vintage-print'
  | 'blockbuster'
  | 'neon-night'
  | 'surreality'
  | 'worlds';

export const LOOK_CATEGORY_LABELS: Record<LookCategory, string> = {
  daylight: 'Daylight',
  shadow: 'Shadow',
  'vintage-print': 'Vintage Print',
  blockbuster: 'Blockbuster',
  'neon-night': 'Neon & Night',
  surreality: 'Surreality',
  worlds: 'Worlds',
};

export const LOOK_CATEGORIES: LookCategory[] = [
  'daylight',
  'shadow',
  'vintage-print',
  'blockbuster',
  'neon-night',
  'surreality',
  'worlds',
];

export interface LookRecipe {
  id: string;
  category: LookCategory;
  label: string;
  description: string;
  patch: {
    colorPalette?: Partial<ColorPaletteSettings>;
    lighting?: Partial<Omit<LightingSettings, 'colorPalette'>>;
  };
  promptGarnish?: string;
}

function bwPatch(look: ColorPaletteSettings['bw']['look']): Partial<ColorPaletteSettings> {
  const preset = getBwLookPreset(look);
  const { midToneExposure, ...bw } = preset;
  return {
    mode: 'bw',
    bw,
    brightness: midToneExposure,
    activeLookRecipeId: undefined,
  };
}

export const LOOK_RECIPES: LookRecipe[] = [
  // Daylight (3)
  {
    id: 'daylight-warm-dusk',
    category: 'daylight',
    label: 'Warm Dusk',
    description: 'Golden sunset warmth with rich amber tones',
    patch: {
      colorPalette: {
        mode: 'color',
        dominantHue: 38,
        scheme: 'analogous',
        saturation: 72,
        brightness: 48,
        keyLightWarmth: 55,
        accentHue: null,
      },
      lighting: { style: 'golden-hour', timeOfDay: 'sunset', colorTemp: 4200, atmosphere: 'clear' },
    },
    promptGarnish: 'magic hour glow, long sunset shadows',
  },
  {
    id: 'daylight-cool-twilight',
    category: 'daylight',
    label: 'Cool Twilight',
    description: 'Blue-hour cool cast with soft twilight mood',
    patch: {
      colorPalette: {
        mode: 'color',
        dominantHue: 215,
        scheme: 'analogous',
        saturation: 42,
        brightness: 32,
        keyLightWarmth: -48,
        accentHue: null,
      },
      lighting: { style: 'blue-hour', timeOfDay: 'dusk', colorTemp: 7500, atmosphere: 'clear' },
    },
    promptGarnish: 'civil twilight ambience, cool ambient skylight',
  },
  {
    id: 'daylight-bright-airy',
    category: 'daylight',
    label: 'Bright Airy',
    description: 'High-key daylight with clean luminous tones',
    patch: {
      colorPalette: {
        mode: 'color',
        dominantHue: 52,
        scheme: 'monochromatic',
        saturation: 28,
        brightness: 78,
        keyLightWarmth: 12,
        accentHue: null,
      },
      lighting: { style: 'high-key', timeOfDay: 'morning', colorTemp: 5800, atmosphere: 'clear', intensity: 72 },
    },
  },
  // Shadow (3)
  {
    id: 'shadow-detective-noir',
    category: 'shadow',
    label: 'Detective Noir',
    description: 'High-contrast monochrome with deep chiaroscuro',
    patch: {
      colorPalette: bwPatch('film-noir'),
      lighting: { style: 'low-key', timeOfDay: 'night', colorTemp: 3200, atmosphere: 'clear', keyLight: 'hard' },
    },
  },
  {
    id: 'shadow-backlit-shape',
    category: 'shadow',
    label: 'Backlit Shape',
    description: 'Silhouette framing with rim-lit edges',
    patch: {
      colorPalette: bwPatch('silhouette'),
      lighting: { style: 'dramatic', timeOfDay: 'sunset', colorTemp: 4500, atmosphere: 'clear', keyLight: 'backlight' },
    },
    promptGarnish: 'rim-lit silhouette edges, subject as graphic shape',
  },
  {
    id: 'shadow-bleak-overcast',
    category: 'shadow',
    label: 'Bleak Overcast',
    description: 'Desaturated cool grays under flat overcast light',
    patch: {
      colorPalette: {
        mode: 'color',
        dominantHue: 200,
        scheme: 'monochromatic',
        saturation: 18,
        brightness: 28,
        keyLightWarmth: -22,
        accentHue: null,
      },
      lighting: { style: 'natural', timeOfDay: 'afternoon', colorTemp: 6200, atmosphere: 'misty', intensity: 45 },
    },
    promptGarnish: 'bleak overcast sky, flat diffused light, muted world',
  },
  // Vintage Print (4)
  {
    id: 'vintage-archive-warmth',
    category: 'vintage-print',
    label: 'Archive Warmth',
    description: 'Faded warm print tones with gentle fade',
    patch: {
      colorPalette: {
        mode: 'color',
        dominantHue: 32,
        scheme: 'analogous',
        saturation: 38,
        brightness: 42,
        keyLightWarmth: 38,
        accentHue: null,
      },
      lighting: { style: 'cinematic', timeOfDay: 'afternoon', colorTemp: 4800, atmosphere: 'dusty' },
    },
    promptGarnish: 'vintage photograph warmth, faded archival print',
  },
  {
    id: 'vintage-hyper-classic',
    category: 'vintage-print',
    label: 'Hyper Classic',
    description: 'Punchy classic grade with rich mid-tones',
    patch: {
      colorPalette: {
        mode: 'color',
        dominantHue: 28,
        scheme: 'complementary',
        saturation: 58,
        brightness: 45,
        keyLightWarmth: 25,
        accentHue: 205,
      },
      lighting: { style: 'cinematic', timeOfDay: 'afternoon', colorTemp: 5200, atmosphere: 'clear' },
    },
    promptGarnish: 'classic Hollywood color timing, rich photochemical grade',
  },
  {
    id: 'vintage-antique-tint',
    category: 'vintage-print',
    label: 'Antique Tint',
    description: 'Sepia-leaning antique paper warmth',
    patch: {
      colorPalette: {
        mode: 'color',
        dominantHue: 42,
        scheme: 'monochromatic',
        saturation: 32,
        brightness: 38,
        keyLightWarmth: 62,
        accentHue: null,
      },
      lighting: { style: 'natural', timeOfDay: 'morning', colorTemp: 4000, atmosphere: 'dusty' },
    },
    promptGarnish: 'antique sepia tint, aged paper warmth',
  },
  {
    id: 'vintage-silver-grit',
    category: 'vintage-print',
    label: 'Silver Grit',
    description: 'High-contrast bleach-bypass with metallic grit',
    patch: {
      colorPalette: {
        mode: 'color',
        dominantHue: 195,
        scheme: 'monochromatic',
        saturation: 22,
        brightness: 40,
        keyLightWarmth: -8,
        accentHue: null,
      },
      lighting: { style: 'dramatic', timeOfDay: 'noon', colorTemp: 5600, atmosphere: 'dusty', intensity: 68 },
    },
    promptGarnish: 'bleach bypass look, desaturated high contrast, metallic grit',
  },
  // Blockbuster (3)
  {
    id: 'blockbuster-complementary-punch',
    category: 'blockbuster',
    label: 'Complementary Punch',
    description: 'Teal shadows with warm orange highlights',
    patch: {
      colorPalette: {
        mode: 'color',
        dominantHue: 192,
        scheme: 'complementary',
        saturation: 68,
        brightness: 42,
        keyLightWarmth: 18,
        accentHue: 28,
      },
      lighting: { style: 'cinematic', timeOfDay: 'afternoon', colorTemp: 5400, atmosphere: 'clear' },
    },
    promptGarnish: 'blockbuster teal and orange grade, commercial color contrast',
  },
  {
    id: 'blockbuster-desaturated-epic',
    category: 'blockbuster',
    label: 'Desaturated Epic',
    description: 'Muted epic grade with restrained color',
    patch: {
      colorPalette: {
        mode: 'color',
        dominantHue: 210,
        scheme: 'analogous',
        saturation: 24,
        brightness: 36,
        keyLightWarmth: -12,
        accentHue: null,
      },
      lighting: { style: 'cinematic', timeOfDay: 'dawn', colorTemp: 6000, atmosphere: 'misty' },
    },
    promptGarnish: 'desaturated epic blockbuster grade, restrained color palette',
  },
  {
    id: 'blockbuster-warm-hero',
    category: 'blockbuster',
    label: 'Warm Hero',
    description: 'Sun-drenched warm blockbuster skin tones',
    patch: {
      colorPalette: {
        mode: 'color',
        dominantHue: 24,
        scheme: 'split-complementary',
        saturation: 62,
        brightness: 52,
        keyLightWarmth: 42,
        accentHue: 195,
      },
      lighting: { style: 'cinematic', timeOfDay: 'sunset', colorTemp: 4600, atmosphere: 'clear', intensity: 70 },
    },
    promptGarnish: 'warm hero lighting, sun-kissed blockbuster skin tones',
  },
  // Neon & Night (4)
  {
    id: 'neon-electric-city',
    category: 'neon-night',
    label: 'Electric City',
    description: 'Cyberpunk magenta-cyan neon contrast',
    patch: {
      colorPalette: {
        mode: 'color',
        dominantHue: 300,
        scheme: 'complementary',
        saturation: 88,
        brightness: 38,
        keyLightWarmth: -15,
        accentHue: 185,
      },
      lighting: { style: 'neon', timeOfDay: 'night', colorTemp: 6500, atmosphere: 'rainy', intensity: 65 },
    },
    promptGarnish: 'neon-drenched city streets, electric signage glow',
  },
  {
    id: 'neon-tungsten-glow',
    category: 'neon-night',
    label: 'Tungsten Glow',
    description: 'Warm tungsten practicals in a dark interior',
    patch: {
      colorPalette: {
        mode: 'color',
        dominantHue: 28,
        scheme: 'analogous',
        saturation: 55,
        brightness: 32,
        keyLightWarmth: 72,
        accentHue: null,
      },
      lighting: { style: 'low-key', timeOfDay: 'night', colorTemp: 3200, atmosphere: 'clear', keyLight: 'soft', intensity: 48 },
    },
    promptGarnish: 'tungsten practical lamps, warm interior night glow',
  },
  {
    id: 'neon-street-sodium',
    category: 'neon-night',
    label: 'Street Sodium',
    description: 'Orange sodium-vapor streetlight cast',
    patch: {
      colorPalette: {
        mode: 'color',
        dominantHue: 35,
        scheme: 'monochromatic',
        saturation: 62,
        brightness: 30,
        keyLightWarmth: 58,
        accentHue: null,
      },
      lighting: { style: 'natural', timeOfDay: 'night', colorTemp: 2800, atmosphere: 'foggy', intensity: 42 },
    },
    promptGarnish: 'sodium vapor streetlights, amber urban night haze',
  },
  {
    id: 'neon-candle-intimacy',
    category: 'neon-night',
    label: 'Candle Intimacy',
    description: 'Soft candlelight warmth in close quarters',
    patch: {
      colorPalette: {
        mode: 'color',
        dominantHue: 42,
        scheme: 'monochromatic',
        saturation: 48,
        brightness: 28,
        keyLightWarmth: 82,
        accentHue: null,
      },
      lighting: { style: 'low-key', timeOfDay: 'night', colorTemp: 2400, atmosphere: 'clear', keyLight: 'soft', intensity: 35 },
    },
    promptGarnish: 'intimate candlelight, flickering warm practical glow',
  },
  // Surreality (5)
  {
    id: 'surreality-false-color',
    category: 'surreality',
    label: 'False Color',
    description: 'Infrared-style surreal spectrum remap',
    patch: {
      colorPalette: {
        mode: 'false-color',
        dominantHue: 330,
        scheme: 'complementary',
        saturation: 85,
        brightness: 55,
        keyLightWarmth: 10,
        spectrumBias: 72,
        accentHue: 120,
      },
      lighting: { style: 'cinematic', timeOfDay: 'noon', colorTemp: 5500, atmosphere: 'clear' },
    },
    promptGarnish: 'infrared photography, false color, surreal foliage tones',
  },
  {
    id: 'surreality-heat-map',
    category: 'surreality',
    label: 'Heat Map',
    description: 'Thermal imaging heat-map palette',
    patch: {
      colorPalette: {
        mode: 'false-color',
        dominantHue: 8,
        scheme: 'triadic',
        saturation: 92,
        brightness: 48,
        keyLightWarmth: 35,
        spectrumBias: 85,
        accentHue: 55,
      },
      lighting: { style: 'dramatic', timeOfDay: 'night', colorTemp: 5000, atmosphere: 'clear' },
    },
    promptGarnish: 'thermal imaging heat map, hot and cold false-color gradients',
  },
  {
    id: 'surreality-surveillance-green',
    category: 'surreality',
    label: 'Surveillance Green',
    description: 'Night-vision green cast with grain',
    patch: {
      colorPalette: {
        mode: 'false-color',
        dominantHue: 125,
        scheme: 'monochromatic',
        saturation: 55,
        brightness: 35,
        keyLightWarmth: -35,
        spectrumBias: 30,
        accentHue: null,
        bw: { ...getBwLookPreset('natural'), grain: 'subtle' },
      },
      lighting: { style: 'low-key', timeOfDay: 'night', colorTemp: 7000, atmosphere: 'clear', intensity: 38 },
    },
    promptGarnish: 'night vision green phosphor, surveillance camera aesthetic',
  },
  {
    id: 'surreality-duotone-pop',
    category: 'surreality',
    label: 'Duotone Pop',
    description: 'Bold two-hue graphic duotone grade',
    patch: {
      colorPalette: {
        mode: 'duotone',
        dominantHue: 260,
        secondaryHue: 42,
        duotoneBalance: 45,
        saturation: 72,
        brightness: 45,
        keyLightWarmth: 5,
        accentHue: null,
      },
      lighting: { style: 'cinematic', timeOfDay: 'dusk', colorTemp: 5600, atmosphere: 'clear' },
    },
    promptGarnish: 'graphic duotone pop art grading',
  },
  {
    id: 'surreality-isolated-accent',
    category: 'surreality',
    label: 'Isolated Accent',
    description: 'Monochrome world with one vivid accent color',
    patch: {
      colorPalette: {
        mode: 'accent-splash',
        dominantHue: 0,
        accentHue: 0,
        accentStrength: 82,
        brightness: getBwLookPreset('film-noir').midToneExposure,
        keyLightWarmth: 0,
        bw: getBwLookPreset('film-noir'),
      },
      lighting: { style: 'dramatic', timeOfDay: 'night', colorTemp: 4500, atmosphere: 'clear' },
    },
    promptGarnish: 'sin city selective color, vivid red accent on monochrome',
  },
  // Worlds (5)
  {
    id: 'worlds-eco-bright',
    category: 'worlds',
    label: 'Eco Bright',
    description: 'Lush saturated greens with sunlit clarity',
    patch: {
      colorPalette: {
        mode: 'color',
        dominantHue: 135,
        scheme: 'analogous',
        saturation: 75,
        brightness: 58,
        keyLightWarmth: 8,
        accentHue: 95,
      },
      lighting: { style: 'natural', timeOfDay: 'morning', colorTemp: 5800, atmosphere: 'clear', intensity: 75 },
    },
    promptGarnish: 'lush eco-bright foliage, vibrant natural greens',
  },
  {
    id: 'worlds-brass-age',
    category: 'worlds',
    label: 'Brass Age',
    description: 'Steampunk brass and copper industrial warmth',
    patch: {
      colorPalette: {
        mode: 'color',
        dominantHue: 32,
        scheme: 'split-complementary',
        saturation: 52,
        brightness: 38,
        keyLightWarmth: 48,
        accentHue: 195,
      },
      lighting: { style: 'dramatic', timeOfDay: 'afternoon', colorTemp: 4200, atmosphere: 'dusty', intensity: 55 },
    },
    promptGarnish: 'steampunk brass and copper tones, industrial age warmth',
  },
  {
    id: 'worlds-terminal-cast',
    category: 'worlds',
    label: 'Terminal Cast',
    description: 'Matrix-green phosphor terminal glow',
    patch: {
      colorPalette: {
        mode: 'color',
        dominantHue: 145,
        scheme: 'monochromatic',
        saturation: 65,
        brightness: 28,
        keyLightWarmth: -42,
        accentHue: null,
      },
      lighting: { style: 'neon', timeOfDay: 'night', colorTemp: 7200, atmosphere: 'clear', intensity: 40 },
    },
    promptGarnish: 'phosphor green terminal glow, digital world cast',
  },
  {
    id: 'worlds-pastel-stage',
    category: 'worlds',
    label: 'Pastel Stage',
    description: 'Soft pastel production design palette',
    patch: {
      colorPalette: {
        mode: 'color',
        dominantHue: 200,
        scheme: 'tetradic',
        saturation: 38,
        brightness: 72,
        keyLightWarmth: 5,
        accentHue: 320,
      },
      lighting: { style: 'high-key', timeOfDay: 'morning', colorTemp: 6000, atmosphere: 'clear', intensity: 68 },
    },
    promptGarnish: 'pastel production design, whimsical soft color blocking',
  },
  {
    id: 'worlds-nordic-noir',
    category: 'worlds',
    label: 'Nordic Noir',
    description: 'Cool desaturated nordic crime-drama palette',
    patch: {
      colorPalette: {
        mode: 'color',
        dominantHue: 205,
        scheme: 'monochromatic',
        saturation: 22,
        brightness: 26,
        keyLightWarmth: -38,
        accentHue: null,
      },
      lighting: { style: 'low-key', timeOfDay: 'dusk', colorTemp: 6800, atmosphere: 'misty', intensity: 40 },
    },
    promptGarnish: 'nordic noir palette, cold desaturated scandinavian mood',
  },
];

export const LOOK_RECIPES_BY_ID: Record<string, LookRecipe> = Object.fromEntries(
  LOOK_RECIPES.map((r) => [r.id, r]),
);

export function getLookRecipe(id: string | null | undefined): LookRecipe | undefined {
  if (!id) return undefined;
  return LOOK_RECIPES_BY_ID[id];
}

export function recipesForCategory(category: LookCategory): LookRecipe[] {
  return LOOK_RECIPES.filter((r) => r.category === category);
}

export function applyLookRecipeToLighting(
  current: LightingSettings,
  recipe: LookRecipe,
): LightingSettings {
  const palettePatch = recipe.patch.colorPalette ?? {};
  const mergedBw = palettePatch.bw
    ? { ...current.colorPalette.bw, ...palettePatch.bw }
    : current.colorPalette.bw;

  const colorPalette = normalizeColorPalette({
    ...current.colorPalette,
    ...palettePatch,
    bw: mergedBw,
    activeLookRecipeId: recipe.id,
  });

  if (palettePatch.bw?.look) {
    const preset = getBwLookPreset(palettePatch.bw.look);
    colorPalette.brightness = preset.midToneExposure;
    colorPalette.bw = { ...colorPalette.bw, ...preset };
  }

  const lightingPatch = recipe.patch.lighting ?? {};
  return {
    ...current,
    ...lightingPatch,
    colorPalette,
    colorTemp: lightingPatch.colorTemp ?? current.colorTemp,
  };
}