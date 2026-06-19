import type { LightingSettings, VideoEnvironmentSettings } from '@/lib/types/studio';

export const VIDEO_ENVIRONMENT_NONE = '__none__';

export const DEFAULT_VIDEO_ENVIRONMENT: VideoEnvironmentSettings = {
  presetId: null,
};

export interface VideoEnvironmentPreset {
  id: string;
  label: string;
  description: string;
  promptPhrase: string;
}

export const VIDEO_ENVIRONMENT_PRESETS: VideoEnvironmentPreset[] = [
  {
    id: 'foggy-morning',
    label: 'Foggy Morning',
    description: 'Thick ground fog with soft morning light',
    promptPhrase:
      'foggy morning atmosphere, thick rolling fog at ground level, soft diffused light, volumetric god rays, moody cinematic lighting',
  },
  {
    id: 'mystic-mist',
    label: 'Mystic Mist',
    description: 'Ethereal mist and soft volumetric haze',
    promptPhrase:
      'ethereal mist, soft volumetric haze, moody diffused lighting, dreamy atmospheric depth, gentle light scatter',
  },
  {
    id: 'golden-haze',
    label: 'Golden Haze',
    description: 'Warm golden-hour haze with sun rays',
    promptPhrase:
      'hazy golden hour atmosphere, warm sun rays through atmospheric haze, soft glowing air, cinematic warmth',
  },
  {
    id: 'cinematic-rain',
    label: 'Cinematic Rain',
    description: 'Heavy rain with reflections and mood',
    promptPhrase:
      'pouring rain with wet reflections, rain-streaked air, moody cinematic lighting, glistening surfaces, atmospheric rainfall',
  },
  {
    id: 'light-drizzle',
    label: 'Light Drizzle',
    description: 'Subtle drizzle and overcast softness',
    promptPhrase:
      'light drizzle, fine rain mist in the air, soft overcast diffusion, gentle wet sheen on surfaces',
  },
  {
    id: 'volumetric-smoke',
    label: 'Volumetric Smoke',
    description: 'Smoke volumes with dramatic god rays',
    promptPhrase:
      'volumetric smoke, god rays through smoke, dramatic light shafts, atmospheric particulate haze, cinematic depth',
  },
  {
    id: 'gentle-snowfall',
    label: 'Gentle Snowfall',
    description: 'Soft snowfall and winter atmosphere',
    promptPhrase:
      'gentle snowfall, soft winter atmosphere, diffused cold light, floating snow particles, quiet icy air',
  },
  {
    id: 'blizzard',
    label: 'Blizzard',
    description: 'Intense snow and wind-driven particles',
    promptPhrase:
      'blizzard conditions, heavy wind-driven snow, obscured visibility, harsh cold atmosphere, swirling snow particles',
  },
  {
    id: 'sandstorm',
    label: 'Sandstorm',
    description: 'Dust and sand particles in harsh light',
    promptPhrase:
      'sandstorm, dust particles in the air, harsh obscured sunlight, gritty atmospheric turbulence, desert haze',
  },
  {
    id: 'dust-haze',
    label: 'Dust Haze',
    description: 'Suspended dust with muted sun',
    promptPhrase:
      'dusty haze, suspended particle effects in the air, muted sunlight, dry atmospheric diffusion',
  },
  {
    id: 'underwater-caustics',
    label: 'Underwater Caustics',
    description: 'Submerged caustic light patterns',
    promptPhrase:
      'underwater environment, caustic light patterns dancing on surfaces, submerged atmosphere, aquatic light diffusion',
  },
  {
    id: 'dreamlike-glow',
    label: 'Dreamlike Glow',
    description: 'Surreal luminous haze',
    promptPhrase:
      'dreamlike surreal glow, soft luminous haze, otherworldly atmosphere, ethereal bloom, fantastical environmental light',
  },
];

export const VIDEO_ENVIRONMENT_BY_ID: Record<string, VideoEnvironmentPreset> = Object.fromEntries(
  VIDEO_ENVIRONMENT_PRESETS.map((preset) => [preset.id, preset]),
);

export function getVideoEnvironmentPreset(id: string | null | undefined): VideoEnvironmentPreset | undefined {
  if (!id) return undefined;
  return VIDEO_ENVIRONMENT_BY_ID[id];
}

export function normalizeVideoEnvironment(
  value?: Partial<VideoEnvironmentSettings> | null,
): VideoEnvironmentSettings {
  return {
    ...DEFAULT_VIDEO_ENVIRONMENT,
    ...value,
    presetId: value?.presetId ?? null,
  };
}

export function buildVideoEnvironmentPrompt(lighting: LightingSettings): string {
  const preset = getVideoEnvironmentPreset(lighting.videoEnvironment?.presetId);
  return preset?.promptPhrase?.trim() ?? '';
}