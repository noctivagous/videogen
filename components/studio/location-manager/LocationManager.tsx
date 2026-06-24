'use client';

import { useRef, useState } from 'react';
import type { Location, LocationBackdropPlate } from '@/lib/types/studio';
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

// ── Sub-components ────────────────────────────────────────────────────────────

interface PlateThumbnailProps {
  plate: LocationBackdropPlate;
  onRemove?: () => void;
  showRemove?: boolean;
}

function PlateThumbnail({ plate, onRemove, showRemove }: PlateThumbnailProps) {
  return (
    <div className="relative group w-24 h-14 flex-shrink-0">
      {plate.url ? (
        <img
          src={plate.url}
          alt={plate.label}
          className="w-full h-full object-cover rounded-lg border border-surface-600"
        />
      ) : (
        <div className="w-full h-full rounded-lg border border-surface-600 bg-surface-700 flex items-center justify-center text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
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
}

function LocationCard({ location, onRename, onAddPlate, onRemovePlate, onDelete }: LocationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(location.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function commitName() {
    setEditingName(false);
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== location.name) {
      onRename(trimmed);
    } else {
      setNameValue(location.name);
    }
  }

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
    <div className="bg-surface-800 border border-surface-600 rounded-xl overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-3 p-3">
        {/* Primary plate thumbnail */}
        <div className="w-16 h-10 flex-shrink-0 rounded-lg overflow-hidden border border-surface-600 bg-surface-700">
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

        {/* Name */}
        <div className="flex-1 min-w-0">
          {editingName ? (
            <input
              autoFocus
              type="text"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitName();
                if (e.key === 'Escape') { setEditingName(false); setNameValue(location.name); }
              }}
              className="w-full bg-surface-700 border border-brand-500 rounded px-2 py-0.5 text-sm text-gray-100 focus:outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingName(true)}
              className="text-sm font-medium text-gray-100 truncate hover:text-brand-300 transition-colors text-left w-full"
              title="Click to rename"
            >
              {location.name}
            </button>
          )}
          <p className="text-[10px] text-gray-500 mt-0.5">
            {location.plates.length} backdrop plate{location.plates.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-surface-700 text-gray-400 hover:text-gray-200 transition-colors"
            title={expanded ? 'Collapse' : 'Expand plates'}
          >
            <svg
              className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onDelete}
                className="px-2 py-1 text-[10px] bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 text-[10px] bg-surface-700 text-gray-400 rounded hover:bg-surface-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-lg hover:bg-surface-700 text-gray-500 hover:text-red-400 transition-colors"
              title="Delete location"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Expanded plate grid */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-surface-700">
          <div className="flex flex-wrap gap-2 mt-3">
            {location.plates.map((plate) => (
              <PlateThumbnail
                key={plate.id}
                plate={plate}
                showRemove={location.plates.length > 1}
                onRemove={() => onRemovePlate(plate.id)}
              />
            ))}

            {/* Add plate button */}
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
        </div>
      )}
    </div>
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
  const navigateToPanel = useNavigateToStudioPanel();

  const [showNewForm, setShowNewForm] = useState(false);

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
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
            onRename={(name) => renameLocation(location.id, name)}
            onAddPlate={(url, label) => addLocationPlate(location.id, url, label)}
            onRemovePlate={(plateId) => removeLocationPlate(location.id, plateId)}
            onDelete={() => deleteLocation(location.id)}
          />
        ))}
      </div>
    </div>
  );
}
