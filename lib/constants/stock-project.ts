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
  colorTemp: 5800,
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
  guide: 'grid-3x3',
  placement: 'ix-mid-r',
  headroom: 'normal',
  showOverlay: true,
};

export const STOCK_REFERENCE_ROLES: ReferenceRole[] = ['Subject', 'Backdrop', 'Style'];

export interface CreateStockShotOptions {
  duration?: number;
  placement?: FrameComposition['placement'];
  withReferences?: boolean;
  thumbnail?: string | null;
  camera?: CameraSettings;
  lighting?: LightingSettings;
  motion?: MotionSettings;
  sceneSetup?: string;
  shotActivity?: string;
  /** @deprecated use sceneSetup */
  prompt?: string;
}

export function createStockShot(
  id: number,
  name: string,
  active: boolean,
  options: CreateStockShotOptions = {},
): Shot {
  const {
    duration = 5,
    placement = 'ix-mid-r',
    withReferences = false,
    thumbnail = null,
    camera = STOCK_CAMERA,
    lighting = STOCK_LIGHTING,
    motion = STOCK_MOTION,
    sceneSetup = STOCK_PROMPT,
    shotActivity = '',
    prompt,
  } = options;

  return {
    id,
    name,
    duration,
    thumbnail: thumbnail ?? (withReferences ? STOCK_ASSETS.ms : null),
    videoUrl: null,
    generatedVideos: [],
    activeVideoIndex: 0,
    active,
    camera: { ...camera },
    lighting: { ...lighting },
    motion: { ...motion },
    sceneSetup: sceneSetup ?? prompt ?? STOCK_PROMPT,
    shotActivity,
    references: withReferences
      ? [STOCK_CHARACTER_REF, STOCK_BACKDROP_REF, null]
      : [null, null, null],
    referenceRoles: [...STOCK_REFERENCE_ROLES],
    cinematographyRefs: true,
    frameComposition: {
      ...DEFAULT_FRAME_COMPOSITION,
      ...STOCK_SHOT_COMPOSITION,
      placement,
    },
  };
}

export const STOCK_SHOTS: Shot[] = [
  createStockShot(1, 'Shot 01', true, {
    duration: 5,
    placement: 'ix-mid-r',
    withReferences: true,
    thumbnail: STOCK_ASSETS.ms,
    camera: STOCK_CAMERA,
    sceneSetup: STOCK_MS_PROMPT,
    shotActivity: 'Facing camera, arms at sides. Still pose.',
  }),
  createStockShot(2, 'Shot 02', false, {
    duration: 3,
    placement: 'cell-1-1',
    thumbnail: STOCK_ASSETS.ms,
    camera: { ...STOCK_CAMERA, fieldSize: 'cu' },
    lighting: { ...STOCK_LIGHTING, timeOfDay: 'golden-hour', colorTemp: 4500 },
    sceneSetup: '',
    shotActivity: 'Still pose, neutral expression.',
  }),
  createStockShot(3, 'Shot 03', false, {
    duration: 7,
    placement: 'ix-mid-l',
    thumbnail: STOCK_ASSETS.ms,
    camera: { ...STOCK_CAMERA, fieldSize: 'ls', focalLength: 35 },
    lighting: { ...STOCK_LIGHTING, timeOfDay: 'evening', colorTemp: 3200, atmosphere: 'hazy' },
    motion: { ...STOCK_MOTION, subjectAction: 'walking', intensity: 'moderate' },
    sceneSetup: '',
    shotActivity: 'Walking through the studio at a moderate pace.',
  }),
];

export const EMPTY_PROJECT: ProjectSettings = {
  name: 'Untitled Project',
  resolution: '1280x720',
  aspectRatio: '16:9',
  fps: 24,
  duration: 5,
};

export const EMPTY_SHOTS: Shot[] = [
  createStockShot(1, 'Shot 01', true, { duration: 5, placement: 'cell-1-1', sceneSetup: '', shotActivity: '' }),
];