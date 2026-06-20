import type { CameraPromptInclusion, CameraSettings } from '@/lib/types/studio';

export const DEFAULT_CAMERA_PROMPT_INCLUSION: CameraPromptInclusion = {
  includeInPrompt: true,
  shotSetup: true,
};

export function resolveCameraPromptInclusion(camera: CameraSettings): CameraPromptInclusion {
  return {
    ...DEFAULT_CAMERA_PROMPT_INCLUSION,
    ...camera.promptInclusion,
  };
}

export function normalizeCameraPromptInclusion(
  value?: Partial<CameraPromptInclusion> | null,
): CameraPromptInclusion {
  return {
    ...DEFAULT_CAMERA_PROMPT_INCLUSION,
    ...value,
  };
}