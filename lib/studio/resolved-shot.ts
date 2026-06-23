import { normalizeReferenceRole } from '@/lib/constants/camera';
import { getBackdropSlotIndexFromRoles } from '@/lib/studio/backdrop-framing';
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
  return [backdropUrl, ...subjectRefs];
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
  if (backdrop?.url || roles.length > 0) {
    return ['Backdrop', ...roles];
  }
  return ['Backdrop', 'Subject', 'Style'];
}

function setupHasBackdropRole(setup: Setup): boolean {
  return (setup.referenceRoles ?? []).some(
    (r) => normalizeReferenceRole(r) === 'Backdrop' || normalizeReferenceRole(r) === 'Depth',
  );
}

function isBackdropReferenceRole(role: ReferenceRole | string | undefined): boolean {
  const normalized = normalizeReferenceRole(role ?? 'None');
  return normalized === 'Backdrop' || normalized === 'Depth';
}

/** Map resolved slot arrays back onto setup storage (backdrop may be prepended or in-place). */
export function resolvedSlotArrayToSetup<T>(
  setup: Setup,
  resolvedValues: T[],
  resolvedRoles: ReferenceRole[] | undefined,
  backdropFill: T,
): T[] {
  const roles = resolvedRoles ?? [];
  if (setupHasBackdropRole(setup)) {
    const setupRoles = setup.referenceRoles ?? [];
    return resolvedValues.map((value, i) =>
      isBackdropReferenceRole(roles[i] ?? setupRoles[i]) ? backdropFill : value,
    );
  }

  const withoutPrependedBackdrop = resolvedValues.slice(1);
  const setupLen = Math.max(setup.references?.length ?? 0, (setup.referenceRoles ?? []).length);
  const result = [...withoutPrependedBackdrop];
  while (result.length < setupLen) result.push(backdropFill);
  return result;
}

function resolvedReferenceRolesToSetup(
  setup: Setup,
  resolvedRoles: ReferenceRole[],
): ReferenceRole[] {
  if (setupHasBackdropRole(setup)) {
    return resolvedRoles.map((role) => normalizeReferenceRole(role));
  }
  return resolvedRoles.slice(1).map((role) => normalizeReferenceRole(role));
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
  resolved: ResolvedShot | undefined,
  setup: Setup,
): {
  setupPatch: SetupLevelPatch;
  coveragePatch: CoverageLevelPatch;
  backdropPatch: BackdropLevelPatch;
} {
  const setupPatch: SetupLevelPatch = {};
  const coveragePatch: CoverageLevelPatch = {};
  const backdropPatch: BackdropLevelPatch = {};
  const effectiveRoles = patch.referenceRoles ?? resolved?.referenceRoles;

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
  if (patch.references !== undefined) {
    setupPatch.references = resolvedSlotArrayToSetup(
      setup,
      patch.references,
      effectiveRoles,
      null,
    );
  }
  if (patch.referenceRoles !== undefined) {
    setupPatch.referenceRoles = resolvedReferenceRolesToSetup(setup, patch.referenceRoles);
  }
  if (patch.referenceMode !== undefined) setupPatch.referenceMode = patch.referenceMode;
  if (patch.transformedReferences !== undefined) {
    setupPatch.transformedReferences = resolvedSlotArrayToSetup(
      setup,
      patch.transformedReferences,
      effectiveRoles,
      null,
    );
  }
  if (patch.themeTransformFingerprint !== undefined) {
    setupPatch.themeTransformFingerprint = resolvedSlotArrayToSetup(
      setup,
      patch.themeTransformFingerprint,
      effectiveRoles,
      null,
    );
  }
  if (patch.themeTransformStatus !== undefined) {
    setupPatch.themeTransformStatus = resolvedSlotArrayToSetup(
      setup,
      patch.themeTransformStatus,
      effectiveRoles,
      'idle',
    );
  }
  if (patch.themeTransformError !== undefined) {
    setupPatch.themeTransformError = resolvedSlotArrayToSetup(
      setup,
      patch.themeTransformError,
      effectiveRoles,
      null,
    );
  }
  if (patch.themeTransformLinked !== undefined) {
    setupPatch.themeTransformLinked = resolvedSlotArrayToSetup(
      setup,
      patch.themeTransformLinked,
      effectiveRoles,
      false,
    );
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
    const backdropIdx = getBackdropSlotIndexFromRoles(effectiveRoles);
    if (backdropIdx >= 0 && patch.references[backdropIdx] !== undefined) {
      backdropPatch.url = patch.references[backdropIdx];
    }
  }

  void context;

  return { setupPatch, coveragePatch, backdropPatch };
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

  const backdrop = getSetupBackdrop(setup, coverage.backdropId);
  const resolved = resolveShot(setup, coverage, backdrop);
  const { setupPatch, coveragePatch, backdropPatch } = splitResolvedShotPatch(
    patch,
    context,
    resolved,
    setup,
  );

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
