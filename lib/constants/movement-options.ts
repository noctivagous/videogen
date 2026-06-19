import { CAMERA_MOVEMENT_LABELS, CAMERA_MOVEMENT_SHORT } from '@/lib/constants/camera';
import type { VisualDropdownOption } from '@/lib/constants/field-size-options';
import type { CameraMovement } from '@/lib/types/studio';

/** Stock filenames under public/stock/movements/ (shared when direction is implied by label). */
const MOVEMENT_THUMBNAIL_FILE: Record<CameraMovement, string> = {
  static: 'static.jpg',
  'pan-left': 'pan.jpg',
  'pan-right': 'pan.jpg',
  'tilt-up': 'tilt.jpg',
  'tilt-down': 'tilt.jpg',
  'dolly-in': 'push-in.jpg',
  'dolly-out': 'dolly-out.jpg',
  'truck-left': 'truck-left.jpg',
  'truck-right': 'truck-right.jpg',
  orbit: 'orbit.jpg',
  handheld: 'handheld.jpg',
  drone: 'drone.jpg',
  'push-in': 'push-in.jpg',
  steadicam: 'steadicam.jpg',
  'whip-pan': 'whip-pan.jpg',
  zoom: 'zoom.jpg',
  'pov-track': 'pov-track.jpg',
};

const ALL_MOVEMENTS: CameraMovement[] = [
  'static',
  'pan-left',
  'pan-right',
  'whip-pan',
  'tilt-up',
  'tilt-down',
  'dolly-in',
  'dolly-out',
  'push-in',
  'truck-left',
  'truck-right',
  'zoom',
  'steadicam',
  'pov-track',
  'orbit',
  'handheld',
  'drone',
];

export function movementThumbnail(movement: CameraMovement): string {
  return `/stock/movements/${MOVEMENT_THUMBNAIL_FILE[movement]}`;
}

export const MOVEMENT_OPTIONS: VisualDropdownOption<CameraMovement>[] = ALL_MOVEMENTS.map(
  (value) => ({
    value,
    label: CAMERA_MOVEMENT_LABELS[value],
    shortLabel: CAMERA_MOVEMENT_SHORT[value],
    imageUrl: movementThumbnail(value),
  }),
);