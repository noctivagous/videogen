'use client';

import { CharacterSheetCompositionControls } from '@/components/studio/CharacterSheetCompositionControls';
import { resolveReferenceDisplayUrl } from '@/lib/storage/reference-url';
import {
  getSubjectChecklistSlotIndices,
  getSubjectSheetSlotCount,
  getSubjectSlotDisplayLabel,
  isCrowdHeroMode,
} from '@/lib/studio/subject-sheet-slots';
import type { Shot } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';
import type { ReactNode } from 'react';

interface CharacterSheetWorkflowStep {
  id: string;
  label: string;
  done: boolean;
}

export interface SubjectsFieldsetProps {
  characterSheetStep: CharacterSheetWorkflowStep | undefined;
  stepNumber: number;
  renderReferenceSlotRow: (index: number) => ReactNode;
}

function isSubjectSlotFilled(shot: Shot, slotIndex: number): boolean {
  return Boolean(resolveReferenceDisplayUrl(shot.references[slotIndex]));
}

export function SubjectsFieldset({
  characterSheetStep,
  stepNumber,
  renderReferenceSlotRow,
}: SubjectsFieldsetProps) {
  const shots = useStudioStore((s) => s.shots);
  const currentShot = useStudioStore((s) => s.currentShot);
  const camera = useStudioStore((s) => s.camera);
  const handleCameraCompositionChange = useStudioStore((s) => s.handleCameraCompositionChange);
  const setCrowdTypePrompt = useStudioStore((s) => s.setCrowdTypePrompt);
  const shot = shots.find((s) => s.id === currentShot) ?? shots[0];

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

  return (
    <fieldset className="workflow-step-fieldset workflow-step-fieldset--nested mt-2">
      <legend className="workflow-step-fieldset__legend">Subjects</legend>
      <div className="flex flex-col gap-1.5 text-[10px] text-gray-400">
        <CharacterSheetCompositionControls compactCrowd={isCrowd} />

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

        {showSheetRows && characterSheetStep && (
          <div className="flex items-center gap-1.5">
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                characterSheetStep.done ? 'bg-brand-500/30 text-brand-300' : 'bg-surface-700 text-gray-500'
              }`}
            >
              {characterSheetStep.done ? '✓' : stepNumber}
            </span>
            <span className={characterSheetStep.done ? 'text-gray-300' : ''}>
              {characterSheetStep.label}
            </span>
          </div>
        )}

        {showSheetRows &&
          subjectSlotIndices.map((slotIndex, index) => {
            const filled = isSubjectSlotFilled(shot, slotIndex);
            return (
              <div key={slotIndex} className="flex flex-col gap-1.5">
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
                {renderReferenceSlotRow(slotIndex)}
              </div>
            );
          })}

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
