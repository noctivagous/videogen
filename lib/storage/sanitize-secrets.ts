import type { StudioProject } from '@/lib/types/studio';

/** Top-level keys that must never be written to project files or autosave. */
const FORBIDDEN_PROJECT_ROOT_KEYS = new Set([
  'ai',
  'configured',
  'customProviders',
  'defaultProvider',
  'apiKey',
  'apiKeys',
  'secrets',
]);

function stripForbiddenKeys<T extends Record<string, unknown>>(obj: T): T {
  const next = { ...obj };
  for (const key of Object.keys(next)) {
    if (FORBIDDEN_PROJECT_ROOT_KEYS.has(key)) {
      delete next[key];
    }
  }
  return next;
}

/** Ensure persisted studio projects never contain provider credentials. */
export function sanitizeProjectForPersistence(project: StudioProject): StudioProject {
  const clean = stripForbiddenKeys(project as StudioProject & Record<string, unknown>);
  return {
    schemaVersion: clean.schemaVersion,
    project: { ...clean.project },
    shots: clean.shots,
    currentShot: clean.currentShot,
  };
}