import { sanitizeProjectForPersistence } from '@/lib/storage/sanitize-secrets';
import type { StudioProject } from '@/lib/types/studio';

export const PROJECT_SCHEMA_VERSION = 18;
export const STUDIO_STATE_KEY = 'vgen_studio_draft';

export function buildStudioProject(state: {
  project: StudioProject['project'];
  scenes: StudioProject['scenes'];
  currentSceneId: number;
  setups: StudioProject['setups'];
  currentSetupId: number;
  currentCoverageShotId: number;
  mediaLibrary?: StudioProject['mediaLibrary'];
  shotWorkflowSnapshots?: StudioProject['shotWorkflowSnapshots'];
}): StudioProject {
  return sanitizeProjectForPersistence({
    schemaVersion: PROJECT_SCHEMA_VERSION,
    project: state.project,
    scenes: state.scenes,
    currentSceneId: state.currentSceneId,
    setups: state.setups,
    currentSetupId: state.currentSetupId,
    currentCoverageShotId: state.currentCoverageShotId,
    mediaLibrary: state.mediaLibrary ?? [],
    shotWorkflowSnapshots: state.shotWorkflowSnapshots ?? [],
  });
}

/** @deprecated Studio draft autosave uses File API — kept for one-time localStorage migration. */
export function loadStudioDraft(): StudioProject | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STUDIO_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StudioProject;
  } catch {
    return null;
  }
}

/** @deprecated */
export function clearStudioDraft(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STUDIO_STATE_KEY);
}