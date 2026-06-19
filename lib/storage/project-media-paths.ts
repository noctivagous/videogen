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

  shot.references.forEach((ref, refIndex) => {
    if (ref) visit(`${base}.references.${refIndex}`, ref);
  });

  shot.generatedVideos?.forEach((video, videoIndex) => {
    visit(`${base}.generatedVideos.${videoIndex}.url`, video.url);
    if (video.posterUrl) visit(`${base}.generatedVideos.${videoIndex}.posterUrl`, video.posterUrl);
  });
}

export function collectProjectMediaUploads(project: StudioProject): ProjectMediaUpload[] {
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

  return uploads;
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