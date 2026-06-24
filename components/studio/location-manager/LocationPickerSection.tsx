'use client';

import { useState } from 'react';
import {
  EntityDropdown,
  EntityDropdownPanel,
} from '@/components/studio/entity-picker/EntityDropdown';
import { SetupBackdropPanel } from '@/components/studio/SetupBackdropPanel';
import { WorkflowCollapsibleSection } from '@/components/ui/WorkflowCollapsibleSection';
import { useStudioStore } from '@/store/useStudioStore';
import { useNavigateToStudioPanel } from '@/hooks/use-studio-panel-navigation';

/**
 * Location → backdrop plate picker for the bake workflow Backdrop section.
 */
export function LocationPickerSection() {
  const locations = useStudioStore((s) => s.locations);
  const setups = useStudioStore((s) => s.setups);
  const currentSetupId = useStudioStore((s) => s.currentSetupId);
  const currentCoverageShotId = useStudioStore((s) => s.currentCoverageShotId);
  const assignLocationToSetup = useStudioStore((s) => s.assignLocationToSetup);
  const assignPlateToShot = useStudioStore((s) => s.assignPlateToShot);
  const navigateToPanel = useNavigateToStudioPanel();

  const [locationOpen, setLocationOpen] = useState(false);
  const [plateOpen, setPlateOpen] = useState(false);
  const [sourceMode, setSourceMode] = useState<'location' | 'manual'>('location');

  const setup = setups.find((s) => s.id === currentSetupId);
  const assignedLocationId = setup?.locationId ?? null;
  const assignedLocation = locations.find((l) => l.id === assignedLocationId) ?? null;

  const activeCoverage = setup?.shots.find((s) => s.id === currentCoverageShotId) ?? setup?.shots[0];
  const assignedPlateId = activeCoverage?.backdropId ?? null;
  const assignedPlate = assignedLocation?.plates.find((p) => p.id === assignedPlateId) ?? null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
        <span className="uppercase tracking-wider font-semibold">Locations</span>
        <button
          type="button"
          onClick={() => navigateToPanel('location-manager')}
          className="ml-auto text-brand-400 hover:text-brand-300 transition-colors text-[9px]"
        >
          Manage →
        </button>
      </div>

      <div className="flex items-start gap-2">
        <input
          type="radio"
          name="backdrop-source-mode"
          checked={sourceMode === 'location'}
          onChange={() => setSourceMode('location')}
          className="mt-2 h-3.5 w-3.5 rounded-full border-surface-500 text-brand-500 focus:ring-brand-500/40"
          aria-label="Use location manager backdrop"
        />
        <div className="flex-1 flex flex-col gap-2">
          <EntityDropdown
            label="Location"
            value={assignedLocation?.name ?? ''}
            thumbnailUrl={assignedLocation?.plates[0]?.url}
            placeholder="Select location…"
            open={locationOpen}
            onToggle={() => {
              if (sourceMode !== 'location') return;
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
                {locations.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => {
                      assignLocationToSetup(currentSetupId, loc.id);
                      if (activeCoverage && loc.plates[0]) {
                        assignPlateToShot(currentSetupId, activeCoverage.id, loc.plates[0].id);
                      }
                      setLocationOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-surface-700 transition-colors text-[11px]
                      ${loc.id === assignedLocationId ? 'bg-brand-500/10 text-brand-300' : 'text-gray-200'}`}
                  >
                    {loc.plates[0]?.url && (
                      <img
                        src={loc.plates[0].url}
                        alt={loc.name}
                        className="w-10 h-6 rounded object-cover border border-surface-600 flex-shrink-0"
                      />
                    )}
                    <span className="truncate flex-1">{loc.name}</span>
                  </button>
                ))}
                {locations.length === 0 && (
                  <div className="px-2.5 py-2 text-[11px] text-gray-500">
                    No locations yet. Create one in Location Manager.
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
                if (sourceMode !== 'location') return;
                setPlateOpen((v) => !v);
                setLocationOpen(false);
              }}
            >
              <EntityDropdownPanel>
                <div className="p-1 space-y-0.5 max-h-40 overflow-y-auto">
                  {assignedLocation.plates.map((plate) => (
                    <button
                      key={plate.id}
                      type="button"
                      onClick={() => {
                        assignPlateToShot(currentSetupId, activeCoverage.id, plate.id);
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
        </div>
      </div>

      <div className="flex items-start gap-2">
        <input
          type="radio"
          name="backdrop-source-mode"
          checked={sourceMode === 'manual'}
          onChange={() => {
            setSourceMode('manual');
            setLocationOpen(false);
            setPlateOpen(false);
          }}
          className="mt-2 h-3.5 w-3.5 rounded-full border-surface-500 text-brand-500 focus:ring-brand-500/40"
          aria-label="Use manual backdrop plate"
        />
        <div className="flex-1">
          <WorkflowCollapsibleSection label="Manual Backdrop Plate" defaultCollapsed>
            <SetupBackdropPanel />
          </WorkflowCollapsibleSection>
        </div>
      </div>
    </div>
  );
}
