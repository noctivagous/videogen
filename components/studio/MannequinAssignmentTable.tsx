'use client';

import { normalizeReferenceRole } from '@/lib/constants/camera';
import {
  getPrincipalMannequins,
  isValidSubjectSlotAssignment,
  mannequinSpatialLabel,
  type MannequinSpatialLabel,
} from '@/lib/studio/mannequin-character-assignment';
import { getReferenceSlotLabel } from '@/lib/studio/reference-slots';
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
  if (!isValidSubjectSlotAssignment(shot, slotIndex, shot.lighting)) return null;
  const role = normalizeReferenceRole(shot.referenceRoles[slotIndex!] ?? 'Subject');
  return getReferenceSlotLabel(shot, slotIndex!, role);
}

export function MannequinAssignmentTable() {
  const shots = useStudioStore((s) => s.shots);
  const currentShot = useStudioStore((s) => s.currentShot);
  const shot = shots.find((s) => s.id === currentShot) ?? shots[0];

  if (!shot) return null;

  const principals = [...getPrincipalMannequins(shot.mannequins)].sort((a, b) => a.x - b.x);

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
                {assigned ? (
                  <>
                    <span aria-hidden="true">✓</span>
                    {assignmentLabel}
                  </>
                ) : (
                  'Unassigned'
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
