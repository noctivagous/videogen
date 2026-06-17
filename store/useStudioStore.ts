'use client';

import { create } from 'zustand';
import {
  DEFAULT_FRAME_COMPOSITION,
  LEGACY_FIELD_SIZE_MIGRATION,
  SINGLE_ONLY_COVERAGE,
} from '@/lib/constants/camera';
import { RESOLUTION_PRESETS } from '@/lib/constants/resolutions';
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
  ToastType,
} from '@/lib/types/studio';

const INITIAL_SHOTS: Shot[] = [
  { id: 1, name: 'Shot 01', duration: 5, thumbnail: null, active: true, references: [null, null, null], referenceRoles: ['Subject', 'Style', 'Motion'], frameComposition: { guide: 'rule-of-thirds', placement: 'middle-right', headroom: 'normal', showOverlay: true } },
  { id: 2, name: 'Shot 02', duration: 3, thumbnail: null, active: false, references: [null, null, null], referenceRoles: ['Subject', 'Style', 'Motion'], frameComposition: { guide: 'rule-of-thirds', placement: 'center', headroom: 'normal', showOverlay: true } },
  { id: 3, name: 'Shot 03', duration: 7, thumbnail: null, active: false, references: [null, null, null], referenceRoles: ['Subject', 'Style', 'Motion'], frameComposition: { guide: 'rule-of-thirds', placement: 'middle-left', headroom: 'normal', showOverlay: true } },
];

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
    referenceRoles: shot.referenceRoles || ['Subject', 'Style', 'Motion'],
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

  init: () => void;
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
  project: {
    name: 'Untitled_Project_01',
    resolution: '854x480',
    aspectRatio: '16:9',
    fps: 30,
    duration: 5,
  },
  camera: migrateCamera({
    fieldSize: 'ms',
    subjectCount: '1s',
    coverage: 'clean',
    lensType: 'standard',
    focalLength: 50,
    angle: 'eye-level',
    movement: 'static',
    aperture: 2.8,
    dof: 'shallow',
  }),
  lighting: {
    keyLight: 'soft',
    intensity: 80,
    style: 'natural',
    timeOfDay: 'noon',
    colorTemp: 5500,
    atmosphere: 'clear',
  },
  motion: {
    intensity: 'subtle',
    subjectAction: 'still',
    stabilization: 70,
    motionBlur: 'low',
  },
  prompt: '',
  shots: migrateShots(INITIAL_SHOTS),
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

  init() {
    if (get().initialized) return;
    const ai = loadAIState();
    set({ ai, initialized: true });
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
    const newShot: Shot = {
      id: newId,
      name: `Shot ${String(newId).padStart(2, '0')}`,
      duration: 5,
      thumbnail: null,
      active: false,
      references: [null, null, null],
      referenceRoles: ['Subject', 'Style', 'Motion'],
      frameComposition: current
        ? { ...current.frameComposition }
        : { ...DEFAULT_FRAME_COMPOSITION },
    };
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
    const roles = ['Subject', 'Style', 'Motion', 'Depth', 'Canny', 'None'] as const;
    const current = shot.referenceRoles[index];
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