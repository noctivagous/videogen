'use client';

import { useCallback, useMemo, useState } from 'react';
import { MediaLibraryGridView } from '@/components/studio/media-library/MediaLibraryGridView';
import { MediaLibraryInspector } from '@/components/studio/media-library/MediaLibraryInspector';
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
import { mergeMediaLibraries, type MediaLibraryCollection } from '@/lib/media/media-library-mutations';
import { searchMediaLibrary } from '@/lib/media/media-library-query';
import { deriveProjectAssets, mergeWithDerivedAssets } from '@/lib/media/derive-project-assets';
import type { MediaAssetType } from '@/lib/types/media-library';
import { useNavigateToStudioPanel } from '@/hooks/use-studio-panel-navigation';
import { useStudioStore } from '@/store/useStudioStore';

interface MediaLibraryViewerProps {
  onBack: () => void;
}

export function MediaLibraryViewer({ onBack }: MediaLibraryViewerProps) {
  const mediaLibrary = useStudioStore((s) => s.mediaLibrary);
  const globalMediaLibrary = useStudioStore((s) => s.globalMediaLibrary);
  const setups = useStudioStore((s) => s.setups);
  const shotWorkflowSnapshots = useStudioStore((s) => s.shotWorkflowSnapshots);
  const shots = useStudioStore((s) => s.shots);
  const selectedId = useStudioStore((s) => s.selectedMediaLibraryItemId);
  const selectMediaLibraryItem = useStudioStore((s) => s.selectMediaLibraryItem);
  const selectShot = useStudioStore((s) => s.selectShot);
  const navigateToPanel = useNavigateToStudioPanel();
  const importMediaAssets = useStudioStore((s) => s.importMediaAssets);
  const deleteMediaAssets = useStudioStore((s) => s.deleteMediaAssets);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<MediaLibrarySearchMode>('text');
  const [typeFilter, setTypeFilter] = useState<MediaAssetType | 'all'>('all');
  const [scopeFilter, setScopeFilter] = useState<MediaLibraryScopeFilter>('all');
  const [layoutMode, setLayoutMode] = useState<MediaLibraryLayoutMode>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Assets derived directly from the live project state — always up to date,
  // no manual save required.
  const derivedAssets = useMemo(() => deriveProjectAssets(setups), [setups]);

  // Merge: explicit mediaLibrary wins over derived when both cover the same URL.
  const projectAssets = useMemo(
    () => mergeWithDerivedAssets(mediaLibrary, derivedAssets),
    [mediaLibrary, derivedAssets],
  );

  const scopedAssets = useMemo(() => {
    if (scopeFilter === 'project') return projectAssets;
    if (scopeFilter === 'global') return globalMediaLibrary;
    return mergeMediaLibraries(projectAssets, globalMediaLibrary);
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

  const importScope: MediaLibraryCollection =
    scopeFilter === 'global' ? 'global' : 'project';

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

  const handleGoToShot = (shotId: number) => {
    selectShot(shotId);
    navigateToPanel('shot-designer');
  };

  const handleImport = (files: FileList | null) => {
    if (!files?.length) return;
    void importMediaAssets(Array.from(files), importScope);
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
  };

  return (
    <div
      className="media-library-viewer flex flex-col h-full min-h-0 bg-surface-900"
      {...uiSectionProps(UI_SECTIONS.studioMediaLibraryViewer)}
    >
      <div {...uiSectionProps(UI_SECTIONS.studioMediaLibraryToolbar)}>
        <MediaLibraryToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchMode={searchMode}
          onSearchModeChange={setSearchMode}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          scopeFilter={scopeFilter}
          onScopeFilterChange={setScopeFilter}
          layoutMode={layoutMode}
          onLayoutModeChange={setLayoutMode}
          assetCount={filtered.assets.length}
          snapshotCount={filtered.snapshots.length}
          selectedCount={selectedIds.size}
          onImport={handleImport}
          onDeleteSelected={handleDeleteSelected}
          onSelectAll={handleSelectAll}
          onClearSelection={() => setSelectedIds(new Set())}
          onBack={onBack}
        />
      </div>

      <div className="media-library-viewer__body flex flex-1 min-h-0">
        <div
          className="media-library-viewer__browser flex-1 min-w-0 border-r border-surface-700"
          {...uiSectionProps(UI_SECTIONS.studioMediaLibraryBrowser)}
        >
          {layoutMode === 'grid' && <MediaLibraryGridView {...browserProps} />}
          {layoutMode === 'list' && (
            <MediaLibraryListView {...browserProps} shots={shots} />
          )}
          {layoutMode === 'tree' && <MediaLibraryTreeView {...browserProps} shots={shots} />}
        </div>

        <aside
          className="media-library-viewer__inspector w-72 xl:w-80 shrink-0 min-h-0 bg-surface-900/90"
          {...uiSectionProps(UI_SECTIONS.studioMediaLibraryInspector)}
        >
          <MediaLibraryInspector
            selectedId={selectedId}
            assets={scopedAssets}
            snapshots={shotWorkflowSnapshots}
            shots={shots}
            onSelectAsset={(id) => handleSelectAsset(id)}
            onGoToShot={handleGoToShot}
          />
        </aside>
      </div>
    </div>
  );
}
