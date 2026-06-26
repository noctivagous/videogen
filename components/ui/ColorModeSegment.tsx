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

const MODE_SELECT_OPTIONS: { value: ColorPaletteMode; label: string }[] = [
  { value: 'color', label: 'Color' },
  { value: 'bw', label: 'B&W' },
  ...FX_COLOR_MODES.map((mode) => ({ value: mode, label: FX_MODE_LABELS[mode] })),
  { value: 'off', label: 'Off' },
];

export function ColorModeSelect({ value, onChange }: ColorModeSegmentProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ColorPaletteMode)}
      aria-label="Color palette mode"
      className="shrink-0 bg-surface-900 border border-surface-600 rounded-lg px-2 py-1.5 text-xs text-gray-100 focus:outline-none focus:border-brand-500"
    >
      {MODE_SELECT_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function ColorModeIconPreview({ mode }: { mode: ColorPaletteMode }) {
  switch (mode) {
    case 'color':
      return (
        <div
          className="size-full rounded-[7px]"
          style={{
            background:
              'conic-gradient(from 0deg, #ef4444, #f59e0b, #22c55e, #3b82f6, #a855f7, #ef4444)',
          }}
        />
      );
    case 'bw':
      return <div className="size-full rounded-[7px] bg-gradient-to-br from-gray-200 via-gray-500 to-gray-900" />;
    case 'false-color':
      return (
        <div className="size-full rounded-[7px] bg-gradient-to-r from-blue-700 via-emerald-400 via-yellow-300 to-red-500" />
      );
    case 'duotone':
      return <div className="size-full rounded-[7px] bg-gradient-to-br from-violet-500 to-amber-400" />;
    case 'accent-splash':
      return (
        <div className="relative size-full rounded-[7px] bg-gradient-to-br from-gray-500 to-gray-900">
          <span className="absolute bottom-1 right-1 size-3.5 rounded-full bg-orange-500 ring-1 ring-black/30" />
        </div>
      );
    case 'off':
      return (
        <div className="size-full rounded-[7px] border border-dashed border-surface-500 bg-surface-700/80" />
      );
    default:
      return <div className="size-full rounded-[7px] bg-surface-700" />;
  }
}

export function ColorModeIconBar({ value, onChange }: ColorModeSegmentProps) {
  return (
    <div
      className="flex shrink-0 flex-col gap-2"
      role="toolbar"
      aria-label="Color palette mode"
    >
      {MODE_SELECT_OPTIONS.map((option) => {
        const active = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-label={option.label}
            aria-pressed={active}
            className="group"
          >
            <span
              className={`flex size-[3.375rem] flex-col rounded-lg border p-1 transition-all ${
                active
                  ? 'border-brand-500/60 bg-brand-500/10 ring-1 ring-brand-500/30'
                  : 'border-surface-600 bg-surface-800/80 group-hover:border-surface-500 group-hover:bg-surface-700'
              }`}
            >
              <span className="min-h-0 flex-1 overflow-hidden rounded-[5px]">
                <ColorModeIconPreview mode={option.value} />
              </span>
              <span
                className={`mt-0.5 shrink-0 px-px text-center text-[7px] font-medium uppercase leading-tight tracking-wide line-clamp-2 ${
                  active ? 'text-brand-300' : 'text-gray-500 group-hover:text-gray-300'
                }`}
              >
                {option.label}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

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