'use client';

import {
  FX_COLOR_MODES,
  FX_MODE_LABELS,
  parentColorMode,
} from '@/lib/constants/color-palette';
import type { ColorPaletteMode, FxColorMode } from '@/lib/types/studio';

export interface ColorModeSegmentProps {
  value: ColorPaletteMode;
  onChange: (mode: ColorPaletteMode) => void;
}

const PRIMARY_MODES: { id: 'color' | 'bw' | 'fx' | 'off'; label: string }[] = [
  { id: 'color', label: 'Color' },
  { id: 'bw', label: 'B&W' },
  { id: 'fx', label: 'FX' },
  { id: 'off', label: 'Off' },
];

const DEFAULT_FX_MODE: FxColorMode = 'false-color';

export function ColorModeSegment({ value, onChange }: ColorModeSegmentProps) {
  const primary = parentColorMode(value);

  return (
    <div className="space-y-2">
      <div className="frame-view-segment w-full" role="tablist" aria-label="Color palette mode">
        {PRIMARY_MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            role="tab"
            aria-selected={primary === mode.id}
            className={`frame-view-segment-btn flex-1 justify-center ${primary === mode.id ? 'active' : ''}`}
            onClick={() => {
              if (mode.id === 'fx') {
                onChange(FX_COLOR_MODES.includes(value as FxColorMode) ? value : DEFAULT_FX_MODE);
              } else {
                onChange(mode.id);
              }
            }}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {primary === 'fx' && (
        <div
          className="frame-view-segment w-full"
          role="tablist"
          aria-label="FX color mode"
        >
          {FX_COLOR_MODES.map((fxMode) => (
            <button
              key={fxMode}
              type="button"
              role="tab"
              aria-selected={value === fxMode}
              className={`frame-view-segment-btn flex-1 justify-center text-xs ${value === fxMode ? 'active' : ''}`}
              onClick={() => onChange(fxMode)}
            >
              {FX_MODE_LABELS[fxMode]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}