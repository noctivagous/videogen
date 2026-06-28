'use client';

import { useEffect, useState } from 'react';
import {
  EntityDropdown,
  EntityDropdownPanel,
} from '@/components/studio/entity-picker/EntityDropdown';
import { EntityImageAddButton } from '@/components/studio/entity-picker/EntityImageAddButton';
import { STOCK_LOCATIONS } from '@/lib/constants/stock-project';
import { isManualBackdropLocation } from '@/lib/studio/manual-backdrop-location';
import { useStudioStore } from '@/store/useStudioStore';
import { useNavigateToStudioPanel } from '@/hooks/use-studio-panel-navigation';

/**
 * Location → backdrop plate picker for the bake workflow Backdrop section.
 */
interface LocationPickerSectionProps {
  checklistMarker?: string;
  checklistDone?: boolean;
}

function isBackdropPlate(plate: { dataType?: string }) {
  const dataType = plate.dataType;
  return !dataType || dataType === 'backdrop-plate';
}

export function LocationPickerSection({
  checklistMarker,
  checklistDone = false,
}: LocationPickerSectionProps) {
  const locations = useStudioStore((s) => s.locations);
  const setups = useStudioStore((s) => s.setups);
  const currentSetupId = useStudioStore((s) => s.currentSetupId);
  const currentCoverageShotId = useStudioStore((s) => s.currentCoverageShotId);
  const assignLocationToSetup = useStudioStore((s) => s.assignLocationToSetup);
  const assignPlateToShot = useStudioStore((s) => s.assignPlateToShot);
  const navigateToPanel = useNavigateToStudioPanel();

  const [locationOpen, setLocationOpen] = useState(false);
  const [plateOpen, setPlateOpen] = useState(false);

  const setup = setups.find((s) => s.id === currentSetupId);
  const assignedLocationId = setup?.locationId ?? null;
  const assignedLocation = locations.find((l) => l.id === assignedLocationId) ?? null;
  const assignableLocations = locations.filter((location) => !isManualBackdropLocation(location));
  const selectablePlates = (assignedLocation?.plates ?? []).filter(isBackdropPlate);
  const firstBackdropPlateUrl = (plates: typeof locations[number]['plates']): string | undefined => {
    const candidate = plates.find((plate) => isBackdropPlate(plate) && Boolean(plate.url));
    return candidate?.url ?? undefined;
  };

  const activeCoverage = setup?.shots.find((s) => s.id === currentCoverageShotId) ?? setup?.shots[0];
  const assignedPlateId = activeCoverage?.backdropId ?? null;
  const assignedPlate = selectablePlates.find((p) => p.id === assignedPlateId) ?? null;

  const plateOwningLocation =
    assignedPlateId == null
      ? null
      : assignableLocations.find((location) =>
          location.plates.some((plate) => isBackdropPlate(plate) && plate.id === assignedPlateId),
        ) ??
        STOCK_LOCATIONS.find((location) =>
          location.plates.some((plate) => isBackdropPlate(plate) && plate.id === assignedPlateId),
        ) ??
        null;
  const plateOwningLocationId = plateOwningLocation?.id ?? null;
  const catalogPlateUrl =
    plateOwningLocation?.plates.find((plate) => isBackdropPlate(plate) && plate.id === assignedPlateId)
      ?.url ?? null;
  const setupBackdropUrl =
    assignedPlateId == null
      ? null
      : (setup?.backdrops.find((backdrop) => backdrop.id === assignedPlateId)?.url ?? null);

  useEffect(() => {
    if (!currentSetupId || !currentCoverageShotId || !assignedPlateId || !plateOwningLocationId) return;

    const isLocationOutOfSync = assignedLocationId !== plateOwningLocationId;
    const isBackdropUrlOutOfSync = Boolean(catalogPlateUrl) && setupBackdropUrl !== catalogPlateUrl;
    if (!isLocationOutOfSync && !isBackdropUrlOutOfSync) return;

    assignPlateToShot(
      currentSetupId,
      currentCoverageShotId,
      assignedPlateId,
      plateOwningLocationId,
    );
  }, [
    assignPlateToShot,
    assignedLocationId,
    assignedPlateId,
    catalogPlateUrl,
    currentCoverageShotId,
    currentSetupId,
    plateOwningLocationId,
    setupBackdropUrl,
  ]);

  return (
    <fieldset className="workflow-step-fieldset workflow-step-fieldset--nested">
      <legend className="workflow-step-fieldset__legend flex items-center gap-1.5 w-full pr-1">
        {checklistMarker && (
          <span
            className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
              checklistDone ? 'bg-brand-500/30 text-brand-300' : 'bg-surface-700 text-gray-500'
            }`}
            aria-hidden="true"
          >
            {checklistDone ? '✓' : checklistMarker}
          </span>
        )}
        <span className={checklistDone ? 'text-gray-300' : ''}>Locations</span>
        <button
          type="button"
          onClick={() => navigateToPanel('location-manager')}
          className="ml-auto text-brand-400 hover:text-brand-300 transition-colors text-[9px] normal-case tracking-normal font-medium"
        >
          Manage →
        </button>
      </legend>
      <div className="flex flex-col gap-2 text-[10px] text-gray-400">
        <EntityDropdown
          label="Location"
          value={assignedLocation?.name ?? ''}
          thumbnailUrl={selectablePlates[0]?.url}
          placeholder="Select location…"
          open={locationOpen}
          onToggle={() => {
            setLocationOpen((v) => !v);
            setPlateOpen(false);
          }}
          emptyIcon={
            <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
          }
        >
          <EntityDropdownPanel>
            <div className="p-1 space-y-0.5 max-h-40 overflow-y-auto">
              {assignableLocations.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                    onClick={() => {
                      const defaultPlate = loc.plates.find(isBackdropPlate);
                      if (activeCoverage && defaultPlate) {
                        assignPlateToShot(
                          currentSetupId,
                          activeCoverage.id,
                          defaultPlate.id,
                          loc.id,
                        );
                      } else {
                        assignLocationToSetup(currentSetupId, loc.id);
                      }
                      setLocationOpen(false);
                    }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-surface-700 transition-colors text-[11px]
                    ${loc.id === assignedLocationId ? 'bg-brand-500/10 text-brand-300' : 'text-gray-200'}`}
                >
                  {firstBackdropPlateUrl(loc.plates) && (
                    <img
                      src={firstBackdropPlateUrl(loc.plates)}
                      alt={loc.name}
                      className="w-10 h-6 rounded object-cover border border-surface-600 flex-shrink-0"
                    />
                  )}
                  <span className="truncate flex-1">{loc.name}</span>
                </button>
              ))}
              {assignableLocations.length === 0 && (
                <div className="px-2.5 py-2 text-[11px] text-gray-500">
                  No locations yet. Add an image below or open Location Manager.
                </div>
              )}
            </div>
            {assignedLocation && (
              <div className="border-t border-surface-700 p-1">
                <button
                  type="button"
                  onClick={() => {
                    assignLocationToSetup(currentSetupId, null);
                    setLocationOpen(false);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg text-left text-[11px] text-red-400 hover:bg-surface-700 transition-colors"
                >
                  Remove assignment
                </button>
              </div>
            )}
          </EntityDropdownPanel>
        </EntityDropdown>

        {assignedLocation && activeCoverage && (
          <EntityDropdown
            label="Backdrop Plate"
            value={assignedPlate?.label ?? ''}
            thumbnailUrl={assignedPlate?.url}
            placeholder="Select backdrop plate…"
            open={plateOpen}
            onToggle={() => {
              setPlateOpen((v) => !v);
              setLocationOpen(false);
            }}
          >
            <EntityDropdownPanel>
              <div className="p-1 space-y-0.5 max-h-40 overflow-y-auto">
                {selectablePlates.map((plate) => (
                  <button
                    key={plate.id}
                    type="button"
                      onClick={() => {
                        assignPlateToShot(
                          currentSetupId,
                          activeCoverage.id,
                          plate.id,
                          assignedLocationId ?? undefined,
                        );
                        setPlateOpen(false);
                      }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-surface-700 transition-colors text-[11px]
                      ${plate.id === assignedPlateId ? 'bg-brand-500/10 text-brand-300' : 'text-gray-200'}`}
                  >
                    {plate.url && (
                      <img
                        src={plate.url}
                        alt={plate.label}
                        className="w-10 h-6 rounded object-cover border border-surface-600 flex-shrink-0"
                      />
                    )}
                    <span className="truncate flex-1">{plate.label}</span>
                  </button>
                ))}
              </div>
            </EntityDropdownPanel>
          </EntityDropdown>
        )}

        <EntityImageAddButton kind="location" label="Add backdrop image…" />
      </div>
    </fieldset>
  );
}
