import type { VisualDropdownOption } from '@/lib/constants/field-size-options';
import type { DepthOfField } from '@/lib/types/studio';

export const DOF_LABELS: Record<DepthOfField, string> = {
  'very-shallow': 'Very Shallow',
  shallow: 'Shallow',
  medium: 'Medium',
  deep: 'Deep Focus / Landscape',
};

export const DOF_SHORT: Record<DepthOfField, string> = {
  'very-shallow': 'Very Shallow',
  shallow: 'Shallow',
  medium: 'Medium',
  deep: 'Deep',
};

const ALL_DOF: DepthOfField[] = ['very-shallow', 'shallow', 'medium', 'deep'];

export function dofThumbnail(dof: DepthOfField): string {
  return `/stock/depth-of-field/${dof}.jpg`;
}

export const DOF_OPTIONS: VisualDropdownOption<DepthOfField>[] = ALL_DOF.map((value) => ({
  value,
  label: DOF_LABELS[value],
  shortLabel: DOF_SHORT[value],
  imageUrl: dofThumbnail(value),
}));