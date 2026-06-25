import type { MediaAsset } from '@/lib/types/media-library';
import type { SavedProjectRecord } from '@/lib/storage/saved-projects-store';
import type { Setup, StudioProject } from '@/lib/types/studio';
import { buildStudioProject } from '@/lib/storage/studio-state';

export interface ProjectSummaryStats {
  locationCount: number;
  setupCount: number;
  shotCount: number;
  characterCount: number;
  diskBytes: number | null;
}

export function countProjectShots(setups: readonly Setup[]): number {
  return setups.reduce((total, setup) => total + setup.shots.length, 0);
}

export function getProjectStatsFromStudioProject(
  project: StudioProject,
  globalMediaLibrary: readonly MediaAsset[] = [],
): ProjectSummaryStats {
  const setups = project.setups ?? [];
  return {
    locationCount: project.locations?.length ?? 0,
    setupCount: setups.length,
    shotCount: countProjectShots(setups),
    characterCount: project.characters?.length ?? 0,
    diskBytes: estimateSnapshotDiskBytes(project, globalMediaLibrary),
  };
}

export function getSavedProjectStats(record: SavedProjectRecord): ProjectSummaryStats {
  if (record.snapshot) {
    return getProjectStatsFromStudioProject(
      record.snapshot.project,
      record.snapshot.globalMediaLibrary,
    );
  }

  if (record.location) {
    return {
      locationCount: 0,
      setupCount: 0,
      shotCount: 0,
      characterCount: 0,
      diskBytes: null,
    };
  }

  return {
    locationCount: 0,
    setupCount: 0,
    shotCount: 0,
    characterCount: 0,
    diskBytes: null,
  };
}

export function getLiveProjectStats(state: {
  project: StudioProject['project'];
  scenes: StudioProject['scenes'];
  currentSceneId: number;
  setups: Setup[];
  currentSetupId: number;
  currentCoverageShotId: number;
  characters: StudioProject['characters'];
  locations: StudioProject['locations'];
  mediaLibrary: MediaAsset[];
  shotWorkflowSnapshots: StudioProject['shotWorkflowSnapshots'];
  globalMediaLibrary: readonly MediaAsset[];
}): ProjectSummaryStats {
  const project = buildStudioProject(state);
  return getProjectStatsFromStudioProject(project, state.globalMediaLibrary);
}

function estimateSnapshotDiskBytes(
  project: StudioProject,
  globalMediaLibrary: readonly MediaAsset[],
): number {
  try {
    const payload = JSON.stringify({ project, globalMediaLibrary });
    return new TextEncoder().encode(payload).byteLength;
  } catch {
    return 0;
  }
}

export function formatProjectDiskSize(bytes: number | null | undefined): string {
  if (bytes == null) return '—';
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'] as const;
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const precision = value >= 100 || unitIndex === 0 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
}

export const PROJECT_SUMMARY_STAT_LABELS = [
  { key: 'locationCount' as const, label: 'Locations' },
  { key: 'setupCount' as const, label: 'Setups' },
  { key: 'shotCount' as const, label: 'Shots' },
  { key: 'characterCount' as const, label: 'Characters' },
];
