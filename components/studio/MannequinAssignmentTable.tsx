'use client';

import { normalizeReferenceRole } from '@/lib/constants/camera';
import {
  getPrincipalMannequins,
  mannequinSpatialLabel,
  type MannequinSpatialLabel,
} from '@/lib/studio/mannequin-character-assignment';
import { getReferenceSlotLabel } from '@/lib/studio/reference-slots';
import {
  getSubjectChecklistSlotIndices,
  getSubjectSlotDisplayLabel,
} from '@/lib/studio/subject-sheet-slots';
import { getSubjectCharacterSource } from '@/lib/studio/character-sheet-source';
import type { Shot } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

function formatSpatialLabel(label: MannequinSpatialLabel): string {
  switch (label) {
    case 'leftmost':
      return 'Left';
    case 'center':
      return 'Center';
    case 'rightmost':
      return 'Right';
    case 'sole':
      return 'Sole';
  }
}

function getAssignmentLabel(shot: Shot, slotIndex: number | undefined): string | null {
  if (slotIndex == null || slotIndex < 0) return null;
  const role = normalizeReferenceRole(shot.referenceRoles[slotIndex!] ?? 'Subject');
  return getReferenceSlotLabel(shot, slotIndex!, role);
}

function getSheetLabel(sheetLabel: string | undefined, index: number): string {
  if (sheetLabel && sheetLabel.trim().length > 0) return sheetLabel.trim();
  return `Character Sheet ${index + 1}`;
}

export function MannequinAssignmentTable() {
  const shots = useStudioStore((s) => s.shots);
  const currentShot = useStudioStore((s) => s.currentShot);
  const setups = useStudioStore((s) => s.setups);
  const currentSetupId = useStudioStore((s) => s.currentSetupId);
  const characters = useStudioStore((s) => s.characters);
  const assignMannequinSubjectSlot = useStudioStore((s) => s.assignMannequinSubjectSlot);
  const shot = shots.find((s) => s.id === currentShot) ?? shots[0];
  const setup = setups.find((s) => s.id === currentSetupId);

  if (!shot) return null;

  const principals = [...getPrincipalMannequins(shot.mannequins)].sort((a, b) => a.x - b.x);
  const checklistSlotIndices = getSubjectChecklistSlotIndices(shot);
  const slotOptions = checklistSlotIndices.map((slotIndex, ordinal) => {
    const source = getSubjectCharacterSource(setup, shot, ordinal, slotIndex);
    const displayLabel = getSubjectSlotDisplayLabel(shot, slotIndex, ordinal + 1);
    if (source === 'manager') {
      const characterId = setup?.characterSlots?.[ordinal] ?? null;
      const character = characterId ? characters.find((c) => c.id === characterId) : null;
      if (character) {
        const selectedSheetId = setup?.characterSheetSlots?.[ordinal] ?? null;
        const selectedSheet = selectedSheetId
          ? character.sheets.find((sheet) => sheet.id === selectedSheetId)
          : null;
        const fallbackSheet = character.sheets[0];
        const sheet = selectedSheet ?? fallbackSheet;
        const sheetIndex = Math.max(
          0,
          character.sheets.findIndex((candidate) => candidate.id === sheet?.id),
        );
        const sheetLabel = getSheetLabel(sheet?.label, sheetIndex);
        return {
          slotIndex,
          label: `${displayLabel} - ${character.name} (${sheetLabel})`,
        };
      }
    }

    return {
      slotIndex,
      label: source === 'manual' ? `${displayLabel} - Manual Character Sheet` : displayLabel,
    };
  });

  if (principals.length === 0) {
    return (
      <p className="mannequin-assignment-table__empty text-[10px] text-gray-500 leading-snug">
        Place mannequins on the preview to assign characters.
      </p>
    );
  }

  return (
    <table className="mannequin-assignment-table">
      <thead>
        <tr>
          <th scope="col">Mannequin</th>
          <th scope="col">Character Sheet</th>
        </tr>
      </thead>
      <tbody>
        {principals.map((mannequin) => {
          const assignmentLabel = getAssignmentLabel(shot, mannequin.subjectSlotIndex);
          const assigned = assignmentLabel != null;

          return (
            <tr key={mannequin.id}>
              <td className="mannequin-assignment-table__mannequin">
                {formatSpatialLabel(mannequinSpatialLabel(mannequin, principals))}
              </td>
              <td
                className={`mannequin-assignment-table__assignment ${
                  assigned
                    ? 'mannequin-assignment-table__assignment--assigned'
                    : 'mannequin-assignment-table__assignment--unassigned'
                }`}
              >
                <select
                  className={`workflow-settings-table__select ${
                    assigned ? 'workflow-settings-table__select--assigned' : ''
                  }`}
                  value={mannequin.subjectSlotIndex ?? ''}
                  onChange={(e) => {
                    const raw = e.target.value;
                    assignMannequinSubjectSlot(mannequin.id, raw === '' ? null : Number(raw));
                  }}
                  aria-label={`Assign character sheet to ${formatSpatialLabel(
                    mannequinSpatialLabel(mannequin, principals),
                  )} mannequin`}
                >
                  <option value="">{slotOptions.length ? 'Unassigned' : 'No sheets available'}</option>
                  {slotOptions.map((option) => (
                    <option key={option.slotIndex} value={option.slotIndex}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {assigned && assignmentLabel && (
                  <span className="text-[9px] text-gray-400 truncate max-w-[9rem]" title={assignmentLabel}>
                    {assignmentLabel}
                  </span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
