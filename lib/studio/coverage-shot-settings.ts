import { DEFAULT_FRAME_COMPOSITION } from '@/lib/constants/camera';
import { DEFAULT_REFERENCE_MODE } from '@/lib/constants/reference-modes';
import { normalizeReferenceRole } from '@/lib/constants/camera';
import { normalizeLensCamera } from '@/lib/constants/lens';
import { DEFAULT_COLOR_PALETTE, normalizeColorPalette } from '@/lib/constants/color-palette';
import { STOCK_CHARACTER_REF } from '@/lib/constants/stock-project';
import {
  DEFAULT_THEME_TRANSFORM_LIGHTING_INCLUSION,
  normalizeThemeTransformLighting,
} from '@/lib/constants/theme-transform-lighting';
import { DEFAULT_VIDEO_ENVIRONMENT, normalizeVideoEnvironment } from '@/lib/constants/video-environment';
import { DEFAULT_VIDEO_LIGHTING, normalizeVideoLighting } from '@/lib/constants/video-lighting';
import { DEFAULT_CAMERA_PROMPT_INCLUSION } from '@/lib/constants/camera-prompt-inclusion';
import { warmthToKelvin } from '@/lib/constants/color-palette';
import { DEFAULT_BACKDROP_ID } from '@/lib/studio/resolved-shot';
import {
  defaultThemeTransformRefs,
  defaultThemeTransformStatus,
  emptyThemeTransformArray,
} from '@/lib/studio/theme-transform';
import type {
  CameraSettings,
  CoverageShot,
  FrameComposition,
  LightingSettings,
  MotionSettings,
  Setup,
  SetupBackdrop,
} from '@/lib/types/studio';

export interface SetupProjectDefaults {
  lighting: LightingSettings;
  sceneSetup: string;
}

const BLANK_CAMERA: CameraSettings = {
  fieldSize: 'ms',
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

const BLANK_MOTION: MotionSettings = {
  intensity: 'subtle',
  subjectAction: 'still',
  stabilization: 80,
  motionBlur: 'low',
};

const BLANK_LIGHTING: LightingSettings = {
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

export const DEFAULT_SETUP_DEFAULTS: SetupProjectDefaults = {
  lighting: BLANK_LIGHTING,
  sceneSetup: '',
};

type InheritedCoverageSettings = Omit<
  CoverageShot,
  'id' | 'name' | 'active' | 'thumbnail' | 'videoUrl' | 'generatedVideos' | 'activeVideoIndex' | 'backdropId'
>;

export function createDefaultBackdrop(url: string | null = null): SetupBackdrop {
  return {
    id: DEFAULT_BACKDROP_ID,
    label: 'Plate 1',
    url,
    backdropFramingByAspect: {},
    backdropCropsByAspect: {},
    backdropCropStatusByAspect: {},
  };
}

export function createBlankCoverageSettings(): InheritedCoverageSettings {
  return {
    duration: 5,
    camera: normalizeLensCamera({ ...BLANK_CAMERA }),
    motion: { ...BLANK_MOTION },
    shotActivity: '',
    frameComposition: { ...DEFAULT_FRAME_COMPOSITION },
    promptAdditions: '',
    lightingAtmospherePrompt: '',
    bakeStartFramePrompt: '',
  };
}

export function cloneInheritedCoverageSettings(source: CoverageShot): InheritedCoverageSettings {
  return {
    duration: source.duration,
    camera: normalizeLensCamera({ ...source.camera }),
    motion: { ...source.motion },
    shotActivity: source.shotActivity,
    frameComposition: { ...source.frameComposition },
    promptAdditions: source.promptAdditions,
    lightingAtmospherePrompt: source.lightingAtmospherePrompt,
    bakeStartFramePrompt: source.bakeStartFramePrompt,
  };
}

export function createBlankSetupSettings(): Omit<
  Setup,
  'id' | 'name' | 'sceneId' | 'active' | 'backdrops' | 'shots'
> {
  return {
    sceneSetup: '',
    lighting: {
      ...BLANK_LIGHTING,
      colorPalette: normalizeColorPalette(BLANK_LIGHTING.colorPalette),
      themeTransformLighting: normalizeThemeTransformLighting(BLANK_LIGHTING.themeTransformLighting),
      videoEnvironment: normalizeVideoEnvironment(BLANK_LIGHTING.videoEnvironment),
      videoLighting: normalizeVideoLighting(BLANK_LIGHTING.videoLighting),
    },
    references: [null, null],
    referenceRoles: ['Subject', 'Style'],
    referenceMode: DEFAULT_REFERENCE_MODE,
    transformedReferences: defaultThemeTransformRefs(),
    themeTransformFingerprint: emptyThemeTransformArray(null),
    themeTransformStatus: defaultThemeTransformStatus(),
    themeTransformError: emptyThemeTransformArray(null),
    themeTransformLinked: emptyThemeTransformArray(false),
    subjectSlotSourceModes: [],
  };
}

export function cloneInheritedSetupSettings(source: Setup): Omit<
  Setup,
  'id' | 'name' | 'sceneId' | 'active' | 'backdrops' | 'shots'
> {
  return {
    sceneSetup: source.sceneSetup,
    lighting: {
      ...source.lighting,
      colorPalette: normalizeColorPalette(source.lighting.colorPalette),
      themeTransformLighting: normalizeThemeTransformLighting(source.lighting.themeTransformLighting),
      videoEnvironment: normalizeVideoEnvironment(source.lighting.videoEnvironment),
      videoLighting: normalizeVideoLighting(source.lighting.videoLighting),
    },
    crowdTypePrompt: source.crowdTypePrompt,
    references: [...source.references],
    referenceRoles: [...source.referenceRoles],
    referenceMode: source.referenceMode,
    transformedReferences: [...(source.transformedReferences ?? defaultThemeTransformRefs())],
    themeTransformFingerprint: [...(source.themeTransformFingerprint ?? emptyThemeTransformArray(null))],
    themeTransformStatus: [...(source.themeTransformStatus ?? defaultThemeTransformStatus())],
    themeTransformError: [...(source.themeTransformError ?? emptyThemeTransformArray(null))],
    themeTransformLinked: [...(source.themeTransformLinked ?? emptyThemeTransformArray(false))],
    subjectSlotSourceModes: [...(source.subjectSlotSourceModes ?? [])],
  };
}

export function createCoverageShot(
  id: number,
  name: string,
  active: boolean,
  backdropId: string,
  options: Partial<Omit<CoverageShot, 'id' | 'name' | 'active' | 'backdropId'>> = {},
): CoverageShot {
  return {
    id,
    name,
    backdropId,
    active,
    thumbnail: null,
    videoUrl: null,
    generatedVideos: [],
    activeVideoIndex: 0,
    ...createBlankCoverageSettings(),
    ...options,
  };
}

export function createSetup(
  id: number,
  name: string,
  sceneId: number,
  active: boolean,
  coverage: CoverageShot,
  options: {
    backdropUrl?: string | null;
    setupSettings?: Partial<Omit<Setup, 'id' | 'name' | 'sceneId' | 'active' | 'backdrops' | 'shots'>>;
  } = {},
): Setup {
  const { backdropUrl = null, setupSettings = {} } = options;
  return {
    id,
    name,
    sceneId,
    active,
    ...createBlankSetupSettings(),
    ...setupSettings,
    backdrops: [createDefaultBackdrop(backdropUrl)],
    shots: [coverage],
  };
}

function isStockDemoReference(ref: string | null | undefined): boolean {
  return Boolean(ref && ref.includes('demo-surfer'));
}

function healStockDemoSubjectReference(setup: Setup): {
  references: (string | null)[];
  referenceRoles: Setup['referenceRoles'];
} {
  const references = [...(setup.references ?? [])];
  const referenceRoles = [...(setup.referenceRoles ?? [])];
  while (references.length < 2) references.push(null);
  while (referenceRoles.length < 2) referenceRoles.push(referenceRoles.length === 0 ? 'Subject' : 'Style');

  const hasStockContext =
    setup.backdrops?.some((b) => isStockDemoReference(b.url)) ||
    references.some((ref) => isStockDemoReference(ref));
  if (!hasStockContext) {
    return { references, referenceRoles };
  }

  const normalizedRoles = referenceRoles.map((role) => normalizeReferenceRole(role ?? 'None'));
  let subjectIdx = normalizedRoles.findIndex((role) => role === 'Subject');
  if (subjectIdx < 0) {
    subjectIdx = 0;
    referenceRoles[0] = 'Subject';
  }

  if (references[subjectIdx]) {
    return { references, referenceRoles };
  }

  const stockDonorIdx = references.findIndex(
    (ref, i) => isStockDemoReference(ref) && normalizeReferenceRole(referenceRoles[i] ?? 'None') !== 'Subject',
  );
  if (stockDonorIdx >= 0) {
    references[subjectIdx] = references[stockDonorIdx];
    references[stockDonorIdx] = null;
    return { references, referenceRoles };
  }

  references[subjectIdx] = STOCK_CHARACTER_REF;
  return { references, referenceRoles };
}

export function migrateSetup(setup: Setup, defaults: SetupProjectDefaults): Setup {
  const healed = healStockDemoSubjectReference(setup);
  return {
    ...setup,
    sceneSetup: setup.sceneSetup ?? defaults.sceneSetup,
    lighting: {
      ...defaults.lighting,
      ...setup.lighting,
      colorPalette: normalizeColorPalette(setup.lighting?.colorPalette ?? defaults.lighting.colorPalette),
    },
    references: healed.references,
    referenceRoles: healed.referenceRoles,
    backdrops: setup.backdrops?.length ? setup.backdrops : [createDefaultBackdrop()],
    shots: setup.shots?.length ? setup.shots : [],
  };
}

export function migrateAllSetups(setups: Setup[], defaults: SetupProjectDefaults): Setup[] {
  return setups.map((s) => migrateSetup(s, defaults));
}

export function nextSetupId(setups: Setup[]): number {
  if (!setups.length) return 1;
  return Math.max(...setups.map((s) => s.id)) + 1;
}

export function nextCoverageShotId(setups: Setup[]): number {
  let max = 0;
  for (const setup of setups) {
    for (const shot of setup.shots) {
      if (shot.id > max) max = shot.id;
    }
  }
  return max + 1;
}

export function nextBackdropId(setups: Setup[]): string {
  let max = 0;
  for (const setup of setups) {
    for (const backdrop of setup.backdrops) {
      const match = /^plate-(\d+)$/.exec(backdrop.id);
      if (match) max = Math.max(max, Number(match[1]));
    }
  }
  return `plate-${max + 1}`;
}

export function formatCoverageShotLabel(camera: CameraSettings): string {
  return `${camera.fieldSize.toUpperCase()} ${camera.coverage}`;
}
