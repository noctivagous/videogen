'use client';

import { useRef, useState } from 'react';
import type { Character, CharacterSheet } from '@/lib/types/studio';
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

interface SheetThumbnailProps {
  sheet: CharacterSheet;
  onRemove?: () => void;
  showRemove?: boolean;
}

function SheetThumbnail({ sheet, onRemove, showRemove }: SheetThumbnailProps) {
  return (
    <div className="relative group w-16 h-16 flex-shrink-0">
      <img
        src={sheet.url}
        alt={sheet.label ?? 'Character sheet'}
        className="w-full h-full object-cover rounded-lg border border-surface-600"
      />
      {showRemove && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          title="Remove sheet"
        >
          ×
        </button>
      )}
    </div>
  );
}

interface CharacterCardProps {
  character: Character;
  onRename: (name: string) => void;
  onAddSheet: (url: string) => void;
  onRemoveSheet: (sheetId: string) => void;
  onDelete: () => void;
}

function CharacterCard({ character, onRename, onAddSheet, onRemoveSheet, onDelete }: CharacterCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(character.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function commitName() {
    setEditingName(false);
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== character.name) {
      onRename(trimmed);
    } else {
      setNameValue(character.name);
    }
  }

  async function handleAddSheet(files: FileList | null) {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const url = await readFileAsDataUrl(file);
      onAddSheet(url);
    }
  }

  const primarySheet = character.sheets[0];

  return (
    <div className="bg-surface-800 border border-surface-600 rounded-xl overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-3 p-3">
        {/* Primary sheet thumbnail */}
        <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden border border-surface-600 bg-surface-700">
          {primarySheet ? (
            <img
              src={primarySheet.url}
              alt={character.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
                if (e.key === 'Escape') { setEditingName(false); setNameValue(character.name); }
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
              {character.name}
            </button>
          )}
          <p className="text-[10px] text-gray-500 mt-0.5">
            {character.sheets.length} sheet{character.sheets.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-surface-700 text-gray-400 hover:text-gray-200 transition-colors"
            title={expanded ? 'Collapse' : 'Expand sheets'}
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
              title="Delete character"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Expanded sheet grid */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-surface-700">
          <div className="flex flex-wrap gap-2 mt-3">
            {character.sheets.map((sheet) => (
              <SheetThumbnail
                key={sheet.id}
                sheet={sheet}
                showRemove={character.sheets.length > 1}
                onRemove={() => onRemoveSheet(sheet.id)}
              />
            ))}

            {/* Add sheet button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-16 h-16 rounded-lg border border-dashed border-surface-500 hover:border-brand-500 text-gray-500 hover:text-brand-400 flex items-center justify-center transition-colors flex-shrink-0"
              title="Add sheet"
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
            onChange={(e) => handleAddSheet(e.target.files)}
          />
        </div>
      )}
    </div>
  );
}

// ── New Character Form ────────────────────────────────────────────────────────

interface NewCharacterFormProps {
  onCreated: () => void;
  onCancel: () => void;
}

function NewCharacterForm({ onCreated, onCancel }: NewCharacterFormProps) {
  const createCharacter = useStudioStore((s) => s.createCharacter);
  const [name, setName] = useState('');
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [sheetPreview, setSheetPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(files: FileList | null) {
    if (!files?.length) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) return;
    const url = await readFileAsDataUrl(file);
    setSheetUrl(url);
    setSheetPreview(url);
  }

  function handleCreate() {
    if (!name.trim() || !sheetUrl) return;
    createCharacter(name.trim(), sheetUrl);
    onCreated();
  }

  const canCreate = Boolean(name.trim() && sheetUrl);

  return (
    <div className="bg-surface-800 border border-brand-500/40 rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-100">New Character</h3>

      <div>
        <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Name</label>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && canCreate) handleCreate(); if (e.key === 'Escape') onCancel(); }}
          placeholder="e.g. Alex, Detective Rivera"
          className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-brand-500"
        />
      </div>

      <div>
        <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Character Sheet (required)</label>
        {sheetPreview ? (
          <div className="flex items-center gap-3">
            <img
              src={sheetPreview}
              alt="Character sheet preview"
              className="w-16 h-16 object-cover rounded-lg border border-surface-600"
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
            <span className="text-xs">Upload sheet image</span>
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
          Create Character
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

export function CharacterManager() {
  const characters = useStudioStore((s) => s.characters);
  const renameCharacter = useStudioStore((s) => s.renameCharacter);
  const addCharacterSheet = useStudioStore((s) => s.addCharacterSheet);
  const removeCharacterSheet = useStudioStore((s) => s.removeCharacterSheet);
  const deleteCharacter = useStudioStore((s) => s.deleteCharacter);
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
          <h1 className="text-sm font-semibold text-gray-100">Character Manager</h1>
          <p className="text-[10px] text-gray-500">{characters.length} character{characters.length !== 1 ? 's' : ''} in this project</p>
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
          New Character
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {showNewForm && (
          <NewCharacterForm
            onCreated={() => setShowNewForm(false)}
            onCancel={() => setShowNewForm(false)}
          />
        )}

        {characters.length === 0 && !showNewForm && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface-800 border border-surface-600 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-400">No characters yet</p>
            <p className="text-xs text-gray-600 mt-1 max-w-xs">
              Create a character with a name and at least one reference sheet to use in your shots.
            </p>
            <button
              type="button"
              onClick={() => setShowNewForm(true)}
              className="mt-4 px-4 py-2 text-xs font-medium rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition-colors"
            >
              Create First Character
            </button>
          </div>
        )}

        {characters.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            onRename={(name) => renameCharacter(character.id, name)}
            onAddSheet={(url) => addCharacterSheet(character.id, url)}
            onRemoveSheet={(sheetId) => removeCharacterSheet(character.id, sheetId)}
            onDelete={() => deleteCharacter(character.id)}
          />
        ))}
      </div>
    </div>
  );
}
