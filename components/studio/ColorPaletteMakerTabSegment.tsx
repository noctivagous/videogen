'use client';

import {
  COLOR_PALETTE_MAKER_TAB_LABELS,
  COLOR_PALETTE_MAKER_TABS,
  type ColorPaletteMakerTab,
} from '@/lib/studio/color-palette-maker-routes';

interface ColorPaletteMakerTabSegmentProps {
  value: ColorPaletteMakerTab;
  onChange: (tab: ColorPaletteMakerTab) => void;
}

export function ColorPaletteMakerTabSegment({ value, onChange }: ColorPaletteMakerTabSegmentProps) {
  return (
    <div
      className="frame-view-segment color-palette-maker-tab-segment flex items-center gap-1 shrink-0"
      role="tablist"
      aria-label="Color palette maker section"
    >
      {COLOR_PALETTE_MAKER_TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={value === tab}
          className={`frame-view-segment-btn text-[10px] px-2.5 py-1 ${value === tab ? 'active' : ''}`}
          onClick={() => onChange(tab)}
        >
          {COLOR_PALETTE_MAKER_TAB_LABELS[tab]}
        </button>
      ))}
    </div>
  );
}