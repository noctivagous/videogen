'use client';

import { useRef } from 'react';
import { type ManagerScope } from '@/components/studio/ManagerScopeSegment';
import { MEDIA_ASSET_TYPE_ORDER, getMediaAssetTypeLabel } from '@/lib/media/media-library-query';
import type { MediaAssetType } from '@/lib/types/media-library';

export type MediaLibraryLayoutMode = 'grid' | 'list' | 'tree';
export type MediaLibraryScopeFilter = ManagerScope;
export type MediaLibrarySearchMode = 'text' | 'clip';

interface MediaLibraryToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchMode: MediaLibrarySearchMode;
  onSearchModeChange: (mode: MediaLibrarySearchMode) => void;
  typeFilter: MediaAssetType | 'all';
  onTypeFilterChange: (type: MediaAssetType | 'all') => void;
  scopeFilter: MediaLibraryScopeFilter;
  layoutMode: MediaLibraryLayoutMode;
  onLayoutModeChange: (mode: MediaLibraryLayoutMode) => void;
  assetCount: number;
  selectedCount: number;
  onImport: (files: FileList | null) => void;
  onDeleteSelected: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
}

export function MediaLibraryToolbar({
  searchQuery,
  onSearchChange,
  searchMode,
  onSearchModeChange,
  typeFilter,
  onTypeFilterChange,
  scopeFilter,
  layoutMode,
  onLayoutModeChange,
  assetCount,
  selectedCount,
  onImport,
  onDeleteSelected,
  onSelectAll,
  onClearSelection,
}: MediaLibraryToolbarProps) {
  const importInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="media-library-toolbar flex flex-wrap items-center gap-2 border-b border-surface-700 px-4 py-2 bg-surface-900/80">
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
        title={
          scopeFilter === 'project'
            ? 'Import into Project library'
            : 'Import into Global library'
        }
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
