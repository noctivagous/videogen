'use client';

import { COLOR_SCHEME_LABELS } from '@/lib/constants/color-palette';
import { ColorSchemeIcon } from '@/components/ui/ColorSchemeIcon';
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
          className={`color-scheme-btn inline-flex items-center gap-1 ${value === scheme ? 'color-scheme-btn--active' : ''}`}
          onClick={() => onChange(scheme)}
        >
          <ColorSchemeIcon scheme={scheme} className="w-3.5 h-3.5 shrink-0 opacity-80" />
          {COLOR_SCHEME_LABELS[scheme]}
        </button>
      ))}
    </div>
  );
}