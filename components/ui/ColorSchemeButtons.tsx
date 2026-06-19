'use client';

import { COLOR_SCHEME_LABELS } from '@/lib/constants/color-palette';
import type { ColorScheme } from '@/lib/types/studio';

const SCHEMES: ColorScheme[] = [
  'analogous',
  'complementary',
  'split-complementary',
  'triadic',
  'tetradic',
  'monochromatic',
];

export interface ColorSchemeButtonsProps {
  value: ColorScheme;
  onChange: (scheme: ColorScheme) => void;
}

export function ColorSchemeButtons({ value, onChange }: ColorSchemeButtonsProps) {
  return (
    <div className="color-scheme-buttons flex flex-wrap gap-1.5">
      {SCHEMES.map((scheme) => (
        <button
          key={scheme}
          type="button"
          className={`color-scheme-btn ${value === scheme ? 'color-scheme-btn--active' : ''}`}
          onClick={() => onChange(scheme)}
        >
          {COLOR_SCHEME_LABELS[scheme]}
        </button>
      ))}
    </div>
  );
}