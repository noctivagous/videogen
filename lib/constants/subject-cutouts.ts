import type { CameraSettings, FieldSize } from '@/lib/types/studio';

export type SubjectGender = 'male' | 'female';

export type OtsVariant = 'male-over-male' | 'male-over-female' | 'female-over-male';

/** Field sizes that share the same cutout asset. */
export const FIELD_SIZE_ALIASES: Partial<Record<FieldSize, FieldSize>> = {
  ls: 'fs',
  xls: 'els',
  ws: 'gv',
};

export const ALL_FIELD_SIZES: FieldSize[] = [
  'ecu', 'cu', 'mcu', 'close-shot', 'ms', 'fs', 'ls', 'els', 'vls',
  'ws', 'mws', 'bcu', 'xls', 'cowboy', 'ch', 'gv',
];

export function resolveFieldSizeAsset(fieldSize: FieldSize): FieldSize {
  return FIELD_SIZE_ALIASES[fieldSize] ?? fieldSize;
}

export function getOtsVariant(camera: CameraSettings): OtsVariant {
  if (camera.subjectCount === '2s') return 'male-over-female';
  return 'male-over-male';
}

export function getStockSubjectGender(camera: CameraSettings): SubjectGender {
  if (camera.coverage === 'ots' && camera.subjectCount === '2s') return 'female';
  return 'male';
}

export function subjectCutoutPath(gender: SubjectGender, fieldSize: FieldSize): string {
  const resolved = resolveFieldSizeAsset(fieldSize);
  return `/stock/subjects/${gender}/${resolved}.png`;
}

export function otsCutoutPath(variant: OtsVariant): string {
  return `/stock/subjects/ots/${variant}.png`;
}

export function getSubjectCutoutUrl(camera: CameraSettings): string {
  if (camera.coverage === 'ots') {
    return otsCutoutPath(getOtsVariant(camera));
  }
  const gender = getStockSubjectGender(camera);
  return subjectCutoutPath(gender, camera.fieldSize);
}

/** Fingerprints settings that affect framing preview — used for stale model preview detection. */
export function previewFramingFingerprint(camera: CameraSettings, aspectRatio: string): string {
  return JSON.stringify({
    fieldSize: camera.fieldSize,
    coverage: camera.coverage,
    subjectCount: camera.subjectCount,
    angle: camera.angle,
    aspectRatio,
  });
}