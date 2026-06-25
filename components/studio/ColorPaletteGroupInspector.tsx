'use client';

import { useState } from 'react';

import { ColorPaletteSwatches } from '@/components/studio/ColorPaletteSwatches';
import {
  formatColorPaletteGroupAssetName,
  parseColorPaletteGroupFromAsset,
  parseDerivedCharacterColorPaletteGroupAssetId,
  parseDerivedLocationColorPaletteGroupAssetId,
} from '@/lib/media/color-palette-group';
import type { MediaAsset } from '@/lib/types/media-library';
import { useStudioStore } from '@/store/useStudioStore';

interface ColorPaletteGroupInspectorProps {
  asset: MediaAsset;
  onSelectAsset?: (assetId: string) => void;
}

export function ColorPaletteGroupInspector({ asset }: ColorPaletteGroupInspectorProps) {
  const characters = useStudioStore((s) => s.characters);
  const locations = useStudioStore((s) => s.locations);
  const renameColorPaletteGroupAsset = useStudioStore((s) => s.renameColorPaletteGroupAsset);
  const deleteMediaAssets = useStudioStore((s) => s.deleteMediaAssets);
  const removeCharacterColorPaletteGroup = useStudioStore((s) => s.removeCharacterColorPaletteGroup);
  const removeLocationColorPaletteGroup = useStudioStore((s) => s.removeLocationColorPaletteGroup);

  const doc = parseColorPaletteGroupFromAsset(asset);
  const [nameDraft, setNameDraft] = useState<string | null>(null);

  const isDerivedAsset = asset.id.startsWith('derived:');
  const characterRef = parseDerivedCharacterColorPaletteGroupAssetId(asset.id);
  const locationRef = parseDerivedLocationColorPaletteGroupAssetId(asset.id);
  const character = asset.metadata.characterId
    ? characters.find((entry) => entry.id === asset.metadata.characterId)
    : characterRef
      ? characters.find((entry) => entry.id === characterRef.characterId)
      : undefined;
  const location = asset.metadata.locationId
    ? locations.find((entry) => entry.id === asset.metadata.locationId)
    : locationRef
      ? locations.find((entry) => entry.id === locationRef.locationId)
      : undefined;

  if (!doc) {
    return <div className="p-4 text-sm text-gray-500">Could not read color palette group data.</div>;
  }

  const displayName = nameDraft ?? doc.name;
  const scope = asset.scope === 'global' ? 'global' : 'project';

  const handleRemove = () => {
    if (characterRef) {
      removeCharacterColorPaletteGroup(characterRef.characterId, characterRef.collectionId);
      return;
    }
    if (locationRef) {
      removeLocationColorPaletteGroup(locationRef.locationId, locationRef.collectionId);
      return;
    }
    if (!isDerivedAsset) {
      deleteMediaAssets([asset.id]);
    }
  };

  return (
    <div className="media-library-inspector flex flex-col h-full overflow-y-auto">
      <div className="p-3 border-b border-surface-700 flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-semibold text-gray-200">{formatColorPaletteGroupAssetName(asset)}</div>
          <div className="text-[10px] text-gray-500 font-mono mt-0.5">{asset.id}</div>
          <div className="text-[10px] text-gray-500 mt-0.5 capitalize">{scope} library</div>
        </div>
        <button
          type="button"
          onClick={handleRemove}
          disabled={isDerivedAsset && !characterRef && !locationRef}
          className="shrink-0 px-2 py-1 text-[10px] rounded border border-red-900/50 text-red-300 hover:bg-red-950/40 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Remove
        </button>
      </div>

      {isDerivedAsset && (
        <div className="px-3 py-2 border-b border-surface-700 text-[10px] text-amber-300 bg-amber-950/20">
          Derived asset: edit the owning {character ? 'character' : location ? 'location' : 'entity'} or remove it here.
        </div>
      )}

      <div className="p-3 border-b border-surface-700">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset.thumbnailUrl ?? asset.url}
          alt=""
          className="w-full aspect-video rounded-lg border border-surface-700 object-cover bg-surface-900"
        />
      </div>

      <div className="p-3 flex flex-col gap-3">
        <label className="media-library-inspector-field flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">Name</span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setNameDraft(e.target.value)}
            disabled={isDerivedAsset}
            className="media-library-field w-full disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {!isDerivedAsset && (
            <div className="flex gap-1.5 mt-1">
              <button
                type="button"
                onClick={() => {
                  renameColorPaletteGroupAsset(asset.id, displayName);
                  setNameDraft(null);
                }}
                className="px-2 py-1 text-[10px] rounded border border-surface-600 hover:bg-surface-700 text-gray-300"
              >
                Apply name
              </button>
              {nameDraft != null && (
                <button
                  type="button"
                  onClick={() => setNameDraft(null)}
                  className="px-2 py-1 text-[10px] text-gray-500 hover:text-gray-300"
                >
                  Reset
                </button>
              )}
            </div>
          )}
        </label>

        {character && (
          <InspectorReadOnly label="Character">{character.name}</InspectorReadOnly>
        )}
        {location && (
          <InspectorReadOnly label="Location">{location.name}</InspectorReadOnly>
        )}

        <InspectorReadOnly label="Groups">{doc.groups.length}</InspectorReadOnly>
        <InspectorReadOnly label="Created">{new Date(asset.createdAt).toLocaleString()}</InspectorReadOnly>

        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">Palette Groups</p>
          <ul className="space-y-2">
            {doc.groups.map((group, index) => (
              <li
                key={group.id}
                className="rounded-lg border border-surface-600/80 bg-surface-900/40 px-2 py-1.5 space-y-1"
              >
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                  {index + 1}. {group.label}
                </p>
                <ColorPaletteSwatches palette={group.palette} interactive={false} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function InspectorReadOnly({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="media-library-inspector-field flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">{label}</span>
      <div className="text-[11px] text-gray-300">{children}</div>
    </div>
  );
}
