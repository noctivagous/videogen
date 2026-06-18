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
    placement = 'middle-right',
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
    placement: 'middle-right',
    withReferences: true,
    thumbnail: STOCK_ASSETS.ms,
    camera: STOCK_CAMERA,
    sceneSetup:
      'Use the exact same matte gray male mannequin identity from the reference. ' +
      'Pure photographic film-school reference still. Zero typography: no text, letters, words, numbers, ' +
      'captions, labels, watermarks, logos, signage, UI overlays. ' +
      'Smooth sculpted gray dress shirt, belt at waist — hard-surface gray sculpt. ' +
      'Neutral gray studio, cinematic 35mm lens. Medium shot waist up ONLY: bottom edge cuts exactly at belt line — ' +
      'NO trousers visible below belt, NO thighs. Frame ends at waist. Rule of thirds, subject on the right third. ' +
      'Soft cinematic key light, shallow depth of field.',
    shotActivity: 'Facing camera, arms at sides. Still pose.',
  }),
  createStockShot(2, 'Shot 02', false, {
    duration: 3,
    placement: 'center',
    thumbnail: STOCK_ASSETS.ms,
    camera: { ...STOCK_CAMERA, fieldSize: 'cu' },
    lighting: { ...STOCK_LIGHTING, timeOfDay: 'golden-hour', colorTemp: 4500 },
    sceneSetup: 'Close-up of the matte gray mannequin subject. Neutral studio, soft key light, shallow depth of field.',
    shotActivity: 'Still pose, neutral expression.',
  }),
  createStockShot(3, 'Shot 03', false, {
    duration: 7,
    placement: 'middle-left',
    thumbnail: STOCK_ASSETS.ms,
    camera: { ...STOCK_CAMERA, fieldSize: 'ls', focalLength: 35 },
    lighting: { ...STOCK_LIGHTING, timeOfDay: 'evening', colorTemp: 3200, atmosphere: 'hazy' },
    motion: { ...STOCK_MOTION, subjectAction: 'walking', intensity: 'moderate' },
    sceneSetup: 'Long shot of the mannequin subject in a neutral gray studio. Wide framing, cinematic atmosphere.',
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
  createStockShot(1, 'Shot 01', true, { duration: 5, placement: 'center', sceneSetup: '', shotActivity: '' }),
];