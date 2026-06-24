import { DEFAULT_FRAME_COMPOSITION } from '@/lib/constants/camera';
import { DEFAULT_REFERENCE_MODE } from '@/lib/constants/reference-modes';
import { getDefaultResolution } from '@/lib/constants/resolutions';
import { DEFAULT_COLOR_PALETTE, warmthToKelvin } from '@/lib/constants/color-palette';
import { DEFAULT_CAMERA_PROMPT_INCLUSION } from '@/lib/constants/camera-prompt-inclusion';
import { DEFAULT_THEME_TRANSFORM_LIGHTING_INCLUSION } from '@/lib/constants/theme-transform-lighting';
import { DEFAULT_VIDEO_ENVIRONMENT } from '@/lib/constants/video-environment';
import { DEFAULT_VIDEO_LIGHTING } from '@/lib/constants/video-lighting';
import { STOCK_ASSETS, STOCK_MS_PROMPT, STOCK_SURFER_SHOT_ACTIVITY } from '@/lib/constants/stock-demo';
import type {
  CameraSettings,
  Character,
  CoverageShot,
  FrameComposition,
  LightingSettings,
  Location,
  MotionSettings,
  ProjectSettings,
  ReferenceRole,
  Setup,
  Shot,
} from '@/lib/types/studio';
import {
  createCoverageShot,
  createDefaultBackdrop,
  createSetup,
} from '@/lib/studio/coverage-shot-settings';

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
  ui: { workflowDescriptionExpanded: true },
};

export const STOCK_CAMERA: CameraSettings = {
  fieldSize: 'ls',
  subjectCount: '1s',
  coverage: 'clean',
  arrangement: 'two-shot-clean',
  crowdDensity: 'medium',
  fillRestWithGenerics: true,
  heroSubjectsEnabled: false,
  lensType: 'standard',
  focalLength: 50,
  angle: 'eye-level',
  movement: 'static',
  aperture: 2.8,
  dof: 'shallow',
  promptInclusion: { ...DEFAULT_CAMERA_PROMPT_INCLUSION },
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
  videoLighting: { ...DEFAULT_VIDEO_LIGHTING },
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

export const STOCK_REFERENCE_ROLES: ReferenceRole[] = ['Backdrop', 'Subject', 'Style'];

/** Stable IDs for demo Character / Location entities. */
export const STOCK_CHARACTER_BUD_ID = 'stock-character-bud';
export const STOCK_CHARACTER_BUD_SHEET_ID = 'stock-character-bud-sheet-1';
export const STOCK_LOCATION_CHK_OFFICE_ID = 'stock-location-chk-office';
export const STOCK_LOCATION_CHK_PLATE_ID = 'stock-plate-57th-entry-left';

export const STOCK_CHARACTERS: Character[] = [
  {
    id: STOCK_CHARACTER_BUD_ID,
    name: 'Bud',
    sheets: [
      {
        id: STOCK_CHARACTER_BUD_SHEET_ID,
        url: STOCK_ASSETS.demoSurferCharacterSheet,
        label: 'Character Sheet 1',
        dataType: 'character-sheet',
        createdAt: 0,
      },
    ],
    createdAt: 0,
  },
];

export const STOCK_LOCATIONS: Location[] = [
  {
    id: STOCK_LOCATION_CHK_OFFICE_ID,
    name: 'CHK Office',
    plates: [
      {
        id: STOCK_LOCATION_CHK_PLATE_ID,
        url: STOCK_ASSETS.demoSurferBackdrop,
        label: '57th St. Entry - Left',
        dataType: 'backdrop-plate',
        createdAt: 0,
      },
    ],
    createdAt: 0,
  },
];

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
      ? [STOCK_BACKDROP_REF, STOCK_CHARACTER_REF, null]
      : [null, null, null],
    referenceRoles: [...STOCK_REFERENCE_ROLES],
    referenceMode: DEFAULT_REFERENCE_MODE,
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

export function createStockSetup(
  id: number,
  name: string,
  active: boolean,
  options: CreateStockShotOptions = {},
): Setup {
  const shot = createStockShot(id, `Shot ${String(id).padStart(2, '0')}`, active, options);
  const backdropUrl = options.withReferences !== false ? STOCK_BACKDROP_REF : null;
  const coverage = createCoverageShot(id, shot.name, active, STOCK_LOCATION_CHK_PLATE_ID, {
    duration: shot.duration,
    thumbnail: shot.thumbnail,
    videoUrl: shot.videoUrl,
    generatedVideos: shot.generatedVideos,
    activeVideoIndex: shot.activeVideoIndex,
    camera: shot.camera,
    motion: shot.motion,
    shotActivity: shot.shotActivity,
    frameComposition: shot.frameComposition,
  });

  const setup = createSetup(id, name.replace(/^Shot\s+/i, 'Setup '), 1, active, coverage, {
    backdropUrl,
    setupSettings: {
      sceneSetup: shot.sceneSetup,
      lighting: shot.lighting,
      references: options.withReferences !== false
        ? [STOCK_CHARACTER_REF, null]
        : [null, null],
      referenceRoles: ['Subject', 'Style'],
      referenceMode: shot.referenceMode,
      characterSlots: options.withReferences !== false ? [STOCK_CHARACTER_BUD_ID] : undefined,
      characterSheetSlots: options.withReferences !== false ? [STOCK_CHARACTER_BUD_SHEET_ID] : undefined,
      locationId: options.withReferences !== false ? STOCK_LOCATION_CHK_OFFICE_ID : null,
    },
  });

  if (options.withReferences !== false) {
    setup.backdrops = [
      {
        id: STOCK_LOCATION_CHK_PLATE_ID,
        label: '57th St. Entry - Left',
        url: backdropUrl,
      },
    ];
    setup.shots[0].backdropId = STOCK_LOCATION_CHK_PLATE_ID;
  }

  return setup;
}

export const STOCK_SETUPS: Setup[] = [
  createStockSetup(1, 'Setup 01', true, {
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

export const EMPTY_SETUPS: Setup[] = [
  createStockSetup(1, 'Setup 01', true, {
    duration: 5,
    placement: 'cell-1-1',
    withReferences: true,
    sceneSetup: '',
    shotActivity: '',
  }),
];

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
  ui: { workflowDescriptionExpanded: true },
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