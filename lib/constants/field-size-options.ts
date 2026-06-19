import { CAMERA_FIELD_SIZE_SHORT } from '@/lib/constants/camera';
import { ALL_FIELD_SIZES, subjectCutoutPath } from '@/lib/constants/subject-cutouts';
import type { FieldSize } from '@/lib/types/studio';

export interface VisualDropdownOption<T extends string = string> {
  value: T;
  label: string;
  shortLabel?: string;
  imageUrl?: string;
  backgroundUrl?: string;
}

const FIELD_SIZE_LABELS: Record<FieldSize, string> = {
  ecu: 'ECU — Extreme Close-Up',
  cu: 'CU — Close-Up',
  mcu: 'MCU — Medium Close-Up',
  'close-shot': 'CS — Close Shot',
  ms: 'MS — Medium Shot',
  fs: 'FS — Full Shot',
  ls: 'LS — Long Shot',
  els: 'ELS — Extreme Long Shot',
  vls: 'VLS — Very Long Shot',
  ws: 'WS — Wide Shot',
  mws: 'MWS — Medium Wide Shot',
  bcu: 'BCU — Big Close-Up',
  xls: 'XLS — Extreme Long Shot',
  cowboy: 'CS — Cowboy Shot (American Shot)',
  ch: 'CH — Choker Shot',
  gv: 'GV — General View',
};

export function fieldSizeThumbnail(fieldSize: FieldSize): string {
  return subjectCutoutPath('male', fieldSize);
}

export const FIELD_SIZE_OPTIONS: VisualDropdownOption<FieldSize>[] = ALL_FIELD_SIZES.map(
  (value) => ({
    value,
    label: FIELD_SIZE_LABELS[value],
    shortLabel: CAMERA_FIELD_SIZE_SHORT[value],
    imageUrl: fieldSizeThumbnail(value),
  }),
);