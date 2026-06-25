import type { MannequinAngle } from '@/lib/types/studio';

/** Facing-direction cycle when rotating left (counter-clockwise from above). */
export const MANNEQUIN_ANGLE_CYCLE: readonly MannequinAngle[] = [
  'front',
  'threeQuarterLeft',
  'left',
  'rearThreeQuarterLeft',
  'back',
  'rearThreeQuarterRight',
  'right',
  'threeQuarterRight',
] as const;

export function rotateMannequinAngle(
  angle: MannequinAngle,
  direction: 'left' | 'right',
): MannequinAngle {
  const idx = MANNEQUIN_ANGLE_CYCLE.indexOf(angle);
  if (idx < 0) return angle;
  const delta = direction === 'left' ? 1 : -1;
  const next = (idx + delta + MANNEQUIN_ANGLE_CYCLE.length) % MANNEQUIN_ANGLE_CYCLE.length;
  return MANNEQUIN_ANGLE_CYCLE[next];
}

export function mannequinAngleLabel(angle: MannequinAngle): string {
  const labels: Record<MannequinAngle, string> = {
    front: 'Front',
    threeQuarterLeft: '3/4 Left',
    threeQuarterRight: '3/4 Right',
    left: 'Left Profile',
    rearThreeQuarterLeft: 'Rear 3/4 Left',
    right: 'Right Profile',
    rearThreeQuarterRight: 'Rear 3/4 Right',
    back: 'Back',
  };
  return labels[angle];
}

const ANGLE_TO_INDEX = new Map<MannequinAngle, number>(
  MANNEQUIN_ANGLE_CYCLE.map((angle, index) => [angle, index]),
);

function wrap(value: number, modulo: number): number {
  return ((value % modulo) + modulo) % modulo;
}

export function angleToYawTurn16(angle: MannequinAngle): number {
  return wrap((ANGLE_TO_INDEX.get(angle) ?? 0) * 2, 16);
}

export function normalizeYawTurn16(
  yawTurn16: number | undefined,
  fallbackAngle: MannequinAngle,
): number {
  if (yawTurn16 == null || !Number.isFinite(yawTurn16)) {
    return angleToYawTurn16(fallbackAngle);
  }
  return wrap(Math.round(yawTurn16), 16);
}

export function yawTurn16ToAngle(yawTurn16: number): MannequinAngle {
  const baseIndex = Math.floor(wrap(yawTurn16, 16) / 2);
  return MANNEQUIN_ANGLE_CYCLE[baseIndex];
}

export function yawTurn16ToVisualYawDeg(yawTurn16: number): number {
  // Odd indices represent half-steps between 1/8 facings.
  return wrap(yawTurn16, 2) === 1 ? -22.5 : 0;
}

export function rotateYawTurn16BySixteenth(
  yawTurn16: number,
  direction: 'left' | 'right',
): number {
  const delta = direction === 'left' ? 1 : -1;
  return wrap(yawTurn16 + delta, 16);
}

export function rotateYawTurn16ByEighth(
  yawTurn16: number,
  direction: 'left' | 'right',
): number {
  const current = wrap(yawTurn16, 16);
  const odd = current % 2 !== 0;
  const delta = direction === 'left' ? 1 : -1;
  // When currently on a 1/16 half-step, snap to the nearest 1/8 in the
  // intended direction instead of adding a full extra 1/8 on top.
  if (odd) return wrap(current + delta, 16);
  return wrap(current + delta * 2, 16);
}