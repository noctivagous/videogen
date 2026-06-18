'use client';

import { create } from 'zustand';
import {
  DEFAULT_FRAME_COMPOSITION,
  LEGACY_FIELD_SIZE_MIGRATION,
  normalizeReferenceRole,
  SINGLE_ONLY_COVERAGE,
} from '@/lib/constants/camera';
import { RESOLUTION_PRESETS } from '@/lib/constants/resolutions';
import {
  STOCK_CAMERA,
  STOCK_LIGHTING,
  STOCK_MOTION,
  STOCK_PROJECT,
  STOCK_PROMPT,
  STOCK_REFERENCE_ROLES,
  STOCK_SHOTS,
  createStockShot,
} from '@/lib/constants/stock-project';
import { applyFrameCompositionSmartDefaults } from '@/lib/studio/composition';
import {
  createCustomProvider,
  DEFAULT_AI_STATE,
  getCurrentProviderName,
  loadAIState,
  saveAIState,
} from '@/lib/storage/ai-settings';
import { downloadProject, pickAndLoadProject } from '@/lib/storage/project-io';
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

function migrateCamera(camera: CameraSettings): CameraSettings {
  const legacy = LEGACY_FIELD_SIZE_MIGRATION[camera.fieldSize];
  const migrated = legacy ? { ...camera, ...legacy } : { ...camera };
  if (!migrated.subjectCount) migrated.subjectCount = '1s';
  if (!migrated.coverage) migrated.coverage = 'clean';
  return migrated;
}

function migrateShots(shots: Shot[]): Shot[] {
  return shots.map((shot) => ({
    ...shot,
    references: shot.references || [null, null, null],
    referenceRoles: (shot.referenceRoles || [...STOCK_REFERENCE_ROLES]).map((role) =>
      normalizeReferenceRole(role as string),
    ),
    frameComposition: {
      ...DEFAULT_FRAME_COMPOSITION,
      ...shot.frameComposition,
    },
  }));
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

interface StudioStore {
  project: ProjectSettings;
  camera: CameraSettings;
  lighting: LightingSettings;
  motion: MotionSettings;
  prompt: string;
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
  setPrompt: (prompt: string) => void;
  setShotFrameComposition: (patch: Partial<FrameComposition>) => void;
  toggleCompositionOverlay: () => void;
  handleCameraCompositionChange: (changed: 'subjectCount' | 'coverage') => void;

  selectShot: (id: number) => void;
  deleteShot: (id: number) => void;
  addShot: () => void;
  setReference: (index: number, dataUrl: string | null) => void;
  cycleReferenceRole: (index: number) => void;

  generate: () => void;
  saveProject: () => void;
  loadProject: () => Promise<void>;
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
  project: { ...STOCK_PROJECT },
  camera: migrateCamera({ ...STOCK_CAMERA }),
  lighting: { ...STOCK_LIGHTING },
  motion: { ...STOCK_MOTION },
  prompt: STOCK_PROMPT,
  shots: migrateShots(STOCK_SHOTS),
  currentShot: 1,
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
    // v1: vector blocking preview only — 3D toggle deferred until ref-based posing ships
    set({ ai, previewMode: 'vector', initialized: true });
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
    return {
      project: state.project,
      camera: state.camera,
      lighting: state.lighting,
      motion: state.motion,
      prompt: state.prompt,
      shots: state.shots,
      currentShot: state.currentShot,
      shot: getCurrentShotFromList(state.shots, state.currentShot),
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
    set((s) => ({ camera: { ...s.camera, ...patch } }));
  },

  setLighting(patch) {
    set((s) => ({ lighting: { ...s.lighting, ...patch } }));
  },

  setMotion(patch) {
    set((s) => ({ motion: { ...s.motion, ...patch } }));
  },

  setPrompt(prompt) {
    set({ prompt });
  },

  setShotFrameComposition(patch) {
    const shot = get().getCurrentShot();
    if (!shot) return;
    Object.assign(shot.frameComposition, patch);
    set({ shots: [...get().shots] });
  },

  toggleCompositionOverlay() {
    const shot = get().getCurrentShot();
    if (!shot) return;
    shot.frameComposition.showOverlay = !shot.frameComposition.showOverlay;
    set({ shots: [...get().shots] });
  },

  handleCameraCompositionChange(changed) {
    const { camera } = get();
    let next = { ...camera };

    if (changed === 'coverage' && SINGLE_ONLY_COVERAGE.has(camera.coverage)) {
      next.subjectCount = '1s';
    }

    if (changed === 'subjectCount' && next.subjectCount !== '1s') {
      if (SINGLE_ONLY_COVERAGE.has(next.coverage)) {
        next.coverage = 'clean';
      }
    }

    set({ camera: next });

    const shot = get().getCurrentShot();
    if (shot) {
      applyFrameCompositionSmartDefaults(next, shot.frameComposition);
      set({ shots: [...get().shots] });
    }
  },

  selectShot(id) {
    set((s) => ({
      currentShot: id,
      shots: s.shots.map((shot) => ({ ...shot, active: shot.id === id })),
    }));
    get().showToast(`Switched to Shot ${id}`);
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
    }
    set({ shots: nextShots, currentShot: nextCurrent });
    get().showToast('Shot deleted');
  },

  addShot() {
    const { shots } = get();
    const current = get().getCurrentShot();
    const newId = Math.max(...shots.map((s) => s.id)) + 1;
    const newShot: Shot = createStockShot(
      newId,
      `Shot ${String(newId).padStart(2, '0')}`,
      false,
      5,
      current?.frameComposition.placement ?? 'center',
      Boolean(current?.references.some(Boolean)),
    );
    if (current?.references.some(Boolean)) {
      newShot.references = [...current.references];
      newShot.referenceRoles = [...current.referenceRoles];
    }
    newShot.frameComposition = current
      ? { ...current.frameComposition }
      : { ...DEFAULT_FRAME_COMPOSITION };
    set({ shots: [...shots, newShot] });
    get().showToast('New shot added');
  },

  setReference(index, dataUrl) {
    const shot = get().getCurrentShot();
    if (!shot) return;
    shot.references[index] = dataUrl;
    set({ shots: [...get().shots] });
    if (dataUrl) get().showToast('Reference image added');
  },

  cycleReferenceRole(index) {
    const shot = get().getCurrentShot();
    if (!shot) return;
    const roles = ['Subject', 'Backdrop', 'Motion', 'Depth', 'Canny', 'None'] as const;
    const current = normalizeReferenceRole(shot.referenceRoles[index] ?? 'None');
    const nextIdx = (roles.indexOf(current) + 1) % roles.length;
    shot.referenceRoles[index] = roles[nextIdx];
    set({ shots: [...get().shots] });
  },

  generate() {
    const { prompt, project } = get();
    if (!prompt.trim()) {
      get().showToast('Please enter a prompt first', 'error');
      return;
    }

    set({ isGenerating: true, showPreviewSuccess: false });
    const totalFrames = project.duration * project.fps;
    let currentFrame = 0;

    const interval = setInterval(() => {
      currentFrame += Math.floor(totalFrames / 20);
      if (currentFrame >= totalFrames) {
        currentFrame = totalFrames;
        clearInterval(interval);

        setTimeout(() => {
          const ai = get().ai;
          set({
            isGenerating: false,
            showPreviewSuccess: true,
            previewSuccessProvider: `Using ${getCurrentProviderName(ai)}`,
            previewSuccessPrompt: get().prompt,
          });
          get().showToast('Video generation complete!');

          setTimeout(() => set({ showPreviewSuccess: false }), 3500);
        }, 500);
      }
      set({ progressText: `Processing frame ${currentFrame} of ${totalFrames}` });
    }, 150);
  },

  saveProject() {
    const state = get();
    const project: StudioProject = {
      project: state.project,
      camera: state.camera,
      lighting: state.lighting,
      motion: state.motion,
      prompt: state.prompt,
      shots: state.shots,
      currentShot: state.currentShot,
    };
    downloadProject(project);
    get().showToast('Project saved successfully');
  },

  async loadProject() {
    const data = await pickAndLoadProject();
    if (!data) {
      get().showToast('Failed to load project', 'error');
      return;
    }

    const project = {
      ...data.project,
      aspectRatio: data.project.aspectRatio || '16:9',
    };

    set({
      project: ensureResolution(project),
      camera: migrateCamera(data.camera),
      lighting: data.lighting,
      motion: data.motion,
      prompt: data.prompt || '',
      shots: migrateShots(data.shots),
      currentShot: data.currentShot || data.shots[0]?.id || 1,
    });
    get().showToast('Project loaded successfully');
  },

  exportVideo() {
    get().showToast('Export started... Video will be ready shortly');
    setTimeout(() => get().showToast('Video exported successfully!'), 2000);
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
    if (ai.defaultProvider === id) ai.defaultProvider = 'xai';
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