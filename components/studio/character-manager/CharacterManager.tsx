'use client';

import { useEffect, useRef, useState } from 'react';
import { DraggableImageWell, DropWell } from '@/components/studio/character-manager/DragAndDrop';
import { ColorPaletteGroupChip } from '@/components/studio/ColorPaletteGroupChip';
import { InspectionManager } from '@/components/studio/inspection-manager/InspectionManager';
import { CollapsibleManagerCard } from '@/components/studio/manager-cards/CollapsibleManagerCard';
import { characterSheetLabel } from '@/components/studio/entity-picker/EntityDropdown';
import type { Character, CharacterSheet, ColorPaletteCollection } from '@/lib/types/studio';
import {
  derivedCharacterColorPaletteGroupAssetId,
  parseDerivedCharacterColorPaletteGroupAssetId,
} from '@/lib/media/color-palette-group';
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

function normalizeSheetLabel(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, ' ');
}

function derivedCharacterSheetAssetId(characterId: string, sheetId: string): string {
  return `derived:character-sheet:${characterId}:${sheetId}`;
}

function parseDerivedCharacterSheetAssetId(assetId: string): { characterId: string; sheetId: string } | null {
  const match = /^derived:character-sheet:([^:]+):([^:]+)$/.exec(assetId);
  if (!match) return null;
  return { characterId: match[1], sheetId: match[2] };
}

function parseStringList(text: string): string[] {
  const values = text
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  return Array.from(new Set(values));
}

function toCharacterStringList(values: string[] | undefined): string[] {
  if (!values) return [];
  return values.map((value) => value.trim()).filter((value) => value.length > 0);
}

const CHARACTER_VIEW_SECTIONS: Array<{ title: string; views: string[] }> = [
  {
    title: 'Fullbody',
    views: ['Front', 'Profile Right', 'Profile Left', 'Back', '3/4 Left'],
  },
  {
    title: 'Bust',
    views: ['Front Bust', 'Profile Bust', '3/4 Bust'],
  },
];

const CHARACTER_SHEET_LABEL = 'Character Sheet';

const VIEW_LABEL_ALIASES: Record<string, string[]> = {
  'Character Sheet': ['character sheet reference', 'main character sheet', 'sheet'],
  'Front': ['front fullbody', 'fullbody front', 'full body front'],
  'Profile Right': ['right profile', 'profile-right', 'profile right fullbody'],
  'Profile Left': ['left profile', 'profile-left', 'profile left fullbody'],
  'Back': ['rear', 'back fullbody', 'fullbody back'],
  '3/4 Left': ['three quarter left', '3/4left', '3-4 left'],
  'Front Bust': ['bust front', 'front bust crop', 'front closeup'],
  'Profile Bust': ['bust profile', 'profile bust left', 'profile bust right'],
  '3/4 Bust': ['three quarter bust', '3/4 bust crop', 'bust 3/4'],
};

const VIEW_OPTIONS = [
  CHARACTER_SHEET_LABEL,
  ...CHARACTER_VIEW_SECTIONS.flatMap((section) => section.views),
];

function isCharacterSheetLabel(label: string | undefined): boolean {
  if (!label) return false;
  const normalized = normalizeSheetLabel(label);
  const canonical = normalizeSheetLabel(CHARACTER_SHEET_LABEL);
  return normalized === canonical || normalized.startsWith(`${canonical} `);
}

function resolveViewAssignments(sheets: CharacterSheet[]): Map<string, CharacterSheet> {
  const usedSheetIds = new Set<string>();
  const assignments = new Map<string, CharacterSheet>();

  const scoreSheetForView = (sheet: CharacterSheet, viewLabel: string): number | null => {
    if (!sheet.label) return null;
    const normalized = normalizeSheetLabel(sheet.label);
    const canonical = normalizeSheetLabel(viewLabel);
    const aliases = (VIEW_LABEL_ALIASES[viewLabel] ?? []).map(normalizeSheetLabel);

    if (normalized === canonical) return 0;
    if (aliases.includes(normalized)) return 1;
    if (normalized.startsWith(`${canonical} `) || normalized.startsWith(`${canonical}-`)) return 2;
    if (aliases.some((alias) => normalized.startsWith(`${alias} `) || normalized.startsWith(`${alias}-`))) {
      return 3;
    }
    return null;
  };

  for (const section of CHARACTER_VIEW_SECTIONS) {
    for (const viewLabel of section.views) {
      const candidates = sheets
        .filter((sheet) => !usedSheetIds.has(sheet.id))
        .map((sheet) => ({ sheet, score: scoreSheetForView(sheet, viewLabel) }))
        .filter((entry): entry is { sheet: CharacterSheet; score: number } => entry.score != null)
        .sort((a, b) => {
          if (a.score !== b.score) return a.score - b.score;
          return b.sheet.createdAt - a.sheet.createdAt;
        });

      const selected = candidates[0]?.sheet;
      if (!selected) continue;
      assignments.set(viewLabel, selected);
      usedSheetIds.add(selected.id);
    }
  }

  return assignments;
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface SheetThumbnailProps {
  sheet: CharacterSheet;
  onRemove?: () => void;
  showRemove?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

function SheetThumbnail({ sheet, onRemove, showRemove, selected, onSelect }: SheetThumbnailProps) {
  return (
    <div className="relative group w-16 h-16 flex-shrink-0">
      <button type="button" onClick={onSelect} className="block w-full h-full">
        <img
          src={sheet.url}
          alt={sheet.label ?? 'Character sheet'}
          className={`w-full h-full object-cover rounded-lg border transition-colors ${
            selected ? 'border-brand-500' : 'border-surface-600 hover:border-brand-500/60'
          }`}
        />
      </button>
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
  onAddSheet: (url: string, label?: string) => void;
  onRemoveSheet: (sheetId: string) => void;
  onAssignSheetLabel: (sheetId: string, label?: string) => void;
  onUpdateLists: (patch: Partial<Pick<Character, 'propNames' | 'wardrobeItems' | 'storedPoses'>>) => void;
  onDelete: () => void;
  onSelectSheet: (sheet: CharacterSheet) => void;
  selectedSheetId: string | null;
  onSelectColorPaletteGroup: (collection: ColorPaletteCollection) => void;
  selectedColorPaletteGroupId: string | null;
  onRemoveColorPaletteGroup: (collectionId: string) => void;
}

function CharacterCard({
  character,
  onRename,
  onAddSheet,
  onRemoveSheet,
  onAssignSheetLabel,
  onUpdateLists,
  onDelete,
  onSelectSheet,
  selectedSheetId,
  onSelectColorPaletteGroup,
  selectedColorPaletteGroupId,
  onRemoveColorPaletteGroup,
}: CharacterCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [pendingSheetLabel, setPendingSheetLabel] = useState<string | null>(null);
  const [draggedSheetId, setDraggedSheetId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAddSheet(files: FileList | null) {
    if (!files?.length) {
      setPendingSheetLabel(null);
      return;
    }
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const url = await readFileAsDataUrl(file);
      onAddSheet(url, pendingSheetLabel ?? undefined);
    }
    setPendingSheetLabel(null);
  }

  const primarySheet = character.sheets[0];
  const viewSheetByLabel = resolveViewAssignments(character.sheets);
  const assignedViewLabelBySheetId = new Map(
    Array.from(viewSheetByLabel.entries()).map(([viewLabel, sheet]) => [sheet.id, viewLabel]),
  );
  const assignedViewSheetIds = new Set(Array.from(viewSheetByLabel.values()).map((sheet) => sheet.id));
  const characterSheetSheets = character.sheets.filter(
    (sheet) => !assignedViewSheetIds.has(sheet.id) && isCharacterSheetLabel(sheet.label),
  );
  const characterSheetIds = new Set(characterSheetSheets.map((sheet) => sheet.id));
  const otherSheets = character.sheets.filter(
    (sheet) => !assignedViewSheetIds.has(sheet.id) && !characterSheetIds.has(sheet.id),
  );

  const assignDraggedSheetToView = (targetViewLabel: string, targetSheetId?: string) => {
    if (!draggedSheetId) return;
    if (targetSheetId && draggedSheetId === targetSheetId) {
      setDraggedSheetId(null);
      return;
    }

    const draggedSheetCurrentView = assignedViewLabelBySheetId.get(draggedSheetId);
    onAssignSheetLabel(draggedSheetId, targetViewLabel);

    if (targetSheetId && targetSheetId !== draggedSheetId) {
      onAssignSheetLabel(targetSheetId, draggedSheetCurrentView);
    }

    setDraggedSheetId(null);
  };

  return (
    <CollapsibleManagerCard
      name={character.name}
      itemCount={character.sheets.length}
      itemLabelSingular="sheet"
      expanded={expanded}
      onExpandedChange={setExpanded}
      onRename={onRename}
      onDelete={onDelete}
      expandTitle="Expand sheets"
      collapseTitle="Collapse"
      deleteTitle="Delete character"
      onPrimaryClick={() => {
        if (primarySheet) onSelectSheet(primarySheet);
      }}
      primary={
        <div
          className={`w-12 h-12 rounded-lg overflow-hidden border bg-surface-700 transition-colors hover:ring-1 hover:ring-brand-500/70 ${
            selectedSheetId === primarySheet?.id
              ? 'border-brand-500 ring-1 ring-brand-500/70'
              : 'border-surface-600 hover:border-brand-500/60'
          }`}
        >
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
      }
    >
      {CHARACTER_VIEW_SECTIONS.map((section) => (
        <div key={section.title} className="mt-3 first:mt-3">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-2">{section.title}</p>
          <div className="flex flex-wrap gap-2">
            {section.views.map((viewLabel) => {
              const assignedSheet = viewSheetByLabel.get(normalizeSheetLabel(viewLabel));
              if (assignedSheet) {
                return (
                  <div key={viewLabel} className="flex flex-col gap-1">
                    <DropWell
                      onDropWell={() => assignDraggedSheetToView(viewLabel, assignedSheet.id)}
                      disabled={!draggedSheetId}
                      overlayLabel={`Swap with ${viewLabel}`}
                    >
                      <DraggableImageWell
                        onDragStart={() => setDraggedSheetId(assignedSheet.id)}
                        onDragEnd={() => setDraggedSheetId(null)}
                      >
                        <SheetThumbnail
                          sheet={assignedSheet}
                          selected={selectedSheetId === assignedSheet.id}
                          onSelect={() => onSelectSheet(assignedSheet)}
                          showRemove={character.sheets.length > 1}
                          onRemove={() => onRemoveSheet(assignedSheet.id)}
                        />
                      </DraggableImageWell>
                    </DropWell>
                    <span className="text-[9px] text-gray-400 w-16 text-center leading-tight">{viewLabel}</span>
                  </div>
                );
              }

              return (
                <div key={viewLabel} className="flex flex-col gap-1">
                  <DropWell
                    onDropWell={() => assignDraggedSheetToView(viewLabel)}
                    disabled={!draggedSheetId}
                    overlayLabel={`Assign to ${viewLabel}`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setPendingSheetLabel(viewLabel);
                        fileInputRef.current?.click();
                      }}
                      className="w-16 h-16 rounded-lg border border-dashed border-surface-500 hover:border-brand-500 text-gray-500 hover:text-brand-400 flex items-center justify-center transition-colors flex-shrink-0"
                      title={`Add ${viewLabel} sheet`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </DropWell>
                  <span className="text-[9px] text-gray-500 w-16 text-center leading-tight">{viewLabel}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
          <div className="mt-3">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-2">Character Sheet</p>
            <div className="flex flex-wrap gap-2">
              {characterSheetSheets.map((sheet, index) => (
                <div key={sheet.id} className="flex flex-col gap-1">
                  <DropWell
                    onDropWell={() => assignDraggedSheetToView(CHARACTER_SHEET_LABEL, sheet.id)}
                    disabled={!draggedSheetId}
                    overlayLabel={`Swap with ${CHARACTER_SHEET_LABEL}`}
                  >
                    <DraggableImageWell
                      onDragStart={() => setDraggedSheetId(sheet.id)}
                      onDragEnd={() => setDraggedSheetId(null)}
                    >
                      <SheetThumbnail
                        sheet={sheet}
                        selected={selectedSheetId === sheet.id}
                        onSelect={() => onSelectSheet(sheet)}
                        showRemove={character.sheets.length > 1}
                        onRemove={() => onRemoveSheet(sheet.id)}
                      />
                    </DraggableImageWell>
                  </DropWell>
                  <span className="text-[9px] text-gray-400 w-16 text-center leading-tight">
                    {characterSheetLabel(sheet.label, index)}
                  </span>
                  <select
                    value={
                      sheet.label && VIEW_OPTIONS.includes(sheet.label)
                        ? sheet.label
                        : CHARACTER_SHEET_LABEL
                    }
                    onChange={(event) => onAssignSheetLabel(sheet.id, event.target.value || undefined)}
                    className="w-16 bg-surface-700 border border-surface-600 rounded px-1 py-0.5 text-[9px] text-gray-200"
                  >
                    <option value="">Unassigned</option>
                    {VIEW_OPTIONS.map((viewLabel) => (
                      <option key={viewLabel} value={viewLabel}>{viewLabel}</option>
                    ))}
                  </select>
                </div>
              ))}

              <DropWell
                onDropWell={() => assignDraggedSheetToView(CHARACTER_SHEET_LABEL)}
                disabled={!draggedSheetId}
                overlayLabel={`Assign to ${CHARACTER_SHEET_LABEL}`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setPendingSheetLabel(CHARACTER_SHEET_LABEL);
                    fileInputRef.current?.click();
                  }}
                  className="w-16 h-16 rounded-lg border border-dashed border-surface-500 hover:border-brand-500 text-gray-500 hover:text-brand-400 flex items-center justify-center transition-colors flex-shrink-0"
                  title="Add character sheet"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </DropWell>
            </div>
          </div>

          <div className="mt-3">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-2">Other</p>
            <div className="flex flex-wrap gap-2">
              {otherSheets.map((sheet, index) => (
                <div key={sheet.id} className="flex flex-col gap-1">
                  <DraggableImageWell
                    onDragStart={() => setDraggedSheetId(sheet.id)}
                    onDragEnd={() => setDraggedSheetId(null)}
                  >
                    <SheetThumbnail
                      sheet={sheet}
                      selected={selectedSheetId === sheet.id}
                      onSelect={() => onSelectSheet(sheet)}
                      showRemove={character.sheets.length > 1}
                      onRemove={() => onRemoveSheet(sheet.id)}
                    />
                  </DraggableImageWell>
                  <span className="text-[9px] text-gray-400 w-16 text-center leading-tight">
                    {characterSheetLabel(sheet.label, index)}
                  </span>
                  <select
                    value={
                      sheet.label && VIEW_OPTIONS.includes(sheet.label)
                        ? sheet.label
                        : ''
                    }
                    onChange={(event) => onAssignSheetLabel(sheet.id, event.target.value || undefined)}
                    className="w-16 bg-surface-700 border border-surface-600 rounded px-1 py-0.5 text-[9px] text-gray-200"
                  >
                    <option value="">Unassigned</option>
                    {VIEW_OPTIONS.map((viewLabel) => (
                      <option key={viewLabel} value={viewLabel}>{viewLabel}</option>
                    ))}
                  </select>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  setPendingSheetLabel(null);
                  fileInputRef.current?.click();
                }}
                className="w-16 h-16 rounded-lg border border-dashed border-surface-500 hover:border-brand-500 text-gray-500 hover:text-brand-400 flex items-center justify-center transition-colors flex-shrink-0"
                title="Add sheet"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          {(character.colorPalettes?.length ?? 0) > 0 && (
            <div className="mt-4 pt-3 border-t border-surface-700">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-2">
                Color Palette Groups
              </p>
              <div className="flex flex-wrap gap-2">
                {(character.colorPalettes ?? []).map((collection) => (
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

          <div className="mt-4 pt-3 border-t border-surface-700 space-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-200">Character Data</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{character.name}</p>
            </div>

            <StringListEditor
              label="Props"
              values={toCharacterStringList(character.propNames)}
              onChange={(next) => onUpdateLists({ propNames: next })}
            />
            <StringListEditor
              label="Wardrobe Items"
              values={character.wardrobeItems ?? []}
              onChange={(next) => onUpdateLists({ wardrobeItems: next })}
            />
            <StringListEditor
              label="Stored Poses"
              values={character.storedPoses ?? []}
              onChange={(next) => onUpdateLists({ storedPoses: next })}
            />
          </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={pendingSheetLabel == null}
        className="sr-only"
        onChange={(e) => handleAddSheet(e.target.files)}
      />
    </CollapsibleManagerCard>
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

function StringListEditor({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState(values.join('\n'));

  useEffect(() => {
    setDraft(values.join('\n'));
  }, [values]);

  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">{label}</span>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          const parsed = parseStringList(draft);
          onChange(parsed);
          setDraft(parsed.join('\n'));
        }}
        rows={4}
        placeholder="One item per line"
        className="w-full bg-surface-800 border border-surface-600 rounded-lg px-2 py-1.5 text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-brand-500 resize-y"
      />
    </label>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────────

export function CharacterManager() {
  const characters = useStudioStore((s) => s.characters);
  const renameCharacter = useStudioStore((s) => s.renameCharacter);
  const addCharacterSheet = useStudioStore((s) => s.addCharacterSheet);
  const removeCharacterSheet = useStudioStore((s) => s.removeCharacterSheet);
  const updateCharacterSheetLabel = useStudioStore((s) => s.updateCharacterSheetLabel);
  const updateCharacterLists = useStudioStore((s) => s.updateCharacterLists);
  const deleteCharacter = useStudioStore((s) => s.deleteCharacter);
  const removeCharacterColorPaletteGroup = useStudioStore((s) => s.removeCharacterColorPaletteGroup);
  const selectShot = useStudioStore((s) => s.selectShot);
  const navigateToPanel = useNavigateToStudioPanel();

  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedCharacterId) return;
    const exists = characters.some((character) => character.id === selectedCharacterId);
    if (exists) return;
    setSelectedCharacterId(null);
  }, [characters, selectedCharacterId]);

  const handleSelectSheet = (character: Character, sheet: CharacterSheet) => {
    setSelectedCharacterId(character.id);
    setSelectedAssetId(derivedCharacterSheetAssetId(character.id, sheet.id));
  };

  const handleSelectColorPaletteGroup = (character: Character, collection: ColorPaletteCollection) => {
    setSelectedCharacterId(character.id);
    setSelectedAssetId(derivedCharacterColorPaletteGroupAssetId(character.id, collection.id));
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
      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 min-w-0 overflow-y-auto p-4 space-y-3 border-r border-surface-700">
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
              selectedSheetId={
                selectedCharacterId === character.id
                  ? parseDerivedCharacterSheetAssetId(selectedAssetId ?? '')?.sheetId ?? null
                  : null
              }
              onRename={(name) => renameCharacter(character.id, name)}
              onAddSheet={(url, label) => addCharacterSheet(character.id, url, label)}
              onRemoveSheet={(sheetId) => removeCharacterSheet(character.id, sheetId)}
              onAssignSheetLabel={(sheetId, label) => updateCharacterSheetLabel(character.id, sheetId, label)}
              onUpdateLists={(patch) => updateCharacterLists(character.id, patch)}
              onDelete={() => deleteCharacter(character.id)}
              onSelectSheet={(sheet) => handleSelectSheet(character, sheet)}
              onSelectColorPaletteGroup={(collection) => handleSelectColorPaletteGroup(character, collection)}
              selectedColorPaletteGroupId={
                selectedCharacterId === character.id
                  ? parseDerivedCharacterColorPaletteGroupAssetId(selectedAssetId ?? '')?.collectionId ?? null
                  : null
              }
              onRemoveColorPaletteGroup={(collectionId) =>
                removeCharacterColorPaletteGroup(character.id, collectionId)
              }
            />
          ))}
        </div>

        <aside className="w-72 xl:w-80 shrink-0 min-h-0 bg-surface-900/90">
          <InspectionManager
            selectedAssetId={selectedAssetId}
            onSelectAssetId={setSelectedAssetId}
            registrations={[
              {
                parseAssetId: parseDerivedCharacterSheetAssetId,
                onMatch: (parsed) => {
                  const match = parsed as { characterId: string };
                  setSelectedCharacterId(match.characterId);
                },
              },
              {
                parseAssetId: parseDerivedCharacterColorPaletteGroupAssetId,
                onMatch: (parsed) => {
                  const match = parsed as { characterId: string };
                  setSelectedCharacterId(match.characterId);
                },
              },
            ]}
            emptyMessage="Select a character asset to inspect details."
            onGoToShot={handleGoToShot}
          />
        </aside>
      </div>
    </div>
  );
}
