import type { MannequinAngle } from '@/lib/types/studio';

/** Facing-direction cycle when rotating left (counter-clockwise from above). */
export const MANNEQUIN_ANGLE_CYCLE: readonly MannequinAngle[] = [
  'front',
  'threeQuarterLeft',
  'left',
  'back',
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
    right: 'Right Profile',
    back: 'Back',
  };
  return labels[angle];
}