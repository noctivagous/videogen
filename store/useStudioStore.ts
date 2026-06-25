'use client';

import { create } from 'zustand';
import {
  defaultArrangementForSubjectCount,
  normalizeArrangement,
} from '@/lib/constants/arrangement-options';
import {
  DEFAULT_FRAME_COMPOSITION,
  normalizeReferenceRole,
  SINGLE_ONLY_COVERAGE,
} from '@/lib/constants/camera';
import { getDefaultEnabledProviderId, isBuiltInProviderEnabled } from '@/lib/constants/providers';
import { apertureForDof, dofFromAperture, snapToApertureStop } from '@/lib/constants/aperture';
import { kelvinToWarmth, warmthToKelvin } from '@/lib/constants/color-palette';
import { applyLookRecipeToLighting, getLookRecipe } from '@/lib/constants/look-recipes';
import { resolveCameraPromptInclusion } from '@/lib/constants/camera-prompt-inclusion';
import { applyLensCameraPatch } from '@/lib/constants/lens';
import { getDefaultResolution, RESOLUTION_PRESETS } from '@/lib/constants/resolutions';
import {
  EMPTY_PROJECT,
  EMPTY_SETUPS,
  STOCK_BACKDROP_REF,
  STOCK_CAMERA,
  STOCK_CHARACTER_BUD_ID,
  STOCK_CHARACTER_BUD_SHEET_ID,
  STOCK_CHARACTER_REF,
  STOCK_LOCATION_CHK_OFFICE_ID,
  STOCK_LOCATION_CHK_PLATE_ID,
  STOCK_LIGHTING,
  STOCK_MOTION,
  STOCK_PROJECT,
  STOCK_PROMPT,
  STOCK_REFERENCE_ROLES,
  STOCK_SETUPS,
  STOCK_CHARACTERS,
  STOCK_LOCATIONS,
} from '@/lib/constants/stock-project';
import { isPreviewFrameSupported } from '@/lib/studio/generation/preview-frame-supported';
import { isGenerationSupported } from '@/lib/studio/generation/supported';
import { buildPreviewFramePayload } from '@/lib/studio/preview-frame-prompt';
import { previewFramingFingerprint } from '@/lib/constants/subject-cutouts';
import {
  getBuiltInProvider,
  getEffectiveModelId,
  getEffectivePreviewModelId,
  hasVerifiedImageModels,
  hasVerifiedVideoModels,
  resolveImageModelSelectionForProvider,
  resolveModelSelectionForProvider,
} from '@/lib/studio/provider-modalities';
import { buildModelPayloadStack, buildShotPrompt } from '@/lib/studio/model-payload';
import { normalizeThemeTransformLighting } from '@/lib/constants/theme-transform-lighting';
import { normalizeVideoEnvironment } from '@/lib/constants/video-environment';
import { normalizeVideoLighting } from '@/lib/constants/video-lighting';
import {
  buildThemeTransformFingerprint,
  defaultThemeTransformRefs,
  defaultThemeTransformStatus,
  emptyThemeTransformArray,
  hasStaleLinkedTransforms,
  needsThemeTransformer,
  patchThemeTransformInvalidation,
  THEME_TRANSFORM_SLOT_COUNT,
} from '@/lib/studio/theme-transform';
import { DEFAULT_REFERENCE_MODE, normalizeReferenceMode } from '@/lib/constants/reference-modes';
import type { Workflow } from '@/lib/types/studio';
import type { Mannequin } from '@/lib/types/studio';
import { migrateMannequin, migrateMannequins } from '@/lib/studio/migrate-mannequin';
import { DEFAULT_XAI_BAKE_IMAGE_MODEL, getWorkflowLabel, normalizeWorkflow } from '@/lib/constants/workflows';
import { isWorkflowImplemented } from '@/lib/constants/video-generation-workflows';
import {
  bakeBlobsToDataUrls,
  appendBakePromptAdditions,
  resolveBakeStartFramePass1Prompt,
  persistBakedImageUrl,
  renderBakeFrames,
} from '@/lib/studio/bake-start-frame';
import { buildIdentityPassPlan } from '@/lib/studio/bake-identity-pass';
import type { BakeStartFrameRequest } from '@/lib/studio/generation/inpaint-types';
import { fetchWithGenerationProgress } from '@/lib/studio/generation/progress-stream.client';
import {
  applyMannequinSubjectSlot,
  clearMannequinAssignmentsForSlot,
  isValidSubjectSlotAssignment,
  reindexMannequinAssignmentsAfterSlotRemoval,
  tryAutoAssignSingleSubject,
} from '@/lib/studio/mannequin-character-assignment';
import {
  clampMannequinAnchor,
  clampMannequinScale,
  maxFeetAnchorY,
} from '@/lib/studio/mannequin-layout';
import {
  ensureMannequinsOnShot,
  syncMannequinsFromShot,
  type MannequinSyncReason,
} from '@/lib/studio/mannequin-sync';
import {
  applySubjectCountToShot,
  subjectCountFromMannequins,
} from '@/lib/studio/subject-count-from-mannequins';
import {
  ensureSubjectChecklistSlots,
  getRemovedSubjectChecklistSlots,
} from '@/lib/studio/subject-sheet-slots';
import {
  resolveReferenceSlotInvalidation,
  resolveWorkflowInvalidation,
  splitInvalidationPatch,
} from '@/lib/studio/workflow-invalidation';
import {
  archiveGeneratedVideoToLibrary,
  createMediaAssetFromUrl,
  createWorkflowSnapshot,
  getMediaAsset,
  ingestBakedFramesForShot,
  linkAssetToShot,
} from '@/lib/media/media-library';
import { updateMediaAssetInLibrary } from '@/lib/media/media-library-query';
import { indexClipEmbeddingsInLibrary } from '@/lib/media/clip-search';
import {
  applyAssetIdRemapToSetups,
  applyAssetIdRemapToShots,
  applyAssetIdRemapToSnapshots,
  cleanSetupsAfterAssetDelete,
  cleanShotsAfterAssetDelete,
  cleanSnapshotsAfterAssetDelete,
  importMediaFilesToLibrary,
  moveAssetsToScope,
  removeAssetsFromLibrary,
  reorderAssetsInType,
  replaceMediaAssetContent,
  replaceMediaAssetUrl,
  type MediaLibraryCollection,
} from '@/lib/media/media-library-mutations';
import type { MediaAsset, MediaAssetType, ShotWorkflowSnapshot } from '@/lib/types/media-library';
import { switchShotWorkflow } from '@/lib/studio/shot-workflow-state';
import {
  canAddMannequin,
  createDefaultMannequin,
  finalizeMannequinsForShot,
  getWorkflowReferenceSteps,
  isBakeChecklistReferenceSlot,
  isBakeStartFrame,
  shouldUseBakedStartFrameForVideo,
} from '@/lib/studio/workflow';
import {
  clearBackdropCrops,
  clearBackdropCropStatus,
  DEFAULT_BACKDROP_FRAMING,
  getBackdropFraming,
  getBackdropSlotIndex,
  getEffectiveBackdropSourceUrl,
  isBackdropTransformPatch,
  renderBackdropCropDataUrl,
} from '@/lib/studio/backdrop-framing';
import { parseResolution } from '@/lib/studio/generation/adapters/shared';
import {
  appendReferenceSlotPatch,
  isCinematographyRefs,
  removeReferenceSlotPatch,
} from '@/lib/studio/reference-slots';
import { restrictsReferenceSlotsToFirst } from '@/lib/studio/xai-video-models';
import { applyFrameCompositionSmartDefaults } from '@/lib/studio/composition';
import {
  cloneInheritedCoverageSettings,
  cloneInheritedSetupSettings,
  createBlankCoverageSettings,
  createBlankSetupSettings,
  createCoverageShot,
  createDefaultBackdrop,
  createSetup,
  nextCoverageShotId,
  nextSetupId,
} from '@/lib/studio/coverage-shot-settings';
import {
  applyProjectHierarchy,
  buildHierarchyPersistence,
  getCurrentCoverageFromSetup,
  getCurrentSetupFromList,
  getResolvedCurrentShot,
  getTimelineShots,
  patchResolvedShotInSetups,
  projectDefaultsFromStudioData,
} from '@/lib/studio/store-hierarchy';
import { invalidateSetupCoverageBakes } from '@/lib/studio/setup-invalidation';
import {
  DEFAULT_SHOT_DEFAULTS,
  migrateCamera,
} from '@/lib/studio/shot-settings';
import { DEFAULT_BACKDROP_ID, getSetupBackdrop, resolveShot, setupActiveView } from '@/lib/studio/resolved-shot';
import {
  appendGeneratedVideo,
  deleteGeneratedVideoById,
  linkGeneratedVideoMediaAsset,
  selectGeneratedVideoIndex,
} from '@/lib/studio/shot-videos';
import {
  applyProviderTestResultToState,
  bootstrapAIState,
  createCustomProvider,
  DEFAULT_AI_STATE,
  getImageProviderName,
  getProviderApiKey,
  getVideoProviderName,
  isCustomProvider,
  isProviderConnected,
  saveAIState,
} from '@/lib/storage/ai-settings';
import {
  clearProjectLocationSession,
  getProjectLocationKind,
  getProjectLocationLabel,
  getProjectSaveState,
  hasOpenProjectLocation,
  isDirectoryAccessSupported,
  isFileSystemAccessSupported,
  isNativeFilePickerSupported,
  openProjectFile as openProjectFileFromDisk,
  openProjectFolder as openProjectFolderFromDisk,
  restoreProjectSession,
  saveProjectFileAs as saveProjectFileToDisk,
  saveProjectFolderAs as saveProjectFolderToDisk,
  saveProjectNow,
  scheduleProjectAutosave,
  type ProjectLocationKind,
  type ProjectSaveState,
} from '@/lib/storage/file-project';
import { downloadProject, pickAndLoadProject } from '@/lib/storage/project-io';
import { resolveRefsForApi } from '@/lib/storage/reference-url';
import {
  clearServerProjectStorage,
  isServerProjectStorageDevMode,
  isServerProjectStorageEnabled,
  loadProjectFromServer,
} from '@/lib/storage/server-project-storage';
import {
  buildStudioProject,
  clearStudioDraft,
  loadStudioDraft,
} from '@/lib/storage/studio-state';
import type {
  AIState,
  AspectRatio,
  BackdropFraming,
  CameraSettings,
  Character,
  CharacterSheet,
  FrameComposition,
  ColorPaletteSettings,
  LightingSettings,
  Location,
  LocationBackdropPlate,
  MotionSettings,
  ProjectSettings,
  ReferenceMode,
  Scene,
  Setup,
  Shot,
  StudioProject,
  PreviewMode,
  PreviewSubMode,
  ToastType,
} from '@/lib/types/studio';
import type { FrameView } from '@/components/studio/FrameViewSegment';
import type { StudioPanelId } from '@/lib/studio/studio-routes';

export type { StudioPanelId, WorkspaceView } from '@/lib/studio/studio-routes';

const PREVIEW_MODE_KEY = 'videogen_preview_mode';

function projectFileUiState() {
  return {
    projectLocationLabel: getProjectLocationLabel(),
    projectLocationKind: getProjectLocationKind(),
    projectSaveState: getProjectSaveState(),
  };
}

function getStockDefaults() {
  const hierarchy = applyProjectHierarchy(
    {
      schemaVersion: 18,
      project: STOCK_PROJECT,
      scenes: [{ id: 1, name: 'Scene 1' }],
      currentSceneId: 1,
      setups: STOCK_SETUPS,
      currentSetupId: 1,
      currentCoverageShotId: 1,
    },
    { lighting: STOCK_LIGHTING, sceneSetup: STOCK_PROMPT },
  );
  return {
    project: { ...STOCK_PROJECT },
    scenes: hierarchy.scenes,
    currentSceneId: hierarchy.currentSceneId,
    setups: hierarchy.setups,
    currentSetupId: hierarchy.currentSetupId,
    currentCoverageShotId: hierarchy.currentCoverageShotId,
    shots: getTimelineShots(hierarchy.setups),
    currentShot: hierarchy.currentSetupId,
    characters: STOCK_CHARACTERS,
    locations: STOCK_LOCATIONS,
    mediaLibrary: [],
    globalMediaLibrary: [] as MediaAsset[],
    shotWorkflowSnapshots: [],
    camera: hierarchy.camera,
    lighting: hierarchy.lighting,
    motion: hierarchy.motion,
    sceneSetup: hierarchy.sceneSetup,
    shotActivity: hierarchy.shotActivity,
  };
}

function getEmptyDefaults() {
  const hierarchy = applyProjectHierarchy(
    {
      schemaVersion: 18,
      project: EMPTY_PROJECT,
      scenes: [{ id: 1, name: 'Scene 1' }],
      currentSceneId: 1,
      setups: EMPTY_SETUPS,
      currentSetupId: 1,
      currentCoverageShotId: 1,
    },
    { lighting: STOCK_LIGHTING, sceneSetup: '' },
  );
  return {
    project: { ...EMPTY_PROJECT },
    scenes: hierarchy.scenes,
    currentSceneId: hierarchy.currentSceneId,
    setups: hierarchy.setups,
    currentSetupId: hierarchy.currentSetupId,
    currentCoverageShotId: hierarchy.currentCoverageShotId,
    shots: getTimelineShots(hierarchy.setups),
    currentShot: hierarchy.currentSetupId,
    characters: [] as Character[],
    locations: [] as Location[],
    mediaLibrary: [] as MediaAsset[],
    globalMediaLibrary: [] as MediaAsset[],
    shotWorkflowSnapshots: [] as ShotWorkflowSnapshot[],
    camera: hierarchy.camera,
    lighting: hierarchy.lighting,
    motion: hierarchy.motion,
    sceneSetup: hierarchy.sceneSetup,
    shotActivity: hierarchy.shotActivity,
  };
}

function setupHasStockDemoContext(setup: Setup): boolean {
  return Boolean(
    setup.references?.some((ref) => ref?.includes('demo-surfer'))
    || setup.backdrops?.some((plate) => plate.url?.includes('demo-surfer')),
  );
}

function withDemoEntityDefaults(data: StudioProject): StudioProject {
  const hasStockDemo = data.setups.some(setupHasStockDemoContext);
  if (!hasStockDemo) return data;

  const hasBud = (data.characters ?? []).some((character) => character.id === STOCK_CHARACTER_BUD_ID);
  const hasChkOffice = (data.locations ?? []).some((location) => location.id === STOCK_LOCATION_CHK_OFFICE_ID);
  const characters = hasBud ? (data.characters ?? []) : STOCK_CHARACTERS;
  const locations = hasChkOffice ? (data.locations ?? []) : STOCK_LOCATIONS;

  const setups = data.setups.map((setup) => {
    if (!setupHasStockDemoContext(setup)) return setup;

    const characterSlots = setup.characterSlots?.length
      ? setup.characterSlots
      : [STOCK_CHARACTER_BUD_ID];
    const characterSheetSlots = setup.characterSheetSlots?.length
      ? setup.characterSheetSlots
      : [STOCK_CHARACTER_BUD_SHEET_ID];
    const subjectSlotSourceModes: NonNullable<Setup['subjectSlotSourceModes']> = setup.subjectSlotSourceModes?.length
      ? setup.subjectSlotSourceModes
      : ['typed'];
    const locationId = setup.locationId ?? STOCK_LOCATION_CHK_OFFICE_ID;
    const hasNamedPlate = setup.backdrops.some((plate) => plate.id === STOCK_LOCATION_CHK_PLATE_ID);
    const demoBackdropUrl = setup.backdrops[0]?.url ?? STOCK_BACKDROP_REF;
    const backdrops = hasNamedPlate
      ? setup.backdrops
      : [{
          id: STOCK_LOCATION_CHK_PLATE_ID,
          label: '57th St. Entry - Left',
          url: demoBackdropUrl,
        }];
    const shots = setup.shots.map((shot, index) => (
      index === 0 || shot.backdropId === DEFAULT_BACKDROP_ID
        ? { ...shot, backdropId: STOCK_LOCATION_CHK_PLATE_ID }
        : shot
    ));

    return {
      ...setup,
      characterSlots,
      characterSheetSlots,
      subjectSlotSourceModes,
      locationId,
      backdrops,
      shots,
    };
  });

  return {
    ...data,
    characters,
    locations,
    setups,
  };
}

function applyStudioProject(data: StudioProject, globalMediaLibrary: MediaAsset[] = []) {
  const hydrated = withDemoEntityDefaults(data);
  const project = {
    ...hydrated.project,
    aspectRatio: hydrated.project.aspectRatio || '16:9',
  };
  const hierarchy = applyProjectHierarchy(hydrated, projectDefaultsFromStudioData(hydrated));
  return {
    project: ensureResolution(project),
    scenes: hierarchy.scenes,
    currentSceneId: hierarchy.currentSceneId,
    setups: hierarchy.setups,
    currentSetupId: hierarchy.currentSetupId,
    currentCoverageShotId: hierarchy.currentCoverageShotId,
    shots: getTimelineShots(hierarchy.setups),
    currentShot: hierarchy.currentSetupId,
    characters: hydrated.characters ?? [],
    locations: hydrated.locations ?? [],
    mediaLibrary: hydrated.mediaLibrary ?? [],
    globalMediaLibrary,
    shotWorkflowSnapshots: hydrated.shotWorkflowSnapshots ?? [],
    camera: hierarchy.camera,
    lighting: hierarchy.lighting,
    motion: hierarchy.motion,
    sceneSetup: hierarchy.sceneSetup,
    shotActivity: hierarchy.shotActivity,
  };
}

const SETUP_LEVEL_PATCH_KEYS: ReadonlySet<string> = new Set([
  'lighting', 'sceneSetup', 'references', 'transformedReferences', 'crowdTypePrompt',
]);

function applyShotPatch(
  state: Pick<StudioStore, 'setups' | 'currentSetupId' | 'currentCoverageShotId'>,
  patch: Partial<Shot>,
) {
  let setups = patchResolvedShotInSetups(
    state.setups,
    state.currentSetupId,
    state.currentCoverageShotId,
    patch,
  );
  // When shared setup-level fields change, mark other coverage shots' bakes stale.
  const touchesSetup = Object.keys(patch).some((k) => SETUP_LEVEL_PATCH_KEYS.has(k));
  if (touchesSetup) {
    setups = invalidateSetupCoverageBakes(setups, state.currentSetupId);
  }
  const setup = getCurrentSetupFromList(setups, state.currentSetupId);
  const coverage = getCurrentCoverageFromSetup(setup, state.currentCoverageShotId);
  return {
    setups,
    shots: getTimelineShots(setups),
    ...(setup && coverage ? setupActiveView(setup, coverage) : {}),
  };
}

function projectPersistencePayload(state: StudioStore) {
  return {
    project: buildStudioProject(state),
    globalMediaLibrary: state.globalMediaLibrary,
  };
}

function locateMediaAssetCollection(
  state: Pick<StudioStore, 'mediaLibrary' | 'globalMediaLibrary'>,
  assetId: string,
): MediaLibraryCollection | null {
  if (state.mediaLibrary.some((a) => a.id === assetId)) return 'project';
  if (state.globalMediaLibrary.some((a) => a.id === assetId)) return 'global';
  return null;
}

function patchClearsClipEmbedding(
  patch: Partial<Omit<MediaAsset, 'metadata'>> & { metadata?: Partial<MediaAsset['metadata']> },
): boolean {
  if (patch.type !== undefined) return true;
  if (patch.workflowOrigin !== undefined) return true;
  if (!patch.metadata) return false;
  return (
    'prompt' in patch.metadata ||
    'characterId' in patch.metadata ||
    'provider' in patch.metadata
  );
}

function getCurrentShotFromList(
  setups: Setup[],
  setupId: number,
  coverageShotId: number,
): Shot | undefined {
  return getResolvedCurrentShot(setups, setupId, coverageShotId);
}

function mannequinResyncPatch(
  prevShot: Shot,
  nextShot: Shot,
  reason: MannequinSyncReason,
  aspectRatio: AspectRatio = '16:9',
): Pick<Shot, 'mannequins'> {
  return {
    mannequins: syncMannequinsFromShot(nextShot, prevShot.mannequins, {
      reason,
      prevShot,
      aspectRatio,
    }),
  };
}

function ensureResolution(project: ProjectSettings): ProjectSettings {
  const ar = project.aspectRatio || '16:9';
  const presets = RESOLUTION_PRESETS[ar as AspectRatio] || RESOLUTION_PRESETS['16:9'];
  if (!presets.find((p) => p.value === project.resolution)) {
    return { ...project, resolution: getDefaultResolution(ar as AspectRatio) };
  }
  return project;
}

function themeLightingInvalidationPatch(shot: Shot | undefined): Partial<Shot> {
  if (!shot) return {};
  return patchThemeTransformInvalidation(shot, [0, 1, 2], 'lighting');
}

const POSEBLOCK_BAKE_EXPORT_ENABLED = process.env.NEXT_PUBLIC_POSEBLOCK_COMPOSITOR === '1';

async function tryExportPoseBlockComposite(): Promise<string | null> {
  if (!POSEBLOCK_BAKE_EXPORT_ENABLED) return null;
  try {
    const poseblock = await import('poseblock');
    return await poseblock.runCompositeExport();
  } catch {
    return null;
  }
}

const stockState = getStockDefaults();

interface StudioStore {
  project: ProjectSettings;
  camera: CameraSettings;
  lighting: LightingSettings;
  motion: MotionSettings;
  sceneSetup: string;
  shotActivity: string;
  scenes: Scene[];
  currentSceneId: number;
  setups: Setup[];
  currentSetupId: number;
  currentCoverageShotId: number;
  /** Timeline cards — one resolved shot per setup. */
  shots: Shot[];
  /** @deprecated Alias for currentSetupId — timeline selection. */
  currentShot: number;
  /** Named characters with their reference sheets — project-level. */
  characters: Character[];
  /** Named locations with their backdrop plates — project-level. */
  locations: Location[];
  mediaLibrary: MediaAsset[];
  globalMediaLibrary: MediaAsset[];
  shotWorkflowSnapshots: ShotWorkflowSnapshot[];
  ai: AIState;
  toast: { message: string; type: ToastType } | null;
  isGenerating: boolean;
  progressText: string;
  progressDetail: string;
  showPreviewSuccess: boolean;
  previewSuccessProvider: string;
  previewSuccessPrompt: string;
  settingsOpen: boolean;
  appsLauncherOpen: boolean;
  providerEdit: { id: string; isCustom: boolean } | null;
  mobileDrawerOpen: boolean;
  initialized: boolean;
  previewMode: PreviewMode;
  frameView: FrameView;
  previewSubMode: PreviewSubMode;
  isBakingStartFrame: boolean;
  bakeProgress: string;
  bakeProgressDetail: string;
  isPreviewFrameGenerating: boolean;
  previewFrameProgress: string;
  previewFrameProgressDetail: string;
  projectLocationLabel: string | null;
  projectLocationKind: ProjectLocationKind;
  projectSaveState: ProjectSaveState;
  fileApiSupported: boolean;
  workspaceView: StudioPanelId;
  selectedMediaLibraryItemId: string | null;

  init: () => void;
  setWorkspaceView: (view: StudioPanelId) => void;
  selectMediaLibraryItem: (id: string | null) => void;
  updateMediaAsset: (
    assetId: string,
    patch: Partial<Omit<MediaAsset, 'metadata'>> & { metadata?: Partial<MediaAsset['metadata']> },
  ) => void;
  importMediaAssets: (files: File[], scope?: MediaLibraryCollection) => Promise<void>;
  deleteMediaAssets: (assetIds: string[]) => void;
  moveMediaAssetsToScope: (assetIds: string[], target: MediaLibraryCollection) => void;
  replaceMediaAssetContentFromDataUrl: (assetId: string, dataUrl: string) => Promise<void>;
  replaceMediaAssetUrlValue: (assetId: string, url: string) => Promise<void>;
  reorderMediaAssets: (type: MediaAssetType, orderedIds: string[]) => void;
  indexClipEmbeddings: (assetIds?: string[]) => void;
  setFrameView: (view: FrameView) => void;
  setPreviewSubMode: (mode: PreviewSubMode) => void;
  generatePreviewFrame: () => Promise<void>;
  setPreviewMode: (mode: PreviewMode) => void;
  togglePreviewMode: () => void;
  showToast: (message: string, type?: ToastType) => void;
  clearToast: () => void;
  getCurrentShot: () => Shot | undefined;
  getScenePayload: () => {
    project: ProjectSettings;
    scenes: Scene[];
    currentSceneId: number;
    setups: Setup[];
    currentSetupId: number;
    currentCoverageShotId: number;
    shots: Shot[];
    currentShot: number;
    shot: Shot | undefined;
    camera: CameraSettings;
    lighting: LightingSettings;
    motion: MotionSettings;
    sceneSetup: string;
    shotActivity: string;
  };

  setProject: (patch: Partial<ProjectSettings>) => void;
  setCamera: (patch: Partial<CameraSettings>) => void;
  setLighting: (patch: Partial<LightingSettings>) => void;
  setColorPalette: (patch: Partial<ColorPaletteSettings>) => void;
  applyLookRecipe: (id: string) => void;
  clearLookRecipe: () => void;
  setMotion: (patch: Partial<MotionSettings>) => void;
  setSceneSetup: (sceneSetup: string) => void;
  setShotActivity: (shotActivity: string) => void;
  setPromptAdditions: (promptAdditions: string) => void;
  setLightingAtmospherePrompt: (lightingAtmospherePrompt: string) => void;
  setBakeStartFramePrompt: (bakeStartFramePrompt: string) => void;
  setCrowdTypePrompt: (crowdTypePrompt: string) => void;
  setShotFrameComposition: (patch: Partial<FrameComposition>) => void;
  toggleCompositionOverlay: () => void;
  handleCameraCompositionChange: (
    changed:
      | 'subjectCount'
      | 'coverage'
      | 'arrangement'
      | 'crowdDensity'
      | 'fillRestWithGenerics'
      | 'heroSubjectsEnabled',
    patch: Partial<
      Pick<
        CameraSettings,
        | 'subjectCount'
        | 'coverage'
        | 'arrangement'
        | 'crowdDensity'
        | 'fillRestWithGenerics'
        | 'heroSubjectsEnabled'
      >
    >,
  ) => void;

  selectSetup: (id: number) => void;
  selectShot: (id: number) => void;
  selectCoverageShot: (id: number) => void;
  deleteShot: (id: number) => void;
  deleteSetup: (id: number) => void;
  addShot: (mode?: 'duplicate' | 'blank') => void;
  addSetup: (mode?: 'duplicate' | 'blank') => void;
  addCoverageShot: (mode?: 'duplicate' | 'blank') => void;
  deleteCoverageShot: (id: number) => void;
  selectGeneratedVideo: (index: number) => void;
  deleteGeneratedVideo: (id: string) => void;
  setReference: (index: number, dataUrl: string | null) => void;
  addReferenceSlot: () => void;
  removeReferenceSlot: (index: number) => void;
  backdropSelected: boolean;
  setBackdropSelected: (selected: boolean) => void;
  selectedMannequinIds: string[];
  selectMannequin: (id: string, options?: { shiftKey?: boolean }) => void;
  clearMannequinSelection: () => void;
  setBackdropFraming: (patch: Partial<BackdropFraming>) => void;
  toggleBackdropFramingLock: () => void;
  resetBackdropFraming: () => void;
  ensureBackdropCrop: () => Promise<void>;
  commitBackdropCrop: () => Promise<void>;
  cycleReferenceRole: (index: number) => void;
  setReferenceMode: (mode: ReferenceMode) => void;
  setWorkflow: (workflow: Workflow) => void;
  addMannequin: () => void;
  updateMannequin: (id: string, patch: Partial<Mannequin>) => void;
  assignMannequinSubjectSlot: (mannequinId: string, slotIndex: number | null) => void;
  removeMannequin: (id: string) => void;
  invalidateBakedFrame: () => void;
  bakeStartFrame: () => Promise<void>;
  saveBakedFrameToAssets: () => Promise<void>;
  loadBakedFrameFromAsset: (assetId: string) => void;
  archiveBakeFromShot: (shot: Shot) => Promise<void>;
  saveBackdropPlateToLibrary: (setupId: number, backdropId: string) => Promise<void>;
  applyThemeTransformSlot: (index: number) => Promise<void>;

  // ── Character Manager ────────────────────────────────────────────────────
  createCharacter: (name: string, firstSheetUrl: string) => Character;
  renameCharacter: (id: string, name: string) => void;
  addCharacterSheet: (characterId: string, url: string, label?: string) => void;
  removeCharacterSheet: (characterId: string, sheetId: string) => void;
  updateCharacterSheetLabel: (characterId: string, sheetId: string, label?: string) => void;
  updateCharacterLists: (
    id: string,
    patch: Partial<Pick<Character, 'propNames' | 'wardrobeItems' | 'storedPoses'>>,
  ) => void;
  deleteCharacter: (id: string) => void;
  assignCharacterToSlot: (
    setupId: number,
    slotIndex: number,
    characterId: string | null,
    sheetId?: string | null,
  ) => void;
  setSubjectSlotSourceMode: (
    setupId: number,
    slotIndex: number,
    mode: 'typed' | 'manual' | null,
  ) => void;

  // ── Location Manager ─────────────────────────────────────────────────────
  createLocation: (name: string, firstPlateUrl: string) => Location;
  renameLocation: (id: string, name: string) => void;
  addLocationPlate: (locationId: string, url: string, label?: string) => void;
  removeLocationPlate: (locationId: string, plateId: string) => void;
  deleteLocation: (id: string) => void;
  assignLocationToSetup: (setupId: number, locationId: string | null) => void;
  assignPlateToShot: (setupId: number, coverageShotId: number, plateId: string) => void;

  generate: () => Promise<void>;
  saveProject: () => Promise<void>;
  saveProjectQuick: () => Promise<void>;
  loadProject: () => Promise<void>;
  openProjectQuick: () => Promise<void>;
  openProjectFolder: () => Promise<void>;
  saveProjectFolderAs: () => Promise<void>;
  newProject: () => void;
  resetToDemo: () => void;
  exportVideo: () => void;
  syncProjectFileUi: () => void;

  openSettings: () => void;
  closeSettings: () => void;
  openAppsLauncher: () => void;
  closeAppsLauncher: () => void;
  setDefaultVideoProvider: (id: string) => void;
  setDefaultVideoModel: (modelId: string) => void;
  setDefaultImageProvider: (id: string) => void;
  setDefaultImageModel: (modelId: string) => void;
  openProviderEdit: (id: string, isCustom: boolean) => void;
  closeProviderEdit: () => void;
  saveProviderEdit: (apiKey: string, customFields?: { name: string; desc: string; baseUrl: string }) => void;
  applyProviderTestResult: (
    id: string,
    isCustom: boolean,
    result: {
      ok: boolean;
      message: string;
      models?: import('@/lib/types/studio').ProviderModel[];
      modalities?: import('@/lib/types/studio').Modality[];
      purposes?: string[];
    },
    apiKey?: string,
  ) => void;
  deleteCustomProvider: (id: string) => void;
  addCustomProvider: (name: string, baseUrl: string) => void;
  setMobileDrawerOpen: (open: boolean) => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;
async function renderShotBackdropCrop(
  get: () => StudioStore,
): Promise<string> {
  const { project, setups, currentSetupId, currentCoverageShotId } = get();
  const shot = getCurrentShotFromList(setups, currentSetupId, currentCoverageShotId);
  if (!shot) throw new Error('No active shot');

  const aspect = (project.aspectRatio || '16:9') as AspectRatio;
  const sourceUrl = getEffectiveBackdropSourceUrl(shot, shot.lighting);
  if (!sourceUrl) throw new Error('No backdrop source');

  const framing = getBackdropFraming(shot, aspect);
  const { width, height } = parseResolution(project.resolution);
  return renderBackdropCropDataUrl({
    sourceUrl,
    framing,
    outputWidth: width,
    outputHeight: height,
  });
}

export const useStudioStore = create<StudioStore>((set, get) => ({
  project: stockState.project,
  camera: stockState.camera,
  lighting: stockState.lighting,
  motion: stockState.motion,
  sceneSetup: stockState.sceneSetup,
  shotActivity: stockState.shotActivity,
  scenes: stockState.scenes,
  currentSceneId: stockState.currentSceneId,
  setups: stockState.setups,
  currentSetupId: stockState.currentSetupId,
  currentCoverageShotId: stockState.currentCoverageShotId,
  shots: stockState.shots,
  currentShot: stockState.currentShot,
  characters: stockState.characters,
  locations: stockState.locations,
  mediaLibrary: stockState.mediaLibrary,
  globalMediaLibrary: stockState.globalMediaLibrary,
  shotWorkflowSnapshots: stockState.shotWorkflowSnapshots,
  ai: { ...DEFAULT_AI_STATE },
  toast: null,
  isGenerating: false,
  progressText: '',
  progressDetail: '',
  showPreviewSuccess: false,
  previewSuccessProvider: '',
  previewSuccessPrompt: '',
  settingsOpen: false,
  appsLauncherOpen: false,
  providerEdit: null,
  mobileDrawerOpen: false,
  initialized: false,
  previewMode: 'vector',
  frameView: 'preview',
  previewSubMode: 'framing',
  isBakingStartFrame: false,
  bakeProgress: '',
  bakeProgressDetail: '',
  isPreviewFrameGenerating: false,
  previewFrameProgress: '',
  previewFrameProgressDetail: '',
  projectLocationLabel: null,
  projectLocationKind: null,
  projectSaveState: 'none',
  fileApiSupported: false,
  backdropSelected: false,
  selectedMannequinIds: [],
  workspaceView: 'shot-designer',
  selectedMediaLibraryItemId: null,

  setBackdropSelected(selected) {
    set({ backdropSelected: selected });
  },

  selectMannequin(id, options) {
    const { selectedMannequinIds } = get();
    if (options?.shiftKey) {
      if (selectedMannequinIds.includes(id)) {
        set({ selectedMannequinIds: selectedMannequinIds.filter((sid) => sid !== id) });
      } else {
        set({ selectedMannequinIds: [...selectedMannequinIds, id] });
      }
      return;
    }
    set({ selectedMannequinIds: [id] });
  },

  clearMannequinSelection() {
    set({ selectedMannequinIds: [] });
  },

  syncProjectFileUi() {
    set(projectFileUiState());
  },

  setFrameView(view) {
    set({ frameView: view });
  },

  setWorkspaceView(view) {
    set({
      workspaceView: view,
      ...(view === 'shot-designer' ? { selectedMediaLibraryItemId: null } : {}),
    });
  },

  selectMediaLibraryItem(id) {
    set({ selectedMediaLibraryItemId: id });
  },

  updateMediaAsset(assetId, patch) {
    set((s) => {
      const collection = locateMediaAssetCollection(s, assetId);
      if (!collection) return {};
      const fullPatch = patchClearsClipEmbedding(patch)
        ? {
            ...patch,
            metadata: {
              ...(patch.metadata ?? {}),
              clipEmbedding: undefined,
            },
          }
        : patch;
      if (collection === 'project') {
        return {
          mediaLibrary: updateMediaAssetInLibrary(s.mediaLibrary, assetId, fullPatch),
        };
      }
      return {
        globalMediaLibrary: updateMediaAssetInLibrary(s.globalMediaLibrary, assetId, fullPatch),
      };
    });
  },

  async importMediaAssets(files, scope = 'project') {
    if (files.length === 0) return;
    const state = get();
    const library = scope === 'global' ? state.globalMediaLibrary : state.mediaLibrary;
    const { library: nextLibrary, imported } = await importMediaFilesToLibrary(library, files, {
      scope,
      workflowOrigin: 'upload',
    });
    if (imported.length === 0) {
      get().showToast('No supported image or video files to import', 'error');
      return;
    }
    if (scope === 'global') {
      set({ globalMediaLibrary: nextLibrary });
    } else {
      set({ mediaLibrary: nextLibrary });
    }
    get().showToast(`Imported ${imported.length} asset${imported.length === 1 ? '' : 's'}`);
  },

  deleteMediaAssets(assetIds) {
    if (assetIds.length === 0) return;
    const idSet = new Set(assetIds);
    set((s) => {
      const projectDeleted = s.mediaLibrary.filter((a) => idSet.has(a.id));
      const globalDeleted = s.globalMediaLibrary.filter((a) => idSet.has(a.id));
      const deletedCount = projectDeleted.length + globalDeleted.length;
      if (deletedCount === 0) return {};

      const nextSelected =
        s.selectedMediaLibraryItemId && idSet.has(s.selectedMediaLibraryItemId)
          ? null
          : s.selectedMediaLibraryItemId;

      const cleanedSetups = cleanSetupsAfterAssetDelete(s.setups, idSet);
      return {
        mediaLibrary: removeAssetsFromLibrary(s.mediaLibrary, idSet),
        globalMediaLibrary: removeAssetsFromLibrary(s.globalMediaLibrary, idSet),
        setups: cleanedSetups,
        shots: getTimelineShots(cleanedSetups),
        shotWorkflowSnapshots: cleanSnapshotsAfterAssetDelete(s.shotWorkflowSnapshots, idSet),
        selectedMediaLibraryItemId: nextSelected,
      };
    });
    get().showToast(`Removed ${assetIds.length} asset${assetIds.length === 1 ? '' : 's'} from library`);
  },

  moveMediaAssetsToScope(assetIds, target) {
    if (assetIds.length === 0) return;
    set((s) => {
      const moved = moveAssetsToScope(s.mediaLibrary, s.globalMediaLibrary, assetIds, target);
      return {
        mediaLibrary: moved.projectLibrary,
        globalMediaLibrary: moved.globalLibrary,
      };
    });
    get().showToast(
      target === 'global'
        ? 'Moved to global library'
        : 'Moved to project library',
    );
  },

  async replaceMediaAssetContentFromDataUrl(assetId, dataUrl) {
    const state = get();
    const collection = locateMediaAssetCollection(state, assetId);
    if (!collection) {
      get().showToast('Asset not found', 'error');
      return;
    }
    try {
      const library =
        collection === 'global' ? state.globalMediaLibrary : state.mediaLibrary;
      const result = await replaceMediaAssetContent(library, assetId, dataUrl);
      const nextSetups = applyAssetIdRemapToSetups(state.setups, result.idMap);
      const nextSnapshots = applyAssetIdRemapToSnapshots(
        state.shotWorkflowSnapshots,
        result.idMap,
      );
      const remapOtherLibrary = (lib: MediaAsset[]) => {
        if (result.idMap.size === 0) return lib;
        return lib.map((asset) => {
          const parent = asset.metadata.parentAssetId;
          if (parent && result.idMap.has(parent)) {
            return {
              ...asset,
              metadata: { ...asset.metadata, parentAssetId: result.idMap.get(parent) },
            };
          }
          return asset;
        });
      };
      const selectedId =
        state.selectedMediaLibraryItemId === assetId ? result.asset.id : state.selectedMediaLibraryItemId;
      if (collection === 'global') {
        set({
          globalMediaLibrary: result.library,
          mediaLibrary: remapOtherLibrary(state.mediaLibrary),
          setups: nextSetups,
          shots: getTimelineShots(nextSetups),
          shotWorkflowSnapshots: nextSnapshots,
          selectedMediaLibraryItemId: selectedId,
        });
      } else {
        set({
          mediaLibrary: result.library,
          globalMediaLibrary: remapOtherLibrary(state.globalMediaLibrary),
          setups: nextSetups,
          shots: getTimelineShots(nextSetups),
          shotWorkflowSnapshots: nextSnapshots,
          selectedMediaLibraryItemId: selectedId,
        });
      }
      get().showToast(
        result.idMap.size > 0 ? 'Asset content replaced — ID updated from hash' : 'Asset content replaced',
      );
    } catch (e) {
      get().showToast(e instanceof Error ? e.message : 'Could not replace asset', 'error');
    }
  },

  async replaceMediaAssetUrlValue(assetId, url) {
    const trimmed = url.trim();
    if (!trimmed) {
      get().showToast('URL cannot be empty', 'error');
      return;
    }
    const state = get();
    const collection = locateMediaAssetCollection(state, assetId);
    if (!collection) {
      get().showToast('Asset not found', 'error');
      return;
    }
    try {
      const library =
        collection === 'global' ? state.globalMediaLibrary : state.mediaLibrary;
      const result = await replaceMediaAssetUrl(library, assetId, trimmed);
      const nextSetups = applyAssetIdRemapToSetups(state.setups, result.idMap);
      const nextSnapshots = applyAssetIdRemapToSnapshots(
        state.shotWorkflowSnapshots,
        result.idMap,
      );
      const selectedId =
        state.selectedMediaLibraryItemId === assetId ? result.asset.id : state.selectedMediaLibraryItemId;
      if (collection === 'global') {
        set({
          globalMediaLibrary: result.library,
          setups: nextSetups,
          shots: getTimelineShots(nextSetups),
          shotWorkflowSnapshots: nextSnapshots,
          selectedMediaLibraryItemId: selectedId,
        });
      } else {
        set({
          mediaLibrary: result.library,
          setups: nextSetups,
          shots: getTimelineShots(nextSetups),
          shotWorkflowSnapshots: nextSnapshots,
          selectedMediaLibraryItemId: selectedId,
        });
      }
      get().showToast(
        result.idMap.size > 0 ? 'URL updated — asset ID re-hashed' : 'Asset URL updated',
      );
    } catch (e) {
      get().showToast(e instanceof Error ? e.message : 'Could not update URL', 'error');
    }
  },

  reorderMediaAssets(type, orderedIds) {
    set((s) => ({
      mediaLibrary: reorderAssetsInType(s.mediaLibrary, type, orderedIds),
      globalMediaLibrary: reorderAssetsInType(s.globalMediaLibrary, type, orderedIds),
    }));
  },

  indexClipEmbeddings(assetIds) {
    const idSet = assetIds?.length ? new Set(assetIds) : undefined;
    set((s) => ({
      mediaLibrary: indexClipEmbeddingsInLibrary(s.mediaLibrary, idSet),
      globalMediaLibrary: indexClipEmbeddingsInLibrary(s.globalMediaLibrary, idSet),
    }));
    get().showToast(
      assetIds?.length
        ? `Indexed CLIP embeddings for ${assetIds.length} asset${assetIds.length === 1 ? '' : 's'}`
        : 'Indexed CLIP embeddings for all assets',
    );
  },

  setPreviewSubMode(mode) {
    set({ previewSubMode: mode });
  },

  init() {
    const fileApiSupported = isFileSystemAccessSupported();
    set({ fileApiSupported });

    if (get().initialized) return;

    void (async () => {
      const ai = await bootstrapAIState();
      let applied: ReturnType<typeof applyStudioProject> | null = null;
      let toastMessage: string | null = null;

      const devServerStorage = isServerProjectStorageDevMode();

      if (devServerStorage && isServerProjectStorageEnabled()) {
        const serverBundle = await loadProjectFromServer();
        if (serverBundle) {
          applied = applyStudioProject(serverBundle.project, serverBundle.globalMediaLibrary);
          toastMessage = 'Restored shared dev project';
        }
      }

      if (!applied && !devServerStorage && isNativeFilePickerSupported()) {
        const restored = await restoreProjectSession();
        if (restored) {
          applied = applyStudioProject(restored.project, restored.globalMediaLibrary);
          toastMessage = `Opened ${getProjectLocationLabel() ?? 'project'}`;
        }
      }

      if (!applied && !devServerStorage) {
        const draft = loadStudioDraft();
        if (draft) {
          applied = applyStudioProject(draft);
          clearStudioDraft();
          toastMessage = fileApiSupported
            ? 'Restored unsaved work — open or save a project folder to keep it on disk'
            : 'Restored your last session — save a project file to keep it';
        }
      }

      if (!applied && !devServerStorage && isServerProjectStorageEnabled()) {
        const serverBundle = await loadProjectFromServer();
        if (serverBundle) {
          applied = applyStudioProject(serverBundle.project, serverBundle.globalMediaLibrary);
          toastMessage = 'Restored from server backup — choose a project folder to save locally';
        }
      }

      if (applied) {
        set({
          ...applied,
          ai,
          previewMode: 'vector',
          initialized: true,
          ...projectFileUiState(),
        });
        if (toastMessage) get().showToast(toastMessage);
      } else {
        set({
          ai,
          previewMode: 'vector',
          initialized: true,
          ...projectFileUiState(),
        });
      }
    })();
  },

  setPreviewMode(mode) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(PREVIEW_MODE_KEY, mode);
    }
    set({ previewMode: mode });
  },

  togglePreviewMode() {
    const next = get().previewMode === 'vector' ? '3d' : 'vector';
    get().setPreviewMode(next);
  },

  showToast(message, type = 'success') {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: { message, type } });
    toastTimer = setTimeout(() => set({ toast: null }), 3000);
  },

  clearToast() {
    set({ toast: null });
  },

  getCurrentShot() {
    return getCurrentShotFromList(get().setups, get().currentSetupId, get().currentCoverageShotId);
  },

  getScenePayload() {
    const state = get();
    const shot = getResolvedCurrentShot(state.setups, state.currentSetupId, state.currentCoverageShotId);
    return {
      project: state.project,
      scenes: state.scenes,
      currentSceneId: state.currentSceneId,
      setups: state.setups,
      currentSetupId: state.currentSetupId,
      currentCoverageShotId: state.currentCoverageShotId,
      shots: state.shots,
      currentShot: state.currentShot,
      shot,
      camera: shot?.camera ?? state.camera,
      lighting: shot?.lighting ?? state.lighting,
      motion: shot?.motion ?? state.motion,
      sceneSetup: shot?.sceneSetup ?? state.sceneSetup,
      shotActivity: shot?.shotActivity ?? state.shotActivity,
    };
  },

  setProject(patch) {
    set((s) => {
      let project = { ...s.project, ...patch };
      if (patch.aspectRatio) {
        project = ensureResolution(project);
      }
      return { project };
    });
  },

  setCamera(patch) {
    set((s) => {
      const current = getCurrentShotFromList(s.setups, s.currentSetupId, s.currentCoverageShotId);
      const base = current?.camera ?? s.camera;
      const lensPatch = applyLensCameraPatch(base, patch);
      const camera = {
        ...base,
        ...lensPatch,
        ...(patch.promptInclusion
          ? {
              promptInclusion: {
                ...resolveCameraPromptInclusion(base),
                ...patch.promptInclusion,
              },
            }
          : {}),
      };
      if (patch.aperture !== undefined) {
        camera.aperture = snapToApertureStop(patch.aperture);
        camera.dof = dofFromAperture(camera.aperture);
      } else if (patch.dof !== undefined) {
        camera.dof = patch.dof;
        camera.aperture = apertureForDof(patch.dof, base.aperture);
      }
      if (patch.movement === 'drone') {
        camera.angle = 'drone';
      }

      let shotPatch: Partial<Shot> = { camera };
      if (
        current &&
        patch.fieldSize !== undefined &&
        patch.fieldSize !== base.fieldSize
      ) {
        shotPatch = {
          ...shotPatch,
          ...mannequinResyncPatch(
            current,
            { ...current, camera },
            'camera',
            (s.project.aspectRatio || '16:9') as AspectRatio,
          ),
        };
      }

      return {
        camera,
        ...applyShotPatch(s, shotPatch),
      };
    });
  },

  setLighting(patch) {
    set((s) => {
      const clearRecipe = !('activeLookRecipeId' in (patch.colorPalette ?? {}));
      const base = { ...s.lighting, ...patch };
      if (patch.colorPalette) {
        base.colorPalette = { ...s.lighting.colorPalette, ...patch.colorPalette };
        if (patch.colorPalette.bw) {
          base.colorPalette.bw = {
            ...s.lighting.colorPalette.bw,
            ...patch.colorPalette.bw,
          };
        }
        if (clearRecipe && patch.colorPalette.activeLookRecipeId === undefined) {
          base.colorPalette.activeLookRecipeId = null;
        }
      } else if (
        Object.keys(patch).some(
          (key) => key !== 'themeTransformLighting' && key !== 'videoEnvironment' && key !== 'videoLighting',
        )
      ) {
        base.colorPalette = { ...base.colorPalette, activeLookRecipeId: null };
      }
      if (patch.colorTemp !== undefined) {
        base.colorPalette = {
          ...base.colorPalette,
          keyLightWarmth: kelvinToWarmth(patch.colorTemp),
          activeLookRecipeId: null,
        };
      }
      if (patch.themeTransformLighting) {
        base.themeTransformLighting = normalizeThemeTransformLighting({
          ...s.lighting.themeTransformLighting,
          ...patch.themeTransformLighting,
        });
      } else if (!s.lighting.themeTransformLighting) {
        base.themeTransformLighting = normalizeThemeTransformLighting();
      }
      if (patch.videoEnvironment) {
        base.videoEnvironment = normalizeVideoEnvironment({
          ...s.lighting.videoEnvironment,
          ...patch.videoEnvironment,
        });
      } else if (!s.lighting.videoEnvironment) {
        base.videoEnvironment = normalizeVideoEnvironment();
      }
      if (patch.videoLighting) {
        base.videoLighting = normalizeVideoLighting({
          ...s.lighting.videoLighting,
          ...patch.videoLighting,
        });
      } else if (!s.lighting.videoLighting) {
        base.videoLighting = normalizeVideoLighting();
      }
      const current = getCurrentShotFromList(s.setups, s.currentSetupId, s.currentCoverageShotId);
      const shotLighting = { ...current?.lighting ?? base, ...patch };
      if (patch.themeTransformLighting) {
        shotLighting.themeTransformLighting = base.themeTransformLighting;
      } else if (!shotLighting.themeTransformLighting) {
        shotLighting.themeTransformLighting = normalizeThemeTransformLighting();
      }
      if (patch.videoEnvironment) {
        shotLighting.videoEnvironment = base.videoEnvironment;
      } else if (!shotLighting.videoEnvironment) {
        shotLighting.videoEnvironment = normalizeVideoEnvironment();
      }
      if (patch.videoLighting) {
        shotLighting.videoLighting = base.videoLighting;
      } else if (!shotLighting.videoLighting) {
        shotLighting.videoLighting = normalizeVideoLighting();
      }
      if (patch.colorPalette) {
        shotLighting.colorPalette = { ...current?.lighting?.colorPalette ?? s.lighting.colorPalette, ...patch.colorPalette };
        if (patch.colorPalette.bw) {
          shotLighting.colorPalette.bw = {
            ...(current?.lighting?.colorPalette?.bw ?? s.lighting.colorPalette.bw),
            ...patch.colorPalette.bw,
          };
        }
        if (clearRecipe && patch.colorPalette.activeLookRecipeId === undefined) {
          shotLighting.colorPalette.activeLookRecipeId = null;
        }
      } else if (
        Object.keys(patch).some(
          (key) => key !== 'themeTransformLighting' && key !== 'videoEnvironment' && key !== 'videoLighting',
        )
      ) {
        shotLighting.colorPalette = {
          ...shotLighting.colorPalette,
          activeLookRecipeId: null,
        };
      }
      if (patch.colorTemp !== undefined) {
        shotLighting.colorPalette = {
          ...shotLighting.colorPalette,
          keyLightWarmth: kelvinToWarmth(patch.colorTemp),
          activeLookRecipeId: null,
        };
      }
      const invalidationShot = { ...current, lighting: shotLighting } as Shot;
      return {
        lighting: base,
        ...applyShotPatch(s, {
          lighting: shotLighting,
          ...themeLightingInvalidationPatch(invalidationShot),
        }),
      };
    });
  },

  setColorPalette(patch) {
    set((s) => {
      const colorPalette = { ...s.lighting.colorPalette, ...patch };
      if (patch.bw) {
        colorPalette.bw = { ...s.lighting.colorPalette.bw, ...patch.bw };
      }
      if (patch.activeLookRecipeId === undefined) {
        colorPalette.activeLookRecipeId = null;
      }
      const lightingPatch: Partial<LightingSettings> = { colorPalette };
      if (patch.keyLightWarmth !== undefined) {
        lightingPatch.colorTemp = warmthToKelvin(patch.keyLightWarmth);
      }
      const base = { ...s.lighting, ...lightingPatch };
      const current = getCurrentShotFromList(s.setups, s.currentSetupId, s.currentCoverageShotId);
      const shotLighting = {
        ...current?.lighting ?? base,
        colorPalette,
        ...(patch.keyLightWarmth !== undefined
          ? { colorTemp: warmthToKelvin(patch.keyLightWarmth) }
          : {}),
      };
      return {
        lighting: base,
        ...applyShotPatch(s, {
          lighting: shotLighting,
          ...themeLightingInvalidationPatch(current),
        }),
      };
    });
  },

  applyLookRecipe(id) {
    const recipe = getLookRecipe(id);
    if (!recipe) return;
    set((s) => {
      const current = getCurrentShotFromList(s.setups, s.currentSetupId, s.currentCoverageShotId);
      const source = current?.lighting ?? s.lighting;
      const lighting = applyLookRecipeToLighting(source, recipe);
      return {
        lighting,
        ...applyShotPatch(s, {
          lighting,
          ...themeLightingInvalidationPatch(current),
        }),
      };
    });
  },

  clearLookRecipe() {
    get().setColorPalette({ activeLookRecipeId: null });
  },

  setMotion(patch) {
    set((s) => {
      const motion = { ...s.motion, ...patch };
      const current = getCurrentShotFromList(s.setups, s.currentSetupId, s.currentCoverageShotId);
      return {
        motion,
        ...applyShotPatch(s, {
          motion: { ...current?.motion ?? motion, ...patch },
        }),
      };
    });
  },

  setSceneSetup(sceneSetup) {
    set((s) => ({
      sceneSetup,
      ...applyShotPatch(s, { sceneSetup }),
    }));
  },

  setShotActivity(shotActivity) {
    set((s) => ({
      shotActivity,
      ...applyShotPatch(s, { shotActivity }),
    }));
  },

  setPromptAdditions(promptAdditions) {
    set((s) => ({
      ...applyShotPatch(s, { promptAdditions }),
    }));
  },

  setLightingAtmospherePrompt(lightingAtmospherePrompt) {
    set((s) => ({
      ...applyShotPatch(s, { lightingAtmospherePrompt }),
    }));
  },

  setBakeStartFramePrompt(bakeStartFramePrompt) {
    set((s) => ({
      ...applyShotPatch(s, { bakeStartFramePrompt }),
    }));
  },

  setCrowdTypePrompt(crowdTypePrompt) {
    set((s) => ({
      ...applyShotPatch(s, { crowdTypePrompt }),
    }));
  },

  setShotFrameComposition(patch) {
    const shot = get().getCurrentShot();
    if (!shot) return;
    const frameComposition = { ...shot.frameComposition, ...patch };

    set((s) => ({
      ...applyShotPatch(s, { frameComposition }),
    }));
  },

  toggleCompositionOverlay() {
    const shot = get().getCurrentShot();
    if (!shot) return;
    set((s) => ({
      ...applyShotPatch(s, {
        frameComposition: {
          ...shot.frameComposition,
          showOverlay: !shot.frameComposition.showOverlay,
        },
      }),
    }));
  },

  handleCameraCompositionChange(changed, patch) {
    const { setups, currentSetupId, currentCoverageShotId } = get();
    const prevShot = getCurrentShotFromList(setups, currentSetupId, currentCoverageShotId);
    if (!prevShot) return;

    const next = { ...prevShot.camera, ...patch };

    if (changed === 'coverage' && SINGLE_ONLY_COVERAGE.has(next.coverage)) {
      next.subjectCount = '1s';
    }

    if (changed === 'subjectCount') {
      if (next.subjectCount !== '1s' && SINGLE_ONLY_COVERAGE.has(next.coverage)) {
        next.coverage = 'clean';
      }
      next.arrangement = defaultArrangementForSubjectCount(next.subjectCount);
      if (next.subjectCount === 'crowd') {
        next.heroSubjectsEnabled = false;
      }
    }

    next.arrangement = normalizeArrangement(next.subjectCount, next.arrangement);

    const frameComposition = { ...prevShot.frameComposition };
    applyFrameCompositionSmartDefaults(next, frameComposition);

    const nextShot: Shot = { ...prevShot, camera: next, frameComposition };
    const resync = mannequinResyncPatch(
      prevShot,
      nextShot,
      'camera',
      (get().project.aspectRatio || '16:9') as AspectRatio,
    );

    let mergedShot: Shot = {
      ...nextShot,
      ...resync,
      mannequins: resync.mannequins ?? nextShot.mannequins,
    };

    const slotPatch = ensureSubjectChecklistSlots(mergedShot);
    if (slotPatch) {
      mergedShot = { ...mergedShot, ...slotPatch };
    }

    const removedSubjectSlots = getRemovedSubjectChecklistSlots(prevShot, mergedShot);
    if (removedSubjectSlots.length > 0 && mergedShot.mannequins?.length) {
      let mannequins = migrateMannequins(mergedShot.mannequins);
      for (const slotIndex of removedSubjectSlots) {
        mannequins = clearMannequinAssignmentsForSlot(mannequins, slotIndex);
      }
      mergedShot = { ...mergedShot, mannequins };
    }

    const invalidation = splitInvalidationPatch(
      resolveWorkflowInvalidation(prevShot, { kind: 'mannequin_layout_changed' }),
    );

    set({
      camera: next,
      ...applyShotPatch(
        { setups, currentSetupId, currentCoverageShotId },
        {
          camera: next,
          frameComposition,
          mannequins: mergedShot.mannequins,
          ...slotPatch,
          ...invalidation.shotPatch,
        },
      ),
    });
  },

  selectSetup(id) {
    if (get().currentSetupId === id) return;
    const setup = get().setups.find((s) => s.id === id);
    if (!setup) return;

    let setups: Setup[] = get().setups.map((s) => ({
      ...s,
      active: s.id === id,
      shots: s.shots.map((sh, index) => ({
        ...sh,
        active:
          s.id === id &&
          (Boolean(sh.active) ||
            (index === 0 && !setup.shots.some((x) => x.active))),
      })),
    }));

    const activeSetup = setups.find((s) => s.id === id) ?? setup;
    let coverage =
      activeSetup.shots.find((s) => s.active) ??
      activeSetup.shots[0];
    if (!coverage) return;

    let resolved = getResolvedCurrentShot(setups, id, coverage.id);
    if (resolved && (resolved.mannequins?.length ?? 0) === 0) {
      setups = patchResolvedShotInSetups(setups, id, coverage.id, {
        mannequins: ensureMannequinsOnShot(resolved),
      });
      resolved = getResolvedCurrentShot(setups, id, coverage.id);
    }

    const setupAfter = getCurrentSetupFromList(setups, id);
    const coverageAfter = getCurrentCoverageFromSetup(setupAfter, coverage.id);

    set({
      currentSetupId: id,
      currentCoverageShotId: coverage.id,
      currentShot: id,
      previewSubMode: 'framing',
      backdropSelected: false,
      setups,
      shots: getTimelineShots(setups),
      ...(setupAfter && coverageAfter ? setupActiveView(setupAfter, coverageAfter) : {}),
    });
    get().showToast(`Switched to ${setupAfter?.name ?? `Setup ${id}`}`);
  },

  selectShot(id) {
    get().selectSetup(id);
  },

  selectCoverageShot(id) {
    const { currentSetupId, setups } = get();
    const setup = getCurrentSetupFromList(setups, currentSetupId);
    const coverage = setup?.shots.find((s) => s.id === id);
    if (!coverage) return;
    if (get().currentCoverageShotId === id) return;

    const nextSetups = setups.map((s) =>
      s.id === currentSetupId
        ? {
            ...s,
            shots: s.shots.map((sh) => ({ ...sh, active: sh.id === id })),
          }
        : s,
    );

    const setupAfter = getCurrentSetupFromList(nextSetups, currentSetupId);
    const coverageAfter = getCurrentCoverageFromSetup(setupAfter, id);
    let resolved = getResolvedCurrentShot(nextSetups, currentSetupId, id);
    if (resolved && (resolved.mannequins?.length ?? 0) === 0) {
      const withMannequins = patchResolvedShotInSetups(nextSetups, currentSetupId, id, {
        mannequins: ensureMannequinsOnShot(resolved),
      });
      resolved = getResolvedCurrentShot(withMannequins, currentSetupId, id);
      set({
        setups: withMannequins,
        shots: getTimelineShots(withMannequins),
        currentCoverageShotId: id,
        ...(setupAfter && coverageAfter
          ? setupActiveView(getCurrentSetupFromList(withMannequins, currentSetupId)!, coverageAfter)
          : {}),
      });
    } else {
      set({
        setups: nextSetups,
        shots: getTimelineShots(nextSetups),
        currentCoverageShotId: id,
        ...(setupAfter && coverageAfter ? setupActiveView(setupAfter, coverageAfter) : {}),
      });
    }
    get().showToast(`Switched to ${coverageAfter?.name ?? `Shot ${id}`}`);
  },

  deleteSetup(id) {
    const { setups, currentSetupId } = get();
    if (setups.length === 1) {
      get().showToast('Cannot delete the last setup', 'error');
      return;
    }
    const nextSetups = setups.filter((s) => s.id !== id);
    let nextSetupId = currentSetupId;
    if (currentSetupId === id) {
      nextSetupId = nextSetups[0].id;
      nextSetups[0] = { ...nextSetups[0], active: true };
    }
    const setup = getCurrentSetupFromList(nextSetups, nextSetupId);
    const coverage = getCurrentCoverageFromSetup(setup, setup?.shots.find((s) => s.active)?.id ?? setup?.shots[0]?.id ?? 1);
    set({
      setups: nextSetups,
      shots: getTimelineShots(nextSetups),
      currentSetupId: nextSetupId,
      currentCoverageShotId: coverage?.id ?? nextSetupId,
      currentShot: nextSetupId,
      ...(setup && coverage ? setupActiveView(setup, coverage) : {}),
    });
    get().showToast('Setup deleted');
  },

  deleteShot(id) {
    get().deleteSetup(id);
  },

  deleteCoverageShot(id) {
    const { setups, currentSetupId, currentCoverageShotId } = get();
    const setup = getCurrentSetupFromList(setups, currentSetupId);
    if (!setup || setup.shots.length <= 1) {
      get().showToast('Cannot delete the last shot in this setup', 'error');
      return;
    }
    const nextSetups = setups.map((s) => {
      if (s.id !== currentSetupId) return s;
      const nextShots = s.shots.filter((sh) => sh.id !== id);
      if (currentCoverageShotId === id) {
        nextShots[0] = { ...nextShots[0], active: true };
      }
      return { ...s, shots: nextShots };
    });
    const setupAfter = getCurrentSetupFromList(nextSetups, currentSetupId);
    const nextCoverageId =
      currentCoverageShotId === id
        ? setupAfter?.shots[0]?.id ?? currentCoverageShotId
        : currentCoverageShotId;
    const coverageAfter = getCurrentCoverageFromSetup(setupAfter, nextCoverageId);
    set({
      setups: nextSetups,
      shots: getTimelineShots(nextSetups),
      currentCoverageShotId: nextCoverageId,
      ...(setupAfter && coverageAfter ? setupActiveView(setupAfter, coverageAfter) : {}),
    });
    get().showToast('Shot deleted');
  },

  addSetup(mode = 'duplicate') {
    const { setups, currentSetupId, currentCoverageShotId } = get();
    const currentSetup = getCurrentSetupFromList(setups, currentSetupId);
    const currentCoverage = getCurrentCoverageFromSetup(currentSetup, currentCoverageShotId);
    const newSetupId = nextSetupId(setups);
    const newCoverageId = nextCoverageShotId(setups);

    let newSetup: Setup;
    if (mode === 'blank' || !currentSetup || !currentCoverage) {
  const coverage = createCoverageShot(
    newCoverageId,
    `Shot ${String(newCoverageId).padStart(2, '0')}`,
    false,
    createDefaultBackdrop().id,
    {
      ...createBlankCoverageSettings(),
      thumbnail: null,
    },
  );
      coverage.mannequins = ensureMannequinsOnShot(
        resolveShot(
          createSetup(newSetupId, `Setup ${String(newSetupId).padStart(2, '0')}`, 1, false, coverage),
          coverage,
        )!,
      );
      newSetup = createSetup(
        newSetupId,
        `Setup ${String(newSetupId).padStart(2, '0')}`,
        1,
        false,
        coverage,
        { setupSettings: createBlankSetupSettings() },
      );
    } else {
      const inheritedSetup = cloneInheritedSetupSettings(currentSetup);
      const inheritedCoverage = cloneInheritedCoverageSettings(currentCoverage);
      const coverage = createCoverageShot(
        newCoverageId,
        `Shot ${String(newCoverageId).padStart(2, '0')}`,
        false,
        currentCoverage.backdropId,
        inheritedCoverage,
      );
      const resolved = resolveShot(
        { ...currentSetup, ...inheritedSetup, id: newSetupId },
        coverage,
        getSetupBackdrop(currentSetup, currentCoverage.backdropId),
      );
      if (resolved) {
        coverage.mannequins = ensureMannequinsOnShot(resolved);
      }
      newSetup = {
        id: newSetupId,
        sceneId: currentSetup.sceneId,
        name: `Setup ${String(newSetupId).padStart(2, '0')}`,
        active: false,
        ...inheritedSetup,
        backdrops: currentSetup.backdrops.map((b) => ({ ...b })),
        shots: [coverage],
      };
    }

    const nextSetups = [...setups, newSetup];
    set({ setups: nextSetups, shots: getTimelineShots(nextSetups) });
    get().showToast(
      mode === 'blank'
        ? 'New blank setup added'
        : 'New setup added — inherited settings from current setup',
    );
  },

  addShot(mode = 'duplicate') {
    get().addSetup(mode);
  },

  addCoverageShot(mode = 'duplicate') {
    const { setups, currentSetupId, currentCoverageShotId } = get();
    const setup = getCurrentSetupFromList(setups, currentSetupId);
    const currentCoverage = getCurrentCoverageFromSetup(setup, currentCoverageShotId);
    if (!setup) return;

    const newCoverageId = nextCoverageShotId(setups);
    const inherited =
      mode === 'blank' || !currentCoverage
        ? createBlankCoverageSettings()
        : cloneInheritedCoverageSettings(currentCoverage);

    const coverage = createCoverageShot(
      newCoverageId,
      `Shot ${String(newCoverageId).padStart(2, '0')}`,
      false,
      currentCoverage?.backdropId ?? DEFAULT_BACKDROP_ID,
      inherited,
    );
    const resolved = resolveShot(setup, coverage, getSetupBackdrop(setup, coverage.backdropId));
    if (resolved) {
      coverage.mannequins = ensureMannequinsOnShot(resolved);
    }

    const nextSetups = setups.map((s) =>
      s.id === currentSetupId
        ? { ...s, shots: [...s.shots, coverage] }
        : s,
    );
    set({ setups: nextSetups, shots: getTimelineShots(nextSetups) });
    get().showToast(
      mode === 'blank'
        ? 'New blank shot added'
        : 'New shot added — inherited settings from current shot',
    );
  },

  selectGeneratedVideo(index) {
    const shot = get().getCurrentShot();
    if (!shot) return;
    const patch = selectGeneratedVideoIndex(shot, index);
    if (!Object.keys(patch).length) return;
    set((s) => ({
      ...applyShotPatch(s, patch),
    }));
  },

  deleteGeneratedVideo(id) {
    const shot = get().getCurrentShot();
    if (!shot) return;
    const patch = deleteGeneratedVideoById(shot, id);
    if (!Object.keys(patch).length) return;
    set((s) => ({
      ...applyShotPatch(s, patch),
    }));
    get().showToast(patch.videoUrl ? 'Video removed' : 'All generated videos removed');
  },

  setReference(index, dataUrl) {
    const shot = get().getCurrentShot();
    if (!shot) return;
    const { ai } = get();
    const modelId = getEffectiveModelId(ai);
    if (
      dataUrl &&
      restrictsReferenceSlotsToFirst(ai.defaultVideoProvider, modelId) &&
      index > 0
    ) {
      return;
    }
    const references = [...shot.references];
    references[index] = dataUrl;
    const transformedReferences = [...(shot.transformedReferences ?? defaultThemeTransformRefs())];
    transformedReferences[index] = null;
    const linked = [...(shot.themeTransformLinked ?? emptyThemeTransformArray(false))];
    if (!dataUrl) linked[index] = false;
    const shouldArchiveBake =
      isBakeStartFrame(shot) &&
      !dataUrl &&
      isBakeChecklistReferenceSlot(shot, index) &&
      shot.bakeStatus === 'ready' &&
      Boolean(shot.bakedStartFrame);
    const archiveSource = shouldArchiveBake ? { ...shot } : null;
    let mannequins = shot.mannequins;
    if (isBakeStartFrame(shot)) {
      mannequins = clearMannequinAssignmentsForSlot(migrateMannequins(shot.mannequins), index);
      if (dataUrl) {
        const draft = { ...shot, references };
        mannequins = tryAutoAssignSingleSubject(draft, mannequins);
      }
    }
    const { shotPatch: referencePatch } = splitInvalidationPatch(
      resolveReferenceSlotInvalidation(shot, index, {
        clearing: !dataUrl,
        hadImage: Boolean(shot.references[index]),
      }),
    );
    set((s) => ({
      ...applyShotPatch(s, {
        references,
        transformedReferences,
        themeTransformLinked: linked,
        ...(isBakeStartFrame(shot) ? { mannequins } : {}),
        ...referencePatch,
        ...patchThemeTransformInvalidation(shot, [index], 'source'),
      }),
    }));
    if (dataUrl) get().showToast('Reference image added');
    if (index === getBackdropSlotIndex(shot)) {
      set({ backdropSelected: false });
    }
    if (archiveSource) {
      void get().archiveBakeFromShot(archiveSource);
    }
  },

  addReferenceSlot() {
    const shot = get().getCurrentShot();
    if (!shot) return;
    set((s) => ({
      ...applyShotPatch(s, appendReferenceSlotPatch(shot)),
    }));
  },

  removeReferenceSlot(index) {
    const shot = get().getCurrentShot();
    if (!shot) return;
    const patch = removeReferenceSlotPatch(shot, index);
    if (!patch) return;
    const isBackdropSlot = index === getBackdropSlotIndex(shot);
    const shouldArchiveBake =
      isBakeStartFrame(shot) &&
      isBakeChecklistReferenceSlot(shot, index) &&
      shot.bakeStatus === 'ready' &&
      Boolean(shot.bakedStartFrame);
    const archiveSource = shouldArchiveBake ? { ...shot } : null;
    const mannequins = isBakeStartFrame(shot)
      ? reindexMannequinAssignmentsAfterSlotRemoval(migrateMannequins(shot.mannequins), index)
      : shot.mannequins;
    const { shotPatch: referencePatch } = splitInvalidationPatch(
      resolveReferenceSlotInvalidation(shot, index, {
        clearing: true,
        hadImage: Boolean(shot.references[index]),
      }),
    );
    set((s) => ({
      ...(isBackdropSlot ? { backdropSelected: false } : {}),
      ...applyShotPatch(s, {
        ...patch,
        ...(isBakeStartFrame(shot) ? { mannequins } : {}),
        ...referencePatch,
        ...patchThemeTransformInvalidation(shot, [index], 'source'),
      }),
    }));
    if (archiveSource) {
      void get().archiveBakeFromShot(archiveSource);
    }
  },

  setBackdropFraming(patch) {
    const shot = get().getCurrentShot();
    if (!shot) return;
    const aspect = (get().project.aspectRatio || '16:9') as AspectRatio;
    const current = getBackdropFraming(shot, aspect);
    if (current.locked && isBackdropTransformPatch(patch)) {
      return;
    }
    const next = { ...current, ...patch };
    const clearsCrop = isBackdropTransformPatch(patch);
    set((s) => ({
      ...applyShotPatch(s, {
        backdropFramingByAspect: {
          ...(shot.backdropFramingByAspect ?? {}),
          [aspect]: next,
        },
        ...(clearsCrop
          ? {
              backdropCropsByAspect: clearBackdropCrops(shot.backdropCropsByAspect, aspect),
              backdropCropStatusByAspect: clearBackdropCropStatus(
                shot.backdropCropStatusByAspect,
                aspect,
              ),
            }
          : {}),
      }),
    }));
  },

  async commitBackdropCrop() {
    const shot = get().getCurrentShot();
    if (!shot) return;
    const aspect = (get().project.aspectRatio || '16:9') as AspectRatio;

    try {
      const dataUrl = await renderShotBackdropCrop(get);
      const latest = get().getCurrentShot();
      if (!latest) return;
      set((s) => ({
        ...applyShotPatch(s, {
          backdropCropsByAspect: {
            ...(latest.backdropCropsByAspect ?? {}),
            [aspect]: dataUrl,
          },
          backdropCropStatusByAspect: {
            ...(latest.backdropCropStatusByAspect ?? {}),
            [aspect]: 'ready',
          },
        }),
      }));
    } catch {
      const latest = get().getCurrentShot();
      if (!latest) return;
      set((s) => ({
        ...applyShotPatch(s, {
          backdropFramingByAspect: {
            ...(latest.backdropFramingByAspect ?? {}),
            [aspect]: { ...getBackdropFraming(latest, aspect), locked: false },
          },
          backdropCropStatusByAspect: {
            ...(latest.backdropCropStatusByAspect ?? {}),
            [aspect]: 'error',
          },
        }),
      }));
      get().showToast('Failed to crop backdrop', 'error');
    }
  },

  toggleBackdropFramingLock() {
    const shot = get().getCurrentShot();
    if (!shot) return;
    const aspect = (get().project.aspectRatio || '16:9') as AspectRatio;
    const current = getBackdropFraming(shot, aspect);
    const cropStatus = shot.backdropCropStatusByAspect?.[aspect] ?? 'none';

    if (cropStatus === 'pending') return;

    if (current.locked) {
      set((s) => ({
        backdropSelected: false,
        ...applyShotPatch(s, {
          backdropFramingByAspect: {
            ...(shot.backdropFramingByAspect ?? {}),
            [aspect]: { ...current, locked: false },
          },
          backdropCropsByAspect: clearBackdropCrops(shot.backdropCropsByAspect, aspect),
          backdropCropStatusByAspect: clearBackdropCropStatus(shot.backdropCropStatusByAspect, aspect),
        }),
      }));
      return;
    }

    set((s) => ({
      backdropSelected: false,
      ...applyShotPatch(s, {
        backdropFramingByAspect: {
          ...(shot.backdropFramingByAspect ?? {}),
          [aspect]: { ...current, locked: true },
        },
        backdropCropStatusByAspect: {
          ...(shot.backdropCropStatusByAspect ?? {}),
          [aspect]: 'pending',
        },
      }),
    }));
    void get().commitBackdropCrop();
  },

  resetBackdropFraming() {
    const shot = get().getCurrentShot();
    if (!shot) return;
    const aspect = (get().project.aspectRatio || '16:9') as AspectRatio;
    set((s) => ({
      backdropSelected: false,
      ...applyShotPatch(s, {
        backdropFramingByAspect: {
          ...(shot.backdropFramingByAspect ?? {}),
          [aspect]: { ...DEFAULT_BACKDROP_FRAMING },
        },
        backdropCropsByAspect: clearBackdropCrops(shot.backdropCropsByAspect, aspect),
        backdropCropStatusByAspect: clearBackdropCropStatus(shot.backdropCropStatusByAspect, aspect),
      }),
    }));
  },

  async ensureBackdropCrop() {
    const shot = get().getCurrentShot();
    if (!shot) return;
    const aspect = (get().project.aspectRatio || '16:9') as AspectRatio;

    try {
      const dataUrl = await renderShotBackdropCrop(get);
      const latest = get().getCurrentShot();
      if (!latest) return;
      set((s) => ({
        ...applyShotPatch(s, {
          backdropCropsByAspect: {
            ...(latest.backdropCropsByAspect ?? {}),
            [aspect]: dataUrl,
          },
        }),
      }));
    } catch {
      // Generation will surface errors if crop remains unavailable.
    }
  },

  cycleReferenceRole(index) {
    const shot = get().getCurrentShot();
    if (!shot || isBakeChecklistReferenceSlot(shot, index)) return;
    const roles = ['Subject', 'Backdrop', 'Style', 'Depth', 'Canny', 'None'] as const;
    const current = normalizeReferenceRole(shot.referenceRoles[index] ?? 'None');
    const nextIdx = (roles.indexOf(current) + 1) % roles.length;
    const nextRole = roles[nextIdx];
    const referenceRoles = [...shot.referenceRoles];
    referenceRoles[index] = nextRole;
    let mannequins = shot.mannequins;
    if (isBakeStartFrame(shot) && current === 'Subject' && nextRole !== 'Subject') {
      mannequins = clearMannequinAssignmentsForSlot(migrateMannequins(shot.mannequins), index);
    }
    const layoutPatch =
      isBakeStartFrame(shot) && mannequins !== shot.mannequins
        ? splitInvalidationPatch(
            resolveWorkflowInvalidation(shot, { kind: 'character_assignment_changed' }),
          ).shotPatch
        : {};
    set((s) => ({
      ...applyShotPatch(s, {
        referenceRoles,
        ...(isBakeStartFrame(shot) && mannequins !== shot.mannequins
          ? { mannequins, ...layoutPatch }
          : {}),
      }),
    }));
  },

  setReferenceMode(mode) {
    const shot = get().getCurrentShot();
    if (!shot || normalizeReferenceMode(shot) === mode) return;
    set((s) => ({
      ...applyShotPatch(s, { referenceMode: mode }),
    }));
    get().showToast(mode === 'auto-roles' ? 'Auto-roles reference mode' : 'Manual reference mode');
  },

  setWorkflow(workflow) {
    const shot = get().getCurrentShot();
    if (!shot || normalizeWorkflow(shot) === workflow) return;
    if (!isWorkflowImplemented(workflow)) {
      get().showToast(`${getWorkflowLabel(workflow)} is not available yet`, 'error');
      return;
    }
    const enableBakeStart = workflow === 'bake-start-frame';
    const switchPatch = switchShotWorkflow(shot, workflow);
    const nextShot = { ...shot, ...switchPatch, workflow };
    const mannequins =
      (switchPatch.mannequins?.length ?? 0) > 0
        ? switchPatch.mannequins
        : ensureMannequinsOnShot(nextShot);
    const slotPatch = enableBakeStart ? ensureSubjectChecklistSlots({ ...nextShot, mannequins }) : null;
    set((s) => ({
      ...applyShotPatch(s, {
        ...switchPatch,
        workflow,
        mannequins,
        ...(slotPatch ?? {}),
      }),
      previewSubMode: enableBakeStart ? 'framing' : s.previewSubMode,
    }));
    get().showToast(getWorkflowLabel(workflow));
  },

  addMannequin() {
    const shot = get().getCurrentShot();
    if (!canAddMannequin(shot)) {
      get().showToast('Mannequin limit reached for this subject count', 'error');
      return;
    }
    const aspectRatio = (get().project.aspectRatio || '16:9') as AspectRatio;
    const created = createDefaultMannequin();
    const mannequins = [...migrateMannequins(shot?.mannequins), created];
    const finalized = shot ? finalizeMannequinsForShot(shot, mannequins) : mannequins;
    const layoutPatch = shot
      ? splitInvalidationPatch(
          resolveWorkflowInvalidation(shot, { kind: 'mannequin_layout_changed' }),
        ).shotPatch
      : {};

    if (shot) {
      const nextSubjectCount = subjectCountFromMannequins(finalized);
      if (nextSubjectCount !== shot.camera.subjectCount) {
        const synced = applySubjectCountToShot(shot, nextSubjectCount, finalized, aspectRatio);
        set((s) => ({
          camera: synced.camera,
          ...applyShotPatch(s, {
            camera: synced.camera,
            frameComposition: synced.frameComposition,
            mannequins: synced.mannequins,
            ...synced.slotPatch,
            ...layoutPatch,
          }),
          selectedMannequinIds: [created.id],
        }));
        return;
      }
    }

    set((s) => ({
      ...applyShotPatch(s, {
        mannequins: finalized,
        ...layoutPatch,
      }),
      selectedMannequinIds: [created.id],
    }));
  },

  updateMannequin(id, patch) {
    const shot = get().getCurrentShot();
    if (!shot) return;
    const normalized = { ...patch };
    if (normalized.scale !== undefined) {
      normalized.scale = clampMannequinScale(normalized.scale);
    }
    if (normalized.x !== undefined || normalized.y !== undefined || normalized.scale !== undefined) {
      const current = migrateMannequins(shot.mannequins).find((m) => m.id === id);
      if (current) {
        const merged = { ...current, ...normalized };
        const anchored = clampMannequinAnchor(
          {
            x: merged.x,
            y: merged.y,
          },
          { maxY: maxFeetAnchorY(merged) },
        );
        normalized.x = anchored.x;
        normalized.y = anchored.y;
      }
    }
    const mannequins = migrateMannequins(shot.mannequins).map((m) =>
      m.id === id ? migrateMannequin({ ...m, ...normalized }) : m,
    );
    const finalized = finalizeMannequinsForShot(shot, mannequins);
    const { shotPatch: layoutPatch } = splitInvalidationPatch(
      resolveWorkflowInvalidation(shot, { kind: 'mannequin_layout_changed' }),
    );
    set((s) => ({
      ...applyShotPatch(s, {
        mannequins: finalized,
        ...layoutPatch,
      }),
    }));
  },

  assignMannequinSubjectSlot(mannequinId, slotIndex) {
    const shot = get().getCurrentShot();
    if (!shot || !isBakeStartFrame(shot)) return;
    if (slotIndex !== null && !isValidSubjectSlotAssignment(shot, slotIndex)) {
      get().showToast('Choose a filled Subject reference slot', 'error');
      return;
    }
    const mannequins = applyMannequinSubjectSlot(
      migrateMannequins(shot.mannequins),
      mannequinId,
      slotIndex,
    );
    const { shotPatch: layoutPatch } = splitInvalidationPatch(
      resolveWorkflowInvalidation(shot, { kind: 'character_assignment_changed' }),
    );
    set((s) => ({
      ...applyShotPatch(s, {
        mannequins,
        ...layoutPatch,
      }),
    }));
  },

  removeMannequin(id) {
    const shot = get().getCurrentShot();
    if (!shot) return;
    const aspectRatio = (get().project.aspectRatio || '16:9') as AspectRatio;
    const mannequins = finalizeMannequinsForShot(
      shot,
      (shot.mannequins ?? []).filter((m) => m.id !== id),
    );
    const { shotPatch: layoutPatch } = splitInvalidationPatch(
      resolveWorkflowInvalidation(shot, { kind: 'mannequin_layout_changed' }),
    );

    const nextSubjectCount = subjectCountFromMannequins(mannequins);
    if (nextSubjectCount !== shot.camera.subjectCount) {
      const synced = applySubjectCountToShot(shot, nextSubjectCount, mannequins, aspectRatio);
      set((s) => ({
        camera: synced.camera,
        ...applyShotPatch(s, {
          camera: synced.camera,
          frameComposition: synced.frameComposition,
          mannequins: synced.mannequins,
          ...synced.slotPatch,
          ...layoutPatch,
        }),
        selectedMannequinIds: s.selectedMannequinIds.filter((sid) => sid !== id),
      }));
      return;
    }

    set((s) => ({
      ...applyShotPatch(s, {
        mannequins,
        ...layoutPatch,
      }),
      selectedMannequinIds: s.selectedMannequinIds.filter((sid) => sid !== id),
    }));
  },

  invalidateBakedFrame() {
    const shot = get().getCurrentShot();
    if (!shot || !isBakeStartFrame(shot)) return;
    const { shotPatch, toast } = splitInvalidationPatch(
      resolveWorkflowInvalidation(shot, { kind: 'manual_invalidate_bake' }),
    );
    if (!Object.keys(shotPatch).length) return;
    set((s) => ({
      ...applyShotPatch(s, shotPatch),
    }));
    if (toast) get().showToast(toast);
  },

  async archiveBakeFromShot(shot: Shot) {
    if (!shot.bakedStartFrame) return;
    try {
      const result = await ingestBakedFramesForShot(get().mediaLibrary, shot, {
        workflowOrigin: normalizeWorkflow(shot),
      });
      const snapshot = createWorkflowSnapshot(shot, {
        bakedFrameId: result.bakedFrameId,
        intermediateFrameId: result.intermediateFrameId,
      });
      set((s) => ({
        mediaLibrary: result.library,
        shotWorkflowSnapshots: [...s.shotWorkflowSnapshots, snapshot],
        ...applyShotPatch(s, result.shotPatch),
      }));
    } catch {
      get().showToast('Could not save bake to Assets', 'error');
    }
  },

  async saveBakedFrameToAssets() {
    const shot = get().getCurrentShot();
    if (!shot?.bakedStartFrame || !isBakeStartFrame(shot)) {
      get().showToast('No baked frame to save', 'error');
      return;
    }
    await get().archiveBakeFromShot(shot);
    get().showToast('Saved to Assets');
  },

  async saveBackdropPlateToLibrary(setupId, backdropId) {
    const { setups, mediaLibrary } = get();
    const setup = setups.find((s) => s.id === setupId);
    const backdrop = setup?.backdrops.find((b) => b.id === backdropId);
    if (!backdrop?.url) {
      get().showToast('No backdrop image to save', 'error');
      return;
    }
    try {
      const result = await createMediaAssetFromUrl(mediaLibrary, backdrop.url, {
        type: 'backdrop-plate',
        workflowOrigin: 'upload',
        metadata: { usedInShots: [] },
      });
      if (result.library === mediaLibrary) {
        get().showToast('Already in library');
        return;
      }
      set({ mediaLibrary: result.library });
      get().showToast('Backdrop plate saved to library');
    } catch {
      get().showToast('Could not save backdrop plate to library', 'error');
    }
  },

  loadBakedFrameFromAsset(assetId: string) {
    const shot = get().getCurrentShot();
    if (!shot || !isBakeStartFrame(shot)) return;
    const asset = getMediaAsset(get().mediaLibrary, assetId);
    if (!asset || (asset.type !== 'baked-frame' && asset.type !== 'intermediate-frame')) {
      get().showToast('Asset not found', 'error');
      return;
    }
    const library = linkAssetToShot(get().mediaLibrary, assetId, shot.id);
    const linkedKey = asset.type === 'intermediate-frame' ? 'intermediate' : 'bakedFrame';
    set((s) => ({
      mediaLibrary: library,
      ...applyShotPatch(s, {
        bakedStartFrame: asset.type === 'baked-frame' ? asset.url : shot.bakedStartFrame,
        bakedIntermediateFrame:
          asset.type === 'intermediate-frame' ? asset.url : shot.bakedIntermediateFrame,
        bakeStatus: 'ready',
        linkedAssetIds: {
          ...(shot.linkedAssetIds ?? {}),
          [linkedKey]: assetId,
        },
      }),
      previewSubMode: 'model',
      frameView: 'preview',
    }));
    get().showToast('Loaded from Assets');
  },

  async bakeStartFrame() {
    const state = get();
    const { project, ai, currentSetupId, currentCoverageShotId } = state;
    const shot = getResolvedCurrentShot(state.setups, currentSetupId, currentCoverageShotId);
    if (!shot || !isBakeStartFrame(shot)) return;

    const steps = getWorkflowReferenceSteps(shot, shot.lighting, project.aspectRatio as AspectRatio);
    const incomplete = steps.find((s) => !s.done && s.id !== 'bake');
    if (incomplete) {
      get().showToast(`Complete step: ${incomplete.label}`, 'error');
      return;
    }

    const xaiKey = getProviderApiKey('xai', false, ai);
    const xaiModelId = getEffectivePreviewModelId(ai) ?? DEFAULT_XAI_BAKE_IMAGE_MODEL;
    if (!isProviderConnected('xai', false, ai)) {
      get().showToast('Configure xAI API key in Settings for baking', 'error');
      return;
    }
    if (!isPreviewFrameSupported('xai', false)) {
      get().showToast('xAI image provider is required for baking', 'error');
      return;
    }

    const principalCount = (shot.mannequins ?? []).filter((m) => (m.opacity ?? 1) >= 0.5).length;

    set({
      isBakingStartFrame: true,
      bakeProgress: 'Rendering bake composite locally',
      bakeProgressDetail: `Backdrop + ${principalCount} mannequin silhouette(s) at ${project.resolution}`,
      ...applyShotPatch(state, { bakeStatus: 'baking' }),
    });

    try {
      const bakeOutput = await renderBakeFrames({
        shot,
        aspectRatio: project.aspectRatio as AspectRatio,
        resolution: project.resolution,
        mannequins: shot.mannequins ?? [],
      });
      const { imageUrl, compositeUrl: fallbackCompositeUrl } = await bakeBlobsToDataUrls(bakeOutput);

      let compositeUrl = fallbackCompositeUrl;
      if (POSEBLOCK_BAKE_EXPORT_ENABLED) {
        set({
          bakeProgress: 'Capturing 3D mannequin composite',
          bakeProgressDetail: 'Using PoseBlock overlay for bake input',
        });
        const poseBlockComposite = await tryExportPoseBlockComposite();
        if (!poseBlockComposite) {
          throw new Error(
            '3D compositor export is unavailable. Open the Framing view and wait for the PoseBlock scene to load, then try baking again.',
          );
        }
        compositeUrl = poseBlockComposite;
      }

      set({
        bakeProgress: 'Encoding composite for API upload',
        bakeProgressDetail: 'Converting backdrop and mannequin mask to data URLs',
      });

      const identityPlan = buildIdentityPassPlan(shot, imageUrl, shot.lighting);
      let identityPasses: BakeStartFrameRequest['identityPasses'];

      const promptAdditions = shot.promptAdditions;
      const pass1Prompt = resolveBakeStartFramePass1Prompt(shot);

      if (identityPlan && xaiModelId) {
        identityPasses = identityPlan.passes.map((spec) => ({
          providerId: 'xai',
          isCustom: false,
          apiKey: xaiKey,
          modelId: xaiModelId,
          prompt: appendBakePromptAdditions(spec.prompt, promptAdditions),
          aspectRatio: project.aspectRatio,
          refs: spec.refs,
          cinematographyRefs: false,
        }));
      }

      const identityPassCount = identityPasses?.length ?? 0;
      set({
        bakeProgress: 'Starting server bake pipeline',
        bakeProgressDetail:
          identityPassCount > 0
            ? `Pass 1 (silhouette edit) + ${identityPassCount} identity pass(es) · ${xaiModelId}`
            : `Pass 1 only (no character assignment) · ${xaiModelId}`,
      });

      const result = await fetchWithGenerationProgress<{
        status: string;
        imageUrl?: string;
        intermediateImageUrl?: string;
        error?: string;
      }>(
        '/api/bake-start-frame',
        {
          inpaint: {
            providerId: 'xai',
            apiKey: xaiKey,
            modelId: xaiModelId,
            imageUrl: compositeUrl,
            prompt: pass1Prompt,
            aspectRatio: project.aspectRatio,
          },
          identityPasses,
        },
        (update) => set({ bakeProgress: update.message, bakeProgressDetail: update.detail ?? '' }),
      );

      if (!result.imageUrl) {
        throw new Error('Bake finished without an image URL');
      }

      set({
        bakeProgress: 'Saving baked frame locally',
        bakeProgressDetail: 'Inlining image for preview and project save',
      });

      const [bakedStartFrame, bakedIntermediateFrame] = await Promise.all([
        persistBakedImageUrl(result.imageUrl),
        result.intermediateImageUrl
          ? persistBakedImageUrl(result.intermediateImageUrl)
          : Promise.resolve(null),
      ]);

      set((s) => ({
        ...applyShotPatch(s, {
          bakedStartFrame,
          bakedIntermediateFrame,
          bakeStatus: 'ready',
        }),
        isBakingStartFrame: false,
        bakeProgress: '',
        bakeProgressDetail: '',
        previewSubMode: 'model',
        frameView: 'preview',
      }));
      get().showToast('Start frame baked');
      const bakedShot = get().getCurrentShot();
      if (bakedShot) {
        void get().archiveBakeFromShot({
          ...bakedShot,
          bakedStartFrame,
          bakedIntermediateFrame,
          bakeStatus: 'ready',
        });
      }
    } catch (e) {
      set((s) => ({
        ...applyShotPatch(s, { bakeStatus: 'error' }),
        isBakingStartFrame: false,
        bakeProgress: '',
        bakeProgressDetail: '',
      }));
      get().showToast(e instanceof Error ? e.message : 'Bake failed', 'error');
    }
  },

  async generatePreviewFrame() {
    await get().ensureBackdropCrop();

    const state = get();
    const { project, ai, currentSetupId, currentCoverageShotId } = state;
    const shot = getResolvedCurrentShot(state.setups, currentSetupId, currentCoverageShotId);
    if (!shot) return;

    const imageProviderId = ai.defaultImageProvider;
    const isCustom = isCustomProvider(imageProviderId, ai);
    if (!isProviderConnected(imageProviderId, isCustom, ai)) {
      get().showToast('Configure your image provider API key in Settings first', 'error');
      return;
    }
    if (!isPreviewFrameSupported(imageProviderId, isCustom)) {
      get().showToast('Quick preview requires xAI, OpenAI, or Replicate. Change your image provider in Settings.', 'error');
      return;
    }
    if (!hasVerifiedImageModels(imageProviderId, isCustom, ai)) {
      get().showToast('Test your image provider connection in Settings to load image models first', 'error');
      return;
    }

    const payload = {
      project,
      camera: shot.camera,
      lighting: shot.lighting,
      motion: shot.motion,
      shot,
    };
    const { prompt, refs: rawRefs } = buildPreviewFramePayload(payload, imageProviderId);
    const refs = await resolveRefsForApi(rawRefs);
    const apiKey = getProviderApiKey(imageProviderId, isCustom, ai);
    const customBaseUrl = isCustom
      ? ai.customProviders.find((p) => p.id === imageProviderId)?.baseUrl
      : undefined;
    const modelId = getEffectivePreviewModelId(ai);
    if (!modelId) {
      get().showToast('No image model available — re-test your image provider in Settings', 'error');
      return;
    }
    const providerName = getImageProviderName(ai);
    const fingerprint = previewFramingFingerprint(shot.camera, project.aspectRatio);

    set({
      isPreviewFrameGenerating: true,
      previewFrameProgress: 'Preparing preview frame request',
      previewFrameProgressDetail: `${providerName} · ${modelId} · ${refs.length} reference(s) · ${project.aspectRatio}`,
    });

    try {
      const result = await fetchWithGenerationProgress<{ status: string; imageUrl?: string; error?: string }>(
        '/api/preview-frame',
        {
          providerId: imageProviderId,
          isCustom,
          apiKey,
          customBaseUrl,
          modelId,
          prompt,
          aspectRatio: project.aspectRatio,
          refs,
          cinematographyRefs: isCinematographyRefs(shot),
        },
        (update) =>
          set({ previewFrameProgress: update.message, previewFrameProgressDetail: update.detail ?? '' }),
      );

      set((s) => ({
        ...applyShotPatch(s, {
          previewFrameUrl: result.imageUrl ?? null,
          previewFrameFingerprint: fingerprint,
        }),
        isPreviewFrameGenerating: false,
        previewSubMode: 'model',
        previewFrameProgress: '',
        previewFrameProgressDetail: '',
      }));
      get().showToast('Preview frame generated');
    } catch (e) {
      set({
        isPreviewFrameGenerating: false,
        previewFrameProgress: '',
        previewFrameProgressDetail: '',
      });
      get().showToast(e instanceof Error ? e.message : 'Preview frame failed', 'error');
    }
  },

  async applyThemeTransformSlot(index) {
    if (index < 0 || index >= THEME_TRANSFORM_SLOT_COUNT) return;

    const state = get();
    const { project, ai, currentSetupId, currentCoverageShotId } = state;
    const shot = getResolvedCurrentShot(state.setups, currentSetupId, currentCoverageShotId);
    if (!shot) return;

    const lighting = shot.lighting;
    if (!needsThemeTransformer(lighting)) {
      get().showToast('Enable Color Palette or a Look Library preset first', 'error');
      return;
    }

    const sourceUrl = shot.references[index];
    if (!sourceUrl) {
      get().showToast('Add a reference image to this slot first', 'error');
      return;
    }

    const status = shot.themeTransformStatus?.[index] ?? 'idle';
    if (status === 'applying') return;

    const imageProviderId = ai.defaultImageProvider;
    const isCustom = isCustomProvider(imageProviderId, ai);
    if (!isProviderConnected(imageProviderId, isCustom, ai)) {
      get().showToast('Configure your image provider API key in Settings first', 'error');
      return;
    }
    if (!isPreviewFrameSupported(imageProviderId, isCustom)) {
      get().showToast('Theme Transformer requires xAI, OpenAI, or Replicate as image provider', 'error');
      return;
    }
    if (!hasVerifiedImageModels(imageProviderId, isCustom, ai)) {
      get().showToast('Test your image provider connection in Settings to load image models first', 'error');
      return;
    }

    const linked = [...(shot.themeTransformLinked ?? emptyThemeTransformArray(false))];
    linked[index] = true;
    const themeTransformStatus = [...(shot.themeTransformStatus ?? defaultThemeTransformStatus())];
    themeTransformStatus[index] = 'applying';
    const themeTransformError = [...(shot.themeTransformError ?? emptyThemeTransformArray(null))];
    themeTransformError[index] = null;

    set((s) => ({
      ...applyShotPatch(s, {
        themeTransformLinked: linked,
        themeTransformStatus,
        themeTransformError,
      }),
    }));

    const rawRefs = [{ role: normalizeReferenceRole(shot.referenceRoles[index] ?? 'None'), url: sourceUrl }];
    const refs = await resolveRefsForApi(rawRefs);
    const resolvedSource = refs[0]?.url;
    if (!resolvedSource) {
      set((s) => ({
        ...applyShotPatch(s, {
          themeTransformStatus: (() => {
            const next = [...(shot.themeTransformStatus ?? defaultThemeTransformStatus())];
            next[index] = 'error';
            return next;
          })(),
          themeTransformError: (() => {
            const next = [...(shot.themeTransformError ?? emptyThemeTransformArray(null))];
            next[index] = 'Could not resolve reference image URL';
            return next;
          })(),
        }),
      }));
      get().showToast('Could not resolve reference image URL', 'error');
      return;
    }

    const apiKey = getProviderApiKey(imageProviderId, isCustom, ai);
    const customBaseUrl = isCustom
      ? ai.customProviders.find((p) => p.id === imageProviderId)?.baseUrl
      : undefined;
    const modelId = getEffectivePreviewModelId(ai);
    if (!modelId) {
      const nextStatus = [...themeTransformStatus];
      nextStatus[index] = 'error';
      const nextErrors = [...themeTransformError];
      nextErrors[index] = 'No image model available';
      set((s) => ({
        ...applyShotPatch(s, {
          themeTransformStatus: nextStatus,
          themeTransformError: nextErrors,
        }),
      }));
      get().showToast('No image model available — re-test your image provider in Settings', 'error');
      return;
    }

    try {
      const res = await fetch('/api/transform-references', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: imageProviderId,
          isCustom,
          apiKey,
          customBaseUrl,
          modelId,
          aspectRatio: project.aspectRatio,
          lighting,
          slot: {
            index,
            role: normalizeReferenceRole(shot.referenceRoles[index] ?? 'None'),
            sourceUrl: resolvedSource,
          },
        }),
      });

      const result = await res.json();
      if (!res.ok || result.status === 'error') {
        throw new Error(result.error || 'Theme transform failed');
      }

      const fingerprint = buildThemeTransformFingerprint(sourceUrl, lighting);
      const transformedReferences = [...(shot.transformedReferences ?? defaultThemeTransformRefs())];
      transformedReferences[index] = result.imageUrl ?? null;
      const nextStatus = [...(shot.themeTransformStatus ?? defaultThemeTransformStatus())];
      nextStatus[index] = 'ready';
      const fingerprints = [...(shot.themeTransformFingerprint ?? emptyThemeTransformArray(null))];
      fingerprints[index] = fingerprint;

      const isBackdropSlot = index === getBackdropSlotIndex(shot);
      set((s) => ({
        ...applyShotPatch(s, {
          transformedReferences,
          themeTransformStatus: nextStatus,
          themeTransformFingerprint: fingerprints,
          themeTransformError: (() => {
            const next = [...(shot.themeTransformError ?? emptyThemeTransformArray(null))];
            next[index] = null;
            return next;
          })(),
          ...(isBackdropSlot
            ? {
                backdropCropsByAspect: clearBackdropCrops(shot.backdropCropsByAspect),
                backdropCropStatusByAspect: clearBackdropCropStatus(shot.backdropCropStatusByAspect),
              }
            : {}),
        }),
      }));
      if (isBackdropSlot) {
        const aspect = (get().project.aspectRatio || '16:9') as AspectRatio;
        const latest = get().getCurrentShot();
        if (latest && getBackdropFraming(latest, aspect).locked) {
          set((s) => ({
            ...applyShotPatch(s, {
              backdropCropStatusByAspect: {
                ...(latest.backdropCropStatusByAspect ?? {}),
                [aspect]: 'pending',
              },
            }),
          }));
          void get().commitBackdropCrop();
        }
      }
      get().showToast('Reference color grade applied');
    } catch (e) {
      const nextStatus = [...(shot.themeTransformStatus ?? defaultThemeTransformStatus())];
      nextStatus[index] = 'error';
      const nextErrors = [...(shot.themeTransformError ?? emptyThemeTransformArray(null))];
      nextErrors[index] = e instanceof Error ? e.message : 'Theme transform failed';
      set((s) => ({
        ...applyShotPatch(s, {
          themeTransformStatus: nextStatus,
          themeTransformError: nextErrors,
        }),
      }));
      get().showToast(nextErrors[index] ?? 'Theme transform failed', 'error');
    }
  },

  async generate() {
    await get().ensureBackdropCrop();

    const state = get();
    const { project, ai, currentSetupId, currentCoverageShotId } = state;
    const shot = getResolvedCurrentShot(state.setups, currentSetupId, currentCoverageShotId);
    if (!shot) return;

    const combinedPrompt = buildShotPrompt(shot.sceneSetup, shot.shotActivity);
    if (!combinedPrompt.trim()) {
      get().showToast('Please enter scene setup or shot activity first', 'error');
      return;
    }

    if (needsThemeTransformer(shot.lighting) && hasStaleLinkedTransforms(shot, shot.lighting)) {
      get().showToast(
        'Theme Transformer: drag from the outlet to linked reference slots to refresh color grade',
        'error',
      );
      return;
    }

    const videoProviderId = ai.defaultVideoProvider;
    const isCustom = isCustomProvider(videoProviderId, ai);
    if (!isProviderConnected(videoProviderId, isCustom, ai)) {
      get().showToast('Configure your video provider API key in Settings first', 'error');
      return;
    }
    if (!isGenerationSupported(videoProviderId, isCustom)) {
      const name = isCustom
        ? ai.customProviders.find((p) => p.id === videoProviderId)?.name ?? 'This provider'
        : getBuiltInProvider(videoProviderId)?.name ?? 'This provider';
      get().showToast(`${name} does not support video generation yet. Pick another video provider in Settings.`, 'error');
      return;
    }
    if (!isCustom && !hasVerifiedVideoModels(videoProviderId, isCustom, ai)) {
      get().showToast('Test your video provider connection in Settings to load video models first', 'error');
      return;
    }

    const modelId = getEffectiveModelId(ai);
    if (
      restrictsReferenceSlotsToFirst(videoProviderId, modelId) &&
      !shot.references[0] &&
      !shouldUseBakedStartFrameForVideo(shot)
    ) {
      get().showToast('grok-imagine-video-1.5 requires a starting image in Image 1', 'error');
      return;
    }

    const stack = buildModelPayloadStack({
      project,
      camera: shot.camera,
      lighting: shot.lighting,
      motion: shot.motion,
      sceneSetup: shot.sceneSetup,
      shotActivity: shot.shotActivity,
      shot,
      ai,
    });
    const rawRefs = stack.blocks.find((b) => b.id === 'references')?.refs ?? [];
    const refs = await resolveRefsForApi(rawRefs);
    const apiKey = getProviderApiKey(videoProviderId, isCustom, ai);
    const customBaseUrl = isCustom
      ? ai.customProviders.find((p) => p.id === videoProviderId)?.baseUrl
      : undefined;
    if (!isCustom && !modelId) {
      get().showToast('No video model available — re-test your video provider in Settings', 'error');
      return;
    }
    const providerName = getVideoProviderName(ai);

    set({
      isGenerating: true,
      showPreviewSuccess: false,
      progressText: 'Preparing video generation request',
      progressDetail: `${providerName} · ${modelId ?? 'default model'} · ${refs.length} ref(s) · ${project.duration}s · ${project.aspectRatio}`,
    });

    try {
      const result = await fetchWithGenerationProgress<{
        status: string;
        videoUrl?: string;
        posterUrl?: string;
        providerJobId?: string;
        error?: string;
      }>(
        '/api/generate',
        {
          providerId: videoProviderId,
          isCustom,
          apiKey,
          customBaseUrl,
          modelId,
          prompt: stack.combinedPrompt,
          duration: project.duration,
          fps: project.fps,
          resolution: project.resolution,
          aspectRatio: project.aspectRatio,
          refs,
          cinematographyRefs: isCinematographyRefs(shot),
        },
        (update) => set({ progressText: update.message, progressDetail: update.detail ?? '' }),
      );

      const videoUrl = result.videoUrl ?? null;
      if (!videoUrl) {
        throw new Error('Generation completed without a video URL');
      }

      const videoPatch = appendGeneratedVideo(shot, {
        url: videoUrl,
        posterUrl: result.posterUrl ?? shot.thumbnail,
        providerJobId: result.providerJobId,
      });
      const newVideo = videoPatch.generatedVideos?.[videoPatch.activeVideoIndex ?? 0];

      set((s) => ({
        ...applyShotPatch(s, videoPatch),
        isGenerating: false,
        frameView: 'generated',
        showPreviewSuccess: true,
        previewSuccessProvider: `${getVideoProviderName(ai)}${result.providerJobId ? ` · Job ${result.providerJobId}` : ''}`,
        previewSuccessPrompt: combinedPrompt,
        progressText: '',
        progressDetail: '',
      }));
      get().showToast('Video generation complete!');

      const linkArchivedAsset = (library: MediaAsset[], assetId: string) => {
        if (!newVideo) {
          set({ mediaLibrary: library });
          return;
        }
        set((state) => {
          const currentShotState = state.shots.find((entry) => entry.id === shot.id) ?? shot;
          return {
            mediaLibrary: library,
            ...applyShotPatch(state, linkGeneratedVideoMediaAsset(currentShotState, newVideo.id, assetId)),
          };
        });
      };

      // Archive the video to the media library immediately while the provider
      // URL is still live. Provider URLs (e.g. xAI) expire after ~1 hour.
      archiveGeneratedVideoToLibrary(get().mediaLibrary, videoUrl, {
        shotId: shot.id,
        workflowOrigin: shot.workflow ?? 'generated',
        providerJobId: result.providerJobId,
      }).then(({ library, assetId }) => {
        if (assetId) linkArchivedAsset(library, assetId);
      }).catch(() => {
        // Fallback: keep a shot-linked video record in the library even if
        // fetching/transcoding the provider URL fails.
        set((state) => {
          const existingAsset = state.mediaLibrary.find((asset) => asset.url === videoUrl && asset.type === 'video');
          if (existingAsset) {
            linkArchivedAsset(linkAssetToShot(state.mediaLibrary, existingAsset.id, shot.id), existingAsset.id);
            return {};
          }
          const fallbackAssetId = crypto.randomUUID();
          const fallbackLibrary: MediaAsset[] = [
            ...state.mediaLibrary,
            {
              id: fallbackAssetId,
              type: 'video',
              url: videoUrl,
              createdAt: Date.now(),
              workflowOrigin: shot.workflow ?? 'generated',
              metadata: {
                usedInShots: [shot.id],
                provider: result.providerJobId ? getVideoProviderName(ai) : undefined,
              },
            },
          ];
          linkArchivedAsset(fallbackLibrary, fallbackAssetId);
          return {};
        });
      });

      setTimeout(() => set({ showPreviewSuccess: false }), 5000);
    } catch (e) {
      set({ isGenerating: false, progressText: '', progressDetail: '' });
      get().showToast(e instanceof Error ? e.message : 'Generation failed', 'error');
    }
  },

  async saveProject() {
    const project = buildStudioProject(get());
    if (isNativeFilePickerSupported()) {
      const saved = await saveProjectFileToDisk(project);
      if (saved) {
        get().syncProjectFileUi();
        get().showToast('Project saved to file');
        return;
      }
    }
    downloadProject(project);
    get().showToast('Project downloaded');
  },

  async saveProjectQuick() {
    if (isNativeFilePickerSupported() && hasOpenProjectLocation()) {
      const payload = projectPersistencePayload(get());
      const ok = await saveProjectNow(payload.project, payload.globalMediaLibrary);
      get().syncProjectFileUi();
      get().showToast(
        ok ? 'Project saved' : 'Could not save — check folder permission',
        ok ? 'success' : 'error',
      );
      return;
    }
    if (isDirectoryAccessSupported()) {
      await get().saveProjectFolderAs();
      return;
    }
    await get().saveProject();
  },

  async openProjectQuick() {
    if (isDirectoryAccessSupported()) {
      await get().openProjectFolder();
      return;
    }
    await get().loadProject();
  },

  async loadProject() {
    if (isNativeFilePickerSupported()) {
      try {
        const data = await openProjectFileFromDisk();
        if (!data) return;
        const applied = applyStudioProject(data);
        set({
          ...applied,
          ...projectFileUiState(),
        });
        get().showToast('Project file opened');
        return;
      } catch {
        get().showToast('Could not open project file', 'error');
        return;
      }
    }

    const result = await pickAndLoadProject();
    if (result.status === 'cancelled') return;
    if (result.status === 'error') {
      get().showToast(result.message, 'error');
      return;
    }
    const applied = applyStudioProject(result.data);
    set({
      ...applied,
      projectLocationLabel: null,
      projectLocationKind: null,
      projectSaveState: 'dirty',
    });
    get().showToast('Project loaded — save to a folder to keep it on disk');
  },

  async openProjectFolder() {
    if (!isDirectoryAccessSupported()) {
      get().showToast('This browser cannot open project folders — use Open JSON file instead', 'error');
      return;
    }
    try {
      const data = await openProjectFolderFromDisk();
      if (!data) {
        get().showToast('No project.json found in that folder', 'error');
        return;
      }
      const applied = applyStudioProject(data.project, data.globalMediaLibrary);
      set({
        ...applied,
        ...projectFileUiState(),
      });
      get().showToast(`Opened ${getProjectLocationLabel() ?? 'project folder'}`);
    } catch {
      get().showToast('Could not open project folder', 'error');
    }
  },

  async saveProjectFolderAs() {
    if (!isDirectoryAccessSupported()) {
      await get().saveProject();
      return;
    }
    try {
      const { project, globalMediaLibrary } = projectPersistencePayload(get());
      const saved = await saveProjectFolderToDisk(project, globalMediaLibrary);
      if (!saved) return;
      get().syncProjectFileUi();
      get().showToast(`Saved to ${getProjectLocationLabel() ?? 'folder'}`);
    } catch {
      get().showToast('Could not save project folder', 'error');
    }
  },

  newProject() {
    clearProjectLocationSession();
    void clearServerProjectStorage();
    set({
      ...getEmptyDefaults(),
      showPreviewSuccess: false,
      projectLocationLabel: null,
      projectLocationKind: null,
      projectSaveState: 'none',
    });
    clearStudioDraft();
    get().showToast('New project — choose a project folder to save on disk');
  },

  resetToDemo() {
    clearProjectLocationSession();
    void clearServerProjectStorage();
    const demo = getStockDefaults();
    set({
      ...demo,
      showPreviewSuccess: false,
      projectLocationLabel: null,
      projectLocationKind: null,
      projectSaveState: 'none',
    });
    clearStudioDraft();
    get().showToast('Demo project restored');
  },

  exportVideo() {
    get().showToast('Export coming soon — generate a video first', 'error');
  },

  openSettings() {
    set({ settingsOpen: true });
  },

  closeSettings() {
    set({ settingsOpen: false });
  },

  openAppsLauncher() {
    set({ appsLauncherOpen: true });
  },

  closeAppsLauncher() {
    set({ appsLauncherOpen: false });
  },

  setDefaultVideoProvider(id) {
    const current = get().ai;
    if (!isCustomProvider(id, current) && !isBuiltInProviderEnabled(id)) {
      get().showToast('That provider is not available yet', 'error');
      return;
    }
    const isCustom = isCustomProvider(id, current);
    const defaultVideoModelId = resolveModelSelectionForProvider(id, isCustom, current);
    const ai = { ...current, defaultVideoProvider: id, defaultVideoModelId };
    saveAIState(ai);
    set({ ai });
    get().showToast('Video provider updated');
  },

  setDefaultVideoModel(modelId) {
    const ai = { ...get().ai, defaultVideoModelId: modelId };
    saveAIState(ai);
    set({ ai });
  },

  setDefaultImageProvider(id) {
    const current = get().ai;
    if (!isCustomProvider(id, current) && !isBuiltInProviderEnabled(id)) {
      get().showToast('That provider is not available yet', 'error');
      return;
    }
    const isCustom = isCustomProvider(id, current);
    const defaultImageModelId = resolveImageModelSelectionForProvider(id, isCustom, current);
    const ai = { ...current, defaultImageProvider: id, defaultImageModelId };
    saveAIState(ai);
    set({ ai });
    get().showToast('Image provider updated');
  },

  setDefaultImageModel(modelId) {
    const ai = { ...get().ai, defaultImageModelId: modelId };
    saveAIState(ai);
    set({ ai });
  },

  openProviderEdit(id, isCustom) {
    if (!isCustom && !isBuiltInProviderEnabled(id)) return;
    set({ providerEdit: { id, isCustom } });
  },

  closeProviderEdit() {
    set({ providerEdit: null });
  },

  saveProviderEdit(apiKey, customFields) {
    const edit = get().providerEdit;
    if (!edit || !apiKey.trim()) {
      get().showToast('API key is required', 'error');
      return;
    }

    const ai = { ...get().ai };
    if (edit.isCustom) {
      ai.customProviders = ai.customProviders.map((p) =>
        p.id === edit.id
          ? {
              ...p,
              apiKey,
              connected: true,
              ...(customFields?.name ? { name: customFields.name } : {}),
              ...(customFields?.desc ? { desc: customFields.desc } : {}),
              ...(customFields?.baseUrl ? { baseUrl: customFields.baseUrl } : {}),
            }
          : p,
      );
    } else {
      const existing = ai.configured[edit.id];
      ai.configured[edit.id] = {
        ...existing,
        apiKey,
        connected: true,
      };
    }

    saveAIState(ai);
    set({ ai, providerEdit: null });
    get().showToast('Provider settings saved');
  },

  applyProviderTestResult(id, isCustom, result, apiKey) {
    const ai = applyProviderTestResultToState(get().ai, id, isCustom, result, apiKey);
    saveAIState(ai);
    set({ ai });
  },

  deleteCustomProvider(id) {
    const ai = { ...get().ai };
    ai.customProviders = ai.customProviders.filter((p) => p.id !== id);
    const fallback = getDefaultEnabledProviderId();
    if (ai.defaultVideoProvider === id) {
      ai.defaultVideoProvider = fallback;
      ai.defaultVideoModelId = resolveModelSelectionForProvider(fallback, false, ai);
    }
    if (ai.defaultImageProvider === id) {
      ai.defaultImageProvider = fallback;
      ai.defaultImageModelId = resolveImageModelSelectionForProvider(fallback, false, ai);
    }
    saveAIState(ai);
    set({ ai, providerEdit: null });
    get().showToast('Custom provider removed');
  },

  addCustomProvider(name, baseUrl) {
    const ai = { ...get().ai };
    ai.customProviders = [...ai.customProviders, createCustomProvider(name, baseUrl)];
    saveAIState(ai);
    set({ ai });
    get().showToast('Custom provider added. Click Configure to add API key.');
  },

  setMobileDrawerOpen(open) {
    set({ mobileDrawerOpen: open });
  },

  // ── Character Manager actions ────────────────────────────────────────────

  createCharacter(name, firstSheetUrl) {
    const now = Date.now();
    const id = Math.random().toString(36).slice(2, 12);
    const sheet: CharacterSheet = {
      id: Math.random().toString(36).slice(2, 12),
      url: firstSheetUrl,
      dataType: 'character-sheet',
      createdAt: now,
    };
    const character: Character = {
      id,
      name,
      sheets: [sheet],
      propNames: [],
      wardrobeItems: [],
      storedPoses: [],
      createdAt: now,
    };
    set((s) => ({ characters: [...s.characters, character] }));
    return character;
  },

  renameCharacter(id, name) {
    set((s) => ({
      characters: s.characters.map((c) => (c.id === id ? { ...c, name } : c)),
    }));
  },

  addCharacterSheet(characterId, url, label) {
    const now = Date.now();
    const sheet: CharacterSheet = {
      id: Math.random().toString(36).slice(2, 12),
      url,
      label,
      dataType: 'character-sheet',
      createdAt: now,
    };
    set((s) => ({
      characters: s.characters.map((c) =>
        c.id === characterId ? { ...c, sheets: [...c.sheets, sheet] } : c,
      ),
    }));
  },

  removeCharacterSheet(characterId, sheetId) {
    set((s) => ({
      characters: s.characters.map((c) => {
        if (c.id !== characterId) return c;
        if (c.sheets.length <= 1) return c; // guard: keep at least one sheet
        return { ...c, sheets: c.sheets.filter((sh) => sh.id !== sheetId) };
      }),
    }));
  },

  updateCharacterSheetLabel(characterId, sheetId, label) {
    const nextLabel = label?.trim();
    set((s) => ({
      characters: s.characters.map((c) => {
        if (c.id !== characterId) return c;
        return {
          ...c,
          sheets: c.sheets.map((sheet) =>
            sheet.id === sheetId
              ? {
                  ...sheet,
                  label: nextLabel ? nextLabel : undefined,
                }
              : sheet,
          ),
        };
      }),
    }));
  },

  updateCharacterLists(id, patch) {
    set((s) => ({
      characters: s.characters.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  },

  deleteCharacter(id) {
    set((s) => ({
      characters: s.characters.filter((c) => c.id !== id),
      setups: s.setups.map((setup) => {
        if (!setup.characterSlots?.includes(id)) return setup;
        const characterSlots = setup.characterSlots.map((slotId) => (slotId === id ? null : slotId));
        const characterSheetSlots = (setup.characterSheetSlots ?? []).map((sheetId, i) =>
          setup.characterSlots?.[i] === id ? null : sheetId,
        );
        const subjectSlotSourceModes = [...(setup.subjectSlotSourceModes ?? [])];
        for (let i = 0; i < characterSlots.length; i++) {
          if (!characterSlots[i] && subjectSlotSourceModes[i] === 'typed') {
            subjectSlotSourceModes[i] = null;
          }
        }
        return { ...setup, characterSlots, characterSheetSlots, subjectSlotSourceModes };
      }),
    }));
  },

  assignCharacterToSlot(setupId, slotIndex, characterId, sheetId) {
    set((s) => ({
      setups: s.setups.map((setup) => {
        if (setup.id !== setupId) return setup;
        const slots = [...(setup.characterSlots ?? [])];
        const sheetSlots = [...(setup.characterSheetSlots ?? [])];
        const sourceModes = [...(setup.subjectSlotSourceModes ?? [])];
        while (slots.length <= slotIndex) slots.push(null);
        while (sheetSlots.length <= slotIndex) sheetSlots.push(null);
        while (sourceModes.length <= slotIndex) sourceModes.push(null);
        slots[slotIndex] = characterId;

        const character = characterId ? s.characters.find((c) => c.id === characterId) : null;
        let resolvedSheetId: string | null = null;
        let sheetUrl: string | null = null;
        if (character) {
          const sheet =
            sheetId != null
              ? character.sheets.find((sh) => sh.id === sheetId)
              : character.sheets.find((sh) => sh.id === sheetSlots[slotIndex]) ??
                character.sheets[0];
          resolvedSheetId = sheet?.id ?? null;
          sheetUrl = sheet?.url ?? null;
          sheetSlots[slotIndex] = resolvedSheetId;
          sourceModes[slotIndex] = 'typed';
        } else {
          sheetSlots[slotIndex] = null;
          if (sourceModes[slotIndex] === 'typed') {
            sourceModes[slotIndex] = null;
          }
        }

        let refs = setup.references ?? [];
        if (character) {
          refs = [...refs];
          const roles = setup.referenceRoles ?? [];
          let subjectOrdinal = -1;
          for (let i = 0; i < refs.length; i++) {
            if ((roles[i] ?? 'None') === 'Subject') {
              subjectOrdinal++;
              if (subjectOrdinal === slotIndex) {
                refs[i] = sheetUrl;
                break;
              }
            }
          }
        }
        return {
          ...setup,
          characterSlots: slots,
          characterSheetSlots: sheetSlots,
          subjectSlotSourceModes: sourceModes,
          references: refs,
        };
      }),
    }));
  },

  setSubjectSlotSourceMode(setupId, slotIndex, mode) {
    set((s) => ({
      setups: s.setups.map((setup) => {
        if (setup.id !== setupId) return setup;
        const sourceModes = [...(setup.subjectSlotSourceModes ?? [])];
        while (sourceModes.length <= slotIndex) sourceModes.push(null);
        sourceModes[slotIndex] = mode;
        return {
          ...setup,
          subjectSlotSourceModes: sourceModes,
        };
      }),
    }));
  },

  // ── Location Manager actions ─────────────────────────────────────────────

  createLocation(name, firstPlateUrl) {
    const now = Date.now();
    const id = Math.random().toString(36).slice(2, 12);
    const plate: LocationBackdropPlate = {
      id: Math.random().toString(36).slice(2, 12),
      url: firstPlateUrl,
      label: 'Plate 1',
      dataType: 'backdrop-plate',
      createdAt: now,
    };
    const location: Location = { id, name, plates: [plate], createdAt: now };
    set((s) => ({ locations: [...s.locations, location] }));
    return location;
  },

  renameLocation(id, name) {
    set((s) => ({
      locations: s.locations.map((loc) => (loc.id === id ? { ...loc, name } : loc)),
    }));
  },

  addLocationPlate(locationId, url, label) {
    const now = Date.now();
    const plate: LocationBackdropPlate = {
      id: Math.random().toString(36).slice(2, 12),
      url,
      label: label ?? `Plate ${Date.now()}`,
      dataType: 'backdrop-plate',
      createdAt: now,
    };
    set((s) => ({
      locations: s.locations.map((loc) =>
        loc.id === locationId ? { ...loc, plates: [...loc.plates, plate] } : loc,
      ),
    }));
  },

  removeLocationPlate(locationId, plateId) {
    set((s) => ({
      locations: s.locations.map((loc) => {
        if (loc.id !== locationId) return loc;
        if (loc.plates.length <= 1) return loc; // guard: keep at least one plate
        return { ...loc, plates: loc.plates.filter((p) => p.id !== plateId) };
      }),
    }));
  },

  deleteLocation(id) {
    set((s) => ({
      locations: s.locations.filter((loc) => loc.id !== id),
      setups: s.setups.map((setup) =>
        setup.locationId === id ? { ...setup, locationId: null } : setup,
      ),
    }));
  },

  assignLocationToSetup(setupId, locationId) {
    set((s) => ({
      setups: s.setups.map((setup) =>
        setup.id === setupId ? { ...setup, locationId } : setup,
      ),
    }));
  },

  assignPlateToShot(setupId, coverageShotId, plateId) {
    const { locations, setups } = get();
    const setup = setups.find((s) => s.id === setupId);
    if (!setup?.locationId) return;
    const location = locations.find((l) => l.id === setup.locationId);
    const plate = location?.plates.find((p) => p.id === plateId);
    if (!plate) return;

    set((s) => ({
      setups: s.setups.map((su) => {
        if (su.id !== setupId) return su;
        const shots = su.shots.map((sh) => {
          if (sh.id !== coverageShotId) return sh;
          return { ...sh, backdropId: plateId };
        });
        // Mirror plate URL into the SetupBackdrop for the resolved-shot pipeline.
        const backdrops = su.backdrops.map((b) =>
          b.id === plateId ? { ...b, url: plate.url } : b,
        );
        // If no matching backdrop exists yet, add one.
        const hasBackdrop = su.backdrops.some((b) => b.id === plateId);
        const nextBackdrops = hasBackdrop
          ? backdrops
          : [
              ...backdrops,
              {
                id: plateId,
                label: plate.label,
                url: plate.url,
                backdropFramingByAspect: plate.backdropFramingByAspect,
                backdropCropsByAspect: plate.backdropCropsByAspect,
                backdropCropStatusByAspect: plate.backdropCropStatusByAspect,
              },
            ];
        return { ...su, shots, backdrops: nextBackdrops };
      }),
    }));
  },
}));

function isPersistedProjectDirty(state: StudioStore, prevState: StudioStore): boolean {
  return (
    state.project !== prevState.project ||
    state.setups !== prevState.setups ||
    state.currentSetupId !== prevState.currentSetupId ||
    state.currentCoverageShotId !== prevState.currentCoverageShotId ||
    state.shots !== prevState.shots ||
    state.currentShot !== prevState.currentShot ||
    state.characters !== prevState.characters ||
    state.locations !== prevState.locations ||
    state.mediaLibrary !== prevState.mediaLibrary ||
    state.globalMediaLibrary !== prevState.globalMediaLibrary ||
    state.shotWorkflowSnapshots !== prevState.shotWorkflowSnapshots
  );
}

useStudioStore.subscribe((state, prevState) => {
  if (!state.initialized) return;
  if (!isPersistedProjectDirty(state, prevState)) return;

  const { project, globalMediaLibrary } = projectPersistencePayload(state);
  scheduleProjectAutosave(project, (saveState) => {
    const current = useStudioStore.getState();
    const ui = projectFileUiState();
    if (
      current.projectSaveState === saveState &&
      current.projectLocationLabel === ui.projectLocationLabel &&
      current.projectLocationKind === ui.projectLocationKind
    ) {
      return;
    }
    useStudioStore.setState({
      ...ui,
      projectSaveState: saveState,
    });
  }, globalMediaLibrary);
});
