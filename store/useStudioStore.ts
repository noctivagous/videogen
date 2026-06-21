'use client';

import { create } from 'zustand';
import { DEFAULT_FRAME_COMPOSITION, normalizeReferenceRole, SINGLE_ONLY_COVERAGE } from '@/lib/constants/camera';
import { getDefaultEnabledProviderId, isBuiltInProviderEnabled } from '@/lib/constants/providers';
import { apertureForDof, dofFromAperture, snapToApertureStop } from '@/lib/constants/aperture';
import { kelvinToWarmth, warmthToKelvin } from '@/lib/constants/color-palette';
import { applyLookRecipeToLighting, getLookRecipe } from '@/lib/constants/look-recipes';
import { resolveCameraPromptInclusion } from '@/lib/constants/camera-prompt-inclusion';
import { applyLensCameraPatch } from '@/lib/constants/lens';
import { getDefaultResolution, RESOLUTION_PRESETS } from '@/lib/constants/resolutions';
import {
  EMPTY_PROJECT,
  EMPTY_SHOTS,
  STOCK_BACKDROP_REF,
  STOCK_CAMERA,
  STOCK_CHARACTER_REF,
  STOCK_LIGHTING,
  STOCK_MOTION,
  STOCK_PROJECT,
  STOCK_PROMPT,
  STOCK_REFERENCE_ROLES,
  STOCK_SHOTS,
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
  resolveReferenceSlotInvalidation,
  resolveWorkflowInvalidation,
  splitInvalidationPatch,
} from '@/lib/studio/workflow-invalidation';
import {
  createWorkflowSnapshot,
  getMediaAsset,
  ingestBakedFramesForShot,
  linkAssetToShot,
} from '@/lib/media/media-library';
import { updateMediaAssetInLibrary } from '@/lib/media/media-library-query';
import { indexClipEmbeddingsInLibrary } from '@/lib/media/clip-search';
import {
  applyAssetIdRemapToShots,
  applyAssetIdRemapToSnapshots,
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
  cloneInheritedShotSettings,
  createBlankShotSettings,
  DEFAULT_SHOT_DEFAULTS,
  migrateAllShots,
  migrateCamera,
  patchCurrentShot,
  shotActiveView,
  type ShotProjectDefaults,
} from '@/lib/studio/shot-settings';
import {
  appendGeneratedVideo,
  deleteGeneratedVideoById,
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
  FrameComposition,
  ColorPaletteSettings,
  LightingSettings,
  MotionSettings,
  ProjectSettings,
  ReferenceMode,
  Shot,
  StudioProject,
  PreviewMode,
  PreviewSubMode,
  ToastType,
} from '@/lib/types/studio';
import type { FrameView } from '@/components/studio/FrameViewSegment';

const PREVIEW_MODE_KEY = 'videogen_preview_mode';

function projectFileUiState() {
  return {
    projectLocationLabel: getProjectLocationLabel(),
    projectLocationKind: getProjectLocationKind(),
    projectSaveState: getProjectSaveState(),
  };
}

function projectDefaultsFromData(data: StudioProject): ShotProjectDefaults {
  return {
    camera: migrateCamera(data.camera ?? STOCK_CAMERA),
    lighting: data.lighting ?? STOCK_LIGHTING,
    motion: data.motion ?? STOCK_MOTION,
    sceneSetup: data.prompt ?? '',
    shotActivity: '',
  };
}

function getStockDefaults() {
  const shots = migrateAllShots(STOCK_SHOTS, DEFAULT_SHOT_DEFAULTS);
  const active = shots.find((s) => s.active) || shots[0];
  return {
    project: { ...STOCK_PROJECT },
    shots,
    currentShot: active?.id ?? 1,
    mediaLibrary: [],
    globalMediaLibrary: [] as MediaAsset[],
    shotWorkflowSnapshots: [],
    ...shotActiveView(active),
  };
}

function getEmptyDefaults() {
  const shots = migrateAllShots(EMPTY_SHOTS, {
    ...DEFAULT_SHOT_DEFAULTS,
    sceneSetup: '',
    shotActivity: '',
  });
  const active = shots[0];
  return {
    project: { ...EMPTY_PROJECT },
    shots,
    currentShot: active?.id ?? 1,
    mediaLibrary: [] as MediaAsset[],
    globalMediaLibrary: [] as MediaAsset[],
    shotWorkflowSnapshots: [] as ShotWorkflowSnapshot[],
    ...shotActiveView(active),
  };
}

function applyStudioProject(data: StudioProject, globalMediaLibrary: MediaAsset[] = []) {
  const project = {
    ...data.project,
    aspectRatio: data.project.aspectRatio || '16:9',
  };
  const defaults = projectDefaultsFromData(data);
  const shots = migrateAllShots(data.shots, defaults);
  const currentShot = data.currentShot || shots[0]?.id || 1;
  const active = shots.find((s) => s.id === currentShot) || shots[0];
  return {
    project: ensureResolution(project),
    shots,
    currentShot,
    mediaLibrary: data.mediaLibrary ?? [],
    globalMediaLibrary,
    shotWorkflowSnapshots: data.shotWorkflowSnapshots ?? [],
    ...shotActiveView(active),
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

function getCurrentShotFromList(shots: Shot[], currentShot: number): Shot | undefined {
  return shots.find((s) => s.id === currentShot) || shots[0];
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

const stockState = getStockDefaults();

export type WorkspaceView = 'shot' | 'media-library';

interface StudioStore {
  project: ProjectSettings;
  camera: CameraSettings;
  lighting: LightingSettings;
  motion: MotionSettings;
  sceneSetup: string;
  shotActivity: string;
  shots: Shot[];
  currentShot: number;
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
  workspaceView: WorkspaceView;
  selectedMediaLibraryItemId: string | null;

  init: () => void;
  setWorkspaceView: (view: WorkspaceView) => void;
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
  getScenePayload: () => StudioProject & { shot: Shot | undefined };

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
  setShotFrameComposition: (patch: Partial<FrameComposition>) => void;
  toggleCompositionOverlay: () => void;
  handleCameraCompositionChange: (
    changed: 'subjectCount' | 'coverage',
    patch: Partial<Pick<CameraSettings, 'subjectCount' | 'coverage'>>,
  ) => void;

  selectShot: (id: number) => void;
  deleteShot: (id: number) => void;
  addShot: (mode?: 'duplicate' | 'blank') => void;
  selectGeneratedVideo: (index: number) => void;
  deleteGeneratedVideo: (id: string) => void;
  setReference: (index: number, dataUrl: string | null) => void;
  addReferenceSlot: () => void;
  removeReferenceSlot: (index: number) => void;
  backdropSelected: boolean;
  setBackdropSelected: (selected: boolean) => void;
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
  applyThemeTransformSlot: (index: number) => Promise<void>;

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
  const { project, shots, currentShot } = get();
  const shot = getCurrentShotFromList(shots, currentShot);
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
  shots: stockState.shots,
  currentShot: stockState.currentShot,
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
  workspaceView: 'shot',
  selectedMediaLibraryItemId: null,

  setBackdropSelected(selected) {
    set({ backdropSelected: selected });
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
      ...(view === 'shot' ? { selectedMediaLibraryItemId: null } : {}),
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

      return {
        mediaLibrary: removeAssetsFromLibrary(s.mediaLibrary, idSet),
        globalMediaLibrary: removeAssetsFromLibrary(s.globalMediaLibrary, idSet),
        shots: cleanShotsAfterAssetDelete(s.shots, idSet),
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
      const nextShots = applyAssetIdRemapToShots(state.shots, result.idMap);
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
          shots: nextShots,
          shotWorkflowSnapshots: nextSnapshots,
          selectedMediaLibraryItemId: selectedId,
        });
      } else {
        set({
          mediaLibrary: result.library,
          globalMediaLibrary: remapOtherLibrary(state.globalMediaLibrary),
          shots: nextShots,
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
      const nextShots = applyAssetIdRemapToShots(state.shots, result.idMap);
      const nextSnapshots = applyAssetIdRemapToSnapshots(
        state.shotWorkflowSnapshots,
        result.idMap,
      );
      const selectedId =
        state.selectedMediaLibraryItemId === assetId ? result.asset.id : state.selectedMediaLibraryItemId;
      if (collection === 'global') {
        set({
          globalMediaLibrary: result.library,
          shots: nextShots,
          shotWorkflowSnapshots: nextSnapshots,
          selectedMediaLibraryItemId: selectedId,
        });
      } else {
        set({
          mediaLibrary: result.library,
          shots: nextShots,
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
    return getCurrentShotFromList(get().shots, get().currentShot);
  },

  getScenePayload() {
    const state = get();
    const shot = getCurrentShotFromList(state.shots, state.currentShot);
    return {
      project: state.project,
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
      const current = getCurrentShotFromList(s.shots, s.currentShot);
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
        shots: patchCurrentShot(s.shots, s.currentShot, shotPatch),
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
      const current = getCurrentShotFromList(s.shots, s.currentShot);
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
      const shots = patchCurrentShot(s.shots, s.currentShot, {
        lighting: shotLighting,
        ...themeLightingInvalidationPatch(invalidationShot),
      });
      return { lighting: base, shots };
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
      const current = getCurrentShotFromList(s.shots, s.currentShot);
      const shotLighting = {
        ...current?.lighting ?? base,
        colorPalette,
        ...(patch.keyLightWarmth !== undefined
          ? { colorTemp: warmthToKelvin(patch.keyLightWarmth) }
          : {}),
      };
      const shots = patchCurrentShot(s.shots, s.currentShot, {
        lighting: shotLighting,
        ...themeLightingInvalidationPatch(current),
      });
      return { lighting: base, shots };
    });
  },

  applyLookRecipe(id) {
    const recipe = getLookRecipe(id);
    if (!recipe) return;
    set((s) => {
      const current = getCurrentShotFromList(s.shots, s.currentShot);
      const source = current?.lighting ?? s.lighting;
      const lighting = applyLookRecipeToLighting(source, recipe);
      const shots = patchCurrentShot(s.shots, s.currentShot, {
        lighting,
        ...themeLightingInvalidationPatch(current),
      });
      return { lighting, shots };
    });
  },

  clearLookRecipe() {
    get().setColorPalette({ activeLookRecipeId: null });
  },

  setMotion(patch) {
    set((s) => {
      const motion = { ...s.motion, ...patch };
      const current = getCurrentShotFromList(s.shots, s.currentShot);
      const shots = patchCurrentShot(s.shots, s.currentShot, {
        motion: { ...current?.motion ?? motion, ...patch },
      });
      return { motion, shots };
    });
  },

  setSceneSetup(sceneSetup) {
    set((s) => ({
      sceneSetup,
      shots: patchCurrentShot(s.shots, s.currentShot, { sceneSetup }),
    }));
  },

  setShotActivity(shotActivity) {
    set((s) => ({
      shotActivity,
      shots: patchCurrentShot(s.shots, s.currentShot, { shotActivity }),
    }));
  },

  setPromptAdditions(promptAdditions) {
    set((s) => ({
      shots: patchCurrentShot(s.shots, s.currentShot, { promptAdditions }),
    }));
  },

  setLightingAtmospherePrompt(lightingAtmospherePrompt) {
    set((s) => ({
      shots: patchCurrentShot(s.shots, s.currentShot, { lightingAtmospherePrompt }),
    }));
  },

  setBakeStartFramePrompt(bakeStartFramePrompt) {
    set((s) => ({
      shots: patchCurrentShot(s.shots, s.currentShot, { bakeStartFramePrompt }),
    }));
  },

  setShotFrameComposition(patch) {
    const shot = get().getCurrentShot();
    if (!shot) return;
    const frameComposition = { ...shot.frameComposition, ...patch };
    const layoutChanged =
      (patch.placement !== undefined && patch.placement !== shot.frameComposition.placement) ||
      (patch.headroom !== undefined && patch.headroom !== shot.frameComposition.headroom) ||
      (patch.guide !== undefined && patch.guide !== shot.frameComposition.guide);

    let shotPatch: Partial<Shot> = { frameComposition };
    if (layoutChanged) {
      shotPatch = {
        ...shotPatch,
        ...mannequinResyncPatch(
          shot,
          { ...shot, frameComposition },
          'placement',
          (get().project.aspectRatio || '16:9') as AspectRatio,
        ),
      };
    }

    set((s) => ({
      shots: patchCurrentShot(s.shots, s.currentShot, shotPatch),
    }));
  },

  toggleCompositionOverlay() {
    const shot = get().getCurrentShot();
    if (!shot) return;
    set((s) => ({
      shots: patchCurrentShot(s.shots, s.currentShot, {
        frameComposition: {
          ...shot.frameComposition,
          showOverlay: !shot.frameComposition.showOverlay,
        },
      }),
    }));
  },

  handleCameraCompositionChange(changed, patch) {
    const { shots, currentShot } = get();
    const prevShot = getCurrentShotFromList(shots, currentShot);
    if (!prevShot) return;

    const next = { ...prevShot.camera, ...patch };

    if (changed === 'coverage' && SINGLE_ONLY_COVERAGE.has(next.coverage)) {
      next.subjectCount = '1s';
    }

    if (changed === 'subjectCount' && next.subjectCount !== '1s') {
      if (SINGLE_ONLY_COVERAGE.has(next.coverage)) {
        next.coverage = 'clean';
      }
    }

    const frameComposition = { ...prevShot.frameComposition };
    applyFrameCompositionSmartDefaults(next, frameComposition);

    const nextShot: Shot = { ...prevShot, camera: next, frameComposition };
    const resync = mannequinResyncPatch(
      prevShot,
      nextShot,
      'camera',
      (get().project.aspectRatio || '16:9') as AspectRatio,
    );

    set({
      camera: next,
      shots: patchCurrentShot(shots, currentShot, {
        camera: next,
        frameComposition,
        ...resync,
      }),
    });
  },

  selectShot(id) {
    if (get().currentShot === id) return;
    const shot = get().shots.find((s) => s.id === id);
    let shots = get().shots.map((sh) => ({ ...sh, active: sh.id === id }));
    if (shot && (shot.mannequins?.length ?? 0) === 0) {
      shots = patchCurrentShot(shots, id, { mannequins: ensureMannequinsOnShot(shot) });
    }
    const activeShot = shots.find((s) => s.id === id) ?? shot;
    set((s) => ({
      currentShot: id,
      previewSubMode: 'framing',
      backdropSelected: false,
      shots,
      ...(activeShot ? shotActiveView(activeShot) : {}),
    }));
    get().showToast(`Switched to ${activeShot?.name ?? shot?.name ?? `Shot ${id}`}`);
  },

  deleteShot(id) {
    const { shots, currentShot } = get();
    if (shots.length === 1) {
      get().showToast('Cannot delete the last shot', 'error');
      return;
    }
    const nextShots = shots.filter((s) => s.id !== id);
    let nextCurrent = currentShot;
    if (currentShot === id) {
      nextCurrent = nextShots[0].id;
      nextShots[0] = { ...nextShots[0], active: true };
      const active = nextShots[0];
      set({ shots: nextShots, currentShot: nextCurrent, ...shotActiveView(active) });
    } else {
      set({ shots: nextShots, currentShot: nextCurrent });
    }
    get().showToast('Shot deleted');
  },

  addShot(mode = 'duplicate') {
    const { shots } = get();
    const current = get().getCurrentShot();
    const newId = Math.max(...shots.map((s) => s.id)) + 1;

    const inherited =
      mode === 'blank'
        ? createBlankShotSettings()
        : current
          ? cloneInheritedShotSettings(current)
          : {
              duration: 5,
              camera: migrateCamera({ ...STOCK_CAMERA }),
              lighting: { ...STOCK_LIGHTING },
              motion: { ...STOCK_MOTION },
              sceneSetup: STOCK_PROMPT,
              shotActivity: '',
              frameComposition: { ...DEFAULT_FRAME_COMPOSITION },
              references: [STOCK_BACKDROP_REF, STOCK_CHARACTER_REF, null] as (string | null)[],
              referenceRoles: [...STOCK_REFERENCE_ROLES],
              referenceMode: DEFAULT_REFERENCE_MODE,
            };

    const newShot: Shot = {
      id: newId,
      name: `Shot ${String(newId).padStart(2, '0')}`,
      active: false,
      thumbnail: null,
      videoUrl: null,
      generatedVideos: [],
      activeVideoIndex: 0,
      ...inherited,
    };
    const withMannequins = { ...newShot, mannequins: ensureMannequinsOnShot(newShot) };

    set({ shots: [...shots, withMannequins] });
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
      shots: patchCurrentShot(s.shots, s.currentShot, patch),
    }));
  },

  deleteGeneratedVideo(id) {
    const shot = get().getCurrentShot();
    if (!shot) return;
    const patch = deleteGeneratedVideoById(shot, id);
    if (!Object.keys(patch).length) return;
    set((s) => ({
      shots: patchCurrentShot(s.shots, s.currentShot, patch),
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
      shots: patchCurrentShot(s.shots, s.currentShot, {
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
      shots: patchCurrentShot(s.shots, s.currentShot, appendReferenceSlotPatch(shot)),
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
      shots: patchCurrentShot(s.shots, s.currentShot, {
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
      shots: patchCurrentShot(s.shots, s.currentShot, {
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
        shots: patchCurrentShot(s.shots, s.currentShot, {
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
        shots: patchCurrentShot(s.shots, s.currentShot, {
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
        shots: patchCurrentShot(s.shots, s.currentShot, {
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
      shots: patchCurrentShot(s.shots, s.currentShot, {
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
      shots: patchCurrentShot(s.shots, s.currentShot, {
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
        shots: patchCurrentShot(s.shots, s.currentShot, {
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
      shots: patchCurrentShot(s.shots, s.currentShot, {
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
      shots: patchCurrentShot(s.shots, s.currentShot, { referenceMode: mode }),
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
    set((s) => ({
      shots: patchCurrentShot(s.shots, s.currentShot, {
        ...switchPatch,
        workflow,
        mannequins,
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
    const mannequins = [...migrateMannequins(shot?.mannequins)];
    mannequins.push(createDefaultMannequin());
    const finalized = shot ? finalizeMannequinsForShot(shot, mannequins) : mannequins;
    const layoutPatch = shot
      ? splitInvalidationPatch(
          resolveWorkflowInvalidation(shot, { kind: 'mannequin_layout_changed' }),
        ).shotPatch
      : {};
    set((s) => ({
      shots: patchCurrentShot(s.shots, s.currentShot, {
        mannequins: finalized,
        ...layoutPatch,
      }),
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
      shots: patchCurrentShot(s.shots, s.currentShot, {
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
      shots: patchCurrentShot(s.shots, s.currentShot, {
        mannequins,
        ...layoutPatch,
      }),
    }));
  },

  removeMannequin(id) {
    const shot = get().getCurrentShot();
    if (!shot) return;
    const mannequins = finalizeMannequinsForShot(
      shot,
      (shot.mannequins ?? []).filter((m) => m.id !== id),
    );
    const { shotPatch: layoutPatch } = splitInvalidationPatch(
      resolveWorkflowInvalidation(shot, { kind: 'mannequin_layout_changed' }),
    );
    set((s) => ({
      shots: patchCurrentShot(s.shots, s.currentShot, {
        mannequins,
        ...layoutPatch,
      }),
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
      shots: patchCurrentShot(s.shots, s.currentShot, shotPatch),
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
        shots: patchCurrentShot(s.shots, s.currentShot, result.shotPatch),
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
      shots: patchCurrentShot(s.shots, s.currentShot, {
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
    const { project, ai, shots, currentShot } = state;
    const shot = getCurrentShotFromList(shots, currentShot);
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
      shots: patchCurrentShot(shots, currentShot, { bakeStatus: 'baking' }),
    });

    try {
      const bakeOutput = await renderBakeFrames({
        shot,
        aspectRatio: project.aspectRatio as AspectRatio,
        resolution: project.resolution,
        mannequins: shot.mannequins ?? [],
      });
      const { imageUrl, compositeUrl } = await bakeBlobsToDataUrls(bakeOutput);

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
        shots: patchCurrentShot(s.shots, s.currentShot, {
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
        shots: patchCurrentShot(s.shots, s.currentShot, { bakeStatus: 'error' }),
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
    const { project, ai, shots, currentShot } = state;
    const shot = getCurrentShotFromList(shots, currentShot);
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
        shots: patchCurrentShot(s.shots, s.currentShot, {
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
    const { project, ai, shots, currentShot } = state;
    const shot = getCurrentShotFromList(shots, currentShot);
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
      shots: patchCurrentShot(s.shots, s.currentShot, {
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
        shots: patchCurrentShot(s.shots, s.currentShot, {
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
        shots: patchCurrentShot(s.shots, s.currentShot, {
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
        shots: patchCurrentShot(s.shots, s.currentShot, {
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
            shots: patchCurrentShot(s.shots, s.currentShot, {
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
        shots: patchCurrentShot(s.shots, s.currentShot, {
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
    const { project, ai, shots, currentShot } = state;
    const shot = getCurrentShotFromList(shots, currentShot);
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

      set((s) => ({
        shots: patchCurrentShot(s.shots, s.currentShot, appendGeneratedVideo(shot, {
          url: videoUrl,
          posterUrl: result.posterUrl ?? shot.thumbnail,
          providerJobId: result.providerJobId,
        })),
        isGenerating: false,
        frameView: 'generated',
        showPreviewSuccess: true,
        previewSuccessProvider: `${getVideoProviderName(ai)}${result.providerJobId ? ` · Job ${result.providerJobId}` : ''}`,
        previewSuccessPrompt: combinedPrompt,
        progressText: '',
        progressDetail: '',
      }));
      get().showToast('Video generation complete!');

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
}));

function isPersistedProjectDirty(state: StudioStore, prevState: StudioStore): boolean {
  return (
    state.project !== prevState.project ||
    state.shots !== prevState.shots ||
    state.currentShot !== prevState.currentShot ||
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