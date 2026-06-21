import type { MediaAsset } from '@/lib/types/media-library';
import type { StudioProject } from '@/lib/types/studio';

export type ProjectMediaUpload =
  | { path: string; kind: 'inline'; dataUrl: string }
  | { path: string; kind: 'remote'; url: string };

const STOCK_PREFIX = '/stock/';
const SERVER_MEDIA_PREFIX = '/api/project-storage/media/';

export function isStockAssetUrl(url: string): boolean {
  return url.startsWith(STOCK_PREFIX);
}

export function isServerStoredMediaUrl(url: string): boolean {
  return url.startsWith(SERVER_MEDIA_PREFIX);
}

export function isInlineMediaUrl(url: string): boolean {
  return url.startsWith('data:') || url.startsWith('blob:');
}

export function isRemoteProviderUrl(url: string): boolean {
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
  if (isServerStoredMediaUrl(url)) return false;
  return true;
}

function walkShotUrls(
  shot: StudioProject['shots'][number],
  shotIndex: number,
  visit: (path: string, url: string) => void,
): void {
  const base = `shots.${shotIndex}`;
  if (shot.thumbnail) visit(`${base}.thumbnail`, shot.thumbnail);
  if (shot.videoUrl) visit(`${base}.videoUrl`, shot.videoUrl);
  if (shot.previewFrameUrl) visit(`${base}.previewFrameUrl`, shot.previewFrameUrl);
  if (shot.bakedStartFrame) visit(`${base}.bakedStartFrame`, shot.bakedStartFrame);
  if (shot.bakedIntermediateFrame) visit(`${base}.bakedIntermediateFrame`, shot.bakedIntermediateFrame);

  shot.references.forEach((ref, refIndex) => {
    if (ref) visit(`${base}.references.${refIndex}`, ref);
  });
  shot.transformedReferences?.forEach((ref, refIndex) => {
    if (ref) visit(`${base}.transformedReferences.${refIndex}`, ref);
  });

  shot.generatedVideos?.forEach((video, videoIndex) => {
    visit(`${base}.generatedVideos.${videoIndex}.url`, video.url);
    if (video.posterUrl) visit(`${base}.generatedVideos.${videoIndex}.posterUrl`, video.posterUrl);
  });
}

export function filterProjectMediaUploads(
  uploads: ProjectMediaUpload[],
  options: { ingestRemoteUrls: boolean },
): ProjectMediaUpload[] {
  if (options.ingestRemoteUrls) return uploads;
  return uploads.filter((upload) => upload.kind !== 'remote');
}

export function collectProjectMediaUploads(
  project: StudioProject,
  globalMediaLibrary: MediaAsset[] = [],
): ProjectMediaUpload[] {
  const uploads: ProjectMediaUpload[] = [];

  project.shots.forEach((shot, shotIndex) => {
    walkShotUrls(shot, shotIndex, (path, url) => {
      if (isStockAssetUrl(url) || isServerStoredMediaUrl(url)) return;
      if (isInlineMediaUrl(url)) {
        uploads.push({ path, kind: 'inline', dataUrl: url });
      } else if (isRemoteProviderUrl(url)) {
        uploads.push({ path, kind: 'remote', url });
      }
    });
  });

  project.mediaLibrary?.forEach((asset, assetIndex) => {
    collectAssetUploads(uploads, `mediaLibrary.${assetIndex}`, asset);
  });

  globalMediaLibrary.forEach((asset, assetIndex) => {
    collectAssetUploads(uploads, `globalMediaLibrary.${assetIndex}`, asset);
  });

  return uploads;
}

function collectAssetUploads(
  uploads: ProjectMediaUpload[],
  base: string,
  asset: { url: string; thumbnailUrl?: string },
): void {
  if (isInlineMediaUrl(asset.url)) {
    uploads.push({ path: `${base}.url`, kind: 'inline', dataUrl: asset.url });
  }
  if (asset.thumbnailUrl && isInlineMediaUrl(asset.thumbnailUrl)) {
    uploads.push({ path: `${base}.thumbnailUrl`, kind: 'inline', dataUrl: asset.thumbnailUrl });
  }
}

export function setValueAtPath(root: StudioProject, path: string, value: string): StudioProject {
  const parts = path.split('.');
  const clone = structuredClone(root);
  let cursor: Record<string, unknown> = clone as unknown as Record<string, unknown>;

  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const next = cursor[key];
    if (next === undefined || next === null) return clone;
    cursor = next as Record<string, unknown>;
  }

  cursor[parts[parts.length - 1]] = value;
  return clone;
}