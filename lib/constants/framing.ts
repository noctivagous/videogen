import type { FieldSize, Headroom } from '@/lib/types/studio';

export interface FieldFraming {
  spanRatio: number;
  aim: number;
  fill: number;
}

/** Fraction of figure height to fit in frame, aim point, and subject fill of vertical FOV */
export const FIELD_SIZE_FRAMING: Record<FieldSize, FieldFraming> = {
  ecu: { spanRatio: 0.22, aim: 0.88, fill: 0.45 },
  ch: { spanRatio: 0.26, aim: 0.86, fill: 0.45 },
  bcu: { spanRatio: 0.3, aim: 0.84, fill: 0.42 },
  cu: { spanRatio: 0.38, aim: 0.78, fill: 0.38 },
  mcu: { spanRatio: 0.48, aim: 0.72, fill: 0.36 },
  'close-shot': { spanRatio: 0.55, aim: 0.68, fill: 0.34 },
  ms: { spanRatio: 0.72, aim: 0.6, fill: 0.3 },
  cowboy: { spanRatio: 0.78, aim: 0.55, fill: 0.28 },
  mws: { spanRatio: 0.88, aim: 0.5, fill: 0.26 },
  fs: { spanRatio: 1.05, aim: 0.48, fill: 0.24 },
  ls: { spanRatio: 1.25, aim: 0.45, fill: 0.2 },
  ws: { spanRatio: 1.35, aim: 0.42, fill: 0.18 },
  els: { spanRatio: 1.55, aim: 0.4, fill: 0.16 },
  vls: { spanRatio: 1.65, aim: 0.38, fill: 0.14 },
  xls: { spanRatio: 1.55, aim: 0.4, fill: 0.16 },
  gv: { spanRatio: 1.45, aim: 0.42, fill: 0.17 },
};

/** Figure height as % of frame for 2D vector preview */
export const FIELD_SIZE_HEIGHT_PCT: Record<FieldSize, number> = Object.fromEntries(
  Object.entries(FIELD_SIZE_FRAMING).map(([key, { spanRatio }]) => [key, spanRatio * 95]),
) as Record<FieldSize, number>;

export const HEADROOM_Y_OFFSET: Record<Headroom, number> = {
  tight: -3,
  normal: 0,
  generous: 4,
};