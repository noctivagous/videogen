'use client';

import { useRef, useState } from 'react';
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
  onImport: (files: FileList) => void;
  dropHint?: string;
}

export function MediaLibraryGridView({
  assets,
  snapshots,
  selectedId,
  selectedIds,
  onSelectAsset,
  onToggleSelect,
  onSelectSnapshot,
  onImport,
  dropHint = 'Drop images to import',
}: MediaLibraryGridViewProps) {
  const groups = groupMediaAssetsByType(assets);
  const empty = groups.length === 0 && snapshots.length === 0;
  const [dragging, setDragging] = useState(false);
  const dragCounterRef = useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current += 1;
    if (e.dataTransfer.types.includes('Files')) setDragging(true);
  };
  const handleDragLeave = () => {
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setDragging(false);
    }
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setDragging(false);
    if (e.dataTransfer.files.length > 0) onImport(e.dataTransfer.files);
  };

  const dropZoneProps = { onDragEnter: handleDragEnter, onDragLeave: handleDragLeave, onDragOver: handleDragOver, onDrop: handleDrop };

  if (empty) {
    return (
      <div
        className={`media-library-empty relative flex flex-col items-center justify-center h-full text-sm text-gray-500 p-6 text-center transition-colors ${dragging ? 'bg-brand-600/10 border-2 border-dashed border-brand-500/60' : ''}`}
        {...dropZoneProps}
      >
        {dragging ? (
          <p className="text-brand-300 font-medium">{dropHint}</p>
        ) : (
          <>
            <p>No assets match your search.</p>
            <p className="mt-1 text-xs text-gray-600">Add backdrop plates or references to your project, or drop images here to import.</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className={`media-library-grid-view relative p-3 flex flex-col gap-6 overflow-y-auto h-full transition-colors ${dragging ? 'bg-brand-600/5' : ''}`}
      {...dropZoneProps}
    >
      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-20 border-2 border-dashed border-brand-500/60 rounded-lg flex items-center justify-center bg-brand-600/10">
          <p className="text-brand-300 font-semibold text-sm">{dropHint}</p>
        </div>
      )}
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
        {asset.type === 'video' ? (
          <div className="w-full aspect-video bg-surface-900 flex items-center justify-center relative">
            <svg
              className="w-10 h-10 text-gray-600"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            <span className="absolute bottom-1.5 right-1.5 text-[9px] font-semibold uppercase tracking-wider text-gray-500 bg-surface-900/80 px-1 py-0.5 rounded">
              Video
            </span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveAssetDisplayUrl(asset)}
            alt=""
            className="w-full aspect-video object-cover bg-surface-900"
          />
        )}
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
