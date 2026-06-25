import { getShotThumbnailUrl } from '@/lib/studio/shot-display';
import { getResolvedCurrentShot } from '@/lib/studio/store-hierarchy';
import type { SavedProjectRecord } from '@/lib/storage/saved-projects-store';
import { resolveReferenceDisplayUrl } from '@/lib/storage/reference-url';
import type { MediaAsset } from '@/lib/types/media-library';
import type { CoverageShot, Setup, StudioProject } from '@/lib/types/studio';

function firstMediaThumbnail(assets: readonly MediaAsset[]): string | null {
  for (const asset of assets) {
    const url = asset.thumbnailUrl ?? asset.url;
    if (url) return url;
  }
  return null;
}

function getCoverageThumbnailUrl(coverage: CoverageShot, setup?: Setup): string | null {
  const videos = coverage.generatedVideos ?? [];
  if (videos.length > 0) {
    const index = coverage.activeVideoIndex ?? videos.length - 1;
    const active = videos[Math.min(Math.max(0, index), videos.length - 1)];
    if (active?.posterUrl) return active.posterUrl;
  }
  if (coverage.thumbnail) return coverage.thumbnail;
  if (coverage.previewFrameUrl) return coverage.previewFrameUrl;
  if (coverage.bakedStartFrame) return coverage.bakedStartFrame;
  if (coverage.bakedIntermediateFrame) return coverage.bakedIntermediateFrame;
  const ref = setup?.references?.find(Boolean);
  if (ref) return resolveReferenceDisplayUrl(ref);
  return null;
}

export function getProjectThumbnailFromSnapshot(
  project: StudioProject,
  globalMediaLibrary: readonly MediaAsset[] = [],
): string | null {
  const setups = project.setups ?? [];
  const setup = setups.find((entry) => entry.id === project.currentSetupId) ?? setups[0];
  if (setup) {
    const coverage = setup.shots.find((shot) => shot.id === project.currentCoverageShotId) ?? setup.shots[0];
    if (coverage) {
      const url = getCoverageThumbnailUrl(coverage, setup);
      if (url) return url;
    }
  }

  for (const entry of setups) {
    for (const coverage of entry.shots) {
      const url = getCoverageThumbnailUrl(coverage, entry);
      if (url) return url;
    }
  }

  return firstMediaThumbnail([...(globalMediaLibrary ?? []), ...(project.mediaLibrary ?? [])]);
}

export function getSavedProjectThumbnailUrl(record: SavedProjectRecord): string | null {
  if (!record.snapshot) return null;
  return getProjectThumbnailFromSnapshot(record.snapshot.project, record.snapshot.globalMediaLibrary);
}

export function getLiveProjectThumbnailUrl(state: {
  setups: Setup[];
  currentSetupId: number;
  currentCoverageShotId: number;
  globalMediaLibrary: readonly MediaAsset[];
}): string | null {
  const shot = getResolvedCurrentShot(state.setups, state.currentSetupId, state.currentCoverageShotId);
  const fromShot = getShotThumbnailUrl(shot);
  if (fromShot) return fromShot;
  return firstMediaThumbnail(state.globalMediaLibrary);
}
