import { CAMERA_SUBJECT_COUNT_SHORT } from '@/lib/constants/camera';
import type { VisualDropdownOption } from '@/lib/constants/field-size-options';
import type { SubjectCount } from '@/lib/types/studio';

const SUBJECT_COUNT_LABELS: Record<SubjectCount, string> = {
  '1s': '1S — One Shot (Single)',
  '2s': '2S — Two Shot',
  '3s': '3S — Three Shot',
  group: 'Group — Ensemble Shot (4+)',
  crowd: 'Crowd — Crowd Shot',
};

const ALL_SUBJECT_COUNTS: SubjectCount[] = ['1s', '2s', '3s', 'group', 'crowd'];

export function subjectCountThumbnail(count: SubjectCount): string {
  return `/stock/subject-counts/${count}.jpg`;
}

export const SUBJECT_COUNT_OPTIONS: VisualDropdownOption<SubjectCount>[] = ALL_SUBJECT_COUNTS.map(
  (value) => ({
    value,
    label: SUBJECT_COUNT_LABELS[value],
    shortLabel: CAMERA_SUBJECT_COUNT_SHORT[value],
    imageUrl: subjectCountThumbnail(value),
  }),
);