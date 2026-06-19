import {
  getVideoLightingTechnique,
  normalizeVideoLighting,
} from '@/lib/constants/video-lighting';
import type {
  LightingSettings,
  VideoLightingModifierState,
  VideoLightingTechniqueId,
} from '@/lib/types/studio';

export interface VideoLightingPromptPart {
  source: string;
  text: string;
}

function bandStrength(value: number | undefined, low: string, mid: string, high: string): string {
  const v = value ?? 50;
  if (v <= 33) return low;
  if (v <= 66) return mid;
  return high;
}

function anglePhrase(angle: VideoLightingModifierState['angle']): string {
  switch (angle) {
    case 'left':
      return 'key light from the left';
    case 'right':
      return 'key light from the right';
    case 'above':
      return 'key light from above';
    case 'below':
      return 'key light from below';
    case 'front':
      return 'key light from the front';
    case 'back':
      return 'backlight from behind';
    default:
      return 'key light from the side';
  }
}

function kelvinPhrase(bias: VideoLightingModifierState['kelvinBias']): string {
  switch (bias) {
    case 'warm':
      return 'warm golden hour lighting';
    case 'cool':
      return 'cool blue moonlight';
    default:
      return 'neutral color temperature';
  }
}

function practicalPhrase(source: VideoLightingModifierState['practicalSource']): string {
  switch (source) {
    case 'window':
      return 'motivated by window light';
    case 'desk-lamp':
      return 'motivated by desk lamp';
    case 'overhead':
      return 'motivated by overhead practical';
    case 'neon':
      return 'motivated by neon signage';
    default:
      return 'motivated by visible practical sources';
  }
}

function threePointPhrase(modifiers: VideoLightingModifierState): string {
  const key = bandStrength(modifiers.keyIntensity, 'soft key light', 'balanced key light', 'strong key light');
  const fill = bandStrength(modifiers.fillIntensity, 'minimal fill', 'soft fill light', 'bright fill light');
  const back = bandStrength(modifiers.backIntensity, 'subtle backlight', 'moderate backlight', 'strong backlight');
  return `${key}, ${fill}, ${back}`;
}

function buildTechniquePhrase(
  techniqueId: VideoLightingTechniqueId,
  modifiers: VideoLightingModifierState,
): string {
  const preset = getVideoLightingTechnique(techniqueId);
  if (!preset) return '';

  if (techniqueId === 'color-temperature') {
    return kelvinPhrase(modifiers.kelvinBias);
  }

  const parts: string[] = [preset.promptPhrase];

  if (preset.modifiers.includes('intensity')) {
    const strength = bandStrength(modifiers.intensity, 'subtle', 'moderate', 'strong');
    if (techniqueId === 'rim-backlight') {
      parts.push(`${strength} rim intensity`);
    } else if (techniqueId === 'butterfly') {
      parts.push(`${strength} overhead key`);
    } else {
      parts.push(`${strength} intensity`);
    }
  }

  if (preset.modifiers.includes('contrast')) {
    const contrast = modifiers.contrast ?? 50;
    parts.push(contrast >= 55 ? 'high contrast' : 'soft contrast');
  }

  if (preset.modifiers.includes('brightness')) {
    const brightness = modifiers.brightness ?? 50;
    if (techniqueId === 'low-key') {
      parts.push(brightness <= 40 ? 'very dark exposure' : 'dark moody exposure');
    } else if (techniqueId === 'high-key') {
      parts.push(brightness >= 60 ? 'bright airy exposure' : 'clean bright exposure');
    }
  }

  if (preset.modifiers.includes('softness')) {
    const softness = modifiers.softness ?? 50;
    parts.push(softness >= 55 ? 'soft diffused quality' : 'defined light quality');
  }

  if (preset.modifiers.includes('angle')) {
    parts.push(anglePhrase(modifiers.angle));
  }

  if (preset.modifiers.includes('atmosphereDensity')) {
    const density = bandStrength(modifiers.atmosphereDensity, 'light haze', 'moderate atmospheric haze', 'dense atmospheric haze');
    parts.push(density);
  }

  if (preset.modifiers.includes('practicalSource')) {
    parts.push(practicalPhrase(modifiers.practicalSource));
  }

  if (techniqueId === 'three-point') {
    parts.push(threePointPhrase(modifiers));
  }

  const seen = new Set<string>();
  return parts
    .map((part) => part.trim())
    .filter((part) => {
      const key = part.toLowerCase();
      if (!part || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(', ');
}

export function getVideoLightingPromptParts(lighting: LightingSettings): VideoLightingPromptPart[] {
  const videoLighting = normalizeVideoLighting(lighting.videoLighting);
  return videoLighting.techniqueIds
    .map((techniqueId) => {
      const preset = getVideoLightingTechnique(techniqueId);
      const modifiers = videoLighting.modifiers[techniqueId] ?? {};
      const text = buildTechniquePhrase(techniqueId, modifiers);
      if (!text || !preset) return null;
      return {
        source: `Lighting Techniques · ${preset.label}`,
        text,
      };
    })
    .filter((row): row is VideoLightingPromptPart => row !== null);
}

export function buildVideoLightingPrompt(lighting: LightingSettings): string {
  return getVideoLightingPromptParts(lighting)
    .map((part) => part.text)
    .join(', ');
}