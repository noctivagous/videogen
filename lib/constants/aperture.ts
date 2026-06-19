import type { DepthOfField } from '@/lib/types/studio';

/** Standard full-stop f-numbers found on cinema and still lenses. */
export const APERTURE_STOPS = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22] as const;

export type ApertureStop = (typeof APERTURE_STOPS)[number];

export function snapToApertureStop(f: number): ApertureStop {
  let nearest: ApertureStop = APERTURE_STOPS[0];
  let minDist = Infinity;
  for (const stop of APERTURE_STOPS) {
    const dist = Math.abs(stop - f);
    if (dist < minDist) {
      minDist = dist;
      nearest = stop;
    }
  }
  return nearest;
}

export function apertureStopIndex(f: number): number {
  const snapped = snapToApertureStop(f);
  const idx = APERTURE_STOPS.indexOf(snapped);
  return idx >= 0 ? idx : APERTURE_STOPS.indexOf(2.8);
}

/** 0 = smallest opening (f/22), 1 = widest (f/1.4) — for iris visualization. */
export function apertureOpenness(f: number): number {
  const snapped = snapToApertureStop(f);
  const minArea = 1 / APERTURE_STOPS[APERTURE_STOPS.length - 1];
  const maxArea = 1 / APERTURE_STOPS[0];
  const current = 1 / snapped;
  return (current - minArea) / (maxArea - minArea);
}

export function dofFromAperture(f: number): DepthOfField {
  const snapped = snapToApertureStop(f);
  if (snapped <= 2) return 'very-shallow';
  if (snapped <= 4) return 'shallow';
  if (snapped <= 8) return 'medium';
  return 'deep';
}

/** f-stops that map to each depth-of-field band (inverse of {@link dofFromAperture}). */
const APERTURE_STOPS_BY_DOF: Record<DepthOfField, readonly ApertureStop[]> = {
  'very-shallow': [1.4, 2],
  shallow: [2.8, 4],
  medium: [5.6, 8],
  deep: [11, 16, 22],
};

/** Pick the nearest full stop in `targetDof`'s band; unchanged if current aperture already matches. */
export function apertureForDof(targetDof: DepthOfField, currentF: number): ApertureStop {
  const current = snapToApertureStop(currentF);
  if (dofFromAperture(current) === targetDof) return current;

  const candidates = APERTURE_STOPS_BY_DOF[targetDof];
  let nearest = candidates[0];
  let minDist = Math.abs(nearest - current);
  for (const stop of candidates) {
    const dist = Math.abs(stop - current);
    if (dist < minDist) {
      minDist = dist;
      nearest = stop;
    }
  }
  return nearest;
}

export function formatApertureLabel(f: number): string {
  return `f/${snapToApertureStop(f)}`;
}