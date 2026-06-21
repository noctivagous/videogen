import { normalizeReferenceRole } from '@/lib/constants/camera';
import { getBackdropSlotIndex } from '@/lib/studio/backdrop-framing';
import type {
  AspectRatio,
  BackdropCropStatus,
  BackdropFraming,
  CameraSettings,
  CoverageShot,
  FrameComposition,
  LightingSettings,
  Mannequin,
  MotionSettings,
  ReferenceMode,
  ReferenceRole,
  Setup,
  SetupBackdrop,
  Shot,
  ThemeTransformSlotStatus,
  Workflow,
} from '@/lib/types/studio';
import type { ShotLinkedAssetKey } from '@/lib/types/media-library';

/** Runtime merge of setup + coverage + backdrop — same shape legacy components expect. */
export type ResolvedShot = Shot;

export const DEFAULT_BACKDROP_ID = 'plate-1';

export function getSetupBackdrop(
  setup: Setup | undefined,
  backdropId: string | undefined,
): SetupBackdrop | undefined {
  if (!setup?.backdrops?.length) return undefined;
  const id = backdropId ?? setup.shots[0]?.backdropId ?? DEFAULT_BACKDROP_ID;
  return setup.backdrops.find((b) => b.id === id) ?? setup.backdrops[0];
}

export function getCoverageShot(
  setup: Setup | undefined,
  coverageShotId: number | undefined,
): CoverageShot | undefined {
  if (!setup?.shots?.length) return undefined;
  if (coverageShotId != null) {
    return setup.shots.find((s) => s.id === coverageShotId) ?? setup.shots[0];
  }
  return setup.shots.find((s) => s.active) ?? setup.shots[0];
}

/** Build legacy-compatible Shot from hierarchy nodes. */
export function resolveShot(
  setup: Setup | undefined,
  coverage: CoverageShot | undefined,
  backdrop?: SetupBackdrop,
): ResolvedShot | undefined {
  if (!setup || !coverage) return undefined;

  const plate = backdrop ?? getSetupBackdrop(setup, coverage.backdropId);
  const references = buildResolvedReferences(setup, plate);
  const referenceRoles = buildResolvedReferenceRoles(setup, plate);

  return {
    id: coverage.id,
    name: coverage.name,
    duration: coverage.duration,
    thumbnail: coverage.thumbnail,
    videoUrl: coverage.videoUrl,
    generatedVideos: coverage.generatedVideos,
    activeVideoIndex: coverage.activeVideoIndex,
    active: coverage.active ?? false,
    camera: coverage.camera,
    lighting: setup.lighting,
    motion: coverage.motion,
    sceneSetup: setup.sceneSetup,
    shotActivity: coverage.shotActivity,
    promptAdditions: coverage.promptAdditions,
    lightingAtmospherePrompt: coverage.lightingAtmospherePrompt,
    bakeStartFramePrompt: coverage.bakeStartFramePrompt,
    crowdTypePrompt: setup.crowdTypePrompt,
    references,
    referenceRoles,
    referenceMode: setup.referenceMode,
    transformedReferences: setup.transformedReferences,
    themeTransformFingerprint: setup.themeTransformFingerprint,
    themeTransformStatus: setup.themeTransformStatus,
    themeTransformError: setup.themeTransformError,
    themeTransformLinked: setup.themeTransformLinked,
    frameComposition: coverage.frameComposition,
    previewFrameUrl: coverage.previewFrameUrl,
    previewFrameFingerprint: coverage.previewFrameFingerprint,
    backdropFramingByAspect: plate?.backdropFramingByAspect,
    backdropCropsByAspect: plate?.backdropCropsByAspect,
    backdropCropStatusByAspect: plate?.backdropCropStatusByAspect,
    workflow: coverage.workflow,
    workflowStates: coverage.workflowStates,
    mannequins: coverage.mannequins,
    bakedStartFrame: coverage.bakedStartFrame,
    bakedIntermediateFrame: coverage.bakedIntermediateFrame,
    bakeStatus: coverage.bakeStatus,
    savedBakedFrameAssetIds: coverage.savedBakedFrameAssetIds,
    linkedAssetIds: coverage.linkedAssetIds,
    workflowSnapshotId: coverage.workflowSnapshotId,
  };
}

function buildResolvedReferences(
  setup: Setup,
  backdrop: SetupBackdrop | undefined,
): (string | null)[] {
  const subjectRefs = setup.references ?? [];
  const backdropUrl = backdrop?.url ?? null;
  if (subjectRefs.length === 0) {
    return backdropUrl ? [backdropUrl, null, null] : [null, null, null];
  }
  const roles = setup.referenceRoles ?? [];
  const backdropIdx = roles.findIndex(
    (r) => normalizeReferenceRole(r) === 'Backdrop' || normalizeReferenceRole(r) === 'Depth',
  );
  if (backdropIdx >= 0) {
    const refs = [...subjectRefs];
    refs[backdropIdx] = backdropUrl ?? refs[backdropIdx];
    return refs;
  }
  return [backdropUrl, ...subjectRefs.slice(0, 2)];
}

function buildResolvedReferenceRoles(
  setup: Setup,
  backdrop: SetupBackdrop | undefined,
): ReferenceRole[] {
  const roles = [...(setup.referenceRoles ?? [])];
  const hasBackdropRole = roles.some(
    (r) => normalizeReferenceRole(r) === 'Backdrop' || normalizeReferenceRole(r) === 'Depth',
  );
  if (hasBackdropRole) return roles;
  if (backdrop?.url) {
    return ['Backdrop', ...roles.slice(0, 2)];
  }
  return roles.length ? roles : ['Backdrop', 'Subject', 'Style'];
}

export function resolveSetupActiveShot(setup: Setup): ResolvedShot | undefined {
  const coverage = getCoverageShot(setup, undefined);
  const resolved = resolveShot(setup, coverage);
  if (!resolved) return undefined;
  return { ...resolved, name: setup.name };
}

export function resolveAllSetupCards(setups: Setup[]): ResolvedShot[] {
  return setups
    .map((setup) => resolveSetupActiveShot(setup))
    .filter((s): s is ResolvedShot => s != null);
}

export interface ResolvedShotContext {
  setupId: number;
  coverageShotId: number;
  backdropId: string;
}

export function getResolvedShotContext(
  setup: Setup | undefined,
  coverage: CoverageShot | undefined,
): ResolvedShotContext | undefined {
  if (!setup || !coverage) return undefined;
  const backdrop = getSetupBackdrop(setup, coverage.backdropId);
  return {
    setupId: setup.id,
    coverageShotId: coverage.id,
    backdropId: backdrop?.id ?? coverage.backdropId ?? DEFAULT_BACKDROP_ID,
  };
}

export type SetupLevelPatch = Partial<
  Pick<
    Setup,
    | 'name'
    | 'sceneSetup'
    | 'lighting'
    | 'crowdTypePrompt'
    | 'references'
    | 'referenceRoles'
    | 'referenceMode'
    | 'transformedReferences'
    | 'themeTransformFingerprint'
    | 'themeTransformStatus'
    | 'themeTransformError'
    | 'themeTransformLinked'
    | 'backdrops'
    | 'active'
  >
>;

export type CoverageLevelPatch = Partial<
  Pick<
    CoverageShot,
    | 'name'
    | 'duration'
    | 'thumbnail'
    | 'videoUrl'
    | 'generatedVideos'
    | 'activeVideoIndex'
    | 'active'
    | 'camera'
    | 'motion'
    | 'shotActivity'
    | 'promptAdditions'
    | 'lightingAtmospherePrompt'
    | 'bakeStartFramePrompt'
    | 'frameComposition'
    | 'previewFrameUrl'
    | 'previewFrameFingerprint'
    | 'backdropId'
    | 'workflow'
    | 'workflowStates'
    | 'mannequins'
    | 'bakedStartFrame'
    | 'bakedIntermediateFrame'
    | 'bakeStatus'
    | 'savedBakedFrameAssetIds'
    | 'linkedAssetIds'
    | 'workflowSnapshotId'
  >
>;

export type BackdropLevelPatch = Partial<
  Pick<
    SetupBackdrop,
    | 'label'
    | 'url'
    | 'backdropFramingByAspect'
    | 'backdropCropsByAspect'
    | 'backdropCropStatusByAspect'
    | 'linkedAssetId'
  >
>;

/** Split a legacy Shot patch into setup, coverage, and optional backdrop patches. */
export function splitResolvedShotPatch(
  patch: Partial<Shot>,
  context: ResolvedShotContext,
): {
  setupPatch: SetupLevelPatch;
  coveragePatch: CoverageLevelPatch;
  backdropPatch: BackdropLevelPatch;
} {
  const setupPatch: SetupLevelPatch = {};
  const coveragePatch: CoverageLevelPatch = {};
  const backdropPatch: BackdropLevelPatch = {};

  if (patch.name !== undefined) coveragePatch.name = patch.name;
  if (patch.duration !== undefined) coveragePatch.duration = patch.duration;
  if (patch.thumbnail !== undefined) coveragePatch.thumbnail = patch.thumbnail;
  if (patch.videoUrl !== undefined) coveragePatch.videoUrl = patch.videoUrl;
  if (patch.generatedVideos !== undefined) coveragePatch.generatedVideos = patch.generatedVideos;
  if (patch.activeVideoIndex !== undefined) coveragePatch.activeVideoIndex = patch.activeVideoIndex;
  if (patch.active !== undefined) {
    coveragePatch.active = patch.active;
    setupPatch.active = patch.active;
  }

  if (patch.camera !== undefined) coveragePatch.camera = patch.camera;
  if (patch.motion !== undefined) coveragePatch.motion = patch.motion;
  if (patch.shotActivity !== undefined) coveragePatch.shotActivity = patch.shotActivity;
  if (patch.promptAdditions !== undefined) coveragePatch.promptAdditions = patch.promptAdditions;
  if (patch.lightingAtmospherePrompt !== undefined) {
    coveragePatch.lightingAtmospherePrompt = patch.lightingAtmospherePrompt;
  }
  if (patch.bakeStartFramePrompt !== undefined) {
    coveragePatch.bakeStartFramePrompt = patch.bakeStartFramePrompt;
  }
  if (patch.frameComposition !== undefined) coveragePatch.frameComposition = patch.frameComposition;
  if (patch.previewFrameUrl !== undefined) coveragePatch.previewFrameUrl = patch.previewFrameUrl;
  if (patch.previewFrameFingerprint !== undefined) {
    coveragePatch.previewFrameFingerprint = patch.previewFrameFingerprint;
  }
  if (patch.workflow !== undefined) coveragePatch.workflow = patch.workflow;
  if (patch.workflowStates !== undefined) coveragePatch.workflowStates = patch.workflowStates;
  if (patch.mannequins !== undefined) coveragePatch.mannequins = patch.mannequins;
  if (patch.bakedStartFrame !== undefined) coveragePatch.bakedStartFrame = patch.bakedStartFrame;
  if (patch.bakedIntermediateFrame !== undefined) {
    coveragePatch.bakedIntermediateFrame = patch.bakedIntermediateFrame;
  }
  if (patch.bakeStatus !== undefined) coveragePatch.bakeStatus = patch.bakeStatus;
  if (patch.savedBakedFrameAssetIds !== undefined) {
    coveragePatch.savedBakedFrameAssetIds = patch.savedBakedFrameAssetIds;
  }
  if (patch.linkedAssetIds !== undefined) coveragePatch.linkedAssetIds = patch.linkedAssetIds;
  if (patch.workflowSnapshotId !== undefined) {
    coveragePatch.workflowSnapshotId = patch.workflowSnapshotId;
  }

  if (patch.sceneSetup !== undefined) setupPatch.sceneSetup = patch.sceneSetup;
  if (patch.lighting !== undefined) setupPatch.lighting = patch.lighting;
  if (patch.crowdTypePrompt !== undefined) setupPatch.crowdTypePrompt = patch.crowdTypePrompt;
  if (patch.references !== undefined) setupPatch.references = stripBackdropFromReferences(patch);
  if (patch.referenceRoles !== undefined) {
    setupPatch.referenceRoles = stripBackdropFromRoles(patch.referenceRoles);
  }
  if (patch.referenceMode !== undefined) setupPatch.referenceMode = patch.referenceMode;
  if (patch.transformedReferences !== undefined) {
    setupPatch.transformedReferences = patch.transformedReferences;
  }
  if (patch.themeTransformFingerprint !== undefined) {
    setupPatch.themeTransformFingerprint = patch.themeTransformFingerprint;
  }
  if (patch.themeTransformStatus !== undefined) {
    setupPatch.themeTransformStatus = patch.themeTransformStatus;
  }
  if (patch.themeTransformError !== undefined) {
    setupPatch.themeTransformError = patch.themeTransformError;
  }
  if (patch.themeTransformLinked !== undefined) {
    setupPatch.themeTransformLinked = patch.themeTransformLinked;
  }

  if (patch.backdropFramingByAspect !== undefined) {
    backdropPatch.backdropFramingByAspect = patch.backdropFramingByAspect;
  }
  if (patch.backdropCropsByAspect !== undefined) {
    backdropPatch.backdropCropsByAspect = patch.backdropCropsByAspect;
  }
  if (patch.backdropCropStatusByAspect !== undefined) {
    backdropPatch.backdropCropStatusByAspect = patch.backdropCropStatusByAspect;
  }

  if (patch.references !== undefined) {
    const backdropIdx = getBackdropSlotIndex(patch as Shot);
    if (backdropIdx >= 0 && patch.references[backdropIdx] !== undefined) {
      backdropPatch.url = patch.references[backdropIdx];
    }
  }

  void context;

  return { setupPatch, coveragePatch, backdropPatch };
}

function stripBackdropFromReferences(patch: Partial<Shot>): (string | null)[] {
  const refs = patch.references ?? [];
  const roles = patch.referenceRoles ?? [];
  return refs.map((ref, i) => {
    const role = normalizeReferenceRole(roles[i] ?? 'None');
    if (role === 'Backdrop' || role === 'Depth') return null;
    return ref;
  });
}

function stripBackdropFromRoles(roles: ReferenceRole[]): ReferenceRole[] {
  return roles.map((r) => {
    const role = normalizeReferenceRole(r);
    if (role === 'Backdrop' || role === 'Depth') return 'None';
    return role;
  });
}

export function patchSetup(
  setups: Setup[],
  setupId: number,
  patch: SetupLevelPatch,
): Setup[] {
  if (!Object.keys(patch).length) return setups;
  return setups.map((s) => (s.id === setupId ? { ...s, ...patch } : s));
}

export function patchCoverageShot(
  setups: Setup[],
  setupId: number,
  coverageShotId: number,
  patch: CoverageLevelPatch,
): Setup[] {
  if (!Object.keys(patch).length) return setups;
  return setups.map((setup) => {
    if (setup.id !== setupId) return setup;
    return {
      ...setup,
      shots: setup.shots.map((shot) =>
        shot.id === coverageShotId ? { ...shot, ...patch } : shot,
      ),
    };
  });
}

export function patchSetupBackdrop(
  setups: Setup[],
  setupId: number,
  backdropId: string,
  patch: BackdropLevelPatch,
): Setup[] {
  if (!Object.keys(patch).length) return setups;
  return setups.map((setup) => {
    if (setup.id !== setupId) return setup;
    return {
      ...setup,
      backdrops: setup.backdrops.map((b) =>
        b.id === backdropId ? { ...b, ...patch } : b,
      ),
    };
  });
}

export function patchCurrentResolvedShot(
  setups: Setup[],
  setupId: number,
  coverageShotId: number,
  patch: Partial<Shot>,
): Setup[] {
  const setup = setups.find((s) => s.id === setupId);
  const coverage = setup?.shots.find((s) => s.id === coverageShotId);
  if (!setup || !coverage) return setups;

  const context = getResolvedShotContext(setup, coverage);
  if (!context) return setups;

  const { setupPatch, coveragePatch, backdropPatch } = splitResolvedShotPatch(patch, context);

  let next = patchSetup(setups, setupId, setupPatch);
  next = patchCoverageShot(next, setupId, coverageShotId, coveragePatch);
  if (Object.keys(backdropPatch).length) {
    next = patchSetupBackdrop(next, setupId, context.backdropId, backdropPatch);
  }
  return next;
}

export function setupActiveView(setup: Setup, coverage: CoverageShot) {
  return {
    camera: { ...coverage.camera },
    lighting: { ...setup.lighting },
    motion: { ...coverage.motion },
    sceneSetup: setup.sceneSetup,
    shotActivity: coverage.shotActivity,
  };
}
