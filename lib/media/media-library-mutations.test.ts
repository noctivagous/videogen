import { describe, expect, it } from 'vitest';
import {
  cleanShotsAfterAssetDelete,
  moveAssetsToScope,
  removeAssetsFromLibrary,
  reorderAssetsInType,
} from '@/lib/media/media-library-mutations';
import type { MediaAsset } from '@/lib/types/media-library';
import type { Shot } from '@/lib/types/studio';

function asset(id: string, scope?: 'project' | 'global'): MediaAsset {
  return {
    id,
    type: 'reference',
    url: `data:image/png;base64,${id}`,
    createdAt: 1,
    scope,
    metadata: { usedInShots: [1] },
  };
}

describe('media-library-mutations', () => {
  it('removeAssetsFromLibrary filters by id set', () => {
    const lib = [asset('a'), asset('b')];
    const next = removeAssetsFromLibrary(lib, new Set(['a']));
    expect(next.map((a) => a.id)).toEqual(['b']);
  });

  it('moveAssetsToScope moves between project and global libraries', () => {
    const project = [asset('p1')];
    const global = [asset('g1', 'global')];
    const toGlobal = moveAssetsToScope(project, global, ['p1'], 'global');
    expect(toGlobal.projectLibrary).toHaveLength(0);
    expect(toGlobal.globalLibrary.map((a) => a.id)).toContain('p1');
    expect(toGlobal.globalLibrary.find((a) => a.id === 'p1')?.scope).toBe('global');

    const back = moveAssetsToScope(toGlobal.projectLibrary, toGlobal.globalLibrary, ['p1'], 'project');
    expect(back.projectLibrary.map((a) => a.id)).toContain('p1');
    expect(back.globalLibrary.find((a) => a.id === 'p1')).toBeUndefined();
  });

  it('reorderAssetsInType assigns sortOrder', () => {
    const lib: MediaAsset[] = [asset('a'), asset('b'), { ...asset('c'), type: 'video' as const }];
    const next = reorderAssetsInType(lib, 'reference', ['b', 'a']);
    expect(next.find((a) => a.id === 'a')?.sortOrder).toBe(1);
    expect(next.find((a) => a.id === 'b')?.sortOrder).toBe(0);
    expect(next.find((a) => a.id === 'c')?.sortOrder).toBeUndefined();
  });

  it('cleanShotsAfterAssetDelete clears linked asset ids', () => {
    const shots = [
      {
        id: 1,
        name: 'Shot 1',
        active: true,
        linkedAssetIds: { bakedFrame: 'gone', backdrop: 'keep' },
        savedBakedFrameAssetIds: ['gone', 'stay'],
        bakedStartFrame: 'data:old',
        bakeStatus: 'done',
      } as unknown as Shot,
    ];
    const next = cleanShotsAfterAssetDelete(shots, new Set(['gone']));
    expect(next[0].linkedAssetIds?.bakedFrame).toBeUndefined();
    expect(next[0].linkedAssetIds?.backdrop).toBe('keep');
    expect(next[0].savedBakedFrameAssetIds).toEqual(['stay']);
    expect(next[0].bakedStartFrame).toBeNull();
  });
});
