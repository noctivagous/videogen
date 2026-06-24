import type { MediaAsset, MediaAssetType, MediaWorkflowOrigin, ShotWorkflowSnapshot } from '@/lib/types/media-library';
import type { Setup, Shot, Workflow } from '@/lib/types/studio';
import { getWorkflowLabel } from '@/lib/constants/workflows';
import { filterAssetsByClipThreshold, rankAssetsByClipQuery } from '@/lib/media/clip-search';

export const MEDIA_ASSET_TYPE_ORDER: MediaAssetType[] = [
  'unclassified',
  'character-sheet',
  'backdrop-plate',
  'backdrop',
  'baked-frame',
  'intermediate-frame',
  'reference',
  'video',
  'mannequin-layout',
  'shot-workflow',
];

const TYPE_LABELS: Record<MediaAssetType, string> = {
  unclassified: 'Unclassified',
  'character-sheet': 'Character Sheets',
  'backdrop-plate': 'Backdrop Plates',
  backdrop: 'Backdrops',
  'baked-frame': 'Baked Frames',
  'intermediate-frame': 'Intermediate Frames',
  reference: 'References',
  video: 'Videos',
  'mannequin-layout': 'Mannequin Layouts',
  'shot-workflow': 'Shot Workflows',
};

export function getMediaAssetTypeLabel(type: MediaAssetType): string {
  return TYPE_LABELS[type] ?? type;
}

export type MediaLibraryGroupedAssets = {
  type: MediaAssetType;
  label: string;
  assets: MediaAsset[];
}[];

export function groupMediaAssetsByType(assets: MediaAsset[]): MediaLibraryGroupedAssets {
  const byType = new Map<MediaAssetType, MediaAsset[]>();
  for (const asset of assets) {
    const list = byType.get(asset.type) ?? [];
    list.push(asset);
    byType.set(asset.type, list);
  }

  return MEDIA_ASSET_TYPE_ORDER.filter((type) => (byType.get(type)?.length ?? 0) > 0).map((type) => ({
    type,
    label: getMediaAssetTypeLabel(type),
    assets: (byType.get(type) ?? []).sort(sortAssetsInGroup),
  }));
}

function sortAssetsInGroup(a: MediaAsset, b: MediaAsset): number {
  const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
  const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
  if (orderA !== orderB) return orderA - orderB;
  return b.createdAt - a.createdAt;
}

export interface SearchMediaLibraryInput {
  assets: MediaAsset[];
  snapshots: ShotWorkflowSnapshot[];
  query: string;
  typeFilter: MediaAssetType | 'all';
  shots: Shot[];
  searchMode?: 'text' | 'clip';
}

export interface SearchMediaLibraryResult {
  assets: MediaAsset[];
  snapshots: ShotWorkflowSnapshot[];
}

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

function shotNamesForAsset(asset: MediaAsset, shots: Shot[]): string[] {
  return asset.metadata.usedInShots
    .map((id) => shots.find((s) => s.id === id)?.name)
    .filter((name): name is string => Boolean(name));
}

function assetMatchesQuery(asset: MediaAsset, q: string, shots: Shot[]): boolean {
  if (!q) return true;
  if (asset.id.toLowerCase().includes(q)) return true;
  if (asset.type.toLowerCase().includes(q)) return true;
  if (asset.workflowOrigin?.toLowerCase().includes(q)) return true;
  if (asset.metadata.characterId?.toLowerCase().includes(q)) return true;
  if (asset.metadata.prompt?.toLowerCase().includes(q)) return true;
  if (asset.metadata.provider?.toLowerCase().includes(q)) return true;
  if (getMediaAssetTypeLabel(asset.type).toLowerCase().includes(q)) return true;
  return shotNamesForAsset(asset, shots).some((name) => name.toLowerCase().includes(q));
}

function snapshotMatchesQuery(snapshot: ShotWorkflowSnapshot, q: string): boolean {
  if (!q) return true;
  if (snapshot.id.toLowerCase().includes(q)) return true;
  if (snapshot.shotName.toLowerCase().includes(q)) return true;
  if (snapshot.workflow.toLowerCase().includes(q)) return true;
  return false;
}

export function searchMediaLibrary(input: SearchMediaLibraryInput): SearchMediaLibraryResult {
  const q = normalizeQuery(input.query);
  let assets = input.assets;

  if (input.typeFilter !== 'all') {
    assets = assets.filter((asset) => asset.type === input.typeFilter);
  }

  if (q) {
    if (input.searchMode === 'clip') {
      assets = filterAssetsByClipThreshold(assets, input.query);
      assets = rankAssetsByClipQuery(assets, input.query);
    } else {
      assets = assets.filter((asset) => assetMatchesQuery(asset, q, input.shots));
    }
  }

  const snapshots = q
    ? input.snapshots.filter((snapshot) => snapshotMatchesQuery(snapshot, q))
    : input.typeFilter === 'all'
      ? input.snapshots
      : [];

  return { assets, snapshots };
}

export function updateMediaAssetInLibrary(
  library: MediaAsset[],
  assetId: string,
  patch: Partial<Omit<MediaAsset, 'metadata'>> & { metadata?: Partial<MediaAsset['metadata']> },
): MediaAsset[] {
  return library.map((asset) => {
    if (asset.id !== assetId) return asset;
    const metadata = patch.metadata
      ? {
          ...asset.metadata,
          ...patch.metadata,
          usedInShots: patch.metadata.usedInShots ?? asset.metadata.usedInShots,
        }
      : asset.metadata;
    const { metadata: _meta, ...rest } = patch;
    return { ...asset, ...rest, metadata };
  });
}

export function getSnapshotById(
  snapshots: ShotWorkflowSnapshot[],
  id: string,
): ShotWorkflowSnapshot | undefined {
  return snapshots.find((snapshot) => snapshot.id === id);
}

export function isSnapshotItemId(id: string): boolean {
  return id.startsWith('snapshot:');
}

export function snapshotItemId(snapshotId: string): string {
  return `snapshot:${snapshotId}`;
}

export function parseSnapshotItemId(itemId: string): string | null {
  if (!itemId.startsWith('snapshot:')) return null;
  return itemId.slice('snapshot:'.length);
}

export type ShotWorkflowAssetGroup = {
  workflow: MediaWorkflowOrigin | 'unassigned';
  label: string;
  assets: MediaAsset[];
};

export type ShotMediaGroup = {
  shotId: number;
  shotName: string;
  workflows: ShotWorkflowAssetGroup[];
  assetCount: number;
};

export type SetupShotAssetGroup = {
  shotId: number;
  shotName: string;
  assets: MediaAsset[];
  assetCount: number;
};

export type SetupMediaGroup = {
  setupId: number;
  setupName: string;
  shots: SetupShotAssetGroup[];
  assetCount: number;
};

function workflowGroupLabel(workflow: MediaWorkflowOrigin | 'unassigned'): string {
  if (workflow === 'unassigned') return 'Other';
  if (workflow === 'upload') return 'Uploads';
  if (workflow === 'generated') return 'Generated';
  return getWorkflowLabel(workflow as Workflow);
}

function workflowSortKey(workflow: MediaWorkflowOrigin | 'unassigned'): string {
  if (workflow === 'unassigned') return 'zzz';
  return workflow;
}

export function groupMediaAssetsByShotAndWorkflow(
  assets: MediaAsset[],
  shots: Shot[],
): { shotGroups: ShotMediaGroup[]; unassigned: MediaAsset[] } {
  const unassigned: MediaAsset[] = [];
  const shotGroups: ShotMediaGroup[] = [];

  for (const shot of shots) {
    const shotAssets = assets.filter((asset) => asset.metadata.usedInShots.includes(shot.id));
    if (shotAssets.length === 0) continue;

    const byWorkflow = new Map<MediaWorkflowOrigin | 'unassigned', MediaAsset[]>();
    for (const asset of shotAssets) {
      const key = asset.workflowOrigin ?? 'unassigned';
      const list = byWorkflow.get(key) ?? [];
      list.push(asset);
      byWorkflow.set(key, list);
    }

    const workflows = [...byWorkflow.entries()]
      .sort(([a], [b]) => workflowSortKey(a).localeCompare(workflowSortKey(b)))
      .map(([workflow, groupAssets]) => ({
        workflow,
        label: workflowGroupLabel(workflow),
        assets: groupAssets.sort(sortAssetsInGroup),
      }));

    shotGroups.push({
      shotId: shot.id,
      shotName: shot.name,
      workflows,
      assetCount: shotAssets.length,
    });
  }

  for (const asset of assets) {
    if (asset.metadata.usedInShots.length === 0) {
      unassigned.push(asset);
    }
  }

  return { shotGroups, unassigned: unassigned.sort((a, b) => b.createdAt - a.createdAt) };
}

export function groupMediaAssetsBySetupAndShot(
  assets: MediaAsset[],
  setups: Setup[],
): { setupGroups: SetupMediaGroup[]; unassigned: MediaAsset[] } {
  const setupGroups: SetupMediaGroup[] = [];
  const matchedAssetIds = new Set<string>();

  for (const setup of setups) {
    const shotGroups: SetupShotAssetGroup[] = [];
    for (const shot of setup.shots) {
      const shotAssets = assets
        .filter((asset) => asset.metadata.usedInShots.includes(shot.id))
        .sort(sortAssetsInGroup);
      if (shotAssets.length === 0) continue;
      for (const asset of shotAssets) matchedAssetIds.add(asset.id);
      shotGroups.push({
        shotId: shot.id,
        shotName: shot.name,
        assets: shotAssets,
        assetCount: shotAssets.length,
      });
    }
    if (shotGroups.length === 0) continue;
    setupGroups.push({
      setupId: setup.id,
      setupName: setup.name,
      shots: shotGroups,
      assetCount: shotGroups.reduce((sum, shotGroup) => sum + shotGroup.assetCount, 0),
    });
  }

  const unassigned = assets
    .filter((asset) => !matchedAssetIds.has(asset.id))
    .sort((a, b) => b.createdAt - a.createdAt);

  return { setupGroups, unassigned };
}
