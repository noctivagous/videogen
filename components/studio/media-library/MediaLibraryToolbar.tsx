'use client';

import { useRef } from 'react';
import { MEDIA_ASSET_TYPE_ORDER, getMediaAssetTypeLabel } from '@/lib/media/media-library-query';
import type { MediaAssetType } from '@/lib/types/media-library';
import type { MediaLibraryCollection } from '@/lib/media/media-library-mutations';

export type MediaLibraryLayoutMode = 'grid' | 'list' | 'tree';
export type MediaLibraryScopeFilter = 'all' | MediaLibraryCollection;
export type MediaLibrarySearchMode = 'text' | 'clip';

interface MediaLibraryToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchMode: MediaLibrarySearchMode;
  onSearchModeChange: (mode: MediaLibrarySearchMode) => void;
  typeFilter: MediaAssetType | 'all';
  onTypeFilterChange: (type: MediaAssetType | 'all') => void;
  scopeFilter: MediaLibraryScopeFilter;
  onScopeFilterChange: (scope: MediaLibraryScopeFilter) => void;
  layoutMode: MediaLibraryLayoutMode;
  onLayoutModeChange: (mode: MediaLibraryLayoutMode) => void;
  assetCount: number;
  snapshotCount: number;
  selectedCount: number;
  onImport: (files: FileList | null) => void;
  onDeleteSelected: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBack: () => void;
}

export function MediaLibraryToolbar({
  searchQuery,
  onSearchChange,
  searchMode,
  onSearchModeChange,
  typeFilter,
  onTypeFilterChange,
  scopeFilter,
  onScopeFilterChange,
  layoutMode,
  onLayoutModeChange,
  assetCount,
  snapshotCount,
  selectedCount,
  onImport,
  onDeleteSelected,
  onSelectAll,
  onClearSelection,
  onBack,
}: MediaLibraryToolbarProps) {
  const importInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="media-library-toolbar flex flex-wrap items-center gap-2 border-b border-surface-700 px-3 py-2 bg-surface-900/80">
      <button
        type="button"
        onClick={onBack}
        className="media-library-toolbar__back px-2.5 py-1.5 text-xs font-medium rounded-lg border border-surface-600 bg-surface-800 hover:bg-surface-700 text-gray-300 transition-colors"
      >
        Back to Shot
      </button>

      <div className="h-6 w-px bg-surface-600 hidden sm:block" />

      <span className="text-xs font-semibold text-gray-200 hidden sm:inline">Media Library</span>
      <span className="text-[10px] text-gray-500">
        {assetCount} asset{assetCount === 1 ? '' : 's'}
        {snapshotCount > 0 ? ` · ${snapshotCount} snapshot${snapshotCount === 1 ? '' : 's'}` : ''}
        {selectedCount > 0 ? ` · ${selectedCount} selected` : ''}
      </span>

      <div className="flex-1 min-w-[4rem]" />

      <input
        ref={importInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => {
          onImport(e.target.files);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        onClick={() => importInputRef.current?.click()}
        className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-brand-600/40 bg-brand-600/10 hover:bg-brand-600/20 text-brand-300 transition-colors"
      >
        Import
      </button>

      {selectedCount > 0 && (
        <>
          <button
            type="button"
            onClick={onDeleteSelected}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-red-900/50 bg-red-950/40 hover:bg-red-900/30 text-red-300 transition-colors"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={onClearSelection}
            className="px-2 py-1.5 text-[10px] text-gray-400 hover:text-gray-200"
          >
            Clear
          </button>
        </>
      )}

      {assetCount > 0 && selectedCount === 0 && (
        <button
          type="button"
          onClick={onSelectAll}
          className="px-2 py-1.5 text-[10px] text-gray-400 hover:text-gray-200"
        >
          Select all
        </button>
      )}

      <input
        type="search"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={searchMode === 'clip' ? 'CLIP semantic search…' : 'Search assets…'}
        className="media-library-toolbar__search w-full sm:w-52 bg-surface-800 border border-surface-600 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 outline-none focus:ring-2 focus:ring-brand-500"
        aria-label="Search media library"
      />

      <button
        type="button"
        onClick={() => onSearchModeChange(searchMode === 'clip' ? 'text' : 'clip')}
        className={`px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-lg border transition-colors ${
          searchMode === 'clip'
            ? 'border-brand-500/50 bg-brand-600/20 text-brand-300'
            : 'border-surface-600 bg-surface-800 text-gray-400 hover:text-gray-200'
        }`}
        title="Toggle CLIP-style semantic search"
      >
        CLIP
      </button>

      <select
        value={scopeFilter}
        onChange={(e) => onScopeFilterChange(e.target.value as MediaLibraryScopeFilter)}
        className="media-library-toolbar__scope bg-surface-800 border border-surface-600 rounded-lg px-2 py-1.5 text-xs text-gray-200"
        aria-label="Filter by library scope"
      >
        <option value="all">All libraries</option>
        <option value="project">Project</option>
        <option value="global">Global</option>
      </select>

      <select
        value={typeFilter}
        onChange={(e) => onTypeFilterChange(e.target.value as MediaAssetType | 'all')}
        className="media-library-toolbar__type bg-surface-800 border border-surface-600 rounded-lg px-2 py-1.5 text-xs text-gray-200"
        aria-label="Filter by type"
      >
        <option value="all">All types</option>
        {MEDIA_ASSET_TYPE_ORDER.map((type) => (
          <option key={type} value={type}>
            {getMediaAssetTypeLabel(type)}
          </option>
        ))}
      </select>

      <div className="media-library-toolbar__layout flex items-center rounded-lg border border-surface-600 overflow-hidden">
        {(['grid', 'list', 'tree'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onLayoutModeChange(mode)}
            className={`px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
              layoutMode === mode
                ? 'bg-brand-600/25 text-brand-300'
                : 'bg-surface-800 text-gray-400 hover:text-gray-200 hover:bg-surface-700'
            }`}
            aria-pressed={layoutMode === mode}
          >
            {mode}
          </button>
        ))}
      </div>
    </div>
  );
}
