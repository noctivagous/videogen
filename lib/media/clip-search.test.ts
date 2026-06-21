import { describe, expect, it } from 'vitest';
import {
  embedTextForClipSearch,
  rankAssetsByClipQuery,
  indexClipEmbeddingsInLibrary,
} from '@/lib/media/clip-search';
import type { MediaAsset } from '@/lib/types/media-library';

function makeAsset(overrides: Partial<MediaAsset> = {}): MediaAsset {
  return {
    id: 'asset-1',
    type: 'reference',
    url: 'data:image/png;base64,abc',
    createdAt: 1,
    metadata: { usedInShots: [] },
    ...overrides,
  };
}

describe('clip-search', () => {
  it('embedTextForClipSearch returns normalized vectors', () => {
    const vec = embedTextForClipSearch('backdrop sunset');
    const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
    expect(vec.length).toBe(256);
    expect(mag).toBeCloseTo(1, 5);
  });

  it('rankAssetsByClipQuery orders by similarity', () => {
    const backdrop = makeAsset({
      id: 'a',
      type: 'backdrop',
      metadata: { usedInShots: [], prompt: 'sunset beach backdrop' },
    });
    const video = makeAsset({
      id: 'b',
      type: 'video',
      metadata: { usedInShots: [], prompt: 'car chase action' },
    });
    const ranked = rankAssetsByClipQuery([video, backdrop], 'sunset beach');
    expect(ranked[0].id).toBe('a');
  });

  it('indexClipEmbeddingsInLibrary stores embeddings on assets', () => {
    const assets = [makeAsset({ id: 'x' }), makeAsset({ id: 'y' })];
    const indexed = indexClipEmbeddingsInLibrary(assets, new Set(['x']));
    expect(indexed[0].metadata.clipEmbedding?.length).toBe(256);
    expect(indexed[1].metadata.clipEmbedding).toBeUndefined();
  });
});
