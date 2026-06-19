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
import { migrateShotGeneratedVideos } from '@/lib/studio/shot-videos';
import { normalizeThemeTransformLighting } from '@/lib/constants/theme-transform-lighting';
import { normalizeVideoEnvironment } from '@/lib/constants/video-environment';
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
  return migrated;
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

export function cloneInheritedShotSettings(
  source: Shot,
): Omit<Shot, 'id' | 'name' | 'active' | 'thumbnail' | 'videoUrl' | 'generatedVideos' | 'activeVideoIndex'> {
  return {
    duration: source.duration,
    camera: normalizeLensCamera(migrateCamera({ ...source.camera })),
    lighting: {
      ...source.lighting,
      colorPalette: normalizeColorPalette(source.lighting.colorPalette),
      themeTransformLighting: normalizeThemeTransformLighting(source.lighting.themeTransformLighting),
      videoEnvironment: normalizeVideoEnvironment(source.lighting.videoEnvironment),
    },
    motion: { ...source.motion },
    sceneSetup: source.sceneSetup,
    shotActivity: source.shotActivity,
    frameComposition: { ...source.frameComposition },
    references: [...source.references],
    referenceRoles: [...source.referenceRoles],
    cinematographyRefs: source.cinematographyRefs,
    transformedReferences: [...(source.transformedReferences ?? defaultThemeTransformRefs())],
    themeTransformFingerprint: [...(source.themeTransformFingerprint ?? emptyThemeTransformArray(null))],
    themeTransformStatus: [...(source.themeTransformStatus ?? defaultThemeTransformStatus())],
    themeTransformError: [...(source.themeTransformError ?? emptyThemeTransformArray(null))],
    themeTransformLinked: [...(source.themeTransformLinked ?? emptyThemeTransformArray(false))],
  };
}

function isStockDemoSurferSubject(ref: string | null | undefined): boolean {
  if (!ref) return false;
  return ref === STOCK_CHARACTER_REF || ref.includes('demo-surfer');
}

/** Restore demo-surfer backdrop when a prior session stripped slot 1 but kept the Backdrop role. */
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

  return {
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
    },
    motion: { ...defaults.motion, ...shot.motion },
    sceneSetup: stripLegacySceneBoilerplate(shot.sceneSetup ?? shot.prompt ?? defaults.sceneSetup),
    shotActivity: shot.shotActivity ?? '',
    referenceRoles,
    references: healStockDemoReferences(
      (shot.references ?? [null, null, null]).map((ref, i) => {
        if (!ref) return ref;
        const role = referenceRoles[i] ?? 'None';
        if (role === 'Subject' && !isUserSubjectReference(ref)) {
          return normalizeStockSubjectRef(ref, legacyCamera);
        }
        return ref;
      }),
      referenceRoles,
    ),
    frameComposition: {
      ...DEFAULT_FRAME_COMPOSITION,
      ...shot.frameComposition,
      guide: normalizeCompositionGuide(shot.frameComposition?.guide),
      placement: normalizePlacement(shot.frameComposition?.placement),
    },
    previewFrameUrl: shot.previewFrameUrl ?? null,
    previewFrameFingerprint: shot.previewFrameFingerprint ?? null,
    cinematographyRefs: shot.cinematographyRefs,
    transformedReferences: shot.transformedReferences ?? defaultThemeTransformRefs(),
    themeTransformFingerprint: shot.themeTransformFingerprint ?? emptyThemeTransformArray(null),
    themeTransformStatus: shot.themeTransformStatus ?? defaultThemeTransformStatus(),
    themeTransformError: shot.themeTransformError ?? emptyThemeTransformArray(null),
    themeTransformLinked: shot.themeTransformLinked ?? emptyThemeTransformArray(false),
  };
}

export function migrateAllShots(
  shots: Shot[],
  defaults: ShotProjectDefaults,
): Shot[] {
  return shots.map((shot) => migrateShot(shot, defaults));
}