import type { MediaAsset, MediaAssetType, ShotWorkflowSnapshot } from '@/lib/types/media-library';
import type { CoverageShot, Setup, Shot } from '@/lib/types/studio';
import {
  createMediaAssetFromDataUrl,
  generateThumbnailDataUrl,
  hashBlobContent,
  blobFromDataUrl,
} from '@/lib/media/media-library';
import type { CreateMediaAssetOptions } from '@/lib/media/media-library';

export type MediaLibraryCollection = 'project' | 'global';

export function assetScope(asset: MediaAsset): MediaLibraryCollection {
  return asset.scope === 'global' ? 'global' : 'project';
}

export function mergeMediaLibraries(
  projectLibrary: MediaAsset[],
  globalLibrary: MediaAsset[],
): MediaAsset[] {
  return [...projectLibrary, ...globalLibrary];
}

export function removeAssetsFromLibrary(
  library: MediaAsset[],
  assetIds: Set<string>,
): MediaAsset[] {
  return library.filter((asset) => !assetIds.has(asset.id));
}

export function cleanShotsAfterAssetDelete(
  shots: Shot[],
  deletedIds: Set<string>,
): Shot[] {
  return shots.map((shot) => {
    let changed = false;
    let next: Shot = shot;

    const stripLinked = () => {
      if (!shot.linkedAssetIds) return;
      const linkedAssetIds = { ...shot.linkedAssetIds };
      let linkedChanged = false;
      for (const [key, id] of Object.entries(linkedAssetIds)) {
        if (id && deletedIds.has(id)) {
          delete linkedAssetIds[key as keyof typeof linkedAssetIds];
          linkedChanged = true;
        }
      }
      if (linkedChanged) {
        next = { ...next, linkedAssetIds };
        changed = true;
      }
    };

    const stripSaved = () => {
      if (!shot.savedBakedFrameAssetIds?.length) return;
      const savedBakedFrameAssetIds = shot.savedBakedFrameAssetIds.filter(
        (id) => !deletedIds.has(id),
      );
      if (savedBakedFrameAssetIds.length !== shot.savedBakedFrameAssetIds.length) {
        next = { ...next, savedBakedFrameAssetIds };
        changed = true;
      }
    };

    const stripBakedFields = () => {
      let bakedStartFrame = shot.bakedStartFrame;
      let bakedIntermediateFrame = shot.bakedIntermediateFrame;
      let bakePatch: Partial<Shot> = {};
      if (shot.linkedAssetIds?.bakedFrame && deletedIds.has(shot.linkedAssetIds.bakedFrame)) {
        bakedStartFrame = null;
        bakePatch = { bakeStatus: 'idle', bakedStartFrame: null };
      }
      if (
        shot.linkedAssetIds?.intermediate &&
        deletedIds.has(shot.linkedAssetIds.intermediate)
      ) {
        bakedIntermediateFrame = null;
        bakePatch = { ...bakePatch, bakedIntermediateFrame: null };
      }
      if (Object.keys(bakePatch).length > 0) {
        next = { ...next, ...bakePatch, bakedStartFrame, bakedIntermediateFrame };
        changed = true;
      }
    };

    stripLinked();
    stripSaved();
    stripBakedFields();

    return changed ? next : shot;
  });
}

export function cleanSnapshotsAfterAssetDelete(
  snapshots: ShotWorkflowSnapshot[],
  deletedIds: Set<string>,
): ShotWorkflowSnapshot[] {
  return snapshots.map((snapshot) => {
    const assetIds = { ...snapshot.assetIds };
    let changed = false;
    if (assetIds.bakedFrameId && deletedIds.has(assetIds.bakedFrameId)) {
      delete assetIds.bakedFrameId;
      changed = true;
    }
    if (assetIds.intermediateFrameId && deletedIds.has(assetIds.intermediateFrameId)) {
      delete assetIds.intermediateFrameId;
      changed = true;
    }
    if (assetIds.backdropId && deletedIds.has(assetIds.backdropId)) {
      delete assetIds.backdropId;
      changed = true;
    }
    if (assetIds.characterSheetIds?.some((id) => deletedIds.has(id))) {
      assetIds.characterSheetIds = assetIds.characterSheetIds.filter((id) => !deletedIds.has(id));
      changed = true;
    }
    return changed ? { ...snapshot, assetIds } : snapshot;
  });
}

export function remapParentAssetIds(
  library: MediaAsset[],
  idMap: Map<string, string>,
): MediaAsset[] {
  if (idMap.size === 0) return library;
  return library.map((asset) => {
    const parent = asset.metadata.parentAssetId;
    if (!parent || !idMap.has(parent)) return asset;
    return {
      ...asset,
      metadata: { ...asset.metadata, parentAssetId: idMap.get(parent) },
    };
  });
}

export async function replaceMediaAssetUrl(
  library: MediaAsset[],
  assetId: string,
  url: string,
): Promise<{
  library: MediaAsset[];
  idMap: Map<string, string>;
  asset: MediaAsset;
}> {
  if (url.startsWith('data:')) {
    return replaceMediaAssetContent(library, assetId, url);
  }

  const existing = library.find((a) => a.id === assetId);
  if (!existing) throw new Error('Asset not found');

  const nextAsset: MediaAsset = {
    ...existing,
    url,
    metadata: {
      ...existing.metadata,
      clipEmbedding: undefined,
    },
  };

  return {
    library: library.map((a) => (a.id === assetId ? nextAsset : a)),
    idMap: new Map(),
    asset: nextAsset,
  };
}

export async function replaceMediaAssetContent(
  library: MediaAsset[],
  assetId: string,
  dataUrl: string,
): Promise<{
  library: MediaAsset[];
  idMap: Map<string, string>;
  asset: MediaAsset;
}> {
  const existing = library.find((a) => a.id === assetId);
  if (!existing) throw new Error('Asset not found');

  const blob = await blobFromDataUrl(dataUrl);
  if (!blob) throw new Error('Invalid image data');

  const newId = await hashBlobContent(blob);
  const thumbnailUrl = await generateThumbnailDataUrl(dataUrl);
  const idMap = new Map<string, string>();
  if (newId !== assetId) {
    idMap.set(assetId, newId);
  }

  const nextAsset: MediaAsset = {
    ...existing,
    id: newId,
    url: dataUrl,
    thumbnailUrl,
    metadata: {
      ...existing.metadata,
      clipEmbedding: undefined,
    },
  };

  let nextLibrary = library.filter((a) => a.id !== assetId);
  const dupe = nextLibrary.find((a) => a.id === newId);
  if (dupe) {
    nextAsset.metadata.usedInShots = [
      ...new Set([...dupe.metadata.usedInShots, ...existing.metadata.usedInShots]),
    ];
    nextLibrary = nextLibrary.filter((a) => a.id !== newId);
  }
  nextLibrary = remapParentAssetIds(nextLibrary, idMap);
  nextLibrary.push(nextAsset);

  return { library: nextLibrary, idMap, asset: nextAsset };
}

export function moveAssetsToScope(
  projectLibrary: MediaAsset[],
  globalLibrary: MediaAsset[],
  assetIds: string[],
  target: MediaLibraryCollection,
): { projectLibrary: MediaAsset[]; globalLibrary: MediaAsset[] } {
  const idSet = new Set(assetIds);
  const toMoveFromProject = projectLibrary.filter((a) => idSet.has(a.id));
  const toMoveFromGlobal = globalLibrary.filter((a) => idSet.has(a.id));

  if (target === 'global') {
    const moved = toMoveFromProject.map((a) => ({ ...a, scope: 'global' as const }));
    return {
      projectLibrary: projectLibrary.filter((a) => !idSet.has(a.id)),
      globalLibrary: [
        ...globalLibrary.filter((a) => !idSet.has(a.id)),
        ...moved,
        ...toMoveFromGlobal,
      ],
    };
  }

  const moved = toMoveFromGlobal.map((a) => ({ ...a, scope: 'project' as const }));
  return {
    projectLibrary: [
      ...projectLibrary.filter((a) => !idSet.has(a.id)),
      ...moved,
      ...toMoveFromProject,
    ],
    globalLibrary: globalLibrary.filter((a) => !idSet.has(a.id)),
  };
}

export function reorderAssetsInType(
  library: MediaAsset[],
  type: MediaAssetType,
  orderedIds: string[],
): MediaAsset[] {
  const orderMap = new Map(orderedIds.map((id, index) => [id, index]));
  return library.map((asset) => {
    if (asset.type !== type) return asset;
    const order = orderMap.get(asset.id);
    if (order === undefined) return asset;
    return { ...asset, sortOrder: order };
  });
}

export async function importMediaFilesToLibrary(
  library: MediaAsset[],
  files: File[],
  opts: Omit<CreateMediaAssetOptions, 'type'> & { type?: MediaAssetType; scope?: MediaLibraryCollection },
): Promise<{ library: MediaAsset[]; imported: MediaAsset[] }> {
  let nextLibrary = library;
  const imported: MediaAsset[] = [];

  for (const file of files) {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) continue;
    const dataUrl = await readFileAsDataUrl(file);
    const result = await createMediaAssetFromDataUrl(nextLibrary, dataUrl, {
      ...opts,
      type: opts.type ?? inferTypeFromMime(file.type),
    });
    nextLibrary = result.library;
    const withScope = {
      ...result.asset,
      scope: opts.scope ?? 'project',
      workflowOrigin: opts.workflowOrigin ?? 'upload',
    };
    nextLibrary = nextLibrary.map((a) => (a.id === withScope.id ? withScope : a));
    if (!imported.find((a) => a.id === withScope.id)) {
      imported.push(withScope);
    }
  }

  return { library: nextLibrary, imported };
}

function inferTypeFromMime(mime: string): MediaAssetType {
  if (mime.startsWith('video/')) return 'video';
  return 'reference';
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function applyAssetIdRemapToShots(
  shots: Shot[],
  idMap: Map<string, string>,
): Shot[] {
  if (idMap.size === 0) return shots;
  return shots.map((shot) => {
    let next = shot;
    if (shot.linkedAssetIds) {
      const linkedAssetIds = { ...shot.linkedAssetIds };
      let changed = false;
      for (const [key, id] of Object.entries(linkedAssetIds)) {
        if (id && idMap.has(id)) {
          linkedAssetIds[key as keyof typeof linkedAssetIds] = idMap.get(id)!;
          changed = true;
        }
      }
      if (changed) next = { ...next, linkedAssetIds };
    }
    if (shot.savedBakedFrameAssetIds?.length) {
      const savedBakedFrameAssetIds = shot.savedBakedFrameAssetIds.map(
        (id) => idMap.get(id) ?? id,
      );
      if (savedBakedFrameAssetIds.some((id, i) => id !== shot.savedBakedFrameAssetIds![i])) {
        next = { ...next, savedBakedFrameAssetIds };
      }
    }
    return next;
  });
}

export function applyAssetIdRemapToSetups(
  setups: Setup[],
  idMap: Map<string, string>,
): Setup[] {
  if (idMap.size === 0) return setups;
  return setups.map((setup) => ({
    ...setup,
    backdrops: setup.backdrops.map((backdrop) =>
      backdrop.linkedAssetId && idMap.has(backdrop.linkedAssetId)
        ? { ...backdrop, linkedAssetId: idMap.get(backdrop.linkedAssetId)! }
        : backdrop,
    ),
    shots: applyAssetIdRemapToShots(setup.shots as unknown as Shot[], idMap) as unknown as CoverageShot[],
  }));
}

export function cleanSetupsAfterAssetDelete(
  setups: Setup[],
  deletedIds: Set<string>,
): Setup[] {
  return setups.map((setup) => ({
    ...setup,
    backdrops: setup.backdrops.map((backdrop) =>
      backdrop.linkedAssetId && deletedIds.has(backdrop.linkedAssetId)
        ? { ...backdrop, linkedAssetId: undefined }
        : backdrop,
    ),
    shots: cleanShotsAfterAssetDelete(setup.shots as unknown as Shot[], deletedIds) as unknown as CoverageShot[],
  }));
}

export function applyAssetIdRemapToSnapshots(
  snapshots: ShotWorkflowSnapshot[],
  idMap: Map<string, string>,
): ShotWorkflowSnapshot[] {
  if (idMap.size === 0) return snapshots;
  return snapshots.map((snapshot) => {
    const assetIds = { ...snapshot.assetIds };
    let changed = false;
    const remap = (field: keyof typeof assetIds) => {
      const val = assetIds[field];
      if (typeof val === 'string' && idMap.has(val)) {
        (assetIds as Record<string, unknown>)[field] = idMap.get(val);
        changed = true;
      }
    };
    remap('bakedFrameId');
    remap('intermediateFrameId');
    remap('backdropId');
    if (assetIds.characterSheetIds) {
      const next = assetIds.characterSheetIds.map((id) => idMap.get(id) ?? id);
      if (next.some((id, i) => id !== assetIds.characterSheetIds![i])) {
        assetIds.characterSheetIds = next;
        changed = true;
      }
    }
    return changed ? { ...snapshot, assetIds } : snapshot;
  });
}
