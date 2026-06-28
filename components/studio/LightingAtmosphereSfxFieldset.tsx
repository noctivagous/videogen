'use client';

import { CollapsiblePromptEditor } from '@/components/ui/CollapsiblePromptEditor';
import { SettingsSummaryTable } from '@/components/ui/SettingsSummaryTable';
import { getVideoEnvironmentPreset, normalizeVideoEnvironment } from '@/lib/constants/video-environment';
import { getVideoLightingTechnique, normalizeVideoLighting } from '@/lib/constants/video-lighting';
import { buildLightingAtmospherePrompt } from '@/lib/studio/lighting-atmosphere-prompt';
import { useStudioStore } from '@/store/useStudioStore';

export interface LightingAtmosphereSfxFieldsetProps {
  fieldsetOrder: number;
  optional?: boolean;
}

export function LightingAtmosphereSfxFieldset({
  fieldsetOrder,
  optional = false,
}: LightingAtmosphereSfxFieldsetProps) {
  const lighting = useStudioStore((s) => s.lighting);
  const shots = useStudioStore((s) => s.shots);
  const currentShot = useStudioStore((s) => s.currentShot);
  const setLightingAtmospherePrompt = useStudioStore((s) => s.setLightingAtmospherePrompt);

  const shot = shots.find((s) => s.id === currentShot) ?? shots[0];
  if (!shot) return null;

  const videoLighting = normalizeVideoLighting(lighting.videoLighting);
  const videoEnvironment = normalizeVideoEnvironment(lighting.videoEnvironment);
  const compiledPrompt = buildLightingAtmospherePrompt(lighting);
  const promptValue = shot.lightingAtmospherePrompt ?? compiledPrompt;

  const techniqueRows = videoLighting.techniqueIds.map((techniqueId) => {
    const preset = getVideoLightingTechnique(techniqueId);
    return {
      id: techniqueId,
      label: preset?.label ?? techniqueId,
      value: 'Applied',
      active: true,
    };
  });

  const environmentPreset = getVideoEnvironmentPreset(videoEnvironment.presetId);
  const environmentRows = environmentPreset
    ? [{ id: environmentPreset.id, label: environmentPreset.label, value: 'Applied', active: true }]
    : [{ id: 'none', label: 'Preset', value: 'None', active: false }];

  return (
    <fieldset className="workflow-step-fieldset">
      <legend className="workflow-step-fieldset__legend flex items-center gap-1.5">
        <span className="workflow-step-fieldset__legend-order" aria-hidden="true">
          {fieldsetOrder}
        </span>
        <span>Lighting, Atmosphere, SFX</span>
        {optional ? <span className="text-gray-500 normal-case text-[10px]">(optional)</span> : null}
      </legend>

      <fieldset className="workflow-step-fieldset workflow-step-fieldset--nested">
        <legend className="workflow-step-fieldset__legend">Lighting Techniques</legend>
        <SettingsSummaryTable
          columns={['Technique', 'Applied']}
          rows={techniqueRows}
          emptyMessage="No lighting techniques selected."
        />
      </fieldset>

      <fieldset className="workflow-step-fieldset workflow-step-fieldset--nested">
        <legend className="workflow-step-fieldset__legend">Atmosphere / Environment</legend>
        <SettingsSummaryTable columns={['Preset', 'Applied']} rows={environmentRows} />
      </fieldset>

      <fieldset className="workflow-step-fieldset workflow-step-fieldset--nested">
        <legend className="workflow-step-fieldset__legend">SFX</legend>
        <SettingsSummaryTable
          columns={['Effect', 'Applied']}
          rows={[{ id: 'none', label: 'Effect', value: 'None', active: false }]}
        />
      </fieldset>

      <CollapsiblePromptEditor
        className="mt-3"
        label="Compiled prompt"
        value={promptValue}
        onChange={setLightingAtmospherePrompt}
        placeholder="Lighting and atmosphere prompt for video generation…"
        ariaLabel="Lighting and atmosphere compiled prompt"
      />
    </fieldset>
  );
}
