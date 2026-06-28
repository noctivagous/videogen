'use client';

import { useMemo, useState } from 'react';
import { ColorPaletteGroupInspector } from '@/components/studio/ColorPaletteGroupInspector';
import { formatMediaAssetSummary, truncateId } from '@/components/studio/media-library/media-library-labels';
import type { MediaLibraryScopeFilter } from '@/components/studio/media-library/MediaLibraryToolbar';
import { deriveProjectAssets, mergeWithDerivedAssets } from '@/lib/media/derive-project-assets';
import { resolveAssetDisplayUrl } from '@/lib/media/media-library';
import type { MediaAsset } from '@/lib/types/media-library';
import { useStudioStore } from '@/store/useStudioStore';

interface ColorPaletteMakerLibraryContentProps {
  scopeFilter: MediaLibraryScopeFilter;
}

export function ColorPaletteMakerLibraryContent({ scopeFilter }: ColorPaletteMakerLibraryContentProps) {
  const mediaLibrary = useStudioStore((s) => s.mediaLibrary);
  const globalMediaLibrary = useStudioStore((s) => s.globalMediaLibrary);
  const setups = useStudioStore((s) => s.setups);
  const characters = useStudioStore((s) => s.characters);
  const locations = useStudioStore((s) => s.locations);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const derivedAssets = useMemo(
    () => deriveProjectAssets(setups, characters, locations),
    [setups, characters, locations],
  );

  const projectAssets = useMemo(
    () => mergeWithDerivedAssets(mediaLibrary, derivedAssets),
    [mediaLibrary, derivedAssets],
  );

  const paletteAssets = useMemo(() => {
    const source = scopeFilter === 'project' ? projectAssets : globalMediaLibrary;
    return source
      .filter((asset) => asset.type === 'color-palette-group')
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [projectAssets, globalMediaLibrary, scopeFilter]);

  const selectedAsset = useMemo(
    () => paletteAssets.find((asset) => asset.id === selectedId) ?? null,
    [paletteAssets, selectedId],
  );

  return (
    <div className="flex flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6">
        {paletteAssets.length === 0 ? (
          <div className="glass rounded-xl p-6 border border-surface-700 text-center max-w-md mx-auto mt-8">
            <h2 className="font-semibold text-lg text-gray-200">No palettes yet</h2>
            <p className="text-sm text-gray-400 mt-2">
              {scopeFilter === 'project'
                ? 'Save a collection from Maker or attach palettes to characters and locations.'
                : 'Move palettes to the global library or save collections there from Maker.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {paletteAssets.map((asset) => (
              <PaletteLibraryCard
                key={asset.id}
                asset={asset}
                selected={selectedId === asset.id}
                onSelect={() => setSelectedId(asset.id)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedAsset ? (
        <div className="w-72 shrink-0 border-l border-surface-700 min-h-0 overflow-hidden bg-surface-900">
          <ColorPaletteGroupInspector asset={selectedAsset} />
        </div>
      ) : null}
    </div>
  );
}

function PaletteLibraryCard({
  asset,
  selected,
  onSelect,
}: {
  asset: MediaAsset;
  selected: boolean;
  onSelect: () => void;
}) {
  const scopeLabel = asset.scope === 'global' ? 'Global' : 'Project';
  const isDerived = asset.id.startsWith('derived:');

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-colors ${
        selected
          ? 'border-brand-500/60 ring-1 ring-brand-500/30'
          : 'border-surface-700 hover:border-surface-600'
      }`}
    >
      <button type="button" onClick={onSelect} className="block w-full text-left">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolveAssetDisplayUrl(asset)}
          alt=""
          className="w-full aspect-video object-cover bg-surface-900"
        />
        <div className="p-2 bg-surface-800/60">
          <div className="text-[10px] font-semibold text-gray-200 truncate">
            {formatMediaAssetSummary(asset)}
          </div>
          <div className="text-[9px] text-gray-500 truncate">{truncateId(asset.id)}</div>
          <div className="text-[9px] text-gray-600 capitalize mt-0.5">
            {isDerived ? 'Derived' : scopeLabel}
          </div>
        </div>
      </button>
    </div>
  );
}