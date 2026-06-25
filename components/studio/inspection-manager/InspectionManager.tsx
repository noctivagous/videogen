'use client';

import { useEffect, useMemo } from 'react';
import { MediaLibraryInspector } from '@/components/studio/media-library/MediaLibraryInspector';
import { deriveProjectAssets, mergeWithDerivedAssets } from '@/lib/media/derive-project-assets';
import { useStudioStore } from '@/store/useStudioStore';

export interface InspectorRegistration {
  parseAssetId: (assetId: string) => unknown;
  onMatch: (parsed: unknown) => void;
}

interface InspectionManagerProps {
  selectedAssetId: string | null;
  onSelectAssetId: (assetId: string | null) => void;
  registrations?: InspectorRegistration[];
  emptyMessage: string;
  onGoToShot: (shotId: number) => void;
}

export function InspectionManager({
  selectedAssetId,
  onSelectAssetId,
  registrations = [],
  emptyMessage,
  onGoToShot,
}: InspectionManagerProps) {
  const setups = useStudioStore((state) => state.setups);
  const characters = useStudioStore((state) => state.characters);
  const locations = useStudioStore((state) => state.locations);
  const mediaLibrary = useStudioStore((state) => state.mediaLibrary);
  const globalMediaLibrary = useStudioStore((state) => state.globalMediaLibrary);
  const shots = useStudioStore((state) => state.shots);

  const derivedAssets = useMemo(
    () => deriveProjectAssets(setups, characters, locations),
    [setups, characters, locations],
  );
  const projectAssets = useMemo(
    () => mergeWithDerivedAssets(mediaLibrary, derivedAssets),
    [mediaLibrary, derivedAssets],
  );
  const inspectorAssets = useMemo(
    () => [...projectAssets, ...globalMediaLibrary],
    [projectAssets, globalMediaLibrary],
  );

  useEffect(() => {
    if (!selectedAssetId) return;
    const stillExists = inspectorAssets.some((asset) => asset.id === selectedAssetId);
    if (!stillExists) {
      onSelectAssetId(null);
    }
  }, [inspectorAssets, onSelectAssetId, selectedAssetId]);

  const handleSelectAsset = (assetId: string) => {
    onSelectAssetId(assetId);
    for (const registration of registrations) {
      const parsed = registration.parseAssetId(assetId);
      if (parsed == null) continue;
      registration.onMatch(parsed);
      break;
    }
  };

  if (!selectedAssetId) {
    return (
      <div className="h-full flex items-center justify-center p-4 text-xs text-gray-500 text-center">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex-1 min-h-0">
        <MediaLibraryInspector
          selectedId={selectedAssetId}
          assets={inspectorAssets}
          snapshots={[]}
          shots={shots}
          onSelectAsset={handleSelectAsset}
          onGoToShot={onGoToShot}
        />
      </div>
    </div>
  );
}
