'use client';

import { groupMediaAssetsByType } from '@/lib/media/media-library-query';
import { resolveAssetDisplayUrl } from '@/lib/media/media-library';
import type { MediaAsset, ShotWorkflowSnapshot } from '@/lib/types/media-library';
import {
  formatMediaAssetSummary,
  truncateId,
} from '@/components/studio/media-library/media-library-labels';

interface MediaLibraryGridViewProps {
  assets: MediaAsset[];
  snapshots: ShotWorkflowSnapshot[];
  selectedId: string | null;
  selectedIds: Set<string>;
  onSelectAsset: (assetId: string, additive?: boolean) => void;
  onToggleSelect: (assetId: string, additive: boolean) => void;
  onSelectSnapshot: (snapshotId: string) => void;
}

export function MediaLibraryGridView({
  assets,
  snapshots,
  selectedId,
  selectedIds,
  onSelectAsset,
  onToggleSelect,
  onSelectSnapshot,
}: MediaLibraryGridViewProps) {
  const groups = groupMediaAssetsByType(assets);
  const empty = groups.length === 0 && snapshots.length === 0;

  if (empty) {
    return (
      <div className="media-library-empty flex items-center justify-center h-full text-sm text-gray-500 p-6 text-center">
        No assets match your search. Import files or save baked frames to populate the library.
      </div>
    );
  }

  return (
    <div className="media-library-grid-view p-3 flex flex-col gap-6 overflow-y-auto h-full">
      {groups.map((group) => (
        <section key={group.type} className="media-library-grid-section">
          <h3 className="media-library-section-title text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-2">
            {group.label}
            <span className="text-gray-600 font-normal ml-1">({group.assets.length})</span>
          </h3>
          <div className="media-library-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {group.assets.map((asset) => (
              <AssetGridCard
                key={asset.id}
                asset={asset}
                selected={selectedId === asset.id}
                bulkSelected={selectedIds.has(asset.id)}
                onSelect={(additive) => onSelectAsset(asset.id, additive)}
                onToggleSelect={(additive) => onToggleSelect(asset.id, additive)}
              />
            ))}
          </div>
        </section>
      ))}

      {snapshots.length > 0 && (
        <section className="media-library-grid-section">
          <h3 className="media-library-section-title text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-2">
            Workflow Snapshots
            <span className="text-gray-600 font-normal ml-1">({snapshots.length})</span>
          </h3>
          <div className="media-library-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {snapshots.map((snapshot) => (
              <SnapshotGridCard
                key={snapshot.id}
                snapshot={snapshot}
                selected={selectedId === `snapshot:${snapshot.id}`}
                onSelect={() => onSelectSnapshot(snapshot.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function AssetGridCard({
  asset,
  selected,
  bulkSelected,
  onSelect,
  onToggleSelect,
}: {
  asset: MediaAsset;
  selected: boolean;
  bulkSelected: boolean;
  onSelect: (additive: boolean) => void;
  onToggleSelect: (additive: boolean) => void;
}) {
  return (
    <div
      className={`media-library-grid-card rounded-xl border overflow-hidden text-left transition-colors relative ${
        selected
          ? 'border-brand-500 ring-1 ring-brand-500/40 bg-surface-800'
          : 'border-surface-700 bg-surface-800/60 hover:border-brand-500/40'
      }`}
    >
      <input
        type="checkbox"
        checked={bulkSelected}
        onChange={() => onToggleSelect(true)}
        onClick={(e) => e.stopPropagation()}
        aria-label={`Select ${formatMediaAssetSummary(asset)}`}
        className="absolute top-2 left-2 z-10 rounded border-surface-600 bg-surface-900/80"
      />
      <button
        type="button"
        onClick={(e) => onSelect(e.metaKey || e.ctrlKey || e.shiftKey)}
        className="block w-full text-left"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolveAssetDisplayUrl(asset)}
          alt=""
          className="w-full aspect-video object-cover bg-surface-900"
        />
        <div className="p-2">
          <div className="text-[10px] font-semibold text-gray-200 truncate">
            {formatMediaAssetSummary(asset)}
          </div>
          <div className="text-[9px] text-gray-500 truncate">{truncateId(asset.id)}</div>
          <div className="text-[9px] text-gray-600 capitalize mt-0.5">
            {asset.scope === 'global' ? 'Global' : 'Project'}
          </div>
        </div>
      </button>
    </div>
  );
}

function SnapshotGridCard({
  snapshot,
  selected,
  onSelect,
}: {
  snapshot: ShotWorkflowSnapshot;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`media-library-grid-card rounded-xl border p-3 text-left transition-colors ${
        selected
          ? 'border-brand-500 ring-1 ring-brand-500/40 bg-surface-800'
          : 'border-surface-700 bg-surface-800/60 hover:border-brand-500/40'
      }`}
    >
      <div className="text-[10px] font-semibold text-gray-200 truncate">{snapshot.shotName}</div>
      <div className="text-[9px] text-gray-500 mt-1">{snapshot.workflow}</div>
      <div className="text-[9px] text-gray-600 mt-2">{new Date(snapshot.createdAt).toLocaleString()}</div>
    </button>
  );
}
