'use client';

import { create } from 'zustand';
import { DEFAULT_FRAME_COMPOSITION, normalizeReferenceRole, SINGLE_ONLY_COVERAGE } from '@/lib/constants/camera';
import { applyLensCameraPatch } from '@/lib/constants/lens';
import { RESOLUTION_PRESETS } from '@/lib/constants/resolutions';
import {
  EMPTY_PROJECT,
  EMPTY_SHOTS,
  STOCK_CAMERA,
  STOCK_LIGHTING,
  STOCK_MOTION,
  STOCK_PROJECT,
  STOCK_PROMPT,
  STOCK_REFERENCE_ROLES,
  STOCK_SHOTS,
} from '@/lib/constants/stock-project';
import { isGenerationSupported } from '@/lib/studio/generation/supported';
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
  createCustomProvider,
  DEFAULT_AI_STATE,
  getCurrentProviderName,
  getProviderApiKey,
  isProviderConnected,
  loadAIState,
  saveAIState,
} from '@/lib/storage/ai-settings';
import { downloadProject, pickAndLoadProject } from '@/lib/storage/project-io';
import {
  buildStudioProject,
  clearStudioDraft,
  loadStudioDraft,
  saveStudioDraft,
  scheduleStudioAutosave,
} from '@/lib/storage/studio-state';
import type {
  AIState,
  AspectRatio,
  CameraSettings,
  FrameComposition,
  LightingSettings,
  MotionSettings,
  ProjectSettings,
  Shot,
  StudioProject,
  PreviewMode,
  ToastType,
} from '@/lib/types/studio';

const PREVIEW_MODE_KEY = 'videogen_preview_mode';

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

  init: () => void;
  setPreviewMode: (mode: PreviewMode) => void;
  togglePreviewMode: () => void;
  showToast: (message: string, type?: ToastType) => void;
  clearToast: () => void;
  getCurrentShot: () => Shot | undefined;
  getScenePayload: () => StudioProject & { shot: Shot | undefined };

  setProject: (patch: Partial<ProjectSettings>) => void;
  setCamera: (patch: Partial<CameraSettings>) => void;
  setLighting: (patch: Partial<LightingSettings>) => void;
  setMotion: (patch: Partial<MotionSettings>) => void;
  setSceneSetup: (sceneSetup: string) => void;
  setShotActivity: (shotActivity: string) => void;
  setShotFrameComposition: (patch: Partial<FrameComposition>) => void;
  toggleCompositionOverlay: () => void;
  handleCameraCompositionChange: (changed: 'subjectCount' | 'coverage') => void;

  selectShot: (id: number) => void;
  deleteShot: (id: number) => void;
  addShot: () => void;
  setReference: (index: number, dataUrl: string | null) => void;
  cycleReferenceRole: (index: number) => void;

  generate: () => Promise<void>;
  saveProject: () => void;
  loadProject: () => Promise<void>;
  newProject: () => void;
  resetToDemo: () => void;
  exportVideo: () => void;

  openSettings: () => void;
  closeSettings: () => void;
  setDefaultProvider: (id: string) => void;
  openProviderEdit: (id: string, isCustom: boolean) => void;
  closeProviderEdit: () => void;
  saveProviderEdit: (apiKey: string, customFields?: { name: string; desc: string; baseUrl: string }) => void;
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

  init() {
    if (get().initialized) return;
    const ai = loadAIState();
    const draft = loadStudioDraft();
    if (draft) {
      set({ ...applyStudioProject(draft), ai, previewMode: 'vector', initialized: true });
      get().showToast('Restored your last session');
    } else {
      set({ ai, previewMode: 'vector', initialized: true });
    }
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
      return {
        camera,
        shots: patchCurrentShot(s.shots, s.currentShot, { camera }),
      };
    });
  },

  setLighting(patch) {
    set((s) => {
      const lighting = { ...s.lighting, ...patch };
      const current = getCurrentShotFromList(s.shots, s.currentShot);
      const shots = patchCurrentShot(s.shots, s.currentShot, {
        lighting: { ...current?.lighting ?? lighting, ...patch },
      });
      return { lighting, shots };
    });
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
    let next = { ...camera };

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
      references: [null, null, null] as (string | null)[],
      referenceRoles: [...STOCK_REFERENCE_ROLES],
    };

    const newShot: Shot = {
      id: newId,
      name: `Shot ${String(newId).padStart(2, '0')}`,
      active: false,
      thumbnail: null,
      videoUrl: null,
      ...inherited,
    };

    set({ shots: [...shots, newShot] });
    get().showToast('New shot added — inherited settings from current shot');
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
    const roles = ['Subject', 'Backdrop', 'Motion', 'Depth', 'Canny', 'None'] as const;
    const current = normalizeReferenceRole(shot.referenceRoles[index] ?? 'None');
    const nextIdx = (roles.indexOf(current) + 1) % roles.length;
    const referenceRoles = [...shot.referenceRoles];
    referenceRoles[index] = roles[nextIdx];
    set((s) => ({
      shots: patchCurrentShot(s.shots, s.currentShot, { referenceRoles }),
    }));
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

    const isCustom = ai.customProviders.some((p) => p.id === ai.defaultProvider);
    if (!isProviderConnected(ai.defaultProvider, isCustom, ai)) {
      get().showToast('Configure your AI provider API key in Settings first', 'error');
      return;
    }
    if (!isGenerationSupported(ai.defaultProvider, isCustom)) {
      get().showToast('Switch to Replicate or a Custom provider to generate', 'error');
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
    const apiKey = getProviderApiKey(ai.defaultProvider, isCustom, ai);
    const customBaseUrl = isCustom
      ? ai.customProviders.find((p) => p.id === ai.defaultProvider)?.baseUrl
      : undefined;

    set({ isGenerating: true, showPreviewSuccess: false, progressText: 'Submitting to provider...' });

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: ai.defaultProvider,
          isCustom,
          apiKey,
          customBaseUrl,
          prompt: stack.combinedPrompt,
          duration: project.duration,
          fps: project.fps,
          resolution: project.resolution,
          aspectRatio: project.aspectRatio,
          refs: stack.blocks.find((b) => b.id === 'references')?.refs ?? [],
        }),
      });

      const result = await res.json();
      if (!res.ok || result.status === 'error') {
        throw new Error(result.error || 'Generation failed');
      }

      set((s) => ({
        shots: patchCurrentShot(s.shots, s.currentShot, {
          videoUrl: result.videoUrl ?? null,
          thumbnail: result.posterUrl ?? shot.thumbnail,
        }),
        isGenerating: false,
        showPreviewSuccess: true,
        previewSuccessProvider: `${getCurrentProviderName(ai)}${result.providerJobId ? ` · Job ${result.providerJobId}` : ''}`,
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

  saveProject() {
    downloadProject(buildStudioProject(get()));
    get().showToast('Project saved successfully');
  },

  async loadProject() {
    const result = await pickAndLoadProject();
    if (result.status === 'cancelled') return;
    if (result.status === 'error') {
      get().showToast(result.message, 'error');
      return;
    }
    const applied = applyStudioProject(result.data);
    set(applied);
    clearStudioDraft();
    saveStudioDraft(buildStudioProject(applied));
    get().showToast('Project loaded successfully');
  },

  newProject() {
    set({ ...getEmptyDefaults(), showPreviewSuccess: false });
    clearStudioDraft();
    get().showToast('New project created');
  },

  resetToDemo() {
    set({ ...getStockDefaults(), showPreviewSuccess: false });
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

  setDefaultProvider(id) {
    const ai = { ...get().ai, defaultProvider: id };
    saveAIState(ai);
    set({ ai });
    get().showToast('Default provider updated');
  },

  openProviderEdit(id, isCustom) {
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
      ai.configured[edit.id] = { apiKey, connected: true, lastTested: Date.now() };
    }

    saveAIState(ai);
    set({ ai, providerEdit: null });
    get().showToast('Provider settings saved');
  },

  deleteCustomProvider(id) {
    const ai = { ...get().ai };
    ai.customProviders = ai.customProviders.filter((p) => p.id !== id);
    if (ai.defaultProvider === id) ai.defaultProvider = 'replicate';
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

useStudioStore.subscribe((state) => {
  if (!state.initialized) return;
  scheduleStudioAutosave(buildStudioProject(state));
});