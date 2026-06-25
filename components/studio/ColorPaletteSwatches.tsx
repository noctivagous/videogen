'use client';

import {
  hueToColorName,
  isColorPaletteActive,
  isColorPaletteBw,
  isColorPaletteFx,
  paletteDisplayEntries,
  paletteSwatchCss,
} from '@/lib/constants/color-palette';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import type { ColorPaletteSettings } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

export interface ColorPaletteSwatchesProps {
  palette?: ColorPaletteSettings;
  onPatch?: (patch: Partial<ColorPaletteSettings>) => void;
  interactive?: boolean;
  variant?: 'inline' | 'overlay';
  className?: string;
}

export function ColorPaletteSwatches({
  palette: paletteProp,
  onPatch,
  interactive = true,
  variant = 'inline',
  className = '',
}: ColorPaletteSwatchesProps) {
  const storePalette = useStudioStore((s) => s.lighting.colorPalette);
  const setColorPalette = useStudioStore((s) => s.setColorPalette);
  const palette = paletteProp ?? storePalette;
  const patchPalette = onPatch ?? setColorPalette;

  const entries = paletteDisplayEntries(palette);

  if (!isColorPaletteActive(palette)) return null;

  const sectionProps = variant === 'overlay' ? uiSectionProps(UI_SECTIONS.studioPreviewColorPalette) : {};

  return (
    <div
      className={`color-palette-swatch-strip color-palette-swatch-strip--${variant} ${className}`.trim()}
      {...sectionProps}
    >
      {interactive && !isColorPaletteBw(palette) && !isColorPaletteFx(palette) && palette.accentHue != null && (
        <button
          type="button"
          className="text-[10px] uppercase tracking-wider text-gray-500 hover:text-brand-400 transition-colors mr-0.5"
          onClick={() => patchPalette({ accentHue: null })}
        >
          Reset
        </button>
      )}
      {entries.map((entry, i) => {
        const isDominant = i === 0;
        const isSelected = !isDominant && !isColorPaletteBw(palette) && !isColorPaletteFx(palette) && palette.accentHue === entry.value;
        const label = isColorPaletteBw(palette) || isColorPaletteFx(palette)
          ? entry.name
          : `${isDominant ? 'Dominant' : 'Accent'} ${hueToColorName(entry.value)}`;
        const swatchClass = `color-palette-swatch color-palette-swatch--square ${isSelected ? 'color-palette-swatch--selected' : ''}`;

        if (!interactive || isDominant || isColorPaletteBw(palette) || isColorPaletteFx(palette)) {
          return (
            <span
              key={`${entry.value}-${i}`}
              title={label}
              aria-label={label}
              className={swatchClass}
              style={{ backgroundColor: paletteSwatchCss(palette, entry.value, i) }}
            />
          );
        }

        return (
          <button
            key={`${entry.value}-${i}`}
            type="button"
            title={label}
            className={`${swatchClass} p-0 cursor-pointer`}
            style={{ backgroundColor: paletteSwatchCss(palette, entry.value, i) }}
            onClick={() => patchPalette({ accentHue: entry.value })}
            aria-label={label}
          />
        );
      })}
    </div>
  );
}