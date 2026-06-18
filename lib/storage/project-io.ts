import { sanitizeProjectForPersistence } from '@/lib/storage/sanitize-secrets';
import { PROJECT_SCHEMA_VERSION } from '@/lib/storage/studio-state';
import type { StudioProject } from '@/lib/types/studio';

export type LoadProjectResult =
  | { status: 'success'; data: StudioProject }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

export function validateStudioProject(data: unknown): StudioProject | null {
  if (!data || typeof data !== 'object') return null;
  const p = data as StudioProject;
  if (!p.project?.name || !Array.isArray(p.shots) || p.shots.length === 0) return null;
  return sanitizeProjectForPersistence({
    schemaVersion: p.schemaVersion,
    project: p.project,
    shots: p.shots,
    currentShot: p.currentShot ?? p.shots[0]?.id ?? 1,
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
            resolve({ status: 'error', message: 'Invalid project file — missing project name or shots' });
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