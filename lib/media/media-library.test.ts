import { describe, expect, it } from 'vitest';
import {
  findAssetsByType,
  linkAssetToShot,
  prependSavedBakedFrameId,
} from '@/lib/media/media-library';
import type { MediaAsset } from '@/lib/types/media-library';
import type { Shot } from '@/lib/types/studio';

function sampleAsset(overrides: Partial<MediaAsset> = {}): MediaAsset {
  return {
    id: 'abc123',
    type: 'baked-frame',
    url: 'data:image/png;base64,test',
    createdAt: 1,
    workflowOrigin: 'bake-start-frame',
    metadata: { usedInShots: [] },
    ...overrides,
  };
}

describe('media-library', () => {
  it('links assets to shots without duplicates', () => {
    const library = linkAssetToShot([sampleAsset()], 'abc123', 2);
    expect(library[0]?.metadata.usedInShots).toEqual([2]);
    const again = linkAssetToShot(library, 'abc123', 2);
    expect(again[0]?.metadata.usedInShots).toEqual([2]);
  });

  it('filters baked assets by workflow origin', () => {
    const library = [
      sampleAsset({ id: 'a' }),
      sampleAsset({ id: 'b', workflowOrigin: 'auto-place' }),
    ];
    const baked = findAssetsByType(library, 'baked-frame', {
      workflowOrigin: 'bake-start-frame',
    });
    expect(baked).toHaveLength(1);
    expect(baked[0]?.id).toBe('a');
  });

  it('prepends saved baked frame ids newest-first', () => {
    const shot = { savedBakedFrameAssetIds: ['old'] } as Shot;
    const patch = prependSavedBakedFrameId(shot, 'new');
    expect(patch.savedBakedFrameAssetIds).toEqual(['new', 'old']);
    expect(patch.linkedAssetIds?.bakedFrame).toBe('new');
  });
});
