import type {
  VideoLightingModifierKey,
  VideoLightingTechniqueId,
} from '@/lib/types/studio';

export interface VideoLightingTechniquePreset {
  id: VideoLightingTechniqueId;
  label: string;
  description: string;
  promptPhrase: string;
  modifiers: VideoLightingModifierKey[];
}

export const VIDEO_LIGHTING_TECHNIQUES: VideoLightingTechniquePreset[] = [
  {
    id: 'chiaroscuro',
    label: 'Chiaroscuro',
    description: 'Strong contrast between light and shadow',
    promptPhrase: 'dramatic chiaroscuro lighting, deep shadows, high contrast',
    modifiers: ['contrast', 'angle'],
  },
  {
    id: 'rembrandt',
    label: 'Rembrandt Lighting',
    description: 'Triangle highlight on cheek (classic portrait)',
    promptPhrase: 'Rembrandt lighting, key light from side, small triangle catchlight',
    modifiers: ['angle', 'intensity'],
  },
  {
    id: 'split',
    label: 'Split Lighting',
    description: 'Face divided into lit and shadowed halves',
    promptPhrase: 'split lighting, dramatic side light, moody atmosphere',
    modifiers: ['angle'],
  },
  {
    id: 'loop',
    label: 'Loop Lighting',
    description: 'Soft loop shadow under nose',
    promptPhrase: 'loop lighting, soft key light slightly above eye level',
    modifiers: ['angle', 'softness'],
  },
  {
    id: 'butterfly',
    label: 'Butterfly Lighting',
    description: 'Shadow under nose resembling butterfly',
    promptPhrase: 'butterfly lighting, glamour style, key light directly above',
    modifiers: ['intensity'],
  },
  {
    id: 'rim-backlight',
    label: 'Rim / Backlighting',
    description: 'Strong edge light separating subject from background',
    promptPhrase: 'strong rim lighting, backlit silhouette with edge glow',
    modifiers: ['intensity'],
  },
  {
    id: 'low-key',
    label: 'Low-Key Lighting',
    description: 'Dark, moody with minimal fill light',
    promptPhrase: 'low-key lighting, deep shadows, minimal fill',
    modifiers: ['brightness', 'contrast'],
  },
  {
    id: 'high-key',
    label: 'High-Key Lighting',
    description: 'Bright, clean, minimal shadows',
    promptPhrase: 'high-key lighting, soft even illumination, bright atmosphere',
    modifiers: ['brightness', 'contrast'],
  },
  {
    id: 'volumetric',
    label: 'Volumetric Lighting',
    description: 'Visible light beams (god rays)',
    promptPhrase: 'volumetric lighting, god rays cutting through haze',
    modifiers: ['atmosphereDensity', 'intensity'],
  },
  {
    id: 'practical',
    label: 'Practical Lighting',
    description: 'Motivated by visible sources (lamps, windows)',
    promptPhrase: 'practical lighting motivated by visible sources',
    modifiers: ['practicalSource'],
  },
  {
    id: 'color-temperature',
    label: 'Color Temperature',
    description: 'Warm (golden) vs cool (blue) overall cast',
    promptPhrase: 'warm golden hour lighting',
    modifiers: ['kelvinBias'],
  },
  {
    id: 'three-point',
    label: 'Three-Point Lighting',
    description: 'Classic key + fill + backlight',
    promptPhrase: 'three-point lighting setup, balanced cinematic',
    modifiers: ['keyIntensity', 'fillIntensity', 'backIntensity'],
  },
];

export const VIDEO_LIGHTING_TECHNIQUE_BY_ID: Record<
  VideoLightingTechniqueId,
  VideoLightingTechniquePreset
> = Object.fromEntries(
  VIDEO_LIGHTING_TECHNIQUES.map((preset) => [preset.id, preset]),
) as Record<VideoLightingTechniqueId, VideoLightingTechniquePreset>;

export function getVideoLightingTechnique(
  id: VideoLightingTechniqueId | null | undefined,
): VideoLightingTechniquePreset | undefined {
  if (!id) return undefined;
  return VIDEO_LIGHTING_TECHNIQUE_BY_ID[id];
}