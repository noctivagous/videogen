'use client';

import { useEffect, useRef, useState } from 'react';
import {
  getAssignableLocations,
  isManualBackdropLocation,
  parseDerivedLocationPlateAssetId,
} from '@/lib/studio/manual-backdrop-location';
import type { MediaAsset } from '@/lib/types/media-library';
import type { Location } from '@/lib/types/studio';
import { useNavigateToStudioPanel } from '@/hooks/use-studio-panel-navigation';
import { useStudioPanelInspectorStore } from '@/store/useStudioPanelInspectorStore';
import { useStudioStore } from '@/store/useStudioStore';

function resolveBackdropPlateContext(
  asset: MediaAsset,
  locations: Location[],
): {
  url: string;
  label: string;
  locationId?: string;
  plateId?: string;
} {
  const parsed = parseDerivedLocationPlateAssetId(asset.id);
  if (parsed) {
    const location = locations.find((entry) => entry.id === parsed.locationId);
    const plate = location?.plates.find((entry) => entry.id === parsed.plateId);
    return {
      url: plate?.url ?? asset.url,
      label: plate?.label ?? 'Backdrop plate',
      locationId: parsed.locationId,
      plateId: parsed.plateId,
    };
  }

  return {
    url: asset.url,
    label: asset.metadata.prompt?.trim() || 'Backdrop plate',
  };
}

interface BackdropPlateLocationActionsProps {
  asset: MediaAsset;
}

export function BackdropPlateLocationActions({ asset }: BackdropPlateLocationActionsProps) {
  const locations = useStudioStore((s) => s.locations);
  const addLocationPlate = useStudioStore((s) => s.addLocationPlate);
  const moveLocationPlate = useStudioStore((s) => s.moveLocationPlate);
  const requestLocationManagerNewLocation = useStudioPanelInspectorStore(
    (s) => s.requestLocationManagerNewLocation,
  );
  const navigateToPanel = useNavigateToStudioPanel();
  const [associateOpen, setAssociateOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const plateContext = resolveBackdropPlateContext(asset, locations);
  const assignableLocations = getAssignableLocations(locations);
  const currentLocation =
    plateContext.locationId != null
      ? locations.find((location) => location.id === plateContext.locationId)
      : undefined;
  const isManualPlate =
    currentLocation != null ? isManualBackdropLocation(currentLocation) : false;

  useEffect(() => {
    if (!associateOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (rootRef.current?.contains(target)) return;
      setAssociateOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [associateOpen]);

  const handleAssociate = (targetLocationId: string) => {
    if (!plateContext.url) return;

    if (plateContext.locationId && plateContext.plateId) {
      if (plateContext.locationId === targetLocationId) {
        setAssociateOpen(false);
        return;
      }
      moveLocationPlate(plateContext.locationId, targetLocationId, plateContext.plateId);
    } else {
      addLocationPlate(targetLocationId, plateContext.url, plateContext.label);
    }
    setAssociateOpen(false);
  };

  const handleMakePartOfNewLocation = () => {
    if (!plateContext.url) return;
    requestLocationManagerNewLocation({
      plateUrl: plateContext.url,
      existingPlateRef:
        plateContext.locationId && plateContext.plateId
          ? { locationId: plateContext.locationId, plateId: plateContext.plateId }
          : undefined,
    });
    navigateToPanel('location-manager');
  };

  return (
    <div className="flex flex-col gap-2 pb-1 border-b border-surface-700/80">
      <div className="relative" ref={rootRef}>
        <button
          type="button"
          onClick={() => setAssociateOpen((open) => !open)}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border border-surface-600 bg-surface-800 hover:bg-surface-700 transition-colors text-left text-[11px] text-gray-200"
        >
          <svg className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
          </svg>
          <span className="flex-1">Associate with Location…</span>
          <span className="text-gray-600 text-[9px] flex-shrink-0">▾</span>
        </button>
        {associateOpen && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-lg border border-surface-600 bg-surface-800 shadow-xl">
            <div className="p-1 space-y-0.5 max-h-40 overflow-y-auto">
              {assignableLocations.length === 0 ? (
                <div className="px-2.5 py-2 text-[11px] text-gray-500">
                  No named locations yet. Create one first.
                </div>
              ) : (
                assignableLocations.map((location) => (
                  <button
                    key={location.id}
                    type="button"
                    onClick={() => handleAssociate(location.id)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-surface-700 transition-colors text-[11px] text-gray-200"
                  >
                    {location.plates[0]?.url && (
                      <img
                        src={location.plates[0].url}
                        alt={location.name}
                        className="w-10 h-6 rounded object-cover border border-surface-600 flex-shrink-0"
                      />
                    )}
                    <span className="truncate flex-1">{location.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleMakePartOfNewLocation}
        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border border-surface-600 bg-surface-800 hover:bg-surface-700 transition-colors text-left text-[11px] text-gray-200"
      >
        <svg className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Make Part Of New Location…</span>
      </button>

      {currentLocation && !isManualPlate && (
        <p className="text-[10px] text-gray-500">
          Currently in {currentLocation.name}.
        </p>
      )}
      {isManualPlate && (
        <p className="text-[10px] text-gray-500">
          Manual backdrop plate — assign to a named location to organize it.
        </p>
      )}
    </div>
  );
}
