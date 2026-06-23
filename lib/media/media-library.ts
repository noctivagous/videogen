import { normalizeWorkflow } from '@/lib/constants/workflows';
import { getWorkflowReferenceSteps } from '@/lib/studio/workflow';
import type {
  MediaAsset,
  MediaAssetType,
  MediaWorkflowOrigin,
  ShotWorkflowSnapshot,
} from '@/lib/types/media-library';
import type { Shot } from '@/lib/types/studio';

export interface CreateMediaAssetOptions {
  type: MediaAssetType;
  workflowOrigin?: MediaWorkflowOrigin;
  metadata?: Partial<MediaAsset['metadata']>;
}

function parseDataUrl(dataUrl: string): { mime: string; bytes: Uint8Array } | null {
  const match = dataUrl.match(/^data:([^;,]+)?(?:;base64)?,([\s\S]*)$/);
  if (!match) return null;
  const mime = match[1] || 'application/octet-stream';
  const payload = match[2];
  if (dataUrl.includes(';base64')) {
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return { mime, bytes };
  }
  const encoded = encodeURIComponent(payload);
  const decoded = decodeURIComponent(encoded);
  return { mime: mime, bytes: new TextEncoder().encode(decoded) };
}

export async function blobFromDataUrl(dataUrl: string): Promise<Blob | null> {
  if (dataUrl.startsWith('blob:')) {
    try {
      return await fetch(dataUrl).then((r) => r.blob());
    } catch {
      return null;
    }
  }
  if (!dataUrl.startsWith('data:')) return null;
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) return null;
  return new Blob([Uint8Array.from(parsed.bytes)], { type: parsed.mime });
}

/** Fetch a blob from any URL — data URL, blob URL, or regular HTTP/path URL. */
export async function blobFromUrl(url: string): Promise<Blob | null> {
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return blobFromDataUrl(url);
  }
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.blob();
  } catch {
    return null;
  }
}

export async function createMediaAssetFromUrl(
  library: MediaAsset[],
  url: string,
  opts: CreateMediaAssetOptions,
): Promise<{ library: MediaAsset[]; asset: MediaAsset }> {
  const blob = await blobFromUrl(url);
  if (!blob) throw new Error('Could not fetch image data');

  const id = await hashBlobContent(blob);
  const existing = library.find((asset) => asset.id === id);
  if (existing) return { library, asset: existing };

  // Store as a data URL so the asset survives page reloads.
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });

  const thumbnailUrl = await generateThumbnailDataUrl(dataUrl);
  const asset: MediaAsset = {
    id,
    type: opts.type,
    url: dataUrl,
    thumbnailUrl,
    createdAt: Date.now(),
    workflowOrigin: opts.workflowOrigin,
    metadata: {
      usedInShots: [],
      ...opts.metadata,
    },
  };

  return { library: [...library, asset], asset };
}

export async function hashBlobContent(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function generateThumbnailDataUrl(sourceUrl: string, maxSize = 128): Promise<string | undefined> {
  if (typeof document === 'undefined') return undefined;
  const blob = await blobFromDataUrl(sourceUrl);
  if (!blob) return undefined;

  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return undefined;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return canvas.toDataURL('image/webp', 0.75);
}

export async function createMediaAssetFromDataUrl(
  library: MediaAsset[],
  dataUrl: string,
  opts: CreateMediaAssetOptions,
): Promise<{ library: MediaAsset[]; asset: MediaAsset }> {
  const blob = await blobFromDataUrl(dataUrl);
  if (!blob) throw new Error('Could not read image data');

  const id = await hashBlobContent(blob);
  const existing = library.find((asset) => asset.id === id);
  if (existing) return { library, asset: existing };

  const thumbnailUrl = await generateThumbnailDataUrl(dataUrl);
  const asset: MediaAsset = {
    id,
    type: opts.type,
    url: dataUrl,
    thumbnailUrl,
    createdAt: Date.now(),
    workflowOrigin: opts.workflowOrigin,
    metadata: {
      usedInShots: [],
      ...opts.metadata,
    },
  };

  return { library: [...library, asset], asset };
}

export function linkAssetToShot(library: MediaAsset[], assetId: string, shotId: number): MediaAsset[] {
  return library.map((asset) => {
    if (asset.id !== assetId) return asset;
    const usedInShots = asset.metadata.usedInShots.includes(shotId)
      ? asset.metadata.usedInShots
      : [...asset.metadata.usedInShots, shotId];
    return {
      ...asset,
      metadata: { ...asset.metadata, usedInShots },
    };
  });
}

export function unlinkAssetFromShot(library: MediaAsset[], assetId: string, shotId: number): MediaAsset[] {
  return library.map((asset) => {
    if (asset.id !== assetId) return asset;
    return {
      ...asset,
      metadata: {
        ...asset.metadata,
        usedInShots: asset.metadata.usedInShots.filter((id) => id !== shotId),
      },
    };
  });
}

export function findAssetsByType(
  library: MediaAsset[],
  type: MediaAssetType | MediaAssetType[],
  filters?: { workflowOrigin?: MediaWorkflowOrigin; shotId?: number },
): MediaAsset[] {
  const types = Array.isArray(type) ? type : [type];
  return library.filter((asset) => {
    if (!types.includes(asset.type)) return false;
    if (filters?.workflowOrigin && asset.workflowOrigin !== filters.workflowOrigin) return false;
    if (filters?.shotId != null && !asset.metadata.usedInShots.includes(filters.shotId)) return false;
    return true;
  });
}

export function getMediaAsset(library: MediaAsset[], assetId: string): MediaAsset | undefined {
  return library.find((asset) => asset.id === assetId);
}

export function prependSavedBakedFrameId(
  shot: Shot,
  assetId: string,
): Pick<Shot, 'savedBakedFrameAssetIds' | 'linkedAssetIds'> {
  const prior = shot.savedBakedFrameAssetIds ?? [];
  const savedBakedFrameAssetIds = [assetId, ...prior.filter((id) => id !== assetId)];
  return {
    savedBakedFrameAssetIds,
    linkedAssetIds: { ...(shot.linkedAssetIds ?? {}), bakedFrame: assetId },
  };
}

export function createWorkflowSnapshot(
  shot: Shot,
  assetIds: ShotWorkflowSnapshot['assetIds'],
): ShotWorkflowSnapshot {
  const steps = getWorkflowReferenceSteps(shot, shot.lighting);
  const checklistProgress = Object.fromEntries(steps.map((step) => [step.id, step.done])) as ShotWorkflowSnapshot['checklistProgress'];

  return {
    id: crypto.randomUUID(),
    workflow: shot.workflow ?? 'bake-start-frame',
    shotId: shot.id,
    shotName: shot.name,
    createdAt: Date.now(),
    checklistProgress,
    assetIds,
    mannequins: shot.mannequins,
  };
}

export async function ingestBakedFramesForShot(
  library: MediaAsset[],
  shot: Shot,
  opts: { workflowOrigin?: MediaWorkflowOrigin; linkToShot?: boolean } = {},
): Promise<{
  library: MediaAsset[];
  bakedFrameId?: string;
  intermediateFrameId?: string;
  shotPatch: Pick<Shot, 'savedBakedFrameAssetIds' | 'linkedAssetIds'>;
}> {
  let nextLibrary = library;
  let bakedFrameId: string | undefined;
  let intermediateFrameId: string | undefined;
  let shotPatch: Pick<Shot, 'savedBakedFrameAssetIds' | 'linkedAssetIds'> = {};

  if (shot.bakedStartFrame) {
    const baked = await createMediaAssetFromDataUrl(nextLibrary, shot.bakedStartFrame, {
      type: 'baked-frame',
      workflowOrigin: opts.workflowOrigin ?? normalizeWorkflow(shot),
    });
    nextLibrary = baked.library;
    bakedFrameId = baked.asset.id;
    if (opts.linkToShot !== false) {
      nextLibrary = linkAssetToShot(nextLibrary, baked.asset.id, shot.id);
    }
    shotPatch = prependSavedBakedFrameId(shot, baked.asset.id);
  }

  if (
    shot.bakedIntermediateFrame &&
    shot.bakedIntermediateFrame !== shot.bakedStartFrame
  ) {
    const intermediate = await createMediaAssetFromDataUrl(nextLibrary, shot.bakedIntermediateFrame, {
      type: 'intermediate-frame',
      workflowOrigin: opts.workflowOrigin ?? normalizeWorkflow(shot),
      metadata: bakedFrameId ? { parentAssetId: bakedFrameId } : undefined,
    });
    nextLibrary = intermediate.library;
    intermediateFrameId = intermediate.asset.id;
    if (opts.linkToShot !== false) {
      nextLibrary = linkAssetToShot(nextLibrary, intermediate.asset.id, shot.id);
    }
    shotPatch = {
      ...shotPatch,
      linkedAssetIds: {
        ...(shotPatch.linkedAssetIds ?? shot.linkedAssetIds ?? {}),
        intermediate: intermediate.asset.id,
      },
    };
  }

  return { library: nextLibrary, bakedFrameId, intermediateFrameId, shotPatch };
}

export function resolveAssetDisplayUrl(asset: MediaAsset): string {
  return asset.thumbnailUrl ?? asset.url;
}

/**
 * Fetch a generated video from its (possibly temporary) provider URL and save
 * it as a blob data URL in the project media library.
 *
 * This must be called immediately after generation while the URL is still live.
 * Provider URLs like xAI's expire after ~1 hour.
 */
export async function archiveGeneratedVideoToLibrary(
  library: MediaAsset[],
  videoUrl: string,
  opts: {
    shotId: number;
    workflowOrigin?: MediaWorkflowOrigin;
    providerJobId?: string;
  },
): Promise<{ library: MediaAsset[]; assetId: string | null }> {
  // Download the video blob from the provider URL.
  let blob: Blob;
  try {
    const res = await fetch(videoUrl);
    if (!res.ok) return { library, assetId: null };
    blob = await res.blob();
  } catch {
    return { library, assetId: null };
  }

  const id = await hashBlobContent(blob);
  const existing = library.find((a) => a.id === id);
  if (existing) return { library, assetId: id };

  // Convert to a data URL so it survives page reloads without relying on the
  // provider URL remaining valid.
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read video blob'));
    reader.readAsDataURL(blob);
  });

  const asset: MediaAsset = {
    id,
    type: 'video',
    url: dataUrl,
    createdAt: Date.now(),
    workflowOrigin: opts.workflowOrigin ?? 'generated',
    metadata: {
      usedInShots: [opts.shotId],
      ...(opts.providerJobId ? { provider: opts.providerJobId } : {}),
    },
  };

  return { library: [...library, asset], assetId: id };
}
