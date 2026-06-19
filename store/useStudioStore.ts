'use client';

import { create } from 'zustand';
import { DEFAULT_FRAME_COMPOSITION, normalizeReferenceRole, SINGLE_ONLY_COVERAGE } from '@/lib/constants/camera';
import { getDefaultEnabledProviderId, isBuiltInProviderEnabled } from '@/lib/constants/providers';
import { dofFromAperture, snapToApertureStop } from '@/lib/constants/aperture';
import { kelvinToWarmth, warmthToKelvin } from '@/lib/constants/color-palette';
import { applyLookRecipeToLighting, getLookRecipe } from '@/lib/constants/look-recipes';
import { applyLensCameraPatch } from '@/lib/constants/lens';
import { RESOLUTION_PRESETS } from '@/lib/constants/resolutions';
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
import { applyFrameCompositionSmartDefaults } from '@/lib/studio/composition';
import {
  cloneInheritedShotSettings,
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
  createCustomProvider,
  DEFAULT_AI_STATE,
  getImageProviderName,
  getProviderApiKey,
  getVideoProviderName,
  isCustomProvider,
  isProviderConnected,
  loadAIState,
  saveAIState,
} from '@/lib/storage/ai-settings';
import {
  clearProjectLocationSession,
  getProjectLocationKind,
  getProjectLocationLabel,
  getProjectSaveState,
  hasOpenProjectLocation,
  isFileSystemAccessSupported,
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
  CameraSettings,
  FrameComposition,
  ColorPaletteSettings,
  LightingSettings,
  MotionSettings,
  ProjectSettings,
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
    ...shotActiveView(active),
  };
}

function applyStudioProject(data: StudioProject) {
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
    ...shotActiveView(active),
  };
}

function getCurrentShotFromList(shots: Shot[], currentShot: number): Shot | undefined {
  return shots.find((s) => s.id === currentShot) || shots[0];
}

function ensureResolution(project: ProjectSettings): ProjectSettings {
  const ar = project.aspectRatio || '16:9';
  const presets = RESOLUTION_PRESETS[ar as AspectRatio] || RESOLUTION_PRESETS['16:9'];
  if (!presets.find((p) => p.value === project.resolution)) {
    return { ...project, resolution: presets[presets.length - 1].value };
  }
  return project;
}

const stockState = getStockDefaults();

interface StudioStore {
  project: ProjectSettings;
  camera: CameraSettings;
  lighting: LightingSettings;
  motion: MotionSettings;
  sceneSetup: string;
  shotActivity: string;
  shots: Shot[];
  currentShot: number;
  ai: AIState;
  toast: { message: string; type: ToastType } | null;
  isGenerating: boolean;
  progressText: string;
  showPreviewSuccess: boolean;
  previewSuccessProvider: string;
  previewSuccessPrompt: string;
  settingsOpen: boolean;
  providerEdit: { id: string; isCustom: boolean } | null;
  mobileDrawerOpen: boolean;
  initialized: boolean;
  previewMode: PreviewMode;
  frameView: FrameView;
  previewSubMode: PreviewSubMode;
  isPreviewFrameGenerating: boolean;
  previewFrameProgress: string;
  projectLocationLabel: string | null;
  projectLocationKind: ProjectLocationKind;
  projectSaveState: ProjectSaveState;
  fileApiSupported: boolean;

  init: () => void;
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
  setShotFrameComposition: (patch: Partial<FrameComposition>) => void;
  toggleCompositionOverlay: () => void;
  handleCameraCompositionChange: (changed: 'subjectCount' | 'coverage') => void;

  selectShot: (id: number) => void;
  deleteShot: (id: number) => void;
  addShot: () => void;
  selectGeneratedVideo: (index: number) => void;
  deleteGeneratedVideo: (id: string) => void;
  setReference: (index: number, dataUrl: string | null) => void;
  cycleReferenceRole: (index: number) => void;
  toggleCinematographyRefs: () => void;

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

export const useStudioStore = create<StudioStore>((set, get) => ({
  project: stockState.project,
  camera: stockState.camera,
  lighting: stockState.lighting,
  motion: stockState.motion,
  sceneSetup: stockState.sceneSetup,
  shotActivity: stockState.shotActivity,
  shots: stockState.shots,
  currentShot: stockState.currentShot,
  ai: { ...DEFAULT_AI_STATE },
  toast: null,
  isGenerating: false,
  progressText: '',
  showPreviewSuccess: false,
  previewSuccessProvider: '',
  previewSuccessPrompt: '',
  settingsOpen: false,
  providerEdit: null,
  mobileDrawerOpen: false,
  initialized: false,
  previewMode: 'vector',
  frameView: 'preview',
  previewSubMode: 'framing',
  isPreviewFrameGenerating: false,
  previewFrameProgress: '',
  projectLocationLabel: null,
  projectLocationKind: null,
  projectSaveState: 'none',
  fileApiSupported: false,

  syncProjectFileUi() {
    set(projectFileUiState());
  },

  setFrameView(view) {
    set({ frameView: view });
  },

  setPreviewSubMode(mode) {
    set({ previewSubMode: mode });
  },

  init() {
    const fileApiSupported = isFileSystemAccessSupported();
    set({ fileApiSupported });

    if (get().initialized) return;

    void (async () => {
      const ai = loadAIState();
      let applied: ReturnType<typeof applyStudioProject> | null = null;
      let toastMessage: string | null = null;

      if (fileApiSupported) {
        const restored = await restoreProjectSession();
        if (restored) {
          applied = applyStudioProject(restored);
          toastMessage = `Opened ${getProjectLocationLabel() ?? 'project'}`;
        }
      }

      if (!applied) {
        const draft = loadStudioDraft();
        if (draft) {
          applied = applyStudioProject(draft);
          clearStudioDraft();
          toastMessage = fileApiSupported
            ? 'Restored unsaved work — open or save a project folder to keep it on disk'
            : 'Restored your last session — save a project file to keep it';
        }
      }

      if (!applied && isServerProjectStorageEnabled()) {
        const serverProject = await loadProjectFromServer();
        if (serverProject) {
          applied = applyStudioProject(serverProject);
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
      const camera = { ...base, ...applyLensCameraPatch(base, patch) };
      if (patch.aperture !== undefined) {
        camera.aperture = snapToApertureStop(patch.aperture);
        camera.dof = dofFromAperture(camera.aperture);
      }
      if (patch.movement === 'drone') {
        camera.angle = 'drone';
      }
      return {
        camera,
        shots: patchCurrentShot(s.shots, s.currentShot, { camera }),
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
      } else if (Object.keys(patch).length > 0) {
        base.colorPalette = { ...base.colorPalette, activeLookRecipeId: null };
      }
      if (patch.colorTemp !== undefined) {
        base.colorPalette = {
          ...base.colorPalette,
          keyLightWarmth: kelvinToWarmth(patch.colorTemp),
          activeLookRecipeId: null,
        };
      }
      const current = getCurrentShotFromList(s.shots, s.currentShot);
      const shotLighting = { ...current?.lighting ?? base, ...patch };
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
      } else if (Object.keys(patch).length > 0) {
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
      const shots = patchCurrentShot(s.shots, s.currentShot, { lighting: shotLighting });
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
      const shots = patchCurrentShot(s.shots, s.currentShot, { lighting: shotLighting });
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
      const shots = patchCurrentShot(s.shots, s.currentShot, { lighting });
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

  setShotFrameComposition(patch) {
    const shot = get().getCurrentShot();
    if (!shot) return;
    const frameComposition = { ...shot.frameComposition, ...patch };
    set((s) => ({
      shots: patchCurrentShot(s.shots, s.currentShot, { frameComposition }),
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

  handleCameraCompositionChange(changed) {
    const { camera, shots, currentShot } = get();
    const next = { ...camera };

    if (changed === 'coverage' && SINGLE_ONLY_COVERAGE.has(camera.coverage)) {
      next.subjectCount = '1s';
    }

    if (changed === 'subjectCount' && next.subjectCount !== '1s') {
      if (SINGLE_ONLY_COVERAGE.has(next.coverage)) {
        next.coverage = 'clean';
      }
    }

    let updatedShots = patchCurrentShot(shots, currentShot, { camera: next });
    const updatedShot = getCurrentShotFromList(updatedShots, currentShot);
    if (updatedShot) {
      const frameComposition = { ...updatedShot.frameComposition };
      applyFrameCompositionSmartDefaults(next, frameComposition);
      updatedShots = patchCurrentShot(updatedShots, currentShot, { frameComposition });
    }

    set({ camera: next, shots: updatedShots });
  },

  selectShot(id) {
    if (get().currentShot === id) return;
    const shot = get().shots.find((s) => s.id === id);
    set((s) => ({
      currentShot: id,
      previewSubMode: 'framing',
      shots: s.shots.map((sh) => ({ ...sh, active: sh.id === id })),
      ...(shot ? shotActiveView(shot) : {}),
    }));
    get().showToast(`Switched to ${shot?.name ?? `Shot ${id}`}`);
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

  addShot() {
    const { shots } = get();
    const current = get().getCurrentShot();
    const newId = Math.max(...shots.map((s) => s.id)) + 1;

    const inherited = current ? cloneInheritedShotSettings(current) : {
      duration: 5,
      camera: migrateCamera({ ...STOCK_CAMERA }),
      lighting: { ...STOCK_LIGHTING },
      motion: { ...STOCK_MOTION },
      sceneSetup: STOCK_PROMPT,
      shotActivity: '',
      frameComposition: { ...DEFAULT_FRAME_COMPOSITION },
      references: [STOCK_CHARACTER_REF, STOCK_BACKDROP_REF, null] as (string | null)[],
      referenceRoles: [...STOCK_REFERENCE_ROLES],
      cinematographyRefs: true,
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

    set({ shots: [...shots, newShot] });
    get().showToast('New shot added — inherited settings from current shot');
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
    const references = [...shot.references];
    references[index] = dataUrl;
    set((s) => ({
      shots: patchCurrentShot(s.shots, s.currentShot, { references }),
    }));
    if (dataUrl) get().showToast('Reference image added');
  },

  cycleReferenceRole(index) {
    const shot = get().getCurrentShot();
    if (!shot) return;
    const roles = ['Subject', 'Backdrop', 'Style', 'Depth', 'Canny', 'None'] as const;
    const current = normalizeReferenceRole(shot.referenceRoles[index] ?? 'None');
    const nextIdx = (roles.indexOf(current) + 1) % roles.length;
    const referenceRoles = [...shot.referenceRoles];
    referenceRoles[index] = roles[nextIdx];
    set((s) => ({
      shots: patchCurrentShot(s.shots, s.currentShot, { referenceRoles }),
    }));
  },

  toggleCinematographyRefs() {
    const shot = get().getCurrentShot();
    if (!shot) return;
    const next = shot.cinematographyRefs === false;
    set((s) => ({
      shots: patchCurrentShot(s.shots, s.currentShot, { cinematographyRefs: next }),
    }));
    get().showToast(next ? 'Shot breakdown refs on' : 'Generic image slots');
  },

  async generatePreviewFrame() {
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

    set({ isPreviewFrameGenerating: true, previewFrameProgress: `Submitting to ${providerName}...` });

    try {
      const res = await fetch('/api/preview-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: imageProviderId,
          isCustom,
          apiKey,
          customBaseUrl,
          modelId,
          prompt,
          aspectRatio: project.aspectRatio,
          refs,
          cinematographyRefs: shot.cinematographyRefs !== false,
        }),
      });

      const result = await res.json();
      if (!res.ok || result.status === 'error') {
        throw new Error(result.error || 'Preview frame generation failed');
      }

      set((s) => ({
        shots: patchCurrentShot(s.shots, s.currentShot, {
          previewFrameUrl: result.imageUrl ?? null,
          previewFrameFingerprint: fingerprint,
        }),
        isPreviewFrameGenerating: false,
        previewSubMode: 'model',
        previewFrameProgress: '',
      }));
      get().showToast('Preview frame generated');
    } catch (e) {
      set({ isPreviewFrameGenerating: false, previewFrameProgress: '' });
      get().showToast(e instanceof Error ? e.message : 'Preview frame failed', 'error');
    }
  },

  async generate() {
    const state = get();
    const { project, ai, shots, currentShot } = state;
    const shot = getCurrentShotFromList(shots, currentShot);
    if (!shot) return;

    const combinedPrompt = buildShotPrompt(shot.sceneSetup, shot.shotActivity);
    if (!combinedPrompt.trim()) {
      get().showToast('Please enter scene setup or shot activity first', 'error');
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
    const modelId = getEffectiveModelId(ai);
    if (!isCustom && !modelId) {
      get().showToast('No video model available — re-test your video provider in Settings', 'error');
      return;
    }
    const providerName = getVideoProviderName(ai);

    set({ isGenerating: true, showPreviewSuccess: false, progressText: `Submitting to ${providerName}...` });

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
          cinematographyRefs: shot.cinematographyRefs !== false,
        }),
      });

      const result = await res.json();
      if (!res.ok || result.status === 'error') {
        throw new Error(result.error || 'Generation failed');
      }

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
      }));
      get().showToast('Video generation complete!');

      setTimeout(() => set({ showPreviewSuccess: false }), 5000);
    } catch (e) {
      set({ isGenerating: false, progressText: '' });
      get().showToast(e instanceof Error ? e.message : 'Generation failed', 'error');
    }
  },

  async saveProject() {
    const project = buildStudioProject(get());
    if (isFileSystemAccessSupported()) {
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
    if (isFileSystemAccessSupported() && hasOpenProjectLocation()) {
      const ok = await saveProjectNow(buildStudioProject(get()));
      get().syncProjectFileUi();
      get().showToast(
        ok ? 'Project saved' : 'Could not save — check folder permission',
        ok ? 'success' : 'error',
      );
      return;
    }
    if (isFileSystemAccessSupported()) {
      await get().saveProjectFolderAs();
      return;
    }
    await get().saveProject();
  },

  async openProjectQuick() {
    if (isFileSystemAccessSupported()) {
      await get().openProjectFolder();
      return;
    }
    await get().loadProject();
  },

  async loadProject() {
    if (isFileSystemAccessSupported()) {
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
    if (!isFileSystemAccessSupported()) {
      get().showToast('Use Chrome or Edge on HTTPS or localhost to open project folders', 'error');
      return;
    }
    try {
      const data = await openProjectFolderFromDisk();
      if (!data) {
        get().showToast('No project.json found in that folder', 'error');
        return;
      }
      const applied = applyStudioProject(data);
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
    if (!isFileSystemAccessSupported()) {
      await get().saveProject();
      return;
    }
    try {
      const saved = await saveProjectFolderToDisk(buildStudioProject(get()));
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
    const ai = { ...get().ai };
    const patch = {
      lastTested: Date.now(),
      lastTestOk: result.ok,
      lastTestMessage: result.message,
      models: result.models,
      modalities: result.modalities,
      purposes: result.purposes,
    };

    if (isCustom) {
      ai.customProviders = ai.customProviders.map((p) =>
        p.id === id
          ? {
              ...p,
              ...patch,
              apiKey: apiKey?.trim() || p.apiKey,
              connected: result.ok || !!(apiKey?.trim() || (p.apiKey && p.apiKey.length > 4)),
            }
          : p,
      );
    } else {
      const existing = ai.configured[id] ?? { apiKey: '', connected: false };
      const resolvedKey = apiKey?.trim() || existing.apiKey;
      ai.configured[id] = {
        ...existing,
        ...patch,
        apiKey: resolvedKey,
        connected: result.ok || !!(resolvedKey && resolvedKey.length > 4),
      };
    }

    if (ai.defaultVideoProvider === id) {
      ai.defaultVideoModelId = resolveModelSelectionForProvider(id, isCustom, ai, ai.defaultVideoModelId);
    }
    if (ai.defaultImageProvider === id) {
      ai.defaultImageModelId = resolveImageModelSelectionForProvider(id, isCustom, ai, ai.defaultImageModelId);
    }

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
    state.currentShot !== prevState.currentShot
  );
}

useStudioStore.subscribe((state, prevState) => {
  if (!state.initialized) return;
  if (!isPersistedProjectDirty(state, prevState)) return;

  scheduleProjectAutosave(buildStudioProject(state), (saveState) => {
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
  });
});