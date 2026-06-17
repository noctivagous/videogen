import type {
  Coverage,
  FieldSize,
  FrameComposition,
  Placement,
  SubjectCount,
} from '@/lib/types/studio';

export const CAMERA_FIELD_SIZE_SHORT: Record<FieldSize, string> = {
  ecu: 'ECU', cu: 'CU', mcu: 'MCU', 'close-shot': 'CS', ms: 'MS', fs: 'FS',
  ls: 'LS', els: 'ELS', vls: 'VLS', ws: 'WS', mws: 'MWS', bcu: 'BCU',
  xls: 'XLS', cowboy: 'Cowboy', ch: 'CH', gv: 'GV',
};

export const CAMERA_SUBJECT_COUNT_SHORT: Record<SubjectCount, string> = {
  '1s': '1S', '2s': '2S', '3s': '3S', group: 'Group', crowd: 'Crowd',
};

export const CAMERA_COVERAGE_LABELS: Record<Coverage, string> = {
  clean: 'Clean Single',
  'dirty-single': 'Dirty Single',
  ots: 'OTS',
  'one-half': '1½ Shot',
  pov: 'POV',
};

export const SINGLE_ONLY_COVERAGE = new Set<Coverage>([
  'dirty-single', 'ots', 'one-half', 'pov',
]);

export const LEGACY_FIELD_SIZE_MIGRATION: Record<string, Partial<{
  subjectCount: SubjectCount;
  coverage: Coverage;
  fieldSize: FieldSize;
}>> = {
  '2s': { subjectCount: '2s', fieldSize: 'ms' },
  ots: { subjectCount: '1s', coverage: 'ots', fieldSize: 'ms' },
  pov: { subjectCount: '1s', coverage: 'pov', fieldSize: 'ms' },
};

export const DEFAULT_FRAME_COMPOSITION: FrameComposition = {
  guide: 'rule-of-thirds',
  placement: 'middle-right',
  headroom: 'normal',
  showOverlay: true,
};

export const PLACEMENT_POSITIONS: Record<Placement, { x: number; y: number }> = {
  'top-left': { x: 16.67, y: 16.67 },
  'top-center': { x: 50, y: 16.67 },
  'top-right': { x: 83.33, y: 16.67 },
  'middle-left': { x: 16.67, y: 50 },
  center: { x: 50, y: 50 },
  'middle-right': { x: 83.33, y: 50 },
  'bottom-left': { x: 16.67, y: 83.33 },
  'bottom-center': { x: 50, y: 83.33 },
  'bottom-right': { x: 83.33, y: 83.33 },
};

export const FRAME_GUIDE_LABELS: Record<string, string> = {
  none: 'None',
  'rule-of-thirds': 'Rule of Thirds',
  'golden-ratio': 'Golden Ratio',
  center: 'Center',
  'fill-frame': 'Fill Frame',
};

export const PLACEMENT_LABELS: Record<Placement, string> = {
  'top-left': 'Top Left',
  'top-center': 'Top Center',
  'top-right': 'Top Right',
  'middle-left': 'Left Third',
  center: 'Center',
  'middle-right': 'Right Third',
  'bottom-left': 'Bottom Left',
  'bottom-center': 'Bottom Center',
  'bottom-right': 'Bottom Right',
};

export const HEADROOM_FIELD_SIZES = new Set<FieldSize>([
  'ecu', 'cu', 'mcu', 'close-shot', 'ms', 'bcu', 'ch', 'cowboy',
]);

export const PLACEMENTS: Placement[] = [
  'top-left', 'top-center', 'top-right',
  'middle-left', 'center', 'middle-right',
  'bottom-left', 'bottom-center', 'bottom-right',
];

export const REFERENCE_ROLES = [
  'Subject', 'Style', 'Motion', 'Depth', 'Canny', 'None',
] as const;