'use client';

import { useMemo, useState } from 'react';
import { ThemeTransformPromptField } from '@/components/studio/ThemeTransformPromptField';
import { RangeSlider } from '@/components/ui/RangeSlider';
import { Select } from '@/components/ui/Select';
import {
  normalizeVideoLighting,
  seedTechniqueModifiers,
  techniqueModifierKeys,
  VIDEO_LIGHTING_TECHNIQUES,
} from '@/lib/constants/video-lighting';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { buildVideoLightingPrompt } from '@/lib/studio/video-lighting-prompt';
import type {
  VideoLightingModifierKey,
  VideoLightingModifierState,
  VideoLightingTechniqueId,
} from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

function ModifierControls({
  techniqueId,
  modifiers,
  onChange,
}: {
  techniqueId: VideoLightingTechniqueId;
  modifiers: VideoLightingModifierState;
  onChange: (patch: Partial<VideoLightingModifierState>) => void;
}) {
  const keys = techniqueModifierKeys(techniqueId);

  return (
    <div className="video-lighting-modifiers">
      {keys.includes('intensity') && (
        <RangeSlider
          label="Intensity"
          valueLabel={`${modifiers.intensity ?? 65}%`}
          min={0}
          max={100}
          value={modifiers.intensity ?? 65}
          onChange={(e) => onChange({ intensity: parseInt(e.target.value, 10) })}
        />
      )}
      {keys.includes('contrast') && (
        <RangeSlider
          label="Contrast"
          valueLabel={`${modifiers.contrast ?? 70}%`}
          min={0}
          max={100}
          value={modifiers.contrast ?? 70}
          onChange={(e) => onChange({ contrast: parseInt(e.target.value, 10) })}
        />
      )}
      {keys.includes('softness') && (
        <RangeSlider
          label="Softness"
          valueLabel={`${modifiers.softness ?? 50}%`}
          min={0}
          max={100}
          value={modifiers.softness ?? 50}
          onChange={(e) => onChange({ softness: parseInt(e.target.value, 10) })}
        />
      )}
      {keys.includes('brightness') && (
        <RangeSlider
          label="Brightness"
          valueLabel={`${modifiers.brightness ?? 50}%`}
          min={0}
          max={100}
          value={modifiers.brightness ?? 50}
          onChange={(e) => onChange({ brightness: parseInt(e.target.value, 10) })}
        />
      )}
      {keys.includes('atmosphereDensity') && (
        <RangeSlider
          label="Atmosphere Density"
          valueLabel={`${modifiers.atmosphereDensity ?? 60}%`}
          min={0}
          max={100}
          value={modifiers.atmosphereDensity ?? 60}
          onChange={(e) => onChange({ atmosphereDensity: parseInt(e.target.value, 10) })}
        />
      )}
      {keys.includes('angle') && (
        <Select
          label="Light Direction"
          value={modifiers.angle ?? 'left'}
          onChange={(e) => onChange({ angle: e.target.value as VideoLightingModifierState['angle'] })}
        >
          <option value="left">Left</option>
          <option value="right">Right</option>
          <option value="above">Above</option>
          <option value="below">Below</option>
          <option value="front">Front</option>
          <option value="back">Back</option>
        </Select>
      )}
      {keys.includes('kelvinBias') && (
        <Select
          label="Color Temperature"
          value={modifiers.kelvinBias ?? 'warm'}
          onChange={(e) => onChange({ kelvinBias: e.target.value as VideoLightingModifierState['kelvinBias'] })}
        >
          <option value="warm">Warm (golden)</option>
          <option value="neutral">Neutral</option>
          <option value="cool">Cool (blue)</option>
        </Select>
      )}
      {keys.includes('practicalSource') && (
        <Select
          label="Practical Source"
          value={modifiers.practicalSource ?? 'window'}
          onChange={(e) => onChange({ practicalSource: e.target.value as VideoLightingModifierState['practicalSource'] })}
        >
          <option value="window">Window</option>
          <option value="desk-lamp">Desk Lamp</option>
          <option value="overhead">Overhead</option>
          <option value="neon">Neon Signage</option>
        </Select>
      )}
      {keys.includes('keyIntensity') && (
        <RangeSlider
          label="Key Light"
          valueLabel={`${modifiers.keyIntensity ?? 75}%`}
          min={0}
          max={100}
          value={modifiers.keyIntensity ?? 75}
          onChange={(e) => onChange({ keyIntensity: parseInt(e.target.value, 10) })}
        />
      )}
      {keys.includes('fillIntensity') && (
        <RangeSlider
          label="Fill Light"
          valueLabel={`${modifiers.fillIntensity ?? 45}%`}
          min={0}
          max={100}
          value={modifiers.fillIntensity ?? 45}
          onChange={(e) => onChange({ fillIntensity: parseInt(e.target.value, 10) })}
        />
      )}
      {keys.includes('backIntensity') && (
        <RangeSlider
          label="Back Light"
          valueLabel={`${modifiers.backIntensity ?? 55}%`}
          min={0}
          max={100}
          value={modifiers.backIntensity ?? 55}
          onChange={(e) => onChange({ backIntensity: parseInt(e.target.value, 10) })}
        />
      )}
    </div>
  );
}

export function VideoLightingTechniquesPanel() {
  const lighting = useStudioStore((s) => s.lighting);
  const setLighting = useStudioStore((s) => s.setLighting);
  const [search, setSearch] = useState('');

  const videoLighting = normalizeVideoLighting(lighting.videoLighting);
  const promptPhrase = buildVideoLightingPrompt(lighting);

  const filteredTechniques = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return VIDEO_LIGHTING_TECHNIQUES;
    return VIDEO_LIGHTING_TECHNIQUES.filter(
      (technique) =>
        technique.label.toLowerCase().includes(q) ||
        technique.description.toLowerCase().includes(q),
    );
  }, [search]);

  const updateVideoLighting = (next: typeof videoLighting) => {
    setLighting({ videoLighting: next });
  };

  const toggleTechnique = (techniqueId: VideoLightingTechniqueId, enabled: boolean) => {
    const nextIds = enabled
      ? [...videoLighting.techniqueIds, techniqueId]
      : videoLighting.techniqueIds.filter((id) => id !== techniqueId);
    const techniqueIds = VIDEO_LIGHTING_TECHNIQUES
      .map((technique) => technique.id)
      .filter((id) => nextIds.includes(id));
    const modifiers = { ...videoLighting.modifiers };
    if (enabled) {
      modifiers[techniqueId] = seedTechniqueModifiers(
        techniqueId,
        modifiers[techniqueId],
      );
    } else {
      delete modifiers[techniqueId];
    }
    updateVideoLighting({ techniqueIds, modifiers });
  };

  const updateModifier = (
    techniqueId: VideoLightingTechniqueId,
    patch: Partial<VideoLightingModifierState>,
  ) => {
    updateVideoLighting({
      ...videoLighting,
      modifiers: {
        ...videoLighting.modifiers,
        [techniqueId]: {
          ...videoLighting.modifiers[techniqueId],
          ...patch,
        },
      },
    });
  };

  return (
    <div
      className="video-lighting-techniques-panel mt-6 pt-5 border-t border-surface-700"
      {...uiSectionProps(UI_SECTIONS.studioVideoLightingTechniques)}
    >
      <div className="flex items-center gap-2 mb-1">
        <svg className="w-5 h-5 shrink-0 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
        <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-300">
          Lighting Techniques
        </h3>
      </div>
      <p className="text-[10px] text-gray-500 mb-4">Applied to video generation</p>

      <div className="space-y-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search techniques…"
          className="video-lighting-search"
          aria-label="Search lighting techniques"
        />

        <div className="video-lighting-technique-list" role="list">
          {filteredTechniques.map((technique) => {
            const active = videoLighting.techniqueIds.includes(technique.id);
            return (
              <label
                key={technique.id}
                className={`video-lighting-technique-item${active ? ' video-lighting-technique-item--active' : ''}`}
                role="listitem"
                {...uiSectionProps(UI_SECTIONS.studioVideoLightingTechniqueItem, { suffix: technique.id })}
              >
                <input
                  type="checkbox"
                  className="video-lighting-technique-item__checkbox"
                  checked={active}
                  onChange={(e) => toggleTechnique(technique.id, e.target.checked)}
                />
                <span className="video-lighting-technique-item__content">
                  <span className="video-lighting-technique-item__label">{technique.label}</span>
                  <span className="video-lighting-technique-item__description">{technique.description}</span>
                </span>
              </label>
            );
          })}
        </div>

        {videoLighting.techniqueIds.length > 0 && (
          <div className="video-lighting-active-modifiers">
            {videoLighting.techniqueIds.map((techniqueId) => {
              const preset = VIDEO_LIGHTING_TECHNIQUES.find((item) => item.id === techniqueId);
              if (!preset) return null;
              return (
                <details key={techniqueId} className="video-lighting-active-card" open>
                  <summary className="video-lighting-active-card__summary">{preset.label}</summary>
                  <ModifierControls
                    techniqueId={techniqueId}
                    modifiers={videoLighting.modifiers[techniqueId] ?? {}}
                    onChange={(patch) => updateModifier(techniqueId, patch)}
                  />
                </details>
              );
            })}
          </div>
        )}

        <ThemeTransformPromptField
          value={promptPhrase}
          lines={2}
          label="Video lighting prompt"
          className="video-lighting-prompt"
        />
      </div>
    </div>
  );
}