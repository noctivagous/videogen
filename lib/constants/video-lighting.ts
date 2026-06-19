import type {
  LightingSettings,
  VideoLightingModifierKey,
  VideoLightingModifierState,
  VideoLightingSettings,
  VideoLightingTechniqueId,
} from '@/lib/types/studio';
import { VIDEO_LIGHTING_TECHNIQUE_BY_ID } from '@/lib/constants/video-lighting-techniques';

export { VIDEO_LIGHTING_TECHNIQUES, getVideoLightingTechnique } from '@/lib/constants/video-lighting-techniques';

export const DEFAULT_VIDEO_LIGHTING: VideoLightingSettings = {
  techniqueIds: [],
  modifiers: {},
};

export const DEFAULT_VIDEO_LIGHTING_MODIFIERS: VideoLightingModifierState = {
  intensity: 65,
  contrast: 70,
  softness: 50,
  brightness: 50,
  angle: 'left',
  kelvinBias: 'warm',
  practicalSource: 'window',
  keyIntensity: 75,
  fillIntensity: 45,
  backIntensity: 55,
  atmosphereDensity: 60,
};

export function normalizeVideoLighting(
  value?: Partial<VideoLightingSettings> | null,
): VideoLightingSettings {
  const techniqueIds = (value?.techniqueIds ?? []).filter(
    (id): id is VideoLightingTechniqueId => id in VIDEO_LIGHTING_TECHNIQUE_BY_ID,
  );
  const modifiers: VideoLightingSettings['modifiers'] = {};
  for (const id of techniqueIds) {
    modifiers[id] = {
      ...DEFAULT_VIDEO_LIGHTING_MODIFIERS,
      ...value?.modifiers?.[id],
    };
  }
  return { techniqueIds, modifiers };
}

export function seedTechniqueModifiers(
  techniqueId: VideoLightingTechniqueId,
  existing?: VideoLightingModifierState,
): VideoLightingModifierState {
  const preset = VIDEO_LIGHTING_TECHNIQUE_BY_ID[techniqueId];
  const seeded: VideoLightingModifierState = { ...DEFAULT_VIDEO_LIGHTING_MODIFIERS };
  for (const key of preset.modifiers) {
    const value = existing?.[key];
    if (value !== undefined) {
      (seeded as Record<VideoLightingModifierKey, VideoLightingModifierState[VideoLightingModifierKey]>)[key] = value;
    }
  }
  return seeded;
}

export function getActiveVideoLightingTechniques(
  lighting: LightingSettings,
): VideoLightingTechniqueId[] {
  return normalizeVideoLighting(lighting.videoLighting).techniqueIds;
}

export function techniqueModifierKeys(techniqueId: VideoLightingTechniqueId): VideoLightingModifierKey[] {
  return VIDEO_LIGHTING_TECHNIQUE_BY_ID[techniqueId]?.modifiers ?? [];
}