import type { MannequinBoundsFrame } from '@/lib/studio/mannequin-bounds-framing';
import { resolveFieldSizeAsset } from '@/lib/constants/subject-cutouts';
import type { FieldSize, MannequinGender } from '@/lib/types/studio';

/** Alpha silhouette bounds measured from a 16:9 subject cutout PNG. */
export interface SubjectCutoutBounds {
  insetLeft: number;
  insetTop: number;
  widthToFrameHeight: number;
}

export type SubjectCutoutBoundsKey = `${MannequinGender}-${FieldSize}`;

/** Convert cutout silhouette bounds to a center-placement mannequin preset. */
export function mannequinPresetFromCutoutBounds(
  cutout: SubjectCutoutBounds,
): Pick<MannequinBoundsFrame, 'insetLeft' | 'insetTop' | 'widthToFrameHeight'> {
  return {
    insetLeft: cutout.insetLeft,
    insetTop: cutout.insetTop,
    widthToFrameHeight: cutout.widthToFrameHeight,
  };
}

export function subjectCutoutAssetPath(gender: MannequinGender, fieldSize: FieldSize): string {
  const asset = resolveFieldSizeAsset(fieldSize);
  return `public/stock/subjects/${gender}/${asset}.png`;
}