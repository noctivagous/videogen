import type {
  CameraAngle,
  CameraMovement,
  Coverage,
  FieldSize,
  FrameComposition,
  Placement,
  SubjectCount,
} from '@/lib/types/studio';
import {
  DEFAULT_GRID_PLACEMENT,
  PLACEMENT_LABELS,
  PLACEMENT_POSITIONS,
  normalizePlacement,
} from '@/lib/constants/placement-grid';

export {
  DEFAULT_GRID_PLACEMENT,
  GRID_CELLS,
  GRID_INTERSECTIONS,
  PLACEMENT_LABELS,
  PLACEMENT_POSITIONS,
  PLACEMENT_SPECS,
  normalizePlacement,
  placementPrompt,
  placementFramingPrompt,
  getPlacementSpec,
} from '@/lib/constants/placement-grid';
export type { PlacementKind, PlacementSpec } from '@/lib/constants/placement-grid';

export const CAMERA_FIELD_SIZE_SHORT: Record<FieldSize, string> = {
  ecu: 'ECU', cu: 'CU', mcu: 'MCU', 'close-shot': 'CS', ms: 'MS', fs: 'FS',
  ls: 'LS', els: 'ELS', vls: 'VLS', ws: 'WS', mws: 'MWS', bcu: 'BCU',
  xls: 'XLS', cowboy: 'Cowboy', ch: 'CH', gv: 'GV',
};

export const CAMERA_SUBJECT_COUNT_SHORT: Record<SubjectCount, string> = {
  '1s': '1S', '2s': '2S', '3s': '3S', group: 'Group', crowd: 'Crowd',
};

export const CAMERA_ANGLE_LABELS: Record<CameraAngle, string> = {
  'eye-level': 'Eye Level',
  'high-angle': 'High Angle',
  'low-angle': 'Low Angle',
  'birds-eye': "Bird's Eye",
  'worms-eye': "Worm's Eye",
  dutch: 'Dutch Tilt',
  drone: 'Drone',
};

export const CAMERA_MOVEMENT_LABELS: Record<CameraMovement, string> = {
  static: 'Static',
  'pan-left': 'Pan Left',
  'pan-right': 'Pan Right',
  'tilt-up': 'Tilt Up',
  'tilt-down': 'Tilt Down',
  'dolly-in': 'Dolly In',
  'dolly-out': 'Dolly Out',
  'truck-left': 'Truck Left',
  'truck-right': 'Truck Right',
  orbit: 'Orbit',
  handheld: 'Handheld',
  drone: 'Drone Shot',
  'push-in': 'Push In',
  steadicam: 'Steadicam',
  'whip-pan': 'Whip Pan',
  zoom: 'Zoom',
  'pov-track': 'POV Track',
};

export const CAMERA_MOVEMENT_SHORT: Record<CameraMovement, string> = {
  static: 'Static',
  'pan-left': 'Pan L',
  'pan-right': 'Pan R',
  'tilt-up': 'Tilt Up',
  'tilt-down': 'Tilt Down',
  'dolly-in': 'Dolly In',
  'dolly-out': 'Dolly Out',
  'truck-left': 'Truck L',
  'truck-right': 'Truck R',
  orbit: 'Orbit',
  handheld: 'Handheld',
  drone: 'Drone',
  'push-in': 'Push In',
  steadicam: 'Steadicam',
  'whip-pan': 'Whip Pan',
  zoom: 'Zoom',
  'pov-track': 'POV Track',
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
  guide: 'grid-3x3',
  placement: DEFAULT_GRID_PLACEMENT,
  headroom: 'normal',
  showOverlay: true,
};

export const FRAME_GUIDE_LABELS: Record<string, string> = {
  none: 'None',
  'grid-3x3': 'Rule of Thirds',
  'golden-section': 'Golden Section',
  center: 'Center',
  'fill-frame': 'Fill Frame',
};

/** Migrate persisted legacy guide keys to current guide ids. */
export function normalizeCompositionGuide(guide: string | undefined): FrameComposition['guide'] {
  if (guide === 'rule-of-thirds' || guide === 'grid-3x3') {
    return 'grid-3x3';
  }
  if (guide === 'golden-ratio' || guide === 'golden-section') {
    return 'golden-section';
  }
  if (guide === 'none' || guide === 'center' || guide === 'fill-frame') {
    return guide;
  }
  return 'none';
}

export const HEADROOM_FIELD_SIZES = new Set<FieldSize>([
  'ecu', 'cu', 'mcu', 'close-shot', 'ms', 'bcu', 'ch', 'cowboy',
]);

export const REFERENCE_ROLES = [
  'Subject', 'Backdrop', 'Style', 'Depth', 'Canny', 'None',
] as const;

/** Maps legacy persisted roles to current labels. */
export function normalizeReferenceRole(role: string): (typeof REFERENCE_ROLES)[number] {
  if (role === 'Motion') return 'Style';
  if ((REFERENCE_ROLES as readonly string[]).includes(role)) {
    return role as (typeof REFERENCE_ROLES)[number];
  }
  return 'None';
}