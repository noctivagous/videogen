'use client';

import { create } from 'zustand';

interface StudioPanelInspectorStore {
  characterManagerSelectedCharacterId: string | null;
  characterManagerSelectedAssetId: string | null;
  locationManagerSelectedLocationId: string | null;
  locationManagerSelectedAssetId: string | null;
  setCharacterManagerSelection: (characterId: string | null, assetId: string | null) => void;
  setLocationManagerSelection: (locationId: string | null, assetId: string | null) => void;
}

export const useStudioPanelInspectorStore = create<StudioPanelInspectorStore>((set) => ({
  characterManagerSelectedCharacterId: null,
  characterManagerSelectedAssetId: null,
  locationManagerSelectedLocationId: null,
  locationManagerSelectedAssetId: null,
  setCharacterManagerSelection: (characterId, assetId) =>
    set({
      characterManagerSelectedCharacterId: characterId,
      characterManagerSelectedAssetId: assetId,
    }),
  setLocationManagerSelection: (locationId, assetId) =>
    set({
      locationManagerSelectedLocationId: locationId,
      locationManagerSelectedAssetId: assetId,
    }),
}));
