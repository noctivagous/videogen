'use client';

import { create } from 'zustand';

interface LocationManagerNewLocationPrefill {
  plateUrl: string;
  existingPlateRef?: { locationId: string; plateId: string };
}

interface StudioPanelInspectorStore {
  characterManagerSelectedCharacterId: string | null;
  characterManagerSelectedAssetId: string | null;
  locationManagerSelectedLocationId: string | null;
  locationManagerSelectedAssetId: string | null;
  locationManagerNewLocationPrefill: LocationManagerNewLocationPrefill | null;
  setCharacterManagerSelection: (characterId: string | null, assetId: string | null) => void;
  setLocationManagerSelection: (locationId: string | null, assetId: string | null) => void;
  requestLocationManagerNewLocation: (prefill: LocationManagerNewLocationPrefill) => void;
  clearLocationManagerNewLocationPrefill: () => void;
}

export const useStudioPanelInspectorStore = create<StudioPanelInspectorStore>((set) => ({
  characterManagerSelectedCharacterId: null,
  characterManagerSelectedAssetId: null,
  locationManagerSelectedLocationId: null,
  locationManagerSelectedAssetId: null,
  locationManagerNewLocationPrefill: null,
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
  requestLocationManagerNewLocation: (prefill) =>
    set({ locationManagerNewLocationPrefill: prefill }),
  clearLocationManagerNewLocationPrefill: () =>
    set({ locationManagerNewLocationPrefill: null }),
}));
