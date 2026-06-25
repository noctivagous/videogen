'use client';

import { schemeHueOffsets } from '@/lib/constants/color-palette';
import type { ColorScheme } from '@/lib/types/studio';

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + radius * Math.sin(rad),
    y: cy - radius * Math.cos(rad),
  };
}

function schemeDotPositions(scheme: ColorScheme): { x: number; y: number }[] {
  if (scheme === 'monochromatic') {
    return [
      { x: 8, y: 5 },
      { x: 8, y: 8 },
      { x: 8, y: 11 },
    ];
  }

  const cx = 8;
  const cy = 8;
  const radius = 5.5;
  const angles = [0, ...schemeHueOffsets(scheme)];
  return angles.map((angle) => polarToCartesian(cx, cy, radius, angle));
}

export interface ColorSchemeIconProps {
  scheme: ColorScheme;
  className?: string;
}

export function ColorSchemeIcon({ scheme, className }: ColorSchemeIconProps) {
  const dots = schemeDotPositions(scheme);

  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      aria-hidden
      fill="currentColor"
    >
      {dots.map((dot, index) => (
        <circle key={index} cx={dot.x} cy={dot.y} r={1.35} />
      ))}
    </svg>
  );
}
