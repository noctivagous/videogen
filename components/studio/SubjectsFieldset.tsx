'use client';

import { useState } from 'react';
import { CharacterSheetCompositionControls } from '@/components/studio/CharacterSheetCompositionControls';
import {
  characterSheetLabel,
  EntityDropdown,
  EntityDropdownPanel,
} from '@/components/studio/entity-picker/EntityDropdown';
import { resolveReferenceDisplayUrl } from '@/lib/storage/reference-url';
import {
  getSubjectChecklistSlotIndices,
  getSubjectSheetSlotCount,
  getSubjectSlotDisplayLabel,
  isCrowdHeroMode,
} from '@/lib/studio/subject-sheet-slots';
import type { Shot } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';
import { useNavigateToStudioPanel } from '@/hooks/use-studio-panel-navigation';
import type { ReactNode } from 'react';
import { WorkflowCollapsibleSection } from '@/components/ui/WorkflowCollapsibleSection';

interface CharacterSheetWorkflowStep {
  id: string;
  label: string;
  done: boolean;
}

export interface SubjectsFieldsetProps {
  characterSheetStep: CharacterSheetWorkflowStep | undefined;
  stepNumber: number;
  renderReferenceSlotRow: (index: number) => ReactNode;
  legendDone?: boolean;
}

function isSubjectSlotFilled(
  shot: Shot,
  slotIndex: number,
  setup: { characterSlots?: (string | null)[] } | undefined,
  slotOrdinal: number,
): boolean {
  if (setup?.characterSlots?.[slotOrdinal]) return true;
  return Boolean(resolveReferenceDisplayUrl(shot.references[slotIndex]));
}

// ── Character Slot Picker ────────────────────────────────────────────────────

interface CharacterSlotPickerProps {
  slotOrdinal: number;
  fallback: ReactNode;
  hideHeader?: boolean;
}

function CharacterSlotPicker({
  slotOrdinal,
  fallback,
  hideHeader = false,
}: CharacterSlotPickerProps) {
  const characters = useStudioStore((s) => s.characters);
  const setups = useStudioStore((s) => s.setups);
  const currentSetupId = useStudioStore((s) => s.currentSetupId);
  const assignCharacterToSlot = useStudioStore((s) => s.assignCharacterToSlot);
  const navigateToPanel = useNavigateToStudioPanel();

  const [characterOpen, setCharacterOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sourceMode, setSourceMode] = useState<'manager' | 'manual'>('manager');

  const setup = setups.find((s) => s.id === currentSetupId);
  const assignedId = setup?.characterSlots?.[slotOrdinal] ?? null;
  const assignedSheetId = setup?.characterSheetSlots?.[slotOrdinal] ?? null;
  const assigned = characters.find((c) => c.id === assignedId) ?? null;
  const selectableSheets = (assigned?.sheets ?? []).filter((sheet) => {
    const dataType = (sheet as { dataType?: string }).dataType;
    return !dataType || dataType === 'character-sheet';
  });
  const assignedSheet =
    selectableSheets.find((s) => s.id === assignedSheetId)
    ?? selectableSheets[0]
    ?? null;

  return (
    <div className="flex flex-col gap-2">
      {!hideHeader && (
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <span className="uppercase tracking-wider font-semibold">Characters</span>
          <button
            type="button"
            onClick={() => navigateToPanel('character-sheet-generator')}
            className="ml-auto text-brand-400 hover:text-brand-300 transition-colors text-[9px]"
          >
            Manage →
          </button>
        </div>
      )}

      <div className="grid grid-cols-[14px_minmax(0,1fr)] gap-2">
        <div className="pt-6 flex justify-center">
          <input
            type="radio"
            name={`subject-source-mode-${slotOrdinal}`}
            checked={sourceMode === 'manager'}
            onChange={() => setSourceMode('manager')}
            className="h-3.5 w-3.5 rounded-full border-surface-500 text-brand-500 focus:ring-brand-500/40"
            aria-label={`Use character manager source for slot ${slotOrdinal + 1}`}
          />
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <EntityDropdown
            label="Character"
            value={assigned?.name ?? ''}
            thumbnailUrl={assignedSheet?.url ?? selectableSheets[0]?.url}
            placeholder="Select character…"
            open={characterOpen}
            onToggle={() => {
              if (sourceMode !== 'manager') return;
              setCharacterOpen((v) => !v);
              setSheetOpen(false);
            }}
            thumbnailAspect="square"
            emptyIcon={
              <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          >
            <EntityDropdownPanel>
              <div className="p-1 space-y-0.5 max-h-48 overflow-y-auto">
                {characters.map((character) => (
                  <button
                    key={character.id}
                    type="button"
                    onClick={() => {
                      assignCharacterToSlot(currentSetupId, slotOrdinal, character.id);
                      setCharacterOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-surface-700 transition-colors text-[11px]
                      ${character.id === assignedId ? 'bg-brand-500/10 text-brand-300' : 'text-gray-200'}`}
                  >
                    <img
                      src={character.sheets[0]?.url}
                      alt={character.name}
                      className="w-7 h-7 rounded-md object-cover border border-surface-600 flex-shrink-0"
                    />
                    <span className="truncate flex-1">{character.name}</span>
                  </button>
                ))}
                {characters.length === 0 && (
                  <div className="px-2.5 py-2 text-[11px] text-gray-500">
                    No characters yet. Create one in Character Manager.
                  </div>
                )}
              </div>
              {assigned && (
                <div className="border-t border-surface-700 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      assignCharacterToSlot(currentSetupId, slotOrdinal, null);
                      setCharacterOpen(false);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left text-[11px] text-red-400 hover:bg-surface-700 transition-colors"
                  >
                    Remove assignment
                  </button>
                </div>
              )}
            </EntityDropdownPanel>
          </EntityDropdown>

          {assigned && assignedSheet && (
            <EntityDropdown
              label="Character Sheet"
              value={characterSheetLabel(
                assignedSheet.label,
                Math.max(0, assigned.sheets.findIndex((s) => s.id === assignedSheet.id)),
              )}
              thumbnailUrl={assignedSheet.url}
              placeholder="Select character sheet…"
              open={sheetOpen}
              onToggle={() => {
                if (sourceMode !== 'manager') return;
                setSheetOpen((v) => !v);
                setCharacterOpen(false);
              }}
              thumbnailAspect="square"
            >
              <EntityDropdownPanel>
                <div className="p-1 space-y-0.5 max-h-48 overflow-y-auto">
                  {selectableSheets.map((sheet, sheetIndex) => (
                    <button
                      key={sheet.id}
                      type="button"
                      onClick={() => {
                        assignCharacterToSlot(currentSetupId, slotOrdinal, assigned.id, sheet.id);
                        setSheetOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-surface-700 transition-colors text-[11px]
                        ${sheet.id === assignedSheet.id ? 'bg-brand-500/10 text-brand-300' : 'text-gray-200'}`}
                    >
                      <img
                        src={sheet.url}
                        alt={characterSheetLabel(sheet.label, sheetIndex)}
                        className="w-7 h-7 rounded-md object-cover border border-surface-600 flex-shrink-0"
                      />
                      <span className="truncate flex-1">
                        {characterSheetLabel(sheet.label, sheetIndex)}
                      </span>
                    </button>
                  ))}
                </div>
              </EntityDropdownPanel>
            </EntityDropdown>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[14px_minmax(0,1fr)] gap-2 items-start">
        <div className="pt-1 flex justify-center">
          <input
            type="radio"
            name={`subject-source-mode-${slotOrdinal}`}
            checked={sourceMode === 'manual'}
            onChange={() => {
              setSourceMode('manual');
              setCharacterOpen(false);
              setSheetOpen(false);
            }}
            className="h-3.5 w-3.5 rounded-full border-surface-500 text-brand-500 focus:ring-brand-500/40"
            aria-label={`Use manual character sheet source for slot ${slotOrdinal + 1}`}
          />
        </div>
        <div className="flex-1">
          <WorkflowCollapsibleSection label="Manual Character Sheet" defaultCollapsed>
            {fallback}
          </WorkflowCollapsibleSection>
        </div>
      </div>
    </div>
  );
}

export function SubjectsFieldset({
  characterSheetStep,
  stepNumber: _stepNumber,
  renderReferenceSlotRow,
  legendDone = false,
}: SubjectsFieldsetProps) {
  const shots = useStudioStore((s) => s.shots);
  const setups = useStudioStore((s) => s.setups);
  const currentShot = useStudioStore((s) => s.currentShot);
  const currentSetupId = useStudioStore((s) => s.currentSetupId);
  const camera = useStudioStore((s) => s.camera);
  const handleCameraCompositionChange = useStudioStore((s) => s.handleCameraCompositionChange);
  const setCrowdTypePrompt = useStudioStore((s) => s.setCrowdTypePrompt);
  const navigateToPanel = useNavigateToStudioPanel();
  const shot = shots.find((s) => s.id === currentShot) ?? shots[0];
  const setup = setups.find((s) => s.id === currentSetupId);

  if (!shot) return null;

  const subjectSlotIndices = getSubjectChecklistSlotIndices(shot);
  const sheetCount = getSubjectSheetSlotCount(shot);
  const showMultiSheetHint =
    shot.camera.subjectCount === '2s' ||
    shot.camera.subjectCount === '3s' ||
    shot.camera.subjectCount === 'group' ||
    isCrowdHeroMode(shot);
  const showGroupWarning = shot.camera.subjectCount === 'group';
  const isCrowd = shot.camera.subjectCount === 'crowd';
  const showSheetRows = sheetCount > 0;
  const charactersPickerDone = Boolean(characterSheetStep?.done);

  return (
    <fieldset className="workflow-step-fieldset workflow-step-fieldset--nested mt-2">
      <legend className="workflow-step-fieldset__legend flex items-center gap-1.5">
        <span
          className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
            legendDone ? 'bg-brand-500/30 text-brand-300' : 'bg-surface-700 text-gray-500'
          }`}
          aria-hidden="true"
        >
          {legendDone ? '✓' : ''}
        </span>
        <span>Subjects</span>
      </legend>

      <fieldset className="workflow-step-fieldset workflow-step-fieldset--nested">
        <legend className="workflow-step-fieldset__legend normal-case tracking-normal font-medium text-gray-400">
          Subject Count
        </legend>
        <div className="flex flex-col gap-1.5 text-[10px] text-gray-400">
          <CharacterSheetCompositionControls compactCrowd={isCrowd} hideSubjectCountLabel />

          {isCrowd && (
            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-gray-500">Crowd Type</span>
              <input
                type="text"
                className="bg-surface-800 border border-surface-600 rounded px-2 py-1 text-[11px] text-gray-200"
                placeholder="e.g. concert audience, street market"
                value={shot.crowdTypePrompt ?? ''}
                onChange={(e) => setCrowdTypePrompt(e.target.value)}
              />
            </label>
          )}

          {isCrowd && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={camera.heroSubjectsEnabled}
                onChange={(e) =>
                  handleCameraCompositionChange('heroSubjectsEnabled', {
                    heroSubjectsEnabled: e.target.checked,
                  })
                }
                className="rounded border-surface-600"
              />
              <span>Hero Subjects — keep 1–2 characters recognizable in foreground</span>
            </label>
          )}

          {shot.camera.subjectCount === 'group' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={camera.fillRestWithGenerics}
                onChange={(e) =>
                  handleCameraCompositionChange('fillRestWithGenerics', {
                    fillRestWithGenerics: e.target.checked,
                  })
                }
                className="rounded border-surface-600"
              />
              <span>Fill rest with generic figures (slots 5+ use outfit variants)</span>
            </label>
          )}
        </div>
      </fieldset>

      {showSheetRows && (
        <fieldset className="workflow-step-fieldset workflow-step-fieldset--nested">
          <legend className="workflow-step-fieldset__legend flex items-center gap-1.5 w-full pr-1">
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                charactersPickerDone ? 'bg-brand-500/30 text-brand-300' : 'bg-surface-700 text-gray-500'
              }`}
              aria-hidden="true"
            >
              {charactersPickerDone ? '✓' : 'A'}
            </span>
            <span className={charactersPickerDone ? 'text-gray-300' : ''}>Characters</span>
            <button
              type="button"
              onClick={() => navigateToPanel('character-sheet-generator')}
              className="ml-auto text-brand-400 hover:text-brand-300 transition-colors text-[9px] normal-case tracking-normal font-medium"
            >
              Manage →
            </button>
          </legend>
          <div className="flex flex-col gap-1.5 text-[10px] text-gray-400">
            {subjectSlotIndices.map((slotIndex, index) => {
              const filled = isSubjectSlotFilled(shot, slotIndex, setup, index);
              return (
                <div key={slotIndex} className="flex flex-col gap-1.5">
                  {subjectSlotIndices.length > 1 && (
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                          filled ? 'bg-brand-500/30 text-brand-300' : 'bg-surface-700 text-gray-500'
                        }`}
                      >
                        {filled ? '✓' : index + 1}
                      </span>
                      <span className={filled ? 'text-gray-300' : ''}>
                        {getSubjectSlotDisplayLabel(shot, slotIndex, index + 1)}
                      </span>
                    </div>
                  )}
                  <CharacterSlotPicker
                    slotOrdinal={index}
                    fallback={renderReferenceSlotRow(slotIndex)}
                    hideHeader
                  />
                </div>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="flex flex-col gap-1.5 text-[10px] text-gray-400">
        {showGroupWarning && (
          <p className="text-[10px] text-amber-500/90 leading-snug">
            Group shots work best with Bake Start Frame. Auto-place will blend faces.
          </p>
        )}

        {showMultiSheetHint && (
          <p className="text-[10px] text-gray-500 leading-snug">
            Sheets are used during bake only. Video generation receives the single baked start frame.
          </p>
        )}

        {isCrowd && !camera.heroSubjectsEnabled && (
          <p className="text-[10px] text-gray-500 leading-snug">
            Crowd mode generates background texture during bake — no individual character sheets required.
          </p>
        )}
      </div>
    </fieldset>
  );
}
