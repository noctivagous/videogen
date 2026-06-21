import type { MediaAsset } from '@/lib/types/media-library';
import { getMediaAssetTypeLabel } from '@/lib/media/media-library-query';

const EMBEDDING_DIM = 256;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1);
}

/** Deterministic bag-of-words embedding for CLIP-style metadata similarity (client-side). */
export function embedTextForClipSearch(text: string): number[] {
  const tokens = tokenize(text);
  const vec = new Float32Array(EMBEDDING_DIM);
  for (const token of tokens) {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (hash * 31 + token.charCodeAt(i)) >>> 0;
    }
    const idx = hash % EMBEDDING_DIM;
    vec[idx] += 1;
  }
  return l2Normalize(Array.from(vec));
}

export function assetTextForEmbedding(asset: MediaAsset): string {
  return [
    getMediaAssetTypeLabel(asset.type),
    asset.type,
    asset.workflowOrigin ?? '',
    asset.metadata.characterId ?? '',
    asset.metadata.prompt ?? '',
    asset.metadata.provider ?? '',
  ].join(' ');
}

export function buildAssetClipEmbedding(asset: MediaAsset): number[] {
  return embedTextForClipSearch(assetTextForEmbedding(asset));
}

export function l2Normalize(vec: number[]): number[] {
  const mag = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  if (mag === 0) return vec;
  return vec.map((v) => v / mag);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  for (let i = 0; i < len; i++) dot += a[i] * b[i];
  return dot;
}

export function rankAssetsByClipQuery(
  assets: MediaAsset[],
  query: string,
): MediaAsset[] {
  const q = query.trim();
  if (!q) return assets;
  const queryVec = embedTextForClipSearch(q);
  return [...assets].sort((a, b) => {
    const aVec = a.metadata.clipEmbedding ?? buildAssetClipEmbedding(a);
    const bVec = b.metadata.clipEmbedding ?? buildAssetClipEmbedding(b);
    return cosineSimilarity(queryVec, bVec) - cosineSimilarity(queryVec, aVec);
  });
}

export function filterAssetsByClipThreshold(
  assets: MediaAsset[],
  query: string,
  minScore = 0.05,
): MediaAsset[] {
  const q = query.trim();
  if (!q) return assets;
  const queryVec = embedTextForClipSearch(q);
  return assets.filter((asset) => {
    const vec = asset.metadata.clipEmbedding ?? buildAssetClipEmbedding(asset);
    return cosineSimilarity(queryVec, vec) >= minScore;
  });
}

export function indexClipEmbeddingsInLibrary(
  library: MediaAsset[],
  assetIds?: Set<string>,
): MediaAsset[] {
  return library.map((asset) => {
    if (assetIds && !assetIds.has(asset.id)) return asset;
    return {
      ...asset,
      metadata: {
        ...asset.metadata,
        clipEmbedding: buildAssetClipEmbedding(asset),
      },
    };
  });
}
