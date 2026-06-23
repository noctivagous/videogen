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
import type { ReferenceRole, Setup } from '@/lib/types/studio';

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
 * Derive MediaAsset records from a project's setups.
 * The caller is responsible for deduplicating against the explicit mediaLibrary.
 */
export function deriveProjectAssets(setups: Setup[]): MediaAsset[] {
  const assets: MediaAsset[] = [];
  const seenUrls = new Set<string>();

  function push(asset: MediaAsset) {
    if (seenUrls.has(asset.url)) return;
    seenUrls.add(asset.url);
    assets.push(asset);
  }

  const now = Date.now();

  for (const setup of setups) {
    // ── Backdrop plates ────────────────────────────────────────────────────
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
      if (coverage.bakedStartFrame) {
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
        coverage.bakedIntermediateFrame !== coverage.bakedStartFrame
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
      // Generated videos are NOT derived from project state because the provider
      // URLs are temporary (e.g. xAI URLs expire after ~1 hour). Videos are
      // saved to the explicit mediaLibrary as blobs at generation time instead.
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
