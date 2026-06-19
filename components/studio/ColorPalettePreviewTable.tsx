'use client';

import {
  isColorPaletteActive,
  paletteDisplayEntries,
  paletteSwatchCss,
} from '@/lib/constants/color-palette';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import type { ColorPaletteSettings } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

export interface ColorPalettePreviewTableProps {
  palette?: ColorPaletteSettings;
  className?: string;
  /** Transform prompt shown below palette swatches. */
  transformPrompt?: string;
}

export function ColorPalettePreviewTable({
  palette: paletteProp,
  className = '',
  transformPrompt,
}: ColorPalettePreviewTableProps) {
  const storePalette = useStudioStore((s) => s.lighting.colorPalette);
  const palette = paletteProp ?? storePalette;

  if (!isColorPaletteActive(palette)) return null;

  const entries = paletteDisplayEntries(palette);

  return (
    <table
      className={`color-palette-preview-table ${className}`.trim()}
      {...uiSectionProps(UI_SECTIONS.studioPreviewColorPalette)}
    >
      <tbody>
        {entries.map((entry, i) => (
          <tr key={`${entry.name}-${entry.value}-${i}`}>
            <td className="color-palette-preview-table__swatch">
              <span
                className="color-palette-swatch color-palette-swatch--square"
                style={{ backgroundColor: paletteSwatchCss(palette, entry.value, i) }}
                aria-hidden
              />
            </td>
            <td className="color-palette-preview-table__name">{entry.name}</td>
          </tr>
        ))}
      </tbody>
      {transformPrompt?.trim() ? (
        <tfoot>
          <tr>
            <td colSpan={2} className="color-palette-preview-table__prompt-cell">
              <textarea
                readOnly
                rows={3}
                value={transformPrompt}
                className="color-palette-preview-table__prompt-input"
                aria-label="Theme transform prompt"
              />
            </td>
          </tr>
        </tfoot>
      ) : null}
    </table>
  );
}