'use client';

import { BwTonalRangePanel } from '@/components/studio/BwTonalRangePanel';
import { ColorPaletteSwatches } from '@/components/studio/ColorPaletteSwatches';
import { ColorModeSegment } from '@/components/ui/ColorModeSegment';
import { ColorSchemeButtons } from '@/components/ui/ColorSchemeButtons';
import { ColorWheel } from '@/components/ui/ColorWheel';
import { IntegratedColorPicker } from '@/components/ui/IntegratedColorPicker';
import { RangeSlider } from '@/components/ui/RangeSlider';
import {
  FX_MODE_LABELS,
  harmonyAccentHues,
  isColorPaletteBw,
  isColorPaletteFx,
} from '@/lib/constants/color-palette';
import type { ColorPaletteMode, ColorScheme } from '@/lib/types/studio';
import { useNavigateToStudioPanel } from '@/hooks/use-studio-panel-navigation';
import { useStudioStore } from '@/store/useStudioStore';

function warmthLabel(warmth: number): string {
  if (warmth > 25) return 'Warm';
  if (warmth < -25) return 'Cool';
  if (warmth > 0) return 'Slightly warm';
  if (warmth < 0) return 'Slightly cool';
  return 'Neutral';
}

export function ColorPaletteMakerPanel() {
  const palette = useStudioStore((s) => s.colorPaletteMakerDraft);
  const setPalette = useStudioStore((s) => s.setColorPaletteMakerDraft);
  const applyPalette = useStudioStore((s) => s.applyColorPaletteMakerDraft);
  const navigateToPanel = useNavigateToStudioPanel();

  const isOff = palette.mode === 'off';
  const isFx = isColorPaletteFx(palette);
  const wheelAccents =
    isColorPaletteBw(palette) || palette.mode === 'duotone' ? [] : harmonyAccentHues(palette);
  const wheelSaturation = isColorPaletteBw(palette) ? 0 : palette.saturation;
  const showIntegratedPicker = palette.mode === 'color' || palette.mode === 'false-color';

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-surface-900 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-100">Color Palette Maker</h2>
          <p className="text-xs text-gray-500 mt-1">Create and apply color palettes to image references.</p>
        </div>

        <div className="mb-4">
          <ColorModeSegment
            value={palette.mode}
            onChange={(mode: ColorPaletteMode) => setPalette({ mode })}
          />
        </div>

        {!isOff && (
          <div className="bg-surface-800 border border-surface-600 rounded-xl p-4 space-y-4">
            {palette.mode === 'color' && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Harmony</p>
                <ColorSchemeButtons
                  value={palette.scheme}
                  onChange={(scheme: ColorScheme) => setPalette({ scheme, accentHue: null })}
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-300">
                {isFx ? FX_MODE_LABELS[palette.mode as keyof typeof FX_MODE_LABELS] : 'Color Palette'}
              </h3>
              <ColorPaletteSwatches palette={palette} onPatch={setPalette} />
            </div>

            {showIntegratedPicker && (
              <IntegratedColorPicker
                hue={palette.dominantHue}
                saturation={palette.saturation}
                brightness={palette.brightness}
                accentHues={wheelAccents}
                selectedAccentHue={palette.accentHue}
                onAccentSelect={(accentHue) => setPalette({ accentHue })}
                onChange={(next) => {
                  setPalette({
                    ...(next.hue !== undefined ? { dominantHue: next.hue } : {}),
                    ...(next.saturation !== undefined ? { saturation: next.saturation } : {}),
                    ...(next.brightness !== undefined ? { brightness: next.brightness } : {}),
                    ...(next.accentHue === null ? { accentHue: null } : {}),
                  });
                }}
              />
            )}

            {palette.mode === 'accent-splash' && (
              <div className="flex items-center gap-4">
                <ColorWheel
                  hue={palette.accentHue ?? palette.dominantHue}
                  saturation={wheelSaturation}
                  brightness={palette.brightness}
                  accentHues={wheelAccents}
                  selectedAccentHue={palette.accentHue}
                  onChange={(hue) => setPalette({ accentHue: hue, dominantHue: hue })}
                  onAccentSelect={(accentHue) => setPalette({ accentHue })}
                />
              </div>
            )}

            {palette.mode === 'duotone' && (
              <>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Primary</p>
                    <ColorWheel
                      hue={palette.dominantHue}
                      saturation={palette.saturation}
                      brightness={palette.brightness}
                      accentHues={[]}
                      selectedAccentHue={null}
                      onChange={(dominantHue) => setPalette({ dominantHue })}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Secondary</p>
                    <ColorWheel
                      hue={palette.secondaryHue}
                      saturation={palette.saturation}
                      brightness={palette.brightness}
                      accentHues={[]}
                      selectedAccentHue={null}
                      onChange={(secondaryHue) => setPalette({ secondaryHue })}
                    />
                  </div>
                </div>
                <RangeSlider
                  label="Duotone Balance"
                  valueLabel={
                    palette.duotoneBalance < 40
                      ? 'Primary'
                      : palette.duotoneBalance > 60
                        ? 'Secondary'
                        : 'Balanced'
                  }
                  min={0}
                  max={100}
                  value={palette.duotoneBalance}
                  onChange={(e) => setPalette({ duotoneBalance: parseInt(e.target.value, 10) })}
                />
              </>
            )}

            {!isColorPaletteBw(palette) && palette.mode !== 'accent-splash' && !showIntegratedPicker && (
              <RangeSlider
                label="Saturation"
                valueLabel={`${palette.saturation}%`}
                min={0}
                max={100}
                value={palette.saturation}
                onChange={(e) => setPalette({ saturation: parseInt(e.target.value, 10) })}
              />
            )}

            {palette.mode === 'false-color' && (
              <RangeSlider
                label="Spectrum Bias"
                valueLabel={palette.spectrumBias < 35 ? 'Narrow' : palette.spectrumBias > 65 ? 'Wide' : 'Medium'}
                min={0}
                max={100}
                value={palette.spectrumBias}
                onChange={(e) => setPalette({ spectrumBias: parseInt(e.target.value, 10) })}
              />
            )}

            {palette.mode === 'accent-splash' && (
              <>
                <BwTonalRangePanel palette={palette} onPatch={setPalette} />
                <RangeSlider
                  label="Accent Strength"
                  valueLabel={`${palette.accentStrength}%`}
                  min={0}
                  max={100}
                  value={palette.accentStrength}
                  onChange={(e) => setPalette({ accentStrength: parseInt(e.target.value, 10) })}
                />
              </>
            )}

            {!isColorPaletteBw(palette) && palette.mode !== 'accent-splash' && !showIntegratedPicker && (
              <RangeSlider
                label="Brightness"
                valueLabel={`${palette.brightness}%`}
                min={0}
                max={100}
                value={palette.brightness}
                onChange={(e) => setPalette({ brightness: parseInt(e.target.value, 10) })}
              />
            )}

            {!isColorPaletteBw(palette) && palette.mode !== 'accent-splash' && (
              <RangeSlider
                label="Key Light Warmth"
                valueLabel={warmthLabel(palette.keyLightWarmth)}
                className="warmth-slider"
                min={-100}
                max={100}
                value={palette.keyLightWarmth}
                onChange={(e) => setPalette({ keyLightWarmth: parseInt(e.target.value, 10) })}
              />
            )}

            {isColorPaletteBw(palette) && (
              <BwTonalRangePanel palette={palette} onPatch={setPalette} />
            )}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => applyPalette()}
            disabled={isOff}
            className="px-4 py-2 text-xs font-medium rounded-lg border border-brand-500/50 bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            Apply to Lighting
          </button>
          <button
            type="button"
            onClick={() => navigateToPanel('shot-designer')}
            className="px-4 py-2 text-xs font-medium rounded-lg border border-surface-600 bg-surface-800 hover:bg-surface-700 text-gray-300 transition-colors"
          >
            Back to Shot Designer
          </button>
        </div>
      </div>
    </div>
  );
}
