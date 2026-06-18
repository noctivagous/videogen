import { DEFAULT_FRAME_COMPOSITION } from '@/lib/constants/camera';
import { STOCK_ASSETS, STOCK_MS_PROMPT } from '@/lib/constants/stock-demo';
import type {
  CameraSettings,
  FrameComposition,
  LightingSettings,
  MotionSettings,
  ProjectSettings,
  ReferenceRole,
  Shot,
} from '@/lib/types/studio';

export { STOCK_ASSETS, getBackdropReference, getSubjectReference } from '@/lib/constants/stock-demo';

export const STOCK_CHARACTER_REF = STOCK_ASSETS.mannequinIdentity;
export const STOCK_BACKDROP_REF = STOCK_ASSETS.studioBackdrop;

export const STOCK_PROJECT: ProjectSettings = {
  name: 'Demo_MS_Mannequin',
  resolution: '1280x720',
  aspectRatio: '16:9',
  fps: 24,
  duration: 5,
};

export const STOCK_CAMERA: CameraSettings = {
  fieldSize: 'ms',
  subjectCount: '1s',
  coverage: 'clean',
  lensType: 'standard',
  focalLength: 50,
  angle: 'eye-level',
  movement: 'static',
  aperture: 2.8,
  dof: 'shallow',
};

export const STOCK_LIGHTING: LightingSettings = {
  keyLight: 'soft',
  intensity: 75,
  style: 'cinematic',
  timeOfDay: 'afternoon',
  colorTemp: 5200,
  atmosphere: 'clear',
};

export const STOCK_MOTION: MotionSettings = {
  intensity: 'subtle',
  subjectAction: 'still',
  stabilization: 80,
  motionBlur: 'low',
};

export const STOCK_PROMPT = STOCK_MS_PROMPT;

export const STOCK_SHOT_COMPOSITION: FrameComposition = {
  guide: 'rule-of-thirds',
  placement: 'middle-right',
  headroom: 'normal',
  showOverlay: true,
};

export const STOCK_REFERENCE_ROLES: ReferenceRole[] = ['Subject', 'Backdrop', 'Motion'];

export function createStockShot(
  id: number,
  name: string,
  active: boolean,
  duration: number,
  placement: FrameComposition['placement'] = 'middle-right',
  withReferences = false,
): Shot {
  return {
    id,
    name,
    duration,
    thumbnail: null,
    active,
    references: withReferences
      ? [STOCK_CHARACTER_REF, STOCK_BACKDROP_REF, null]
      : [null, null, null],
    referenceRoles: [...STOCK_REFERENCE_ROLES],
    frameComposition: {
      ...DEFAULT_FRAME_COMPOSITION,
      ...STOCK_SHOT_COMPOSITION,
      placement,
    },
  };
}

export const STOCK_SHOTS: Shot[] = [
  createStockShot(1, 'Shot 01', true, 5, 'middle-right', true),
  createStockShot(2, 'Shot 02', false, 3, 'center', false),
  createStockShot(3, 'Shot 03', false, 7, 'middle-left', false),
];