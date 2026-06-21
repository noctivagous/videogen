import { buildVideoEnvironmentPrompt } from '@/lib/constants/video-environment';
import { buildVideoLightingPrompt } from '@/lib/studio/video-lighting-prompt';
import type { LightingSettings } from '@/lib/types/studio';

export function buildLightingAtmospherePrompt(lighting: LightingSettings): string {
  return [buildVideoLightingPrompt(lighting), buildVideoEnvironmentPrompt(lighting)]
    .filter(Boolean)
    .join('. ')
    .replace(/\.\s*\./g, '.')
    .trim();
}

export function resolveLightingAtmospherePrompt(
  lighting: LightingSettings,
  override?: string | null,
  options: { includeVideoLighting?: boolean; includeVideoEnvironment?: boolean } = {},
): string {
  const trimmedOverride = override?.trim();
  if (trimmedOverride) return trimmedOverride;

  const { includeVideoLighting = true, includeVideoEnvironment = true } = options;
  return [
    includeVideoLighting ? buildVideoLightingPrompt(lighting) : '',
    includeVideoEnvironment ? buildVideoEnvironmentPrompt(lighting) : '',
  ]
    .filter(Boolean)
    .join('. ')
    .replace(/\.\s*\./g, '.')
    .trim();
}
