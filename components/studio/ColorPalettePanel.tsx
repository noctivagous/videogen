'use client';

import { BwTonalRangePanel } from '@/components/studio/BwTonalRangePanel';
import { ColorPaletteSwatches } from '@/components/studio/ColorPaletteSwatches';
import { LookLibraryPanel } from '@/components/studio/LookLibraryPanel';
import { ColorModeSegment } from '@/components/ui/ColorModeSegment';
import { ColorSchemeButtons } from '@/components/ui/ColorSchemeButtons';
import { ColorWheel } from '@/components/ui/ColorWheel';
import { RangeSlider } from '@/components/ui/RangeSlider';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import {
  FX_MODE_LABELS,
  harmonyAccentHues,
  hueToColorName,
  isColorPaletteBw,
  isColorPaletteFx,
  resolvePaletteHues,
} from '@/lib/constants/color-palette';
import type { ColorPaletteMode, ColorScheme } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

function warmthLabel(warmth: number): string {
  if (warmth > 25) return 'Warm';
  if (warmth < -25) return 'Cool';
  if (warmth > 0) return 'Slightly warm';
  if (warmth < 0) return 'Slightly cool';
  return 'Neutral';
}

export function ColorPalettePanel() {
  const palette = useStudioStore((s) => s.lighting.colorPalette);
  const setColorPalette = useStudioStore((s) => s.setColorPalette);

  const { dominant } = resolvePaletteHues(palette);
  const wheelAccents =
    isColorPaletteBw(palette) || palette.mode === 'duotone' ? [] : harmonyAccentHues(palette);
  const wheelSaturation = isColorPaletteBw(palette) ? 0 : palette.saturation;
  const isOff = palette.mode === 'off';
  const isFx = isColorPaletteFx(palette);
  const showColorWheel = palette.mode === 'color' || palette.mode === 'false-color' || palette.mode === 'accent-splash';

  return (
    <div
      className={`mb-5 ${isOff ? '' : 'pb-5 border-b border-surface-700'}`}
      {...uiSectionProps(UI_SECTIONS.studioColorPalette)}
    >
      <LookLibraryPanel />

      <div className="mb-4" {...uiSectionProps(UI_SECTIONS.studioColorPaletteMode)}>
        <ColorModeSegment
          value={palette.mode}
          onChange={(mode: ColorPaletteMode) => setColorPalette({ mode })}
        />
      </div>

      {!isOff && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 shrink-0 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
              />
            </svg>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-300">
              {isFx ? FX_MODE_LABELS[palette.mode as keyof typeof FX_MODE_LABELS] : 'Color Palette'}
            </h3>
            <ColorPaletteSwatches palette={palette} />
          </div>

          <div className="space-y-4">
            {showColorWheel && (
              <div className="flex items-center gap-4">
                <ColorWheel
                  hue={palette.mode === 'accent-splash' ? (palette.accentHue ?? palette.dominantHue) : palette.dominantHue}
                  saturation={wheelSaturation}
                  brightness={palette.brightness}
                  accentHues={wheelAccents}
                  selectedAccentHue={palette.accentHue}
                  onChange={(hue) => {
                    if (palette.mode === 'accent-splash') {
                      setColorPalette({ accentHue: hue, dominantHue: hue });
                    } else {
                      setColorPalette({ dominantHue: hue });
                    }
                  }}
                  onAccentSelect={(accentHue) => setColorPalette({ accentHue })}
                />
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    {palette.mode === 'accent-splash' ? 'Accent' : 'Dominant'}
                  </p>
                  <p className="text-sm font-medium text-brand-400 capitalize">
                    {hueToColorName(
                      palette.mode === 'accent-splash'
                        ? (palette.accentHue ?? palette.dominantHue)
                        : dominant,
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {Math.round(
                      palette.mode === 'accent-splash'
                        ? (palette.accentHue ?? palette.dominantHue)
                        : palette.dominantHue,
                    )}
                    °
                  </p>
                </div>
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
                      onChange={(dominantHue) => setColorPalette({ dominantHue })}
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
                      onChange={(secondaryHue) => setColorPalette({ secondaryHue })}
                    />
                  </div>
                </div>
                <RangeSlider
                  label="Duotone Balance"
                  valueLabel={palette.duotoneBalance < 40 ? 'Primary' : palette.duotoneBalance > 60 ? 'Secondary' : 'Balanced'}
                  min={0}
                  max={100}
                  value={palette.duotoneBalance}
                  onChange={(e) => setColorPalette({ duotoneBalance: parseInt(e.target.value) })}
                />
              </>
            )}

            {palette.mode === 'color' && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Harmony</p>
                <ColorSchemeButtons
                  value={palette.scheme}
                  onChange={(scheme: ColorScheme) => setColorPalette({ scheme, accentHue: null })}
                />
              </div>
            )}

            {!isColorPaletteBw(palette) && palette.mode !== 'accent-splash' && (
              <RangeSlider
                label="Saturation"
                valueLabel={`${palette.saturation}%`}
                min={0}
                max={100}
                value={palette.saturation}
                onChange={(e) => setColorPalette({ saturation: parseInt(e.target.value) })}
              />
            )}

            {palette.mode === 'false-color' && (
              <RangeSlider
                label="Spectrum Bias"
                valueLabel={palette.spectrumBias < 35 ? 'Narrow' : palette.spectrumBias > 65 ? 'Wide' : 'Medium'}
                min={0}
                max={100}
                value={palette.spectrumBias}
                onChange={(e) => setColorPalette({ spectrumBias: parseInt(e.target.value) })}
              />
            )}

            {palette.mode === 'accent-splash' && (
              <>
                <BwTonalRangePanel />
                <RangeSlider
                  label="Accent Strength"
                  valueLabel={`${palette.accentStrength}%`}
                  min={0}
                  max={100}
                  value={palette.accentStrength}
                  onChange={(e) => setColorPalette({ accentStrength: parseInt(e.target.value) })}
                />
              </>
            )}

            {!isColorPaletteBw(palette) && palette.mode !== 'accent-splash' && (
              <>
                <RangeSlider
                  label="Brightness"
                  valueLabel={`${palette.brightness}%`}
                  min={0}
                  max={100}
                  value={palette.brightness}
                  onChange={(e) => setColorPalette({ brightness: parseInt(e.target.value) })}
                />

                <RangeSlider
                  label="Key Light Warmth"
                  valueLabel={warmthLabel(palette.keyLightWarmth)}
                  className="warmth-slider"
                  min={-100}
                  max={100}
                  value={palette.keyLightWarmth}
                  onChange={(e) => setColorPalette({ keyLightWarmth: parseInt(e.target.value) })}
                />
              </>
            )}

            {isColorPaletteBw(palette) && <BwTonalRangePanel />}
          </div>
        </>
      )}
    </div>
  );
}