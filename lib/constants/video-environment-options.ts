import type { VisualDropdownOption } from '@/lib/constants/field-size-options';
import {
  VIDEO_ENVIRONMENT_NONE,
  VIDEO_ENVIRONMENT_PRESETS,
} from '@/lib/constants/video-environment';

const PRESET_GRADIENTS: Record<string, string> = {
  'foggy-morning': 'linear-gradient(135deg, #9ca3af 0%, #e5e7eb 55%, #d1d5db 100%)',
  'mystic-mist': 'linear-gradient(135deg, #a5b4fc 0%, #e0e7ff 50%, #c7d2fe 100%)',
  'golden-haze': 'linear-gradient(135deg, #fbbf24 0%, #fde68a 45%, #f59e0b 100%)',
  'cinematic-rain': 'linear-gradient(135deg, #1e3a5f 0%, #3b82f6 40%, #1e293b 100%)',
  'light-drizzle': 'linear-gradient(135deg, #64748b 0%, #94a3b8 50%, #475569 100%)',
  'volumetric-smoke': 'linear-gradient(135deg, #374151 0%, #6b7280 45%, #111827 100%)',
  'gentle-snowfall': 'linear-gradient(135deg, #e2e8f0 0%, #f8fafc 55%, #cbd5e1 100%)',
  blizzard: 'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 40%, #94a3b8 100%)',
  sandstorm: 'linear-gradient(135deg, #d97706 0%, #fbbf24 40%, #92400e 100%)',
  'dust-haze': 'linear-gradient(135deg, #a8a29e 0%, #d6d3d1 50%, #78716c 100%)',
  'underwater-caustics': 'linear-gradient(135deg, #0e7490 0%, #22d3ee 35%, #155e75 100%)',
  'dreamlike-glow': 'linear-gradient(135deg, #c084fc 0%, #f0abfc 45%, #818cf8 100%)',
};

export function videoEnvironmentDropdownOptions(): VisualDropdownOption<string>[] {
  return [
    { value: VIDEO_ENVIRONMENT_NONE, label: 'None', shortLabel: 'None' },
    ...VIDEO_ENVIRONMENT_PRESETS.map((preset) => ({
      value: preset.id,
      label: preset.label,
      shortLabel: preset.label,
      backgroundUrl: PRESET_GRADIENTS[preset.id],
    })),
  ];
}