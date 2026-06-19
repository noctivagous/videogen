import { CAMERA_ANGLE_LABELS } from '@/lib/constants/camera';
import type { VisualDropdownOption } from '@/lib/constants/field-size-options';
import type { CameraAngle } from '@/lib/types/studio';

const ANGLE_SHORT: Record<CameraAngle, string> = {
  'eye-level': 'Eye Level',
  'high-angle': 'High',
  'low-angle': 'Low',
  'birds-eye': "Bird's Eye",
  'worms-eye': "Worm's Eye",
  dutch: 'Dutch',
  drone: 'Drone',
};

/** Stock filenames under public/stock/angles/ (birds-eye uses overhead.jpg). */
const ANGLE_THUMBNAIL_FILE: Record<CameraAngle, string> = {
  'eye-level': 'eye-level.jpg',
  'high-angle': 'high-angle.jpg',
  'low-angle': 'low-angle.jpg',
  'birds-eye': 'overhead.jpg',
  'worms-eye': 'worms-eye.jpg',
  dutch: 'dutch.jpg',
  drone: 'drone.jpg',
};

const ALL_ANGLES: CameraAngle[] = [
  'eye-level',
  'high-angle',
  'low-angle',
  'birds-eye',
  'worms-eye',
  'dutch',
  'drone',
];

export function angleThumbnail(angle: CameraAngle): string {
  return `/stock/angles/${ANGLE_THUMBNAIL_FILE[angle]}`;
}

export const ANGLE_OPTIONS: VisualDropdownOption<CameraAngle>[] = ALL_ANGLES.map((value) => ({
  value,
  label: CAMERA_ANGLE_LABELS[value],
  shortLabel: ANGLE_SHORT[value],
  imageUrl: angleThumbnail(value),
}));