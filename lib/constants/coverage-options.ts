import { CAMERA_COVERAGE_LABELS } from '@/lib/constants/camera';
import type { VisualDropdownOption } from '@/lib/constants/field-size-options';
import type { Coverage } from '@/lib/types/studio';

const COVERAGE_LABELS: Record<Coverage, string> = {
  clean: 'Clean Single',
  'dirty-single': 'Dirty Single',
  ots: 'Over The Shoulder (OTS)',
  'one-half': '1½ Shot (One and a Half)',
  pov: 'Point Of View (POV)',
};

const COVERAGE_SHORT: Record<Coverage, string> = {
  clean: 'Clean',
  'dirty-single': 'Dirty',
  ots: 'OTS',
  'one-half': '1½',
  pov: 'POV',
};

const ALL_COVERAGE: Coverage[] = ['clean', 'dirty-single', 'ots', 'one-half', 'pov'];

export function coverageThumbnail(coverage: Coverage): string {
  return `/stock/coverage/${coverage}.jpg`;
}

export const COVERAGE_OPTIONS: VisualDropdownOption<Coverage>[] = ALL_COVERAGE.map((value) => ({
  value,
  label: COVERAGE_LABELS[value],
  shortLabel: COVERAGE_SHORT[value] ?? CAMERA_COVERAGE_LABELS[value],
  imageUrl: coverageThumbnail(value),
}));