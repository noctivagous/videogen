'use client';

import { ThemeTransformPromptField } from '@/components/studio/ThemeTransformPromptField';
import { VisualDropdown } from '@/components/ui/VisualDropdown';
import { videoEnvironmentDropdownOptions } from '@/lib/constants/video-environment-options';
import {
  buildVideoEnvironmentPrompt,
  getVideoEnvironmentPreset,
  VIDEO_ENVIRONMENT_NONE,
} from '@/lib/constants/video-environment';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { useStudioStore } from '@/store/useStudioStore';

export function AtmosphereEnvironmentPanel() {
  const lighting = useStudioStore((s) => s.lighting);
  const setLighting = useStudioStore((s) => s.setLighting);

  const presetId = lighting.videoEnvironment?.presetId ?? null;
  const activePreset = getVideoEnvironmentPreset(presetId);
  const promptPhrase = buildVideoEnvironmentPrompt(lighting);

  const selectedValue = presetId ?? VIDEO_ENVIRONMENT_NONE;

  return (
    <div
      className="mt-6 pt-5 border-t border-surface-700"
      {...uiSectionProps(UI_SECTIONS.studioVideoEnvironment)}
    >
      <div className="flex items-center gap-2 mb-1">
        <svg className="w-5 h-5 shrink-0 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
          />
        </svg>
        <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-300">
          Atmosphere / Environment
        </h3>
      </div>
      <p className="text-[10px] text-gray-500 mb-4">Applied to video generation</p>

      <div className="space-y-3">
        <VisualDropdown
          label="Preset"
          value={selectedValue}
          onChange={(id: string) => {
            setLighting({
              videoEnvironment: {
                presetId: id === VIDEO_ENVIRONMENT_NONE ? null : id,
              },
            });
          }}
          options={videoEnvironmentDropdownOptions()}
          triggerVariant="backgroundFill"
          menuVariant="grid"
          size="sm"
          menuColumns={2}
          cellWidth={96}
          cellHeight={72}
          uiSection={uiSectionProps(UI_SECTIONS.studioVideoEnvironmentPreset)}
        />

        {activePreset && (
          <ThemeTransformPromptField
            value={promptPhrase}
            lines={2}
            label="Video atmosphere prompt"
            className="video-environment-prompt"
          />
        )}
      </div>
    </div>
  );
}