import { DEFAULT_FRAME_COMPOSITION } from '@/lib/constants/camera';
import { getDefaultResolution } from '@/lib/constants/resolutions';
import { DEFAULT_COLOR_PALETTE, warmthToKelvin } from '@/lib/constants/color-palette';
import { DEFAULT_THEME_TRANSFORM_LIGHTING_INCLUSION } from '@/lib/constants/theme-transform-lighting';
import { DEFAULT_VIDEO_ENVIRONMENT } from '@/lib/constants/video-environment';
import { STOCK_ASSETS, STOCK_MS_PROMPT, STOCK_SURFER_SHOT_ACTIVITY } from '@/lib/constants/stock-demo';
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

/** Default Subject / Backdrop for shot image references (demo-surfer). */
export const STOCK_CHARACTER_REF = STOCK_ASSETS.demoSurferCharacterSheet;
export const STOCK_BACKDROP_REF = STOCK_ASSETS.demoSurferBackdrop;

export const STOCK_PROJECT: ProjectSettings = {
  name: 'Demo_Surfer',
  resolution: getDefaultResolution('16:9'),
  aspectRatio: '16:9',
  fps: 24,
  duration: 5,
};

export const STOCK_CAMERA: CameraSettings = {
  fieldSize: 'fs',
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
  colorTemp: warmthToKelvin(DEFAULT_COLOR_PALETTE.keyLightWarmth),
  atmosphere: 'clear',
  colorPalette: { ...DEFAULT_COLOR_PALETTE },
  themeTransformLighting: { ...DEFAULT_THEME_TRANSFORM_LIGHTING_INCLUSION },
  videoEnvironment: { ...DEFAULT_VIDEO_ENVIRONMENT },
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

export const STOCK_DEMO_MOTION: MotionSettings = {
  ...STOCK_MOTION,
  subjectAction: 'none',
  motionBlur: 'off',
};

export const STOCK_SHOTS: Shot[] = [
  createStockShot(1, 'Shot 01', true, {
    duration: 5,
    placement: 'ix-mid-r',
    withReferences: true,
    thumbnail: STOCK_ASSETS.demoSurferCharacterSheet,
    camera: STOCK_CAMERA,
    motion: STOCK_DEMO_MOTION,
    sceneSetup: STOCK_MS_PROMPT,
    shotActivity: STOCK_SURFER_SHOT_ACTIVITY,
  }),
];

export const EMPTY_PROJECT: ProjectSettings = {
  name: 'Untitled Project',
  resolution: getDefaultResolution('16:9'),
  aspectRatio: '16:9',
  fps: 24,
  duration: 5,
};

export const EMPTY_SHOTS: Shot[] = [
  createStockShot(1, 'Shot 01', true, {
    duration: 5,
    placement: 'cell-1-1',
    withReferences: true,
    sceneSetup: '',
    shotActivity: '',
  }),
];