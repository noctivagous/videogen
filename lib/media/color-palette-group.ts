import {
  COLOR_SCHEME_LABELS,
  hueToColorName,
  normalizeColorPalette,
  paletteDisplayEntries,
  paletteSwatchCss,
} from '@/lib/constants/color-palette';
import type { MediaAsset, MediaLibraryScope } from '@/lib/types/media-library';
import type {
  ColorPaletteCollection,
  ColorPaletteGroupEntry,
  ColorPaletteSettings,
} from '@/lib/types/studio';

export const COLOR_PALETTE_GROUP_MIME = 'application/vnd.videogen.color-palette-group+json';

export interface ColorPaletteGroupDocument {
  version: 1;
  name: string;
  groups: ColorPaletteGroupEntry[];
}

export function paletteGroupEntryLabel(palette: ColorPaletteSettings): string {
  if (palette.mode === 'bw') return 'B&W';
  if (palette.mode === 'duotone') {
    return `Duotone · ${hueToColorName(palette.dominantHue)} / ${hueToColorName(palette.secondaryHue)}`;
  }
  if (palette.mode === 'false-color') {
    return `False Color · ${hueToColorName(palette.dominantHue)}`;
  }
  if (palette.mode === 'accent-splash') {
    return `Accent Splash · ${hueToColorName(palette.accentHue ?? palette.dominantHue)}`;
  }
  return `${COLOR_SCHEME_LABELS[palette.scheme]} · ${hueToColorName(palette.dominantHue)}`;
}

export function normalizeColorPaletteGroupEntry(
  entry: Partial<ColorPaletteGroupEntry> & { palette: ColorPaletteSettings },
): ColorPaletteGroupEntry {
  return {
    id: entry.id ?? crypto.randomUUID(),
    label: entry.label?.trim() || paletteGroupEntryLabel(entry.palette),
    palette: normalizeColorPalette({ ...entry.palette, bw: { ...entry.palette.bw } }),
  };
}

export function normalizeColorPaletteCollection(
  collection: Partial<ColorPaletteCollection> & Pick<ColorPaletteCollection, 'name'>,
): ColorPaletteCollection {
  return {
    id: collection.id ?? crypto.randomUUID(),
    name: collection.name.trim() || 'Untitled Palette',
    groups: (collection.groups ?? []).map((group) =>
      normalizeColorPaletteGroupEntry({
        ...group,
        palette: group.palette,
      }),
    ),
    createdAt: collection.createdAt ?? Date.now(),
  };
}

export function encodeColorPaletteGroupDocument(doc: ColorPaletteGroupDocument): string {
  const json = JSON.stringify(doc);
  const base64 =
    typeof btoa !== 'undefined'
      ? btoa(json)
      : Buffer.from(json, 'utf8').toString('base64');
  return `data:${COLOR_PALETTE_GROUP_MIME};base64,${base64}`;
}

export function decodeColorPaletteGroupDocument(url: string): ColorPaletteGroupDocument | null {
  if (!url.startsWith(`data:${COLOR_PALETTE_GROUP_MIME};base64,`)) return null;
  try {
    const base64 = url.slice(`data:${COLOR_PALETTE_GROUP_MIME};base64,`.length);
    const json =
      typeof atob !== 'undefined'
        ? atob(base64)
        : Buffer.from(base64, 'base64').toString('utf8');
    const parsed = JSON.parse(json) as ColorPaletteGroupDocument;
    if (parsed.version !== 1 || !Array.isArray(parsed.groups)) return null;
    return {
      version: 1,
      name: parsed.name?.trim() || 'Untitled Palette',
      groups: parsed.groups.map((group) =>
        normalizeColorPaletteGroupEntry({
          id: group.id,
          label: group.label,
          palette: group.palette,
        }),
      ),
    };
  } catch {
    return null;
  }
}

export function collectionToDocument(collection: ColorPaletteCollection): ColorPaletteGroupDocument {
  return {
    version: 1,
    name: collection.name,
    groups: collection.groups,
  };
}

export function documentToCollection(
  doc: ColorPaletteGroupDocument,
  id?: string,
  createdAt?: number,
): ColorPaletteCollection {
  return normalizeColorPaletteCollection({
    id,
    name: doc.name,
    groups: doc.groups,
    createdAt,
  });
}

export function parseColorPaletteGroupFromAsset(asset: MediaAsset): ColorPaletteGroupDocument | null {
  return decodeColorPaletteGroupDocument(asset.url);
}

export function colorPaletteGroupThumbnailDataUrl(collection: ColorPaletteCollection): string {
  const swatches: string[] = [];
  for (const group of collection.groups) {
    const entries = paletteDisplayEntries(group.palette);
    for (let i = 0; i < entries.length; i++) {
      swatches.push(paletteSwatchCss(group.palette, entries[i].value, i));
      if (swatches.length >= 12) break;
    }
    if (swatches.length >= 12) break;
  }

  if (swatches.length === 0) {
    swatches.push('#374151', '#4b5563', '#6b7280');
  }

  const width = 160;
  const height = 90;
  const sliceWidth = width / swatches.length;
  const rects = swatches
    .map(
      (color, index) =>
        `<rect x="${(index * sliceWidth).toFixed(2)}" y="0" width="${sliceWidth.toFixed(2)}" height="${height}" fill="${color}" />`,
    )
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${rects}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function derivedCharacterColorPaletteGroupAssetId(
  characterId: string,
  collectionId: string,
): string {
  return `derived:color-palette-group:character:${characterId}:${collectionId}`;
}

export function derivedLocationColorPaletteGroupAssetId(
  locationId: string,
  collectionId: string,
): string {
  return `derived:color-palette-group:location:${locationId}:${collectionId}`;
}

export function parseDerivedCharacterColorPaletteGroupAssetId(
  assetId: string,
): { characterId: string; collectionId: string } | null {
  const match = /^derived:color-palette-group:character:([^:]+):([^:]+)$/.exec(assetId);
  if (!match) return null;
  return { characterId: match[1], collectionId: match[2] };
}

export function parseDerivedLocationColorPaletteGroupAssetId(
  assetId: string,
): { locationId: string; collectionId: string } | null {
  const match = /^derived:color-palette-group:location:([^:]+):([^:]+)$/.exec(assetId);
  if (!match) return null;
  return { locationId: match[1], collectionId: match[2] };
}

export function createColorPaletteGroupMediaAsset(
  collection: ColorPaletteCollection,
  opts: {
    scope?: MediaLibraryScope;
    characterId?: string;
    locationId?: string;
  } = {},
): MediaAsset {
  const doc = collectionToDocument(collection);
  const url = encodeColorPaletteGroupDocument(doc);
  return {
    id: collection.id,
    type: 'color-palette-group',
    url,
    thumbnailUrl: colorPaletteGroupThumbnailDataUrl(collection),
    createdAt: collection.createdAt,
    workflowOrigin: 'upload',
    scope: opts.scope,
    metadata: {
      usedInShots: [],
      ...(opts.characterId ? { characterId: opts.characterId } : {}),
      ...(opts.locationId ? { locationId: opts.locationId } : {}),
      colorPaletteGroupId: collection.id,
    },
  };
}

export function createDerivedColorPaletteGroupAsset(
  collection: ColorPaletteCollection,
  owner: { type: 'character'; id: string } | { type: 'location'; id: string },
): MediaAsset {
  const doc = collectionToDocument(collection);
  const url = encodeColorPaletteGroupDocument(doc);
  const id =
    owner.type === 'character'
      ? derivedCharacterColorPaletteGroupAssetId(owner.id, collection.id)
      : derivedLocationColorPaletteGroupAssetId(owner.id, collection.id);

  return {
    id,
    type: 'color-palette-group',
    url,
    thumbnailUrl: colorPaletteGroupThumbnailDataUrl(collection),
    createdAt: collection.createdAt,
    workflowOrigin: 'upload',
    metadata: {
      usedInShots: [],
      ...(owner.type === 'character'
        ? { characterId: owner.id, colorPaletteGroupId: collection.id }
        : { locationId: owner.id, colorPaletteGroupId: collection.id }),
    },
  };
}

export function formatColorPaletteGroupAssetName(asset: MediaAsset): string {
  return parseColorPaletteGroupFromAsset(asset)?.name ?? 'Color Palette Group';
}
