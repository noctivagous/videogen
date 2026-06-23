'use client';

import { Fragment, useState } from 'react';
import { groupMediaAssetsBySetupAndShot, groupMediaAssetsByType } from '@/lib/media/media-library-query';
import { resolveAssetDisplayUrl } from '@/lib/media/media-library';
import type { MediaAsset, MediaAssetType, ShotWorkflowSnapshot } from '@/lib/types/media-library';
import type { Setup, Shot } from '@/lib/types/studio';
import {
  formatMediaAssetOrigin,
  formatMediaAssetSummary,
  truncateId,
} from '@/components/studio/media-library/media-library-labels';
import { useStudioStore } from '@/store/useStudioStore';

interface MediaLibraryListViewProps {
  assets: MediaAsset[];
  snapshots: ShotWorkflowSnapshot[];
  shots: Shot[];
  setups: Setup[];
  selectedId: string | null;
  selectedIds: Set<string>;
  onSelectAsset: (assetId: string, additive?: boolean) => void;
  onToggleSelect: (assetId: string, additive: boolean) => void;
  onSelectSnapshot: (snapshotId: string) => void;
}

export function MediaLibraryListView({
  assets,
  snapshots,
  shots,
  setups,
  selectedId,
  selectedIds,
  onSelectAsset,
  onToggleSelect,
  onSelectSnapshot,
}: MediaLibraryListViewProps) {
  const reorderMediaAssets = useStudioStore((s) => s.reorderMediaAssets);
  const { setupGroups, unassigned } = groupMediaAssetsBySetupAndShot(assets, setups);
  const unassignedGroups = groupMediaAssetsByType(unassigned);
  const empty = setupGroups.length === 0 && unassignedGroups.length === 0 && snapshots.length === 0;
  const [dragAssetId, setDragAssetId] = useState<string | null>(null);
  const setupNameByShotId = new Map<number, string>();
  for (const setup of setups) {
    for (const shot of setup.shots) {
      setupNameByShotId.set(shot.id, setup.name);
    }
  }

  const handleReorder = (type: MediaAssetType, groupAssets: MediaAsset[], targetId: string) => {
    if (!dragAssetId || dragAssetId === targetId) return;
    const ids = groupAssets.map((a) => a.id);
    const from = ids.indexOf(dragAssetId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;
    ids.splice(from, 1);
    ids.splice(to, 0, dragAssetId);
    reorderMediaAssets(type, ids);
    setDragAssetId(null);
  };

  if (empty) {
    return (
      <div className="media-library-empty flex items-center justify-center h-full text-sm text-gray-500 p-6 text-center">
        No assets match your search.
      </div>
    );
  }

  return (
    <div className="media-library-list-view overflow-y-auto h-full">
      <table className="media-library-list-table w-full text-left text-xs">
        <thead className="sticky top-0 bg-surface-900/95 backdrop-blur-sm z-10">
          <tr className="text-[10px] uppercase tracking-wider text-gray-500 border-b border-surface-700">
            <th className="px-2 py-2 font-semibold w-8" />
            <th className="px-3 py-2 font-semibold w-14" />
            <th className="px-3 py-2 font-semibold hidden md:table-cell">Setup</th>
            <th className="px-3 py-2 font-semibold hidden md:table-cell">Shot</th>
            <th className="px-3 py-2 font-semibold">Name</th>
            <th className="px-3 py-2 font-semibold hidden md:table-cell">Scope</th>
            <th className="px-3 py-2 font-semibold hidden md:table-cell">Origin</th>
            <th className="px-3 py-2 font-semibold hidden lg:table-cell">Used in</th>
            <th className="px-3 py-2 font-semibold hidden sm:table-cell">Created</th>
            <th className="px-3 py-2 font-semibold">ID</th>
          </tr>
        </thead>
        <tbody>
          {setupGroups.map((setupGroup) => (
            <Fragment key={setupGroup.setupId}>
              <tr className="media-library-list-section-header">
                <td colSpan={10} className="px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-gray-300 bg-surface-800/60 border-y border-surface-700/80">
                  {setupGroup.setupName} ({setupGroup.assetCount})
                </td>
              </tr>
              {setupGroup.shots.map((shotGroup) => (
                <Fragment key={shotGroup.shotId}>
                  <tr className="media-library-list-section-header">
                    <td colSpan={10} className="px-4 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-gray-400 bg-surface-800/35 border-b border-surface-700/60">
                      {shotGroup.shotName} ({shotGroup.assetCount})
                    </td>
                  </tr>
                  {shotGroup.assets.map((asset) => (
                    <AssetListRow
                      key={asset.id}
                      asset={asset}
                      shots={shots}
                      setupName={setupGroup.setupName}
                      shotName={shotGroup.shotName}
                      selected={selectedId === asset.id}
                      bulkSelected={selectedIds.has(asset.id)}
                      dragging={dragAssetId === asset.id}
                      onSelect={(additive) => onSelectAsset(asset.id, additive)}
                      onToggleSelect={(additive) => onToggleSelect(asset.id, additive)}
                      onDragStart={() => setDragAssetId(asset.id)}
                      onDragEnd={() => setDragAssetId(null)}
                      onDrop={() => {
                        const sameType = shotGroup.assets.filter((a) => a.type === asset.type);
                        handleReorder(asset.type, sameType, asset.id);
                      }}
                    />
                  ))}
                </Fragment>
              ))}
            </Fragment>
          ))}
          {unassignedGroups.map((group) => (
            <Fragment key={`unassigned-${group.type}`}>
              <tr className="media-library-list-section-header">
                <td colSpan={10} className="px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-gray-400 bg-surface-800/50 border-y border-surface-700/80">
                  Unassigned · {group.label} ({group.assets.length})
                </td>
              </tr>
              {group.assets.map((asset) => (
                <AssetListRow
                  key={asset.id}
                  asset={asset}
                  shots={shots}
                  setupName="—"
                  shotName="—"
                  selected={selectedId === asset.id}
                  bulkSelected={selectedIds.has(asset.id)}
                  dragging={dragAssetId === asset.id}
                  onSelect={(additive) => onSelectAsset(asset.id, additive)}
                  onToggleSelect={(additive) => onToggleSelect(asset.id, additive)}
                  onDragStart={() => setDragAssetId(asset.id)}
                  onDragEnd={() => setDragAssetId(null)}
                  onDrop={() => handleReorder(group.type, group.assets, asset.id)}
                />
              ))}
            </Fragment>
          ))}
          {snapshots.length > 0 && (
            <>
              <tr className="media-library-list-section-header">
                <td colSpan={10} className="px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-gray-400 bg-surface-800/50 border-y border-surface-700/80">
                  Workflow Snapshots ({snapshots.length})
                </td>
              </tr>
              {snapshots.map((snapshot) => (
                <SnapshotListRow
                  key={snapshot.id}
                  snapshot={snapshot}
                  setupName={setupNameByShotId.get(snapshot.shotId) ?? '—'}
                  selected={selectedId === `snapshot:${snapshot.id}`}
                  onSelect={() => onSelectSnapshot(snapshot.id)}
                />
              ))}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}

function AssetListRow({
  asset,
  shots,
  setupName,
  shotName,
  selected,
  bulkSelected,
  dragging,
  onSelect,
  onToggleSelect,
  onDragStart,
  onDragEnd,
  onDrop,
}: {
  asset: MediaAsset;
  shots: Shot[];
  setupName: string;
  shotName: string;
  selected: boolean;
  bulkSelected: boolean;
  dragging: boolean;
  onSelect: (additive: boolean) => void;
  onToggleSelect: (additive: boolean) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDrop: () => void;
}) {
  const usedNames = asset.metadata.usedInShots
    .map((id) => shots.find((s) => s.id === id)?.name)
    .filter(Boolean)
    .join(', ');

  return (
    <tr
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      className={`media-library-list-row border-b border-surface-800 cursor-pointer transition-colors ${
        selected ? 'bg-brand-600/10' : 'hover:bg-surface-800/60'
      } ${dragging ? 'opacity-50' : ''}`}
      onClick={(e) => onSelect(e.metaKey || e.ctrlKey || e.shiftKey)}
    >
      <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={bulkSelected}
          onChange={() => onToggleSelect(true)}
          aria-label={`Select ${formatMediaAssetSummary(asset)}`}
          className="rounded border-surface-600"
        />
      </td>
      <td className="px-3 py-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolveAssetDisplayUrl(asset)}
          alt=""
          className="w-10 h-7 object-cover rounded bg-surface-900"
        />
      </td>
      <td className="px-3 py-2 text-gray-500 hidden md:table-cell">{setupName}</td>
      <td className="px-3 py-2 text-gray-500 hidden md:table-cell">{shotName}</td>
      <td className="px-3 py-2 font-medium text-gray-200">{formatMediaAssetSummary(asset)}</td>
      <td className="px-3 py-2 text-gray-500 hidden md:table-cell capitalize">
        {asset.scope === 'global' ? 'Global' : 'Project'}
      </td>
      <td className="px-3 py-2 text-gray-500 hidden md:table-cell">{formatMediaAssetOrigin(asset.workflowOrigin)}</td>
      <td className="px-3 py-2 text-gray-500 hidden lg:table-cell truncate max-w-[10rem]">{usedNames || '—'}</td>
      <td className="px-3 py-2 text-gray-500 hidden sm:table-cell whitespace-nowrap">
        {new Date(asset.createdAt).toLocaleString()}
      </td>
      <td className="px-3 py-2 text-gray-600 font-mono text-[10px]">{truncateId(asset.id, 16)}</td>
    </tr>
  );
}

function SnapshotListRow({
  snapshot,
  setupName,
  selected,
  onSelect,
}: {
  snapshot: ShotWorkflowSnapshot;
  setupName: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <tr
      className={`media-library-list-row border-b border-surface-800 cursor-pointer transition-colors ${
        selected ? 'bg-brand-600/10' : 'hover:bg-surface-800/60'
      }`}
      onClick={onSelect}
    >
      <td className="px-2 py-2" />
      <td className="px-3 py-2">
        <div className="w-10 h-7 rounded bg-surface-700 flex items-center justify-center text-[8px] text-gray-500">
          SNAP
        </div>
      </td>
      <td className="px-3 py-2 text-gray-500 hidden md:table-cell">{setupName}</td>
      <td className="px-3 py-2 text-gray-500 hidden md:table-cell">{snapshot.shotName}</td>
      <td className="px-3 py-2 font-medium text-gray-200">{snapshot.shotName}</td>
      <td className="px-3 py-2 text-gray-500 hidden md:table-cell">—</td>
      <td className="px-3 py-2 text-gray-500 hidden md:table-cell">{snapshot.workflow}</td>
      <td className="px-3 py-2 text-gray-500 hidden lg:table-cell">—</td>
      <td className="px-3 py-2 text-gray-500 hidden sm:table-cell whitespace-nowrap">
        {new Date(snapshot.createdAt).toLocaleString()}
      </td>
      <td className="px-3 py-2 text-gray-600 font-mono text-[10px]">{truncateId(snapshot.id, 16)}</td>
    </tr>
  );
}
