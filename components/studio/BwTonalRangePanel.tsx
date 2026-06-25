'use client';

import { RangeSlider } from '@/components/ui/RangeSlider';
import { Select } from '@/components/ui/Select';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import {
  BW_FILM_GRAIN_LABELS,
  BW_TONAL_LOOK_LABELS,
  getBwLookPreset,
} from '@/lib/constants/bw-tonal';
import type { BwFilmGrain, BwTonalLook, ColorPaletteSettings } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

function warmthLabel(warmth: number): string {
  if (warmth > 25) return 'Warm ivory';
  if (warmth < -25) return 'Cool silver';
  if (warmth > 0) return 'Slightly warm';
  if (warmth < 0) return 'Slightly cool';
  return 'Neutral gray';
}

export interface BwTonalRangePanelProps {
  palette?: ColorPaletteSettings;
  onPatch?: (patch: Partial<ColorPaletteSettings>) => void;
}

export function BwTonalRangePanel({ palette: paletteProp, onPatch }: BwTonalRangePanelProps = {}) {
  const storePalette = useStudioStore((s) => s.lighting.colorPalette);
  const setColorPalette = useStudioStore((s) => s.setColorPalette);
  const palette = paletteProp ?? storePalette;
  const patchPalette = onPatch ?? setColorPalette;
  const bw = palette.bw;

  const patchBw = (patch: Partial<typeof bw>) =>
    patchPalette({ bw: { ...bw, ...patch } });

  return (
    <div
      className="space-y-4 pt-4 mt-4 border-t border-surface-700/60"
      {...uiSectionProps(UI_SECTIONS.studioBwTonalRange)}
    >
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
          Tonal Range
        </h4>
        <p className="text-[10px] text-gray-500 leading-relaxed">
          Maps to monochrome prompt terms models recognize — film noir, high/low key, contrast, and grain.
        </p>
      </div>

      <Select
        label="Monochrome Look"
        value={bw.look}
        onChange={(e) => {
          const look = e.target.value as BwTonalLook;
          const preset = getBwLookPreset(look);
          const { midToneExposure, ...bwPreset } = preset;
          patchPalette({
            bw: { ...bw, ...bwPreset, look },
            brightness: midToneExposure,
          });
        }}
      >
        {(Object.entries(BW_TONAL_LOOK_LABELS) as [BwTonalLook, string][]).map(([id, label]) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </Select>

      <RangeSlider
        label="Contrast"
        valueLabel={bw.contrast < 30 ? 'Soft' : bw.contrast > 70 ? 'High' : 'Balanced'}
        min={0}
        max={100}
        value={bw.contrast}
        onChange={(e) => patchBw({ contrast: parseInt(e.target.value) })}
      />

      <RangeSlider
        label="Shadow Depth"
        valueLabel={bw.shadowDepth < 30 ? 'Lifted' : bw.shadowDepth > 70 ? 'Crushed' : bw.shadowDepth > 50 ? 'Rich' : 'Natural'}
        min={0}
        max={100}
        value={bw.shadowDepth}
        onChange={(e) => patchBw({ shadowDepth: parseInt(e.target.value) })}
      />

      <RangeSlider
        label="Highlights"
        valueLabel={bw.highlightTone < 30 ? 'Muted' : bw.highlightTone > 70 ? 'Bright' : 'Natural'}
        min={0}
        max={100}
        value={bw.highlightTone}
        onChange={(e) => patchBw({ highlightTone: parseInt(e.target.value) })}
      />

      <RangeSlider
        label="Mid-Tone Exposure"
        valueLabel={`${palette.brightness}%`}
        min={0}
        max={100}
        value={palette.brightness}
        onChange={(e) => patchPalette({ brightness: parseInt(e.target.value) })}
      />

      <RangeSlider
        label="Tone Bias"
        valueLabel={warmthLabel(palette.keyLightWarmth)}
        className="warmth-slider"
        min={-100}
        max={100}
        value={palette.keyLightWarmth}
        onChange={(e) => patchPalette({ keyLightWarmth: parseInt(e.target.value) })}
      />

      <Select
        label="Film Grain"
        value={bw.grain}
        onChange={(e) => patchBw({ grain: e.target.value as BwFilmGrain })}
      >
        {(Object.entries(BW_FILM_GRAIN_LABELS) as [BwFilmGrain, string][]).map(([id, label]) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </Select>
    </div>
  );
}