'use client';

import { useEffect, useState } from 'react';
import { ManagedModal } from '@/components/ui/ModalManager';
import { getAssignableLocations } from '@/lib/studio/manual-backdrop-location';
import {
  useEntityImageAssociateStore,
  type EntityImageAssociateKind,
} from '@/store/useEntityImageAssociateStore';
import { useStudioStore } from '@/store/useStudioStore';

function entityLabels(kind: EntityImageAssociateKind) {
  if (kind === 'location') {
    return {
      title: 'Add Backdrop Plate',
      newHeading: 'New location',
      existingHeading: 'Existing location',
      namePlaceholder: 'e.g. Beach, City Office, Rooftop',
      createLabel: 'Create location & use plate',
      associateLabel: 'Add plate to',
      emptyList: 'No locations yet — create one above.',
    };
  }
  return {
    title: 'Add Character Sheet',
    newHeading: 'New character',
    existingHeading: 'Existing character',
    namePlaceholder: 'e.g. Alex, Detective Rivera',
    createLabel: 'Create character & use sheet',
    associateLabel: 'Add sheet to',
    emptyList: 'No characters yet — create one above.',
  };
}

export function EntityImageAssociateModal() {
  const request = useEntityImageAssociateStore((s) => s.request);
  const close = useEntityImageAssociateStore((s) => s.closeEntityImageAssociate);
  const locations = useStudioStore((s) => s.locations);
  const characters = useStudioStore((s) => s.characters);
  const currentSetupId = useStudioStore((s) => s.currentSetupId);
  const currentCoverageShotId = useStudioStore((s) => s.currentCoverageShotId);
  const setups = useStudioStore((s) => s.setups);
  const createLocation = useStudioStore((s) => s.createLocation);
  const addLocationPlate = useStudioStore((s) => s.addLocationPlate);
  const assignPlateToShot = useStudioStore((s) => s.assignPlateToShot);
  const createCharacter = useStudioStore((s) => s.createCharacter);
  const addCharacterSheet = useStudioStore((s) => s.addCharacterSheet);
  const assignCharacterToSlot = useStudioStore((s) => s.assignCharacterToSlot);
  const showToast = useStudioStore((s) => s.showToast);

  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (request) setName('');
  }, [request]);

  const open = request != null;
  const kind = request?.kind ?? 'location';
  const labels = entityLabels(kind);
  const assignableLocations = getAssignableLocations(locations);

  const resetAndClose = () => {
    setName('');
    setBusy(false);
    close();
  };

  const handleOpenChange = () => {
    if (!busy) resetAndClose();
  };

  const assignLocationPlate = (locationId: string, plateId: string) => {
    const setup = setups.find((entry) => entry.id === currentSetupId);
    const coverage =
      setup?.shots.find((shot) => shot.id === currentCoverageShotId) ?? setup?.shots[0];
    if (!coverage) return;
    assignPlateToShot(currentSetupId, coverage.id, plateId, locationId);
  };

  const handleCreateNew = async () => {
    if (!request || !name.trim() || busy) return;
    setBusy(true);
    try {
      if (request.kind === 'location') {
        const location = await createLocation(name.trim(), request.imageUrl);
        const plate = location.plates[0];
        if (plate) {
          assignLocationPlate(location.id, plate.id);
        }
        showToast(`Location "${location.name}" created`);
      } else {
        if (request.slotOrdinal == null) return;
        const character = createCharacter(name.trim(), request.imageUrl);
        const sheet = character.sheets[0];
        if (sheet) {
          assignCharacterToSlot(currentSetupId, request.slotOrdinal, character.id, sheet.id);
        }
        showToast(`Character "${character.name}" created`);
      }
      resetAndClose();
    } finally {
      setBusy(false);
    }
  };

  const handleAssociateExisting = async (entityId: string) => {
    if (!request || busy) return;
    setBusy(true);
    try {
      if (request.kind === 'location') {
        addLocationPlate(entityId, request.imageUrl, request.imageLabel);
        const location = useStudioStore.getState().locations.find((entry) => entry.id === entityId);
        const plate =
          location?.plates.find((entry) => entry.url === request.imageUrl) ??
          location?.plates[location.plates.length - 1];
        if (plate) {
          assignLocationPlate(entityId, plate.id);
        }
        showToast('Backdrop plate added to location');
      } else {
        if (request.slotOrdinal == null) return;
        addCharacterSheet(entityId, request.imageUrl, request.imageLabel);
        const character = useStudioStore.getState().characters.find((entry) => entry.id === entityId);
        const sheet =
          character?.sheets.find((entry) => entry.url === request.imageUrl) ??
          character?.sheets[character.sheets.length - 1];
        if (sheet) {
          assignCharacterToSlot(currentSetupId, request.slotOrdinal, entityId, sheet.id);
        }
        showToast('Character sheet added');
      }
      resetAndClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <ManagedModal
      open={open}
      onClose={handleOpenChange}
      className="glass pro-panel w-full max-w-md max-h-[90vh] rounded-lg border border-surface-700 overflow-hidden flex flex-col modal"
      role="dialog"
      aria-modal="true"
      aria-label={labels.title}
    >
      <div className="px-4 py-3 border-b border-surface-700 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-gray-200">{labels.title}</span>
        <button
          type="button"
          onClick={handleOpenChange}
          disabled={busy}
          className="p-2 hover:bg-surface-700 rounded-lg transition-all text-gray-400 hover:text-white shrink-0 disabled:opacity-40"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {request && (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={request.imageUrl}
              alt=""
              className={`object-cover rounded-lg border border-surface-600 flex-shrink-0 ${
                kind === 'location' ? 'h-16 w-28' : 'h-16 w-16'
              }`}
            />
            <p className="text-[11px] text-gray-400 leading-snug">
              Save this image as a named {kind === 'location' ? 'location backdrop plate' : 'character sheet'},
              then assign it to the current {kind === 'location' ? 'shot' : 'character slot'}.
            </p>
          </div>

          <section className="space-y-2">
            <h3 className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">
              {labels.newHeading}
            </h3>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim()) void handleCreateNew();
              }}
              placeholder={labels.namePlaceholder}
              className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-brand-500"
            />
            <button
              type="button"
              onClick={() => void handleCreateNew()}
              disabled={!name.trim() || busy}
              className="w-full py-2 text-sm font-medium rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {labels.createLabel}
            </button>
          </section>

          <div className="flex items-center gap-3 text-[10px] text-gray-600 uppercase tracking-wider">
            <span className="h-px flex-1 bg-surface-700" />
            <span>or</span>
            <span className="h-px flex-1 bg-surface-700" />
          </div>

          <section className="space-y-2">
            <h3 className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">
              {labels.existingHeading}
            </h3>
            <div className="rounded-lg border border-surface-700 overflow-hidden">
              {kind === 'location' ? (
                assignableLocations.length === 0 ? (
                  <p className="px-3 py-4 text-[11px] text-gray-500">{labels.emptyList}</p>
                ) : (
                  <div className="max-h-40 overflow-y-auto p-1 space-y-0.5">
                    {assignableLocations.map((location) => (
                      <button
                        key={location.id}
                        type="button"
                        disabled={busy}
                        onClick={() => void handleAssociateExisting(location.id)}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-surface-700 transition-colors text-[11px] text-gray-200 disabled:opacity-40"
                      >
                        {location.plates[0]?.url && (
                          <img
                            src={location.plates[0].url}
                            alt=""
                            className="w-10 h-6 rounded object-cover border border-surface-600 flex-shrink-0"
                          />
                        )}
                        <span className="truncate flex-1">{location.name}</span>
                        <span className="text-[9px] text-gray-500 flex-shrink-0">+ plate</span>
                      </button>
                    ))}
                  </div>
                )
              ) : characters.length === 0 ? (
                <p className="px-3 py-4 text-[11px] text-gray-500">{labels.emptyList}</p>
              ) : (
                <div className="max-h-40 overflow-y-auto p-1 space-y-0.5">
                  {characters.map((character) => (
                    <button
                      key={character.id}
                      type="button"
                      disabled={busy}
                      onClick={() => void handleAssociateExisting(character.id)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-surface-700 transition-colors text-[11px] text-gray-200 disabled:opacity-40"
                    >
                      {character.sheets[0]?.url && (
                        <img
                          src={character.sheets[0].url}
                          alt=""
                          className="w-7 h-7 rounded-md object-cover border border-surface-600 flex-shrink-0"
                        />
                      )}
                      <span className="truncate flex-1">{character.name}</span>
                      <span className="text-[9px] text-gray-500 flex-shrink-0">+ sheet</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </ManagedModal>
  );
}
