import { sanitizeProjectForPersistence } from '@/lib/storage/sanitize-secrets';
import type { StudioProject } from '@/lib/types/studio';

export const PROJECT_SCHEMA_VERSION = 3;
export const STUDIO_STATE_KEY = 'vgen_studio_draft';

const MAX_REF_BYTES = 200_000;

function stripOversizedRefs(project: StudioProject): StudioProject {
  const shots = project.shots.map((shot) => ({
    ...shot,
    references: shot.references.map((ref) => {
      if (!ref || !ref.startsWith('data:')) return ref;
      return ref.length > MAX_REF_BYTES ? null : ref;
    }),
  }));
  return { ...project, shots };
}

export function buildStudioProject(state: {
  project: StudioProject['project'];
  shots: StudioProject['shots'];
  currentShot: number;
}): StudioProject {
  return sanitizeProjectForPersistence({
    schemaVersion: PROJECT_SCHEMA_VERSION,
    project: state.project,
    shots: state.shots,
    currentShot: state.currentShot,
  });
}

export function saveStudioDraft(project: StudioProject): void {
  if (typeof window === 'undefined') return;
  try {
    const trimmed = stripOversizedRefs(project);
    localStorage.setItem(STUDIO_STATE_KEY, JSON.stringify(trimmed));
  } catch {
    // quota exceeded — skip silently
  }
}

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

export function clearStudioDraft(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STUDIO_STATE_KEY);
}

let autosaveTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleStudioAutosave(project: StudioProject): void {
  if (typeof window === 'undefined') return;
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => saveStudioDraft(project), 800);
}