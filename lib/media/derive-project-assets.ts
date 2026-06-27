/**
 * Derives MediaAsset records directly from live project state (setups + shots).
 *
 * These are "implicit" assets — images and videos that exist in the project
 * because the user added them to a workflow, not because they were explicitly
 * saved to the media library. They always reflect the current project state
 * without any manual save step.
 *
 * Deduplication: callers should merge these with the explicit mediaLibrary by
 * URL — if an explicit asset already covers the same URL, prefer the explicit
 * one (it has a richer content-hash ID and metadata).
 */

import type { MediaAsset, MediaAssetType } from '@/lib/types/media-library';
import type { Character, ColorPaletteCollection, Location, ReferenceRole, Setup } from '@/lib/types/studio';
import { isRemoteProviderUrl } from '@/lib/storage/project-media-paths';
import {
  collectionToDocument,
  colorPaletteGroupThumbnailDataUrl,
  encodeColorPaletteGroupDocument,
} from '@/lib/media/color-palette-group';

function encodeCollectionUrl(collection: ColorPaletteCollection): string {
  return encodeColorPaletteGroupDocument(collectionToDocument(collection));
}

function thumbnailForCollection(collection: ColorPaletteCollection): string {
  return colorPaletteGroupThumbnailDataUrl(collection);
}

/** Stable derived-asset ID from a source descriptor. Does not require hashing. */
function derivedId(...parts: (string | number)[]): string {
  return `derived:${parts.join(':')}`;
}

function roleToAssetType(role: ReferenceRole): MediaAssetType {
  switch (role) {
    case 'Subject':
      return 'character-sheet';
    case 'Backdrop':
      return 'backdrop';
    default:
      return 'reference';
  }
}

/**
 * Derive MediaAsset records from a project's setups, characters, and locations.
 * The caller is responsible for deduplicating against the explicit mediaLibrary.
 */
export function deriveProjectAssets(
  setups: Setup[],
  characters: Character[] = [],
  locations: Location[] = [],
): MediaAsset[] {
  const assets: MediaAsset[] = [];
  const seenUrls = new Set<string>();

  function push(asset: MediaAsset) {
    if (seenUrls.has(asset.url)) return;
    seenUrls.add(asset.url);
    assets.push(asset);
  }

  const now = Date.now();

  // ── Character sheets (project-level objects) ───────────────────────────────
  for (const character of characters) {
    for (const sheet of character.sheets) {
      if (!sheet.url) continue;
      push({
        id: derivedId('character-sheet', character.id, sheet.id),
        type: 'character-sheet',
        url: sheet.url,
        thumbnailUrl: sheet.url,
        createdAt: sheet.createdAt,
        workflowOrigin: 'upload',
        metadata: { characterId: character.id, usedInShots: [] },
      });
    }
    for (const collection of character.colorPalettes ?? []) {
      if (!collection.groups?.length) continue;
      push({
        id: derivedId('color-palette-group', 'character', character.id, collection.id),
        type: 'color-palette-group',
        url: encodeCollectionUrl(collection),
        thumbnailUrl: thumbnailForCollection(collection),
        createdAt: collection.createdAt,
        workflowOrigin: 'upload',
        metadata: {
          characterId: character.id,
          colorPaletteGroupId: collection.id,
          usedInShots: [],
        },
      });
    }
  }

  // ── Location backdrop plates (project-level objects) ──────────────────────
  for (const location of locations) {
    for (const plate of location.plates) {
      if (!plate.url) continue;
      // Which setups/coverages use this plate?
      const shotIds = setups.flatMap((setup) =>
        setup.shots.filter((c) => c.backdropId === plate.id).map((c) => c.id),
      );
      push({
        id: derivedId('location-plate', location.id, plate.id),
        type: 'backdrop-plate',
        url: plate.url,
        thumbnailUrl: plate.url,
        createdAt: plate.createdAt,
        workflowOrigin: 'upload',
        metadata: { locationId: location.id, usedInShots: shotIds },
      });
    }
    for (const collection of location.colorPalettes ?? []) {
      if (!collection.groups?.length) continue;
      push({
        id: derivedId('color-palette-group', 'location', location.id, collection.id),
        type: 'color-palette-group',
        url: encodeCollectionUrl(collection),
        thumbnailUrl: thumbnailForCollection(collection),
        createdAt: collection.createdAt,
        workflowOrigin: 'upload',
        metadata: {
          locationId: location.id,
          colorPaletteGroupId: collection.id,
          usedInShots: [],
        },
      });
    }
  }

  for (const setup of setups) {
    // ── Backdrop plates (legacy setup-level) ──────────────────────────────
    for (const backdrop of setup.backdrops) {
      if (!backdrop.url) continue;
      // Which coverage shots use this backdrop?
      const shotIds = setup.shots
        .filter((c) => c.backdropId === backdrop.id)
        .map((c) => c.id);

      push({
        id: derivedId('backdrop', setup.id, backdrop.id),
        type: 'backdrop-plate',
        url: backdrop.url,
        thumbnailUrl: backdrop.url,
        createdAt: now,
        workflowOrigin: 'upload',
        metadata: { usedInShots: shotIds },
      });
    }

    // ── Setup-level references (character sheets, style refs, etc.) ────────
    for (let i = 0; i < setup.references.length; i++) {
      const url = setup.references[i];
      if (!url) continue;
      const role: ReferenceRole = setup.referenceRoles[i] ?? 'None';
      if (role === 'None') continue;

      // Collect shot IDs that belong to this setup.
      const shotIds = setup.shots.map((c) => c.id);

      push({
        id: derivedId('ref', setup.id, i),
        type: roleToAssetType(role),
        url,
        thumbnailUrl: url,
        createdAt: now,
        workflowOrigin: 'upload',
        metadata: { usedInShots: shotIds },
      });
    }

    // ── Per-coverage baked frames and generated videos ─────────────────────
    for (const coverage of setup.shots) {
      if (coverage.bakedStartFrame && !isRemoteProviderUrl(coverage.bakedStartFrame)) {
        push({
          id: derivedId('bake', coverage.id),
          type: 'baked-frame',
          url: coverage.bakedStartFrame,
          thumbnailUrl: coverage.bakedStartFrame,
          createdAt: now,
          workflowOrigin: 'bake-start-frame',
          metadata: { usedInShots: [coverage.id] },
        });
      }
      if (
        coverage.bakedIntermediateFrame &&
        coverage.bakedIntermediateFrame !== coverage.bakedStartFrame &&
        !isRemoteProviderUrl(coverage.bakedIntermediateFrame)
      ) {
        push({
          id: derivedId('bake-intermediate', coverage.id),
          type: 'intermediate-frame',
          url: coverage.bakedIntermediateFrame,
          thumbnailUrl: coverage.bakedIntermediateFrame,
          createdAt: now,
          workflowOrigin: 'bake-start-frame',
          metadata: { usedInShots: [coverage.id] },
        });
      }
      // Generated videos and temporary provider URLs are NOT derived from project
      // state — they are archived to the explicit mediaLibrary as data URLs at
      // generation/bake time instead.
    }
  }

  return assets;
}

/**
 * Merge derived project assets with explicit library assets, preferring
 * explicit assets when they share the same URL (they have richer metadata).
 */
export function mergeWithDerivedAssets(
  explicitAssets: MediaAsset[],
  derivedAssets: MediaAsset[],
): MediaAsset[] {
  const explicitUrls = new Set(explicitAssets.map((a) => a.url));
  const newDerived = derivedAssets.filter((a) => !explicitUrls.has(a.url));
  return [...explicitAssets, ...newDerived];
}
