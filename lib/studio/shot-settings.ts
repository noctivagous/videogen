import { normalizeArrangement as normalizeSubjectArrangement } from '@/lib/constants/arrangement-options';
import { normalizeCrowdDensity } from '@/lib/constants/crowd-density-options';
import {
  DEFAULT_FRAME_COMPOSITION,
  LEGACY_FIELD_SIZE_MIGRATION,
  normalizeCompositionGuide,
  normalizePlacement,
  normalizeReferenceRole,
} from '@/lib/constants/camera';
import { normalizeLensCamera } from '@/lib/constants/lens';
import { isUserSubjectReference, normalizeStockSubjectRef } from '@/lib/constants/stock-demo';
import { normalizeColorPalette } from '@/lib/constants/color-palette';
import { DEFAULT_REFERENCE_MODE, normalizeReferenceMode } from '@/lib/constants/reference-modes';
import { normalizeWorkflow } from '@/lib/constants/workflows';
import { migrateMannequins } from '@/lib/studio/migrate-mannequin';
import { ensureMannequinsOnShot } from '@/lib/studio/mannequin-sync';
import { finalizeMannequinsForShot } from '@/lib/studio/workflow';
import { migrateShotWorkflowStates } from '@/lib/studio/shot-workflow-state';
import {
  STOCK_BACKDROP_REF,
  STOCK_CAMERA,
  STOCK_CHARACTER_REF,
  STOCK_LIGHTING,
  STOCK_MOTION,
  STOCK_PROMPT,
  STOCK_REFERENCE_ROLES,
} from '@/lib/constants/stock-project';
import { stripLegacySceneBoilerplate } from '@/lib/studio/legacy-scene-boilerplate';
import { normalizeReferenceSlotArrays } from '@/lib/studio/reference-slots';
import { migrateShotGeneratedVideos } from '@/lib/studio/shot-videos';
import { normalizeCameraPromptInclusion } from '@/lib/constants/camera-prompt-inclusion';
import { normalizeThemeTransformLighting } from '@/lib/constants/theme-transform-lighting';
import { normalizeVideoEnvironment } from '@/lib/constants/video-environment';
import { normalizeVideoLighting } from '@/lib/constants/video-lighting';
import {
  defaultThemeTransformRefs,
  defaultThemeTransformStatus,
  emptyThemeTransformArray,
} from '@/lib/studio/theme-transform';
import type {
  CameraSettings,
  FrameComposition,
  LightingSettings,
  MotionSettings,
  Shot,
} from '@/lib/types/studio';

export interface ShotProjectDefaults {
  camera: CameraSettings;
  lighting: LightingSettings;
  motion: MotionSettings;
  sceneSetup: string;
  shotActivity: string;
}

export const DEFAULT_SHOT_DEFAULTS: ShotProjectDefaults = {
  camera: STOCK_CAMERA,
  lighting: STOCK_LIGHTING,
  motion: STOCK_MOTION,
  sceneSetup: STOCK_PROMPT,
  shotActivity: '',
};

export function migrateCamera(camera: CameraSettings): CameraSettings {
  const legacy = LEGACY_FIELD_SIZE_MIGRATION[camera.fieldSize];
  const migrated = legacy ? { ...camera, ...legacy } : { ...camera };
  if (!migrated.subjectCount) migrated.subjectCount = '1s';
  if (!migrated.coverage) migrated.coverage = 'clean';
  const subjectCount = migrated.subjectCount;
  return {
    ...migrated,
    arrangement: normalizeSubjectArrangement(subjectCount, migrated.arrangement),
    crowdDensity: normalizeCrowdDensity(migrated.crowdDensity),
    fillRestWithGenerics: migrated.fillRestWithGenerics ?? true,
    heroSubjectsEnabled: migrated.heroSubjectsEnabled ?? false,
    promptInclusion: normalizeCameraPromptInclusion(migrated.promptInclusion),
  };
}

export function shotActiveView(shot: Shot) {
  return {
    camera: { ...shot.camera },
    lighting: { ...shot.lighting },
    motion: { ...shot.motion },
    sceneSetup: shot.sceneSetup,
    shotActivity: shot.shotActivity,
  };
}

export function patchCurrentShot(
  shots: Shot[],
  shotId: number,
  patch: Partial<Shot>,
): Shot[] {
  if (!Object.keys(patch).length) return shots;
  return shots.map((sh) => (sh.id === shotId ? { ...sh, ...patch } : sh));
}

type InheritedShotSettings = Omit<
  Shot,
  'id' | 'name' | 'active' | 'thumbnail' | 'videoUrl' | 'generatedVideos' | 'activeVideoIndex'
>;

export function createBlankShotSettings(): InheritedShotSettings {
  return {
    duration: 5,
    camera: normalizeLensCamera(migrateCamera({ ...STOCK_CAMERA })),
    lighting: {
      ...STOCK_LIGHTING,
      colorPalette: normalizeColorPalette(STOCK_LIGHTING.colorPalette),
      themeTransformLighting: normalizeThemeTransformLighting(STOCK_LIGHTING.themeTransformLighting),
      videoEnvironment: normalizeVideoEnvironment(STOCK_LIGHTING.videoEnvironment),
      videoLighting: normalizeVideoLighting(STOCK_LIGHTING.videoLighting),
    },
    motion: { ...STOCK_MOTION },
    sceneSetup: '',
    shotActivity: '',
    frameComposition: { ...DEFAULT_FRAME_COMPOSITION },
    references: [null, null, null],
    referenceRoles: [...STOCK_REFERENCE_ROLES],
    referenceMode: DEFAULT_REFERENCE_MODE,
    transformedReferences: defaultThemeTransformRefs(),
    themeTransformFingerprint: emptyThemeTransformArray(null),
    themeTransformStatus: defaultThemeTransformStatus(),
    themeTransformError: emptyThemeTransformArray(null),
    themeTransformLinked: emptyThemeTransformArray(false),
    backdropFramingByAspect: {},
    backdropCropsByAspect: {},
    backdropCropStatusByAspect: {},
  };
}

export function cloneInheritedShotSettings(source: Shot): InheritedShotSettings {
  return {
    duration: source.duration,
    camera: normalizeLensCamera(migrateCamera({ ...source.camera })),
    lighting: {
      ...source.lighting,
      colorPalette: normalizeColorPalette(source.lighting.colorPalette),
      themeTransformLighting: normalizeThemeTransformLighting(source.lighting.themeTransformLighting),
      videoEnvironment: normalizeVideoEnvironment(source.lighting.videoEnvironment),
      videoLighting: normalizeVideoLighting(source.lighting.videoLighting),
    },
    motion: { ...source.motion },
    sceneSetup: source.sceneSetup,
    shotActivity: source.shotActivity,
    frameComposition: { ...source.frameComposition },
    references: [...source.references],
    referenceRoles: [...source.referenceRoles],
    referenceMode: normalizeReferenceMode(source),
    transformedReferences: [...(source.transformedReferences ?? defaultThemeTransformRefs())],
    themeTransformFingerprint: [...(source.themeTransformFingerprint ?? emptyThemeTransformArray(null))],
    themeTransformStatus: [...(source.themeTransformStatus ?? defaultThemeTransformStatus())],
    themeTransformError: [...(source.themeTransformError ?? emptyThemeTransformArray(null))],
    themeTransformLinked: [...(source.themeTransformLinked ?? emptyThemeTransformArray(false))],
    backdropFramingByAspect: { ...(source.backdropFramingByAspect ?? {}) },
    backdropCropsByAspect: { ...(source.backdropCropsByAspect ?? {}) },
    backdropCropStatusByAspect: { ...(source.backdropCropStatusByAspect ?? {}) },
  };
}

function isStockDemoSurferSubject(ref: string | null | undefined): boolean {
  if (!ref) return false;
  return ref === STOCK_CHARACTER_REF || ref.includes('demo-surfer');
}

/** Swap legacy slot 0=Subject / slot 1=Backdrop into Backdrop-first order. */
function migrateReferenceSlotOrder<T extends {
  referenceRoles: ReturnType<typeof normalizeReferenceRole>[];
  references: (string | null)[];
  transformedReferences?: (string | null)[];
  themeTransformLinked?: boolean[];
  themeTransformStatus?: import('@/lib/types/studio').ThemeTransformSlotStatus[];
  themeTransformError?: (string | null)[];
  themeTransformFingerprint?: (string | null)[];
}>(shot: T): T {
  const roles = shot.referenceRoles;
  if (roles[0] !== 'Subject' || roles[1] !== 'Backdrop') return shot;

  const swapTriplet = <V,>(arr: V[] | undefined, fill: V): [V, V, V] => {
    const list = [...(arr ?? [])];
    while (list.length < 3) list.push(fill);
    return [list[1], list[0], list[2]];
  };

  const [r0, r1, r2] = swapTriplet(shot.references, null);
  const [t0, t1, t2] = swapTriplet(shot.transformedReferences, null);
  const [l0, l1, l2] = swapTriplet(shot.themeTransformLinked, false);
  const [s0, s1, s2] = swapTriplet(shot.themeTransformStatus, 'idle');
  const [e0, e1, e2] = swapTriplet(shot.themeTransformError, null);
  const [f0, f1, f2] = swapTriplet(shot.themeTransformFingerprint, null);
  const refTail = (shot.references ?? []).slice(3);
  const transformedTail = (shot.transformedReferences ?? []).slice(3);
  const linkedTail = (shot.themeTransformLinked ?? []).slice(3);
  const statusTail = (shot.themeTransformStatus ?? []).slice(3);
  const errorTail = (shot.themeTransformError ?? []).slice(3);
  const fingerprintTail = (shot.themeTransformFingerprint ?? []).slice(3);
  const roleTail = shot.referenceRoles.slice(3);

  return {
    ...shot,
    referenceRoles: ['Backdrop', 'Subject', roles[2] ?? 'Style', ...roleTail],
    references: [r0, r1, r2, ...refTail],
    transformedReferences: [t0, t1, t2, ...transformedTail],
    themeTransformLinked: [l0, l1, l2, ...linkedTail],
    themeTransformStatus: [s0, s1, s2, ...statusTail],
    themeTransformError: [e0, e1, e2, ...errorTail],
    themeTransformFingerprint: [f0, f1, f2, ...fingerprintTail],
  };
}

/** Restore demo-surfer backdrop when a prior session stripped the Backdrop slot but kept the role. */
function healStockDemoReferences(
  references: (string | null)[],
  referenceRoles: ReturnType<typeof normalizeReferenceRole>[],
): (string | null)[] {
  const refs = [...references];
  while (refs.length < 3) refs.push(null);

  const backdropIdx = referenceRoles.findIndex((role) => role === 'Backdrop');
  if (backdropIdx < 0 || refs[backdropIdx]) return refs;

  const subjectRef = refs.find(
    (ref, i) => ref && referenceRoles[i] === 'Subject',
  );
  if (!isStockDemoSurferSubject(subjectRef)) return refs;

  refs[backdropIdx] = STOCK_BACKDROP_REF;
  return refs;
}

/** Migrate legacy shots (flat fieldSize / project-level prompt) into per-shot settings. */
export function migrateShot(
  shot: Shot & {
    fieldSize?: CameraSettings['fieldSize'];
    subjectCount?: CameraSettings['subjectCount'];
    coverage?: CameraSettings['coverage'];
  },
  defaults: ShotProjectDefaults,
): Shot {
  const legacyCamera: CameraSettings = {
    ...defaults.camera,
    ...(shot.camera ?? {}),
    fieldSize: shot.camera?.fieldSize ?? shot.fieldSize ?? defaults.camera.fieldSize,
    subjectCount: shot.camera?.subjectCount ?? shot.subjectCount ?? defaults.camera.subjectCount,
    coverage: shot.camera?.coverage ?? shot.coverage ?? defaults.camera.coverage,
  };

  const generated = migrateShotGeneratedVideos(shot);
  const referenceRoles = (shot.referenceRoles ?? [...STOCK_REFERENCE_ROLES]).map((role) =>
    normalizeReferenceRole(role as string),
  );

  const slotOrderMigrated = migrateReferenceSlotOrder({
    referenceRoles,
    references: shot.references ?? [null, null, null],
    transformedReferences: shot.transformedReferences,
    themeTransformLinked: shot.themeTransformLinked,
    themeTransformStatus: shot.themeTransformStatus,
    themeTransformError: shot.themeTransformError,
    themeTransformFingerprint: shot.themeTransformFingerprint,
  });

  const migratedShot: Shot = {
    id: shot.id,
    name: shot.name,
    duration: shot.duration ?? 5,
    thumbnail: shot.thumbnail ?? null,
    ...generated,
    active: shot.active ?? false,
    camera: normalizeLensCamera(migrateCamera(legacyCamera)),
    lighting: {
      ...defaults.lighting,
      ...shot.lighting,
      colorPalette: normalizeColorPalette(shot.lighting?.colorPalette ?? defaults.lighting.colorPalette),
      themeTransformLighting: normalizeThemeTransformLighting(
        shot.lighting?.themeTransformLighting ?? defaults.lighting.themeTransformLighting,
      ),
      videoEnvironment: normalizeVideoEnvironment(
        shot.lighting?.videoEnvironment ?? defaults.lighting.videoEnvironment,
      ),
      videoLighting: normalizeVideoLighting(
        shot.lighting?.videoLighting ?? defaults.lighting.videoLighting,
      ),
    },
    motion: { ...defaults.motion, ...shot.motion },
    sceneSetup: stripLegacySceneBoilerplate(shot.sceneSetup ?? shot.prompt ?? defaults.sceneSetup),
    shotActivity: shot.shotActivity ?? '',
    promptAdditions: shot.promptAdditions ?? '',
    lightingAtmospherePrompt: shot.lightingAtmospherePrompt ?? '',
    bakeStartFramePrompt: shot.bakeStartFramePrompt ?? '',
    referenceRoles: slotOrderMigrated.referenceRoles,
    references: healStockDemoReferences(
      slotOrderMigrated.references.map((ref, i) => {
        if (!ref) return ref;
        const role = slotOrderMigrated.referenceRoles[i] ?? 'None';
        if (role === 'Subject' && !isUserSubjectReference(ref)) {
          return normalizeStockSubjectRef(ref, legacyCamera);
        }
        return ref;
      }),
      slotOrderMigrated.referenceRoles,
    ),
    transformedReferences: slotOrderMigrated.transformedReferences ?? defaultThemeTransformRefs(),
    themeTransformLinked: slotOrderMigrated.themeTransformLinked ?? emptyThemeTransformArray(false),
    themeTransformStatus: slotOrderMigrated.themeTransformStatus ?? defaultThemeTransformStatus(),
    themeTransformError: slotOrderMigrated.themeTransformError ?? emptyThemeTransformArray(null),
    themeTransformFingerprint: slotOrderMigrated.themeTransformFingerprint ?? emptyThemeTransformArray(null),
    frameComposition: {
      ...DEFAULT_FRAME_COMPOSITION,
      ...shot.frameComposition,
      guide: normalizeCompositionGuide(shot.frameComposition?.guide),
      placement: normalizePlacement(shot.frameComposition?.placement),
    },
    previewFrameUrl: shot.previewFrameUrl ?? null,
    previewFrameFingerprint: shot.previewFrameFingerprint ?? null,
    referenceMode: normalizeReferenceMode(shot),
    backdropFramingByAspect: shot.backdropFramingByAspect ?? {},
    backdropCropsByAspect: shot.backdropCropsByAspect ?? {},
    backdropCropStatusByAspect: shot.backdropCropStatusByAspect ?? {},
    workflow: normalizeWorkflow(shot),
    mannequins: migrateMannequins(shot.mannequins),
    bakedStartFrame: shot.bakedStartFrame ?? null,
    bakedIntermediateFrame: shot.bakedIntermediateFrame ?? null,
    bakeStatus: shot.bakeStatus ?? 'idle',
  };

  const withAssignments: Shot = {
    ...migratedShot,
    mannequins: finalizeMannequinsForShot(migratedShot, migratedShot.mannequins ?? []),
  };
  const withMannequins: Shot = {
    ...withAssignments,
    mannequins: ensureMannequinsOnShot(withAssignments),
  };

  return migrateShotWorkflowStates({
    ...withMannequins,
    ...normalizeReferenceSlotArrays(withMannequins),
  });
}

export function migrateAllShots(
  shots: Shot[],
  defaults: ShotProjectDefaults,
): Shot[] {
  return shots.map((shot) => migrateShot(shot, defaults));
}