import { normalizeReferenceRole } from '@/lib/constants/camera';
import {
  getSubjectCutoutUrl,
  getStockSubjectGender,
  subjectCutoutPath,
  otsCutoutPath,
  getOtsVariant,
} from '@/lib/constants/subject-cutouts';
import type { CameraSettings, FieldSize, Shot } from '@/lib/types/studio';

/** Stock asset paths aligned with public/stock/prompts.json conventions. */
export const STOCK_ASSETS = {
  ms: '/stock/shot-types/ms.jpg',
  mannequinIdentity: '/stock/shot-types/mannequin-identity.jpg',
  studioBackdrop: '/stock/studio-backdrop.jpg',
} as const;

/**
 * Demo scene content only — identity, studio, framing, and lighting come from
 * reference images and camera / lighting / composition panels.
 */
export const STOCK_MS_PROMPT =
  'Matte gray male mannequin in a smooth sculpted gray dress shirt with belt at the waist. ' +
  'Hard-surface gray sculpt.';

/** Map field sizes to cinematography preview chip files when available. */
const FIELD_SIZE_PREVIEW: Partial<Record<FieldSize, string>> = {
  ms: STOCK_ASSETS.ms,
  mcu: '/stock/shot-types/mcu.jpg',
  cu: '/stock/shot-types/cu.jpg',
  ecu: '/stock/shot-types/ecu.jpg',
  els: '/stock/shot-types/els.jpg',
  vls: '/stock/shot-types/els.jpg',
  xls: '/stock/shot-types/els.jpg',
};

export function getPreviewImageUrl(camera: CameraSettings): string {
  return FIELD_SIZE_PREVIEW[camera.fieldSize] ?? STOCK_ASSETS.ms;
}

export { getSubjectCutoutUrl, getStockSubjectGender, subjectCutoutPath, otsCutoutPath, getOtsVariant };

/** True when the Subject ref is a user upload, not a bundled stock identity image. */
export function isUserSubjectReference(url: string): boolean {
  if (url.startsWith('data:')) return true;
  if (url.startsWith('blob:')) return true;
  if (url.startsWith('/stock/')) return false;
  return true;
}

export function getUserSubjectReference(shot: Shot | undefined): string | null {
  if (!shot) return null;
  for (let i = 0; i < shot.references.length; i++) {
    const ref = shot.references[i];
    const role = normalizeReferenceRole(shot.referenceRoles[i] ?? 'None');
    if (ref && role === 'Subject' && isUserSubjectReference(ref)) return ref;
  }
  return null;
}

/** Subject ref for video/API generation (includes stock identity). */
export function getGenerationSubjectReference(shot: Shot | undefined): string | null {
  if (!shot) return STOCK_ASSETS.mannequinIdentity;
  for (let i = 0; i < shot.references.length; i++) {
    const ref = shot.references[i];
    const role = normalizeReferenceRole(shot.referenceRoles[i] ?? 'None');
    if (ref && role === 'Subject') return ref;
  }
  return null;
}

export function getSubjectReference(shot: Shot | undefined): string | null {
  return getGenerationSubjectReference(shot);
}

/** Framing preview always uses per-field-size cutouts unless the user uploaded a custom Subject. */
export function getPreviewSubjectUrl(shot: Shot | undefined, camera: CameraSettings): string {
  const userUpload = getUserSubjectReference(shot);
  if (userUpload) return userUpload;
  return getSubjectCutoutUrl(camera);
}

export function usesFieldSizeCutout(shot: Shot | undefined): boolean {
  return !getUserSubjectReference(shot);
}

export function getBackdropReference(shot: Shot | undefined): string | null {
  if (!shot) return STOCK_ASSETS.studioBackdrop;
  for (let i = 0; i < shot.references.length; i++) {
    const ref = shot.references[i];
    const role = normalizeReferenceRole(shot.referenceRoles[i] ?? 'None');
    if (ref && (role === 'Backdrop' || role === 'Depth')) return ref;
  }
  return STOCK_ASSETS.studioBackdrop;
}