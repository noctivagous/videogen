import type { MediaAsset } from '@/lib/types/media-library';
import type { GeneratedVideo } from '@/lib/types/studio';

const CREATED_AT_MATCH_WINDOW_MS = 5 * 60 * 1000;

export function findMediaAssetForGeneratedVideo(
  mediaLibrary: MediaAsset[],
  video: GeneratedVideo,
  shotId: number,
): MediaAsset | undefined {
  if (video.mediaLibraryAssetId) {
    const linked = mediaLibrary.find((asset) => asset.id === video.mediaLibraryAssetId);
    if (linked) return linked;
  }

  const byUrl = mediaLibrary.find((asset) => asset.type === 'video' && asset.url === video.url);
  if (byUrl) return byUrl;

  const shotVideos = mediaLibrary.filter(
    (asset) => asset.type === 'video' && asset.metadata.usedInShots.includes(shotId),
  );
  if (shotVideos.length === 0) return undefined;
  if (shotVideos.length === 1) return shotVideos[0];

  const byCreatedAt = shotVideos
    .filter((asset) => Math.abs(asset.createdAt - video.createdAt) <= CREATED_AT_MATCH_WINDOW_MS)
    .sort((a, b) => Math.abs(a.createdAt - video.createdAt) - Math.abs(b.createdAt - video.createdAt));

  return byCreatedAt[0] ?? shotVideos[shotVideos.length - 1];
}

export function resolveGeneratedVideoMediaAssetId(
  mediaLibrary: MediaAsset[],
  video: GeneratedVideo,
  shotId: number,
): string | null {
  return findMediaAssetForGeneratedVideo(mediaLibrary, video, shotId)?.id ?? null;
}
