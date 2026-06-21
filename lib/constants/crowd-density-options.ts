import type { VisualDropdownOption } from '@/lib/constants/field-size-options';
import type { CrowdDensity } from '@/lib/types/studio';

const ALL_DENSITIES: CrowdDensity[] = ['sparse', 'medium', 'packed'];

const DENSITY_LABELS: Record<CrowdDensity, string> = {
  sparse: 'Sparse',
  medium: 'Medium',
  packed: 'Packed',
};

export const CROWD_DENSITY_PROMPT_LABELS: Record<CrowdDensity, string> = {
  sparse: 'sparse crowd',
  medium: 'medium density crowd',
  packed: 'packed dense crowd',
};

export const CROWD_DENSITY_OPTIONS: VisualDropdownOption<CrowdDensity>[] = ALL_DENSITIES.map(
  (value) => ({
    value,
    label: DENSITY_LABELS[value],
    shortLabel: DENSITY_LABELS[value],
  }),
);

export function normalizeCrowdDensity(density: CrowdDensity | undefined): CrowdDensity {
  if (density && ALL_DENSITIES.includes(density)) return density;
  return 'medium';
}

/** Grid spacing multiplier for crowd mannequin layout. */
export function crowdDensitySpacingScale(density: CrowdDensity): number {
  switch (density) {
    case 'sparse':
      return 1.25;
    case 'packed':
      return 0.75;
    default:
      return 1;
  }
}
