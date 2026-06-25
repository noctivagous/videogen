'use client';

import { useEffect, useRef, useState } from 'react';
import type { Location, LocationBackdropPlate } from '@/lib/types/studio';
import { InspectionManager } from '@/components/studio/inspection-manager/InspectionManager';
import { CollapsibleManagerCard } from '@/components/studio/manager-cards/CollapsibleManagerCard';
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

function parseDerivedLocationPlateAssetId(assetId: string): { locationId: string; plateId: string } | null {
  const match = /^derived:location-plate:([^:]+):([^:]+)$/.exec(assetId);
  if (!match) return null;
  return { locationId: match[1], plateId: match[2] };
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface PlateThumbnailProps {
  plate: LocationBackdropPlate;
  onRemove?: () => void;
  showRemove?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

function PlateThumbnail({ plate, onRemove, showRemove, selected, onSelect }: PlateThumbnailProps) {
  return (
    <div className="relative group w-24 h-14 flex-shrink-0">
      <button type="button" onClick={onSelect} className="block w-full h-full">
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
}

function LocationCard({
  location,
  onRename,
  onAddPlate,
  onRemovePlate,
  onDelete,
  onSelectPlate,
  selectedPlateId,
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
            plate={plate}
            selected={selectedPlateId === plate.id}
            onSelect={() => onSelectPlate(plate)}
            showRemove={location.plates.length > 1}
            onRemove={() => onRemovePlate(plate.id)}
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

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => handleAddPlate(e.target.files)}
      />
    </CollapsibleManagerCard>
  );
}

// ── New Location Form ─────────────────────────────────────────────────────────

interface NewLocationFormProps {
  onCreated: () => void;
  onCancel: () => void;
}

function NewLocationForm({ onCreated, onCancel }: NewLocationFormProps) {
  const createLocation = useStudioStore((s) => s.createLocation);
  const [name, setName] = useState('');
  const [plateUrl, setPlateUrl] = useState<string | null>(null);
  const [platePreview, setPlatePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(files: FileList | null) {
    if (!files?.length) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) return;
    const url = await readFileAsDataUrl(file);
    setPlateUrl(url);
    setPlatePreview(url);
  }

  function handleCreate() {
    if (!name.trim() || !plateUrl) return;
    createLocation(name.trim(), plateUrl);
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
          onKeyDown={(e) => { if (e.key === 'Enter' && canCreate) handleCreate(); if (e.key === 'Escape') onCancel(); }}
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
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
            >
              Change image
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border border-dashed border-surface-500 hover:border-brand-500 rounded-lg py-4 flex flex-col items-center gap-2 text-gray-500 hover:text-brand-400 transition-colors"
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
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={handleCreate}
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
  const renameLocation = useStudioStore((s) => s.renameLocation);
  const addLocationPlate = useStudioStore((s) => s.addLocationPlate);
  const removeLocationPlate = useStudioStore((s) => s.removeLocationPlate);
  const deleteLocation = useStudioStore((s) => s.deleteLocation);
  const selectShot = useStudioStore((s) => s.selectShot);
  const navigateToPanel = useNavigateToStudioPanel();

  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedLocationId) return;
    const exists = locations.some((location) => location.id === selectedLocationId);
    if (exists) return;
    setSelectedLocationId(null);
  }, [locations, selectedLocationId]);

  const handleSelectPlate = (location: Location, plate: LocationBackdropPlate) => {
    setSelectedLocationId(location.id);
    setSelectedAssetId(derivedLocationPlateAssetId(location.id, plate.id));
  };

  const handleGoToShot = (shotId: number) => {
    selectShot(shotId);
    navigateToPanel('shot-designer');
  };

  return (
    <div className="h-full flex flex-col bg-surface-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-700 flex-shrink-0">
        <button
          type="button"
          onClick={() => navigateToPanel('shot-designer')}
          className="p-1.5 rounded-lg hover:bg-surface-700 text-gray-400 hover:text-gray-200 transition-colors"
          title="Back to Shot Designer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-sm font-semibold text-gray-100">Location Manager</h1>
          <p className="text-[10px] text-gray-500">{locations.length} location{locations.length !== 1 ? 's' : ''} in this project</p>
        </div>
        <button
          type="button"
          onClick={() => setShowNewForm(true)}
          disabled={showNewForm}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition-colors disabled:opacity-40"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          New Location
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 min-w-0 overflow-y-auto p-4 space-y-3 border-r border-surface-700">
          {showNewForm && (
            <NewLocationForm
              onCreated={() => setShowNewForm(false)}
              onCancel={() => setShowNewForm(false)}
            />
          )}

          {locations.length === 0 && !showNewForm && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-surface-800 border border-surface-600 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-400">No locations yet</p>
              <p className="text-xs text-gray-600 mt-1 max-w-xs">
                Create a location with a name and at least one backdrop plate to use as a background in your shots.
              </p>
              <button
                type="button"
                onClick={() => setShowNewForm(true)}
                className="mt-4 px-4 py-2 text-xs font-medium rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition-colors"
              >
                Create First Location
              </button>
            </div>
          )}

          {locations.map((location) => (
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
            />
          ))}
        </div>

        <aside className="w-72 xl:w-80 shrink-0 min-h-0 bg-surface-900/90">
          <InspectionManager
            selectedAssetId={selectedAssetId}
            onSelectAssetId={setSelectedAssetId}
            registrations={[
              {
                parseAssetId: parseDerivedLocationPlateAssetId,
                onMatch: ({ locationId }) => setSelectedLocationId(locationId),
              },
            ]}
            emptyMessage="Select a location plate to inspect details."
            onGoToShot={handleGoToShot}
          />
        </aside>
      </div>
    </div>
  );
}
