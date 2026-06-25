'use client';

import { colorPaletteGroupThumbnailDataUrl } from '@/lib/media/color-palette-group';
import type { ColorPaletteCollection } from '@/lib/types/studio';

interface ColorPaletteGroupChipProps {
  collection: ColorPaletteCollection;
  selected?: boolean;
  onSelect?: () => void;
  onRemove?: () => void;
  showRemove?: boolean;
}

export function ColorPaletteGroupChip({
  collection,
  selected,
  onSelect,
  onRemove,
  showRemove,
}: ColorPaletteGroupChipProps) {
  const thumbnail = colorPaletteGroupThumbnailDataUrl(collection);

  return (
    <div className="relative group w-24 h-14 flex-shrink-0">
      <button type="button" onClick={onSelect} className="block w-full h-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnail}
          alt={collection.name}
          className={`w-full h-full object-cover rounded-lg border transition-colors ${
            selected ? 'border-brand-500 ring-1 ring-brand-500/70' : 'border-surface-600 hover:border-brand-500/60'
          }`}
        />
      </button>
      <p className="absolute bottom-0 inset-x-0 text-[9px] text-center bg-black/50 text-gray-300 rounded-b-lg px-1 truncate py-0.5">
        {collection.name}
      </p>
      {showRemove && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          title="Remove palette group"
        >
          ×
        </button>
      )}
    </div>
  );
}
