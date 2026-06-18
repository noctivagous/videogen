import {
  CAMERA_ANGLE_LABELS,
  CAMERA_FIELD_SIZE_SHORT,
  CAMERA_MOVEMENT_SHORT,
  CAMERA_SUBJECT_COUNT_SHORT,
  normalizeReferenceRole,
} from '@/lib/constants/camera';
import { LENS_PRESETS } from '@/lib/constants/lens';
import { getPreviewImageUrl, getSubjectReference } from '@/lib/constants/stock-demo';
import type { CameraSettings, Shot } from '@/lib/types/studio';

export function getShotThumbnailUrl(shot: Shot | undefined): string | null {
  if (!shot) return null;
  if (shot.thumbnail) return shot.thumbnail;
  const subject = getSubjectReference(shot);
  if (subject) return subject;
  const anyRef = shot.references.find(Boolean);
  if (anyRef) return anyRef;
  return getPreviewImageUrl(shot.camera);
}

export function formatShotSettingsLabel(camera: CameraSettings): string {
  const field = CAMERA_FIELD_SIZE_SHORT[camera.fieldSize] ?? camera.fieldSize.toUpperCase();
  const subjects = CAMERA_SUBJECT_COUNT_SHORT[camera.subjectCount] ?? camera.subjectCount;
  return `${field} · ${subjects}`;
}

const LENS_THUMB_SHORT: Record<CameraSettings['lensType'], string> = {
  wide: 'Wide',
  standard: 'Std',
  telephoto: 'Tele',
  macro: 'Macro',
  fisheye: 'Fish',
  anamorphic: 'Anam',
};

/** Compact overlay lines for shot list thumbnails. */
export function getShotThumbnailOverlayLines(shot: Shot): [string, string] {
  const { camera } = shot;
  const framing = formatShotSettingsLabel(camera);
  const lens = LENS_PRESETS[camera.lensType];
  const lensShort = LENS_THUMB_SHORT[camera.lensType] ?? lens.label;
  const line1 = `${framing} · ${camera.focalLength}mm ${lensShort}`;

  const angle = CAMERA_ANGLE_LABELS[camera.angle] ?? camera.angle;
  const line2 =
    camera.movement === 'static'
      ? angle
      : `${angle} · ${CAMERA_MOVEMENT_SHORT[camera.movement] ?? camera.movement}`;

  return [line1, line2];
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function shotHasReferences(shot: Shot | undefined): boolean {
  return Boolean(shot?.references.some(Boolean));
}

export function getShotRefSummary(shot: Shot | undefined): string {
  if (!shot) return '';
  return shot.references
    .map((url, i) => (url ? normalizeReferenceRole(shot.referenceRoles[i] ?? 'None') : null))
    .filter(Boolean)
    .join(', ');
}