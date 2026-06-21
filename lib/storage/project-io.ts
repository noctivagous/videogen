import { migrateStudioProject } from '@/lib/studio/project-migration';
import { DEFAULT_SHOT_DEFAULTS } from '@/lib/studio/shot-settings';
import { sanitizeProjectForPersistence } from '@/lib/storage/sanitize-secrets';
import { PROJECT_SCHEMA_VERSION } from '@/lib/storage/studio-state';
import type { StudioProject } from '@/lib/types/studio';

export type LoadProjectResult =
  | { status: 'success'; data: StudioProject }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

function hasValidProjectContent(data: StudioProject): boolean {
  if (!data.project?.name) return false;
  if (data.setups?.length) return true;
  if (data.shots?.length) return true;
  return false;
}

export function validateStudioProject(data: unknown): StudioProject | null {
  if (!data || typeof data !== 'object') return null;
  const raw = data as StudioProject;
  if (!hasValidProjectContent(raw)) return null;

  const migrated = migrateStudioProject(raw, DEFAULT_SHOT_DEFAULTS);
  return sanitizeProjectForPersistence({
    schemaVersion: migrated.schemaVersion ?? PROJECT_SCHEMA_VERSION,
    project: migrated.project,
    scenes: migrated.scenes,
    currentSceneId: migrated.currentSceneId,
    setups: migrated.setups,
    currentSetupId: migrated.currentSetupId,
    currentCoverageShotId: migrated.currentCoverageShotId,
    ...(migrated.mediaLibrary ? { mediaLibrary: migrated.mediaLibrary } : {}),
    ...(migrated.shotWorkflowSnapshots ? { shotWorkflowSnapshots: migrated.shotWorkflowSnapshots } : {}),
  });
}

export function downloadProject(project: StudioProject): void {
  const dataStr = JSON.stringify(sanitizeProjectForPersistence(project), null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${project.project.name}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function pickAndLoadProject(): Promise<LoadProjectResult> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve({ status: 'cancelled' });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          const data = validateStudioProject(parsed);
          if (!data) {
            resolve({ status: 'error', message: 'Invalid project file — missing project name or setups' });
            return;
          }
          resolve({ status: 'success', data: { ...data, schemaVersion: data.schemaVersion ?? PROJECT_SCHEMA_VERSION } });
        } catch {
          resolve({ status: 'error', message: 'Could not parse project file — is it valid JSON?' });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
}
