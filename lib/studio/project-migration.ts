import { normalizeReferenceRole } from '@/lib/constants/camera';
import { DEFAULT_BACKDROP_ID } from '@/lib/studio/resolved-shot';
import { migrateAllShots, type ShotProjectDefaults } from '@/lib/studio/shot-settings';
import type {
  CoverageShot,
  Scene,
  Setup,
  SetupBackdrop,
  Shot,
  StudioProject,
} from '@/lib/types/studio';

export const LEGACY_SCHEMA_VERSION = 17;

export function isLegacyProject(data: StudioProject): boolean {
  if ((data.schemaVersion ?? 0) < 18) return true;
  if (data.setups?.length) return false;
  return Boolean(data.shots?.length);
}

function extractBackdropFromShot(shot: Shot): {
  backdrop: SetupBackdrop;
  subjectReferences: (string | null)[];
  subjectRoles: ReturnType<typeof normalizeReferenceRole>[];
  subjectTransformed: (string | null)[];
  subjectLinked: boolean[];
  subjectStatus: import('@/lib/types/studio').ThemeTransformSlotStatus[];
  subjectError: (string | null)[];
  subjectFingerprint: (string | null)[];
} {
  const roles = shot.referenceRoles ?? [];
  const refs = shot.references ?? [];
  const backdropIdx = roles.findIndex((r) => {
    const role = normalizeReferenceRole(r);
    return role === 'Backdrop' || role === 'Depth';
  });

  const backdropUrl = backdropIdx >= 0 ? refs[backdropIdx] ?? null : null;

  const subjectReferences: (string | null)[] = [];
  const subjectRoles: ReturnType<typeof normalizeReferenceRole>[] = [];
  const subjectTransformed: (string | null)[] = [];
  const subjectLinked: boolean[] = [];
  const subjectStatus: import('@/lib/types/studio').ThemeTransformSlotStatus[] = [];
  const subjectError: (string | null)[] = [];
  const subjectFingerprint: (string | null)[] = [];

  for (let i = 0; i < refs.length; i++) {
    if (i === backdropIdx) continue;
    subjectReferences.push(refs[i] ?? null);
    subjectRoles.push(normalizeReferenceRole(roles[i] ?? 'None'));
    subjectTransformed.push(shot.transformedReferences?.[i] ?? null);
    subjectLinked.push(shot.themeTransformLinked?.[i] ?? false);
    subjectStatus.push(shot.themeTransformStatus?.[i] ?? 'idle');
    subjectError.push(shot.themeTransformError?.[i] ?? null);
    subjectFingerprint.push(shot.themeTransformFingerprint?.[i] ?? null);
  }

  while (subjectReferences.length < 2) {
    subjectReferences.push(null);
    subjectRoles.push('None');
    subjectTransformed.push(null);
    subjectLinked.push(false);
    subjectStatus.push('idle');
    subjectError.push(null);
    subjectFingerprint.push(null);
  }

  return {
    backdrop: {
      id: DEFAULT_BACKDROP_ID,
      label: 'Plate 1',
      url: backdropUrl,
      backdropFramingByAspect: shot.backdropFramingByAspect,
      backdropCropsByAspect: shot.backdropCropsByAspect,
      backdropCropStatusByAspect: shot.backdropCropStatusByAspect,
      linkedAssetId: shot.linkedAssetIds?.backdrop,
    },
    subjectReferences,
    subjectRoles: subjectRoles as import('@/lib/types/studio').ReferenceRole[],
    subjectTransformed,
    subjectLinked,
    subjectStatus,
    subjectError,
    subjectFingerprint,
  };
}

function legacyShotToCoverage(shot: Shot): CoverageShot {
  return {
    id: shot.id,
    name: shot.name,
    backdropId: DEFAULT_BACKDROP_ID,
    duration: shot.duration,
    thumbnail: shot.thumbnail,
    videoUrl: shot.videoUrl,
    generatedVideos: shot.generatedVideos,
    activeVideoIndex: shot.activeVideoIndex,
    active: shot.active,
    camera: shot.camera,
    motion: shot.motion,
    shotActivity: shot.shotActivity,
    promptAdditions: shot.promptAdditions,
    lightingAtmospherePrompt: shot.lightingAtmospherePrompt,
    bakeStartFramePrompt: shot.bakeStartFramePrompt,
    frameComposition: shot.frameComposition,
    previewFrameUrl: shot.previewFrameUrl,
    previewFrameFingerprint: shot.previewFrameFingerprint,
    workflow: shot.workflow,
    workflowStates: shot.workflowStates,
    mannequins: shot.mannequins,
    bakedStartFrame: shot.bakedStartFrame,
    bakedIntermediateFrame: shot.bakedIntermediateFrame,
    bakeStatus: shot.bakeStatus,
    savedBakedFrameAssetIds: shot.savedBakedFrameAssetIds,
    linkedAssetIds: shot.linkedAssetIds
      ? {
          characterSheet: shot.linkedAssetIds.characterSheet,
          bakedFrame: shot.linkedAssetIds.bakedFrame,
          intermediate: shot.linkedAssetIds.intermediate,
        }
      : undefined,
    workflowSnapshotId: shot.workflowSnapshotId,
  };
}

function legacyShotToSetup(shot: Shot, sceneId: number): Setup {
  const extracted = extractBackdropFromShot(shot);
  const setupName = shot.name.replace(/^Shot\s+/i, 'Setup ');

  return {
    id: shot.id,
    sceneId,
    name: setupName,
    active: shot.active,
    sceneSetup: shot.sceneSetup,
    lighting: shot.lighting,
    crowdTypePrompt: shot.crowdTypePrompt,
    references: extracted.subjectReferences,
    referenceRoles: extracted.subjectRoles,
    referenceMode: shot.referenceMode,
    transformedReferences: extracted.subjectTransformed,
    themeTransformFingerprint: extracted.subjectFingerprint,
    themeTransformStatus: extracted.subjectStatus,
    themeTransformError: extracted.subjectError,
    themeTransformLinked: extracted.subjectLinked,
    backdrops: [extracted.backdrop],
    shots: [legacyShotToCoverage(shot)],
  };
}

export function migrateV17ToV18(
  data: StudioProject,
  defaults: ShotProjectDefaults,
): StudioProject {
  if (!isLegacyProject(data)) {
    return {
      ...data,
      schemaVersion: 18,
      scenes: data.scenes?.length ? data.scenes : [{ id: 1, name: 'Scene 1' }],
      currentSceneId: data.currentSceneId ?? 1,
      setups: data.setups ?? [],
      currentSetupId: data.currentSetupId ?? data.setups?.[0]?.id ?? 1,
      currentCoverageShotId:
        data.currentCoverageShotId ?? data.setups?.[0]?.shots[0]?.id ?? 1,
    };
  }

  const legacyShots = migrateAllShots(data.shots ?? [], defaults);
  const scene: Scene = { id: 1, name: 'Scene 1' };
  const setups = legacyShots.map((shot) => legacyShotToSetup(shot, scene.id));

  const legacyCurrent = data.currentShot ?? legacyShots.find((s) => s.active)?.id ?? legacyShots[0]?.id ?? 1;

  return {
    schemaVersion: 18,
    project: data.project,
    scenes: [scene],
    currentSceneId: 1,
    setups,
    currentSetupId: legacyCurrent,
    currentCoverageShotId: legacyCurrent,
    mediaLibrary: data.mediaLibrary,
    shotWorkflowSnapshots: data.shotWorkflowSnapshots,
  };
}

export function migrateStudioProject(
  data: StudioProject,
  defaults: ShotProjectDefaults,
): StudioProject {
  return migrateV17ToV18(data, defaults);
}

export function ensureDefaultScene(project: StudioProject): Scene[] {
  if (project.scenes?.length) return project.scenes;
  return [{ id: 1, name: 'Scene 1' }];
}
