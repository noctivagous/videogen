'use client';

import { useEffect, useRef, useState, type DragEvent } from 'react';
import type { Location, LocationBackdropPlate, ColorPaletteCollection } from '@/lib/types/studio';
import {
  getManualBackdropPlates,
  isManualBackdropLocation,
  parseDerivedLocationPlateAssetId,
} from '@/lib/studio/manual-backdrop-location';
import { ColorPaletteGroupChip } from '@/components/studio/ColorPaletteGroupChip';
import {
  derivedLocationColorPaletteGroupAssetId,
  parseDerivedLocationColorPaletteGroupAssetId,
} from '@/lib/media/color-palette-group';
import { CollapsibleManagerCard } from '@/components/studio/manager-cards/CollapsibleManagerCard';
import { ManagerScopeSegment, type ManagerScope } from '@/components/studio/ManagerScopeSegment';
import { StudioPanelHeader } from '@/components/studio/StudioPanelHeader';
import { STUDIO_LAUNCHER_ICONS } from '@/components/studio/studio-launcher-icons';
import { useStudioPanelInspectorStore } from '@/store/useStudioPanelInspectorStore';
import { useStudioStore } from '@/store/useStudioStore';
import { useNavigateToStudioPanel } from '@/hooks/use-studio-panel-navigation';

// ── Helpers ──────────────────────────────────────────────────────────────────

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function derivedLocationPlateAssetId(locationId: string, plateId: string): string {
  return `derived:location-plate:${locationId}:${plateId}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface PlateThumbnailProps {
  locationId: string;
  plate: LocationBackdropPlate;
  onRemove?: () => void;
  showRemove?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  getSetupLabel?: (setupId: number) => string;
}

function PlateThumbnail({
  locationId,
  plate,
  onRemove,
  showRemove,
  selected,
  onSelect,
  getSetupLabel,
}: PlateThumbnailProps) {
  const setupTag =
    plate.source === 'manual' && (plate.setupIds?.length ?? 0) > 0
      ? plate.setupIds!.map((setupId) => getSetupLabel?.(setupId) ?? `Setup ${setupId}`).join(', ')
      : null;
  return (
    <div className="relative group w-24 h-14 flex-shrink-0">
      <button
        type="button"
        onClick={onSelect}
        className="block w-full h-full"
        draggable={Boolean(plate.url)}
        onDragStart={(e) => {
          if (!plate.url) return;
          e.dataTransfer.effectAllowed = 'copy';
          e.dataTransfer.setData('text/uri-list', plate.url);
          e.dataTransfer.setData('text/plain', plate.url);
          e.dataTransfer.setData(
            'application/x-videogen-location-plate',
            JSON.stringify({ locationId, plateId: plate.id }),
          );
        }}
      >
        {plate.url ? (
          <img
            src={plate.url}
            alt={plate.label}
            className={`w-full h-full object-cover rounded-lg border transition-colors ${
              selected ? 'border-brand-500 ring-1 ring-brand-500/70' : 'border-surface-600 hover:border-brand-500/60'
            }`}
          />
        ) : (
          <div
            className={`w-full h-full rounded-lg border bg-surface-700 flex items-center justify-center text-gray-600 transition-colors ${
              selected ? 'border-brand-500 ring-1 ring-brand-500/70' : 'border-surface-600 hover:border-brand-500/60'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </button>
      <p className="absolute bottom-0 inset-x-0 text-[9px] text-center bg-black/50 text-gray-300 rounded-b-lg px-1 truncate py-0.5">
        {plate.label}
      </p>
      {setupTag && (
        <p className="absolute top-0 left-0 right-0 text-[8px] text-center bg-surface-900/80 text-gray-300 px-1 truncate py-0.5">
          {setupTag}
        </p>
      )}
      {showRemove && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          title="Remove plate"
        >
          ×
        </button>
      )}
    </div>
  );
}

interface LocationCardProps {
  location: Location;
  onRename: (name: string) => void;
  onAddPlate: (url: string, label?: string) => void;
  onRemovePlate: (plateId: string) => void;
  onDelete: () => void;
  onSelectPlate: (plate: LocationBackdropPlate) => void;
  selectedPlateId: string | null;
  onSelectColorPaletteGroup: (collection: ColorPaletteCollection) => void;
  selectedColorPaletteGroupId: string | null;
  onRemoveColorPaletteGroup: (collectionId: string) => void;
  getSetupLabel: (setupId: number) => string;
  onMovePlateHere: (fromLocationId: string, plateId: string) => void;
}

function LocationCard({
  location,
  onRename,
  onAddPlate,
  onRemovePlate,
  onDelete,
  onSelectPlate,
  selectedPlateId,
  onSelectColorPaletteGroup,
  selectedColorPaletteGroupId,
  onRemoveColorPaletteGroup,
  getSetupLabel,
  onMovePlateHere,
}: LocationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAddPlate(files: FileList | null) {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const url = await readFileAsDataUrl(file);
      onAddPlate(url, file.name.replace(/\.[^/.]+$/, ''));
    }
  }

  const primaryPlate = location.plates[0];

  return (
    <div
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes('application/x-videogen-location-plate')) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(e) => {
        const payload = e.dataTransfer.getData('application/x-videogen-location-plate');
        if (!payload) return;
        e.preventDefault();
        try {
          const parsed = JSON.parse(payload) as { locationId?: string; plateId?: string };
          if (!parsed.locationId || !parsed.plateId) return;
          onMovePlateHere(parsed.locationId, parsed.plateId);
        } catch {
          // Ignore malformed drag payloads.
        }
      }}
    >
      <CollapsibleManagerCard
      name={location.name}
      itemCount={location.plates.length}
      itemLabelSingular="backdrop plate"
      expanded={expanded}
      onExpandedChange={setExpanded}
      onRename={onRename}
      onDelete={onDelete}
      expandTitle="Expand plates"
      collapseTitle="Collapse"
      deleteTitle="Delete location"
      onPrimaryClick={() => {
        if (primaryPlate) onSelectPlate(primaryPlate);
      }}
      primary={
        <div
          className={`w-16 h-10 rounded-lg overflow-hidden border bg-surface-700 transition-colors hover:ring-1 hover:ring-brand-500/70 ${
            selectedPlateId === primaryPlate?.id
              ? 'border-brand-500 ring-1 ring-brand-500/70'
              : 'border-surface-600 hover:border-brand-500/60'
          }`}
        >
          {primaryPlate?.url ? (
            <img
              src={primaryPlate.url}
              alt={location.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          )}
        </div>
      }
    >
      <div className="flex flex-wrap gap-2 mt-3">
        {location.plates.map((plate) => (
          <PlateThumbnail
            key={plate.id}
            locationId={location.id}
            plate={plate}
            selected={selectedPlateId === plate.id}
            onSelect={() => onSelectPlate(plate)}
            showRemove={location.plates.length > 1}
            onRemove={() => onRemovePlate(plate.id)}
            getSetupLabel={getSetupLabel}
          />
        ))}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-24 h-14 rounded-lg border border-dashed border-surface-500 hover:border-brand-500 text-gray-500 hover:text-brand-400 flex items-center justify-center transition-colors flex-shrink-0"
          title="Add backdrop plate"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {(location.colorPalettes?.length ?? 0) > 0 && (
        <div className="mt-4 pt-3 border-t border-surface-700">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-2">
            Color Palette Groups
          </p>
          <div className="flex flex-wrap gap-2">
            {(location.colorPalettes ?? []).map((collection) => (
              <ColorPaletteGroupChip
                key={collection.id}
                collection={collection}
                selected={selectedColorPaletteGroupId === collection.id}
                onSelect={() => onSelectColorPaletteGroup(collection)}
                showRemove
                onRemove={() => onRemoveColorPaletteGroup(collection.id)}
              />
            ))}
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => handleAddPlate(e.target.files)}
      />
      </CollapsibleManagerCard>
    </div>
  );
}

// ── New Location Form ─────────────────────────────────────────────────────────

interface NewLocationFormProps {
  onCreated: () => void;
  onCancel: () => void;
  initialPrefill?: {
    plateUrl: string;
    existingPlateRef?: { locationId: string; plateId: string };
  } | null;
}

function NewLocationForm({ onCreated, onCancel, initialPrefill }: NewLocationFormProps) {
  const createLocation = useStudioStore((s) => s.createLocation);
  const locations = useStudioStore((s) => s.locations);
  const manualPlates = getManualBackdropPlates(locations);
  const initialManualPlate =
    initialPrefill?.existingPlateRef != null
      ? manualPlates.find((plate) => plate.id === initialPrefill.existingPlateRef?.plateId) ?? null
      : null;
  const [name, setName] = useState('');
  const [plateUrl, setPlateUrl] = useState<string | null>(initialPrefill?.plateUrl ?? null);
  const [platePreview, setPlatePreview] = useState<string | null>(initialPrefill?.plateUrl ?? null);
  const [selectedManualPlate, setSelectedManualPlate] = useState<LocationBackdropPlate | null>(
    initialManualPlate,
  );
  const [dragActive, setDragActive] = useState(false);
  const [existingPlateRef, setExistingPlateRef] = useState<
    { locationId: string; plateId: string } | undefined
  >(initialPrefill?.existingPlateRef);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(files: FileList | null) {
    if (!files?.length) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) return;
    const url = await readFileAsDataUrl(file);
    setPlateUrl(url);
    setPlatePreview(url);
    setSelectedManualPlate(null);
    setExistingPlateRef(undefined);
  }

  async function handleDropBackdrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setDragActive(false);
    await handleFileSelect(event.dataTransfer.files);
  }

  function handleSelectManualPlate(plate: LocationBackdropPlate) {
    if (!plate.url) return;
    setSelectedManualPlate(plate);
    setPlateUrl(plate.url);
    setPlatePreview(plate.url);
    const manualLocation = locations.find(isManualBackdropLocation);
    if (manualLocation) {
      setExistingPlateRef({ locationId: manualLocation.id, plateId: plate.id });
    }
  }

  async function handleCreate() {
    if (!name.trim() || !plateUrl) return;
    await createLocation(name.trim(), plateUrl, existingPlateRef);
    onCreated();
  }

  const canCreate = Boolean(name.trim() && plateUrl);

  return (
    <div className="bg-surface-800 border border-brand-500/40 rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-100">New Location</h3>

      <div>
        <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Name</label>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canCreate) void handleCreate();
            if (e.key === 'Escape') onCancel();
          }}
          placeholder="e.g. Beach, City Office, Rooftop"
          className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-brand-500"
        />
      </div>

      <div>
        <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Backdrop Plate (required)</label>
        {platePreview ? (
          <div className="flex items-center gap-3">
            <img
              src={platePreview}
              alt="Backdrop plate preview"
              className="h-16 w-28 object-cover rounded-lg border border-surface-600"
            />
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-brand-400 hover:text-brand-300 transition-colors text-left"
              >
                Upload different image
              </button>
              {selectedManualPlate && (
                <span className="text-[10px] text-gray-500">
                  From manual plate: {selectedManualPlate.label}
                </span>
              )}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
              event.dataTransfer.dropEffect = 'copy';
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDropBackdrop}
            className={`w-full border border-dashed rounded-lg py-4 flex flex-col items-center gap-2 transition-colors ${
              dragActive
                ? 'border-brand-500 text-brand-300 bg-brand-500/10'
                : 'border-surface-500 hover:border-brand-500 text-gray-500 hover:text-brand-400'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">Upload backdrop plate</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => handleFileSelect(e.target.files)}
        />

        {manualPlates.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">
              Or select a manual backdrop plate
            </p>
            <div className="flex flex-wrap gap-2">
              {manualPlates.map((plate) => {
                const selected = selectedManualPlate?.id === plate.id;
                return (
                  <button
                    key={plate.id}
                    type="button"
                    onClick={() => handleSelectManualPlate(plate)}
                    className={`relative w-24 h-14 flex-shrink-0 rounded-lg overflow-hidden border transition-colors ${
                      selected
                        ? 'border-brand-500 ring-1 ring-brand-500/70'
                        : 'border-surface-600 hover:border-brand-500/60'
                    }`}
                    title={plate.label}
                  >
                    {plate.url ? (
                      <img
                        src={plate.url}
                        alt={plate.label}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-surface-700 flex items-center justify-center text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <span className="absolute bottom-0 inset-x-0 text-[9px] text-center bg-black/50 text-gray-300 px-1 truncate py-0.5">
                      {plate.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => void handleCreate()}
          disabled={!canCreate}
          className="flex-1 py-2 text-sm font-medium rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Create Location
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-lg border border-surface-600 bg-surface-700 hover:bg-surface-600 text-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────────

export function LocationManager() {
  const locations = useStudioStore((s) => s.locations);
  const setups = useStudioStore((s) => s.setups);
  const renameLocation = useStudioStore((s) => s.renameLocation);
  const addLocationPlate = useStudioStore((s) => s.addLocationPlate);
  const removeLocationPlate = useStudioStore((s) => s.removeLocationPlate);
  const moveLocationPlate = useStudioStore((s) => s.moveLocationPlate);
  const deleteLocation = useStudioStore((s) => s.deleteLocation);
  const removeLocationColorPaletteGroup = useStudioStore((s) => s.removeLocationColorPaletteGroup);
  const selectedLocationId = useStudioPanelInspectorStore((s) => s.locationManagerSelectedLocationId);
  const selectedAssetId = useStudioPanelInspectorStore((s) => s.locationManagerSelectedAssetId);
  const setLocationManagerSelection = useStudioPanelInspectorStore((s) => s.setLocationManagerSelection);
  const newLocationPrefill = useStudioPanelInspectorStore((s) => s.locationManagerNewLocationPrefill);
  const clearLocationManagerNewLocationPrefill = useStudioPanelInspectorStore(
    (s) => s.clearLocationManagerNewLocationPrefill,
  );
  const navigateToPanel = useNavigateToStudioPanel();

  const [showNewForm, setShowNewForm] = useState(false);
  const [scope, setScope] = useState<ManagerScope>('project');
  const visibleLocations = scope === 'project' ? locations : [];

  useEffect(() => {
    if (newLocationPrefill && scope === 'project') {
      setShowNewForm(true);
    }
  }, [newLocationPrefill, scope]);

  const handleCloseNewForm = () => {
    setShowNewForm(false);
    clearLocationManagerNewLocationPrefill();
  };

  const handleScopeChange = (nextScope: ManagerScope) => {
    setScope(nextScope);
    setShowNewForm(false);
    clearLocationManagerNewLocationPrefill();
    setLocationManagerSelection(null, null);
  };

  useEffect(() => {
    if (!selectedLocationId) return;
    const exists = visibleLocations.some((location) => location.id === selectedLocationId);
    if (exists) return;
    setLocationManagerSelection(null, null);
  }, [visibleLocations, selectedLocationId, setLocationManagerSelection]);

  const handleSelectPlate = (location: Location, plate: LocationBackdropPlate) => {
    setLocationManagerSelection(location.id, derivedLocationPlateAssetId(location.id, plate.id));
  };

  const handleSelectColorPaletteGroup = (location: Location, collection: ColorPaletteCollection) => {
    setLocationManagerSelection(
      location.id,
      derivedLocationColorPaletteGroupAssetId(location.id, collection.id),
    );
  };

  return (
    <div className="h-full flex flex-col bg-surface-900">
      <StudioPanelHeader
        title="Location Manager"
        description={`${visibleLocations.length} location${visibleLocations.length !== 1 ? 's' : ''} ${
          scope === 'project' ? 'in this project' : 'in global library'
        }`}
        icon={STUDIO_LAUNCHER_ICONS['location-manager']}
        onBack={() => navigateToPanel('shot-designer')}
        backTitle="Back to Shot Designer"
        titleTrailing={
          <ManagerScopeSegment
            value={scope}
            onChange={handleScopeChange}
            ariaLabel="Location library scope"
          />
        }
        actions={
          <button
            type="button"
            onClick={() => setShowNewForm(true)}
            disabled={showNewForm || scope !== 'project'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition-colors disabled:opacity-40"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            New Location
          </button>
        }
      />

      {/* Body */}
      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 min-w-0 overflow-y-auto p-4 space-y-3">
          {showNewForm && scope === 'project' && (
            <NewLocationForm
              initialPrefill={newLocationPrefill}
              onCreated={handleCloseNewForm}
              onCancel={handleCloseNewForm}
            />
          )}

          {visibleLocations.length === 0 && !showNewForm && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-surface-800 border border-surface-600 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-400">
                {scope === 'project' ? 'No locations yet' : 'No global locations yet'}
              </p>
              <p className="text-xs text-gray-600 mt-1 max-w-xs">
                {scope === 'project'
                  ? 'Create a location with a name and at least one backdrop plate to use as a background in your shots.'
                  : 'Global locations will appear here once saved to the shared library.'}
              </p>
              {scope === 'project' && (
                <button
                  type="button"
                  onClick={() => setShowNewForm(true)}
                  className="mt-4 px-4 py-2 text-xs font-medium rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition-colors"
                >
                  Create First Location
                </button>
              )}
            </div>
          )}

          {visibleLocations.map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              selectedPlateId={
                selectedLocationId === location.id
                  ? parseDerivedLocationPlateAssetId(selectedAssetId ?? '')?.plateId ?? null
                  : null
              }
              onRename={(name) => renameLocation(location.id, name)}
              onAddPlate={(url, label) => addLocationPlate(location.id, url, label)}
              onRemovePlate={(plateId) => removeLocationPlate(location.id, plateId)}
              onDelete={() => deleteLocation(location.id)}
              onSelectPlate={(plate) => handleSelectPlate(location, plate)}
              onSelectColorPaletteGroup={(collection) => handleSelectColorPaletteGroup(location, collection)}
              selectedColorPaletteGroupId={
                selectedLocationId === location.id
                  ? parseDerivedLocationColorPaletteGroupAssetId(selectedAssetId ?? '')?.collectionId ?? null
                  : null
              }
              onRemoveColorPaletteGroup={(collectionId) =>
                removeLocationColorPaletteGroup(location.id, collectionId)
              }
              getSetupLabel={(setupId) =>
                setups.find((setup) => setup.id === setupId)?.name ?? `Setup ${setupId}`
              }
              onMovePlateHere={(fromLocationId, plateId) =>
                moveLocationPlate(fromLocationId, location.id, plateId)
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
