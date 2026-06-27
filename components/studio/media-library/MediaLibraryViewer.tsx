'use client';

import { useCallback, useMemo, useState } from 'react';
import { ManagerScopeSegment } from '@/components/studio/ManagerScopeSegment';
import { StudioPanelHeader } from '@/components/studio/StudioPanelHeader';
import { STUDIO_LAUNCHER_ICONS } from '@/components/studio/studio-launcher-icons';
import { MediaLibraryGridView } from '@/components/studio/media-library/MediaLibraryGridView';
import { importDropHint } from '@/components/studio/media-library/MediaLibraryImportScopeDialog';
import { snapshotItemId } from '@/lib/media/media-library-query';
import { MediaLibraryListView } from '@/components/studio/media-library/MediaLibraryListView';
import {
  MediaLibraryToolbar,
  type MediaLibraryLayoutMode,
  type MediaLibraryScopeFilter,
  type MediaLibrarySearchMode,
} from '@/components/studio/media-library/MediaLibraryToolbar';
import { MediaLibraryTreeView } from '@/components/studio/media-library/MediaLibraryTreeView';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { getStudioLauncherItem } from '@/lib/constants/studio-launcher';
import { searchMediaLibrary } from '@/lib/media/media-library-query';
import { deriveProjectAssets, mergeWithDerivedAssets } from '@/lib/media/derive-project-assets';
import type { MediaAssetType } from '@/lib/types/media-library';
import { useStudioStore } from '@/store/useStudioStore';

interface MediaLibraryViewerProps {
  onBack: () => void;
}

export function MediaLibraryViewer({ onBack }: MediaLibraryViewerProps) {
  const mediaLibrary = useStudioStore((s) => s.mediaLibrary);
  const globalMediaLibrary = useStudioStore((s) => s.globalMediaLibrary);
  const setups = useStudioStore((s) => s.setups);
  const characters = useStudioStore((s) => s.characters);
  const locations = useStudioStore((s) => s.locations);
  const shotWorkflowSnapshots = useStudioStore((s) => s.shotWorkflowSnapshots);
  const shots = useStudioStore((s) => s.shots);
  const selectedId = useStudioStore((s) => s.selectedMediaLibraryItemId);
  const selectMediaLibraryItem = useStudioStore((s) => s.selectMediaLibraryItem);
  const importMediaAssets = useStudioStore((s) => s.importMediaAssets);
  const deleteMediaAssets = useStudioStore((s) => s.deleteMediaAssets);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<MediaLibrarySearchMode>('text');
  const [typeFilter, setTypeFilter] = useState<MediaAssetType | 'all'>('all');
  const [scopeFilter, setScopeFilter] = useState<MediaLibraryScopeFilter>('project');
  const [layoutMode, setLayoutMode] = useState<MediaLibraryLayoutMode>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Assets derived directly from the live project state — always up to date,
  // no manual save required.
  const derivedAssets = useMemo(
    () => deriveProjectAssets(setups, characters, locations),
    [setups, characters, locations],
  );

  // Merge: explicit mediaLibrary wins over derived when both cover the same URL.
  const projectAssets = useMemo(
    () => mergeWithDerivedAssets(mediaLibrary, derivedAssets),
    [mediaLibrary, derivedAssets],
  );

  const scopedAssets = useMemo(() => {
    if (scopeFilter === 'project') return projectAssets;
    return globalMediaLibrary;
  }, [projectAssets, globalMediaLibrary, scopeFilter]);

  const filtered = useMemo(
    () =>
      searchMediaLibrary({
        assets: scopedAssets,
        snapshots: shotWorkflowSnapshots,
        query: searchQuery,
        typeFilter,
        shots,
        searchMode,
      }),
    [scopedAssets, shotWorkflowSnapshots, searchQuery, typeFilter, shots, searchMode],
  );

  const handleImport = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return;
      void importMediaAssets(Array.from(files), scopeFilter);
    },
    [scopeFilter, importMediaAssets],
  );

  const toggleSelected = useCallback((assetId: string, additive: boolean) => {
    setSelectedIds((prev) => {
      const next = additive ? new Set(prev) : new Set<string>();
      if (next.has(assetId)) next.delete(assetId);
      else next.add(assetId);
      return next;
    });
  }, []);

  const handleSelectAsset = (assetId: string, additive = false) => {
    if (additive) {
      toggleSelected(assetId, true);
    }
    selectMediaLibraryItem(assetId);
  };

  const handleSelectSnapshot = (snapshotId: string) => {
    selectMediaLibraryItem(snapshotItemId(snapshotId));
  };

  const handleDeleteSelected = () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    deleteMediaAssets(ids);
    setSelectedIds(new Set());
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(filtered.assets.map((a) => a.id)));
  };

  const browserProps = {
    assets: filtered.assets,
    snapshots: filtered.snapshots,
    selectedId,
    selectedIds,
    onSelectAsset: handleSelectAsset,
    onToggleSelect: toggleSelected,
    onSelectSnapshot: handleSelectSnapshot,
    onImport: (files: FileList) => handleImport(files),
    dropHint: importDropHint(scopeFilter),
  };

  const mediaLibraryItem = getStudioLauncherItem('media-library');

  const headerDescription = useMemo(() => {
    const parts = [
      `${filtered.assets.length} asset${filtered.assets.length === 1 ? '' : 's'}`,
    ];
    if (filtered.snapshots.length > 0) {
      parts.push(
        `${filtered.snapshots.length} snapshot${filtered.snapshots.length === 1 ? '' : 's'}`,
      );
    }
    if (selectedIds.size > 0) {
      parts.push(`${selectedIds.size} selected`);
    }
    return parts.join(' · ');
  }, [filtered.assets.length, filtered.snapshots.length, selectedIds.size]);

  return (
    <div
      className="media-library-viewer flex flex-col h-full min-h-0 bg-surface-900"
      {...uiSectionProps(UI_SECTIONS.studioMediaLibraryViewer)}
    >
      <StudioPanelHeader
        title={mediaLibraryItem.title}
        description={headerDescription}
        icon={STUDIO_LAUNCHER_ICONS['media-library']}
        onBack={onBack}
        backTitle="Back to Shot Designer"
        titleTrailing={
          <ManagerScopeSegment
            value={scopeFilter}
            onChange={setScopeFilter}
            ariaLabel="Media library scope"
          />
        }
      />
      <div {...uiSectionProps(UI_SECTIONS.studioMediaLibraryToolbar)}>
        <MediaLibraryToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchMode={searchMode}
          onSearchModeChange={setSearchMode}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          scopeFilter={scopeFilter}
          layoutMode={layoutMode}
          onLayoutModeChange={setLayoutMode}
          assetCount={filtered.assets.length}
          selectedCount={selectedIds.size}
          onImport={handleImport}
          onDeleteSelected={handleDeleteSelected}
          onSelectAll={handleSelectAll}
          onClearSelection={() => setSelectedIds(new Set())}
        />
      </div>

      <div className="media-library-viewer__body flex flex-1 min-h-0 relative">
        <div
          className="media-library-viewer__browser flex-1 min-w-0"
          {...uiSectionProps(UI_SECTIONS.studioMediaLibraryBrowser)}
        >
          {layoutMode === 'grid' && <MediaLibraryGridView {...browserProps} setups={setups} characters={characters} locations={locations} />}
          {layoutMode === 'list' && (
            <MediaLibraryListView {...browserProps} shots={shots} setups={setups} />
          )}
          {layoutMode === 'tree' && <MediaLibraryTreeView {...browserProps} shots={shots} />}
        </div>
      </div>
    </div>
  );
}
