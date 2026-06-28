'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo } from 'react';
import { MannequinInspectorControls } from '@/components/studio/MannequinInspectorControls';
import { ProPane } from '@/components/ui/ProPane';
import { normalizeReferenceRole } from '@/lib/constants/camera';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { migrateMannequins } from '@/lib/studio/migrate-mannequin';
import {
  getPrincipalMannequins,
  isValidSubjectSlotAssignment,
  mannequinSpatialLabel,
  type MannequinSpatialLabel,
} from '@/lib/studio/mannequin-character-assignment';
import { getReferenceSlotLabel } from '@/lib/studio/reference-slots';
import { canAddMannequin } from '@/lib/studio/workflow';
import type { AspectRatio } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

const PoseBlockPoseSection = dynamic(
  () =>
    import('@/components/studio/PoseBlockPoseSection').then((m) => m.PoseBlockPoseSection),
  { ssr: false },
);
const POSEBLOCK_GIZMO_SEGMENT = 'poseblock/PoseGizmoModeSegment';
const PoseGizmoModeSegment = dynamic(
  () => import(POSEBLOCK_GIZMO_SEGMENT).then((m) => m.PoseGizmoModeSegment),
  { ssr: false },
);

function formatSpatialLabel(label: MannequinSpatialLabel): string {
  switch (label) {
    case 'leftmost':
      return 'Left';
    case 'center':
      return 'Center';
    case 'rightmost':
      return 'Right';
    case 'sole':
      return 'Subject';
  }
}

export function PoseBlockPanel() {
  const shots = useStudioStore((s) => s.shots);
  const currentShot = useStudioStore((s) => s.currentShot);
  const project = useStudioStore((s) => s.project);
  const selectedMannequinIds = useStudioStore((s) => s.selectedMannequinIds);
  const selectMannequin = useStudioStore((s) => s.selectMannequin);
  const clearMannequinSelection = useStudioStore((s) => s.clearMannequinSelection);
  const addMannequin = useStudioStore((s) => s.addMannequin);
  const updateMannequin = useStudioStore((s) => s.updateMannequin);
  const removeMannequin = useStudioStore((s) => s.removeMannequin);
  const assignMannequinSubjectSlot = useStudioStore((s) => s.assignMannequinSubjectSlot);

  const shot = shots.find((s) => s.id === currentShot) || shots[0];
  const mannequins = useMemo(
    () => migrateMannequins(shot?.mannequins),
    [shot?.mannequins],
  );
  const aspectRatio = (project.aspectRatio || '16:9') as AspectRatio;
  const primaryId = selectedMannequinIds[0] ?? null;
  const primary = mannequins.find((m) => m.id === primaryId);
  const canAdd = canAddMannequin(shot);
  const principalById = useMemo(() => {
    const principals = [...getPrincipalMannequins(mannequins)].sort((a, b) => a.x - b.x);
    return new Map(principals.map((m) => [m.id, formatSpatialLabel(mannequinSpatialLabel(m, principals))]));
  }, [mannequins]);

  useEffect(() => {
    if (mannequins.length === 0) {
      if (selectedMannequinIds.length > 0) {
        clearMannequinSelection();
      }
      return;
    }
    const valid = selectedMannequinIds.filter((id) => mannequins.some((m) => m.id === id));
    if (valid.length !== selectedMannequinIds.length) {
      useStudioStore.setState({ selectedMannequinIds: valid });
    }
  }, [mannequins, selectedMannequinIds, clearMannequinSelection]);

  const mannequinIcon = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );

  return (
    <div
      className="flex flex-col pro-pane-stack"
      {...uiSectionProps(UI_SECTIONS.studioPoseBlockPanel, { id: false })}
    >
      <ProPane title="Mannequins" icon={mannequinIcon} bodyClassName="flex flex-col gap-3">
      <PoseGizmoModeSegment />

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!canAdd}
          onClick={() => addMannequin()}
          className="px-3 py-1.5 rounded bg-surface-700 hover:bg-surface-600 disabled:opacity-40 text-gray-200 text-xs font-semibold"
        >
          Add mannequin
        </button>
        {selectedMannequinIds.length > 0 && (
          <button
            type="button"
            onClick={clearMannequinSelection}
            className="text-[10px] text-gray-500 underline hover:text-gray-300"
          >
            Clear selection
          </button>
        )}
      </div>

      {selectedMannequinIds.length > 1 && (
        <p className="text-[10px] text-gray-500">
          {selectedMannequinIds.length} selected — canvas edits apply to primary.
        </p>
      )}

      <ul className="flex flex-col gap-1 max-h-36 overflow-y-auto">
        {mannequins.map((m) => {
          const selected = selectedMannequinIds.includes(m.id);
          const spatialLabel = principalById.get(m.id) ?? `Mannequin ${m.id.slice(0, 4).toUpperCase()}`;
          const assigned =
            shot != null &&
            isValidSubjectSlotAssignment(shot, m.subjectSlotIndex, shot.lighting) &&
            m.subjectSlotIndex != null;
          const assignmentLabel =
            assigned && shot
              ? getReferenceSlotLabel(
                  shot,
                  m.subjectSlotIndex!,
                  normalizeReferenceRole(shot.referenceRoles[m.subjectSlotIndex!] ?? 'Subject'),
                )
              : 'Unassigned';
          return (
            <li key={m.id} className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => selectMannequin(m.id, { shiftKey: e.shiftKey })}
                className={`flex-1 rounded px-2 py-1.5 text-left text-xs ${
                  selected
                    ? m.id === primaryId
                      ? 'bg-amber-500/20 text-amber-100 ring-1 ring-amber-400/50'
                      : 'bg-sky-500/15 text-sky-100 ring-1 ring-sky-400/40'
                    : 'bg-surface-800 text-gray-300 hover:bg-surface-700'
                }`}
              >
                {spatialLabel} — {assignmentLabel}
              </button>
              <button
                type="button"
                aria-label="Remove mannequin"
                onClick={() => removeMannequin(m.id)}
                className="rounded bg-red-900/50 px-2 py-1 text-xs text-red-100 hover:bg-red-800/70"
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>

      {mannequins.length === 0 && (
        <p className="text-xs text-gray-500">Add a mannequin to block character placement.</p>
      )}

      {primary && (
        <MannequinInspectorControls
          shot={shot}
          mannequin={primary}
          aspectRatio={aspectRatio}
          onUpdate={updateMannequin}
          onAssignSubjectSlot={assignMannequinSubjectSlot}
        />
      )}
      </ProPane>

      <ProPane title="Pose Adjust">
        <PoseBlockPoseSection />
      </ProPane>
    </div>
  );
}
