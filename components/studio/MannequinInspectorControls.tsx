'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_POSEBLOCK_BASE_POSE_ID,
  fetchPoseBlockPresetEntries,
  formatPosePresetLabel,
  type PoseBlockPresetEntry,
} from '@/lib/poseblock/posePresets';
import {
  MANNEQUIN_AGE_OPTIONS,
  MANNEQUIN_GENDER_OPTIONS,
  MANNEQUIN_POSE_OPTIONS,
} from '@/lib/constants/workflows';
import {
  mannequinTrim,
  mannequinVariantFrom,
} from '@/lib/constants/mannequin-assets';
import {
  anchorToBoundsFrame,
  boundsFrameToMannequinPatch,
  maxWidthToFrameHeight,
  patchBoundsFrame,
  type MannequinBoundsFrame,
} from '@/lib/studio/mannequin-bounds-framing';
import { placementAnchorX } from '@/lib/studio/mannequin-sync';
import {
  mannequinAngleLabel,
  rotateMannequinAngle,
} from '@/lib/studio/mannequin-rotation';
import { normalizeReferenceRole } from '@/lib/constants/camera';
import {
  getSubjectSlotIndices,
  isPrincipalMannequin,
} from '@/lib/studio/mannequin-character-assignment';
import {
  getSubjectSlotDisplayLabel,
  getSubjectSlotOrdinal,
} from '@/lib/studio/subject-sheet-slots';
import {
  getSubjectCharacterSource,
  getManualCharacterSheetUrl,
  MANUAL_CHARACTER_SHEET_LABEL,
} from '@/lib/studio/character-sheet-source';
import { getReferenceSlotLabel } from '@/lib/studio/reference-slots';
import { isBakeStartFrame } from '@/lib/studio/workflow';
import { maxFeetAnchorY } from '@/lib/studio/mannequin-layout';
import {
  characterSheetLabel,
  EntityDropdown,
  EntityDropdownPanel,
} from '@/components/studio/entity-picker/EntityDropdown';
import type { AspectRatio, Mannequin, Shot } from '@/lib/types/studio';
import { Select } from '@/components/ui/Select';
import { RangeSlider } from '@/components/ui/RangeSlider';
import { useStudioStore } from '@/store/useStudioStore';

const BOUNDS_INPUT_MIN = -0.75;
const BOUNDS_INPUT_MAX = 1.5;
const WIDTH_TO_HEIGHT_MIN = 0.02;

function clampBoundsValue(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function BoundsField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col gap-0.5 text-[10px]">
      <span className="text-gray-400">{label}</span>
      <input
        type="number"
        step={0.01}
        min={min}
        max={max}
        value={Number(value.toFixed(3))}
        onChange={(e) =>
          onChange(clampBoundsValue(Number(e.target.value), min, max))
        }
        className="w-full bg-surface-800 border border-surface-600 rounded px-1 py-0.5 text-gray-200 tabular-nums"
      />
    </label>
  );
}

export interface MannequinInspectorControlsProps {
  shot: Shot | undefined;
  mannequin: Mannequin;
  aspectRatio: AspectRatio;
  onUpdate: (id: string, patch: Partial<Mannequin>) => void;
  onAssignSubjectSlot: (mannequinId: string, slotIndex: number | null) => void;
}

export function MannequinInspectorControls({
  shot,
  mannequin,
  aspectRatio,
  onUpdate,
  onAssignSubjectSlot,
}: MannequinInspectorControlsProps) {
  const [basePoseOptions, setBasePoseOptions] = useState<string[]>([DEFAULT_POSEBLOCK_BASE_POSE_ID]);
  const [basePoseMeta, setBasePoseMeta] = useState<Record<string, PoseBlockPresetEntry>>({});
  const [characterOpen, setCharacterOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const setups = useStudioStore((s) => s.setups);
  const characters = useStudioStore((s) => s.characters);
  const currentSetupId = useStudioStore((s) => s.currentSetupId);
  const assignCharacterToSlot = useStudioStore((s) => s.assignCharacterToSlot);
  const setSubjectSlotSourceMode = useStudioStore((s) => s.setSubjectSlotSourceMode);
  const subjectSlotIndices = shot ? getSubjectSlotIndices(shot) : [];
  const placementX = shot ? placementAnchorX(shot) : 0.5;
  const setup = setups.find((s) => s.id === currentSetupId);
  const selectedSlotIndex =
    mannequin.subjectSlotIndex != null && subjectSlotIndices.includes(mannequin.subjectSlotIndex)
      ? mannequin.subjectSlotIndex
      : null;
  const selectedSlotOrdinal = selectedSlotIndex != null ? subjectSlotIndices.indexOf(selectedSlotIndex) : -1;
  const assignedCharacterId =
    selectedSlotOrdinal >= 0 ? setup?.characterSlots?.[selectedSlotOrdinal] ?? null : null;
  const assignedCharacter = characters.find((entry) => entry.id === assignedCharacterId) ?? null;
  const selectableSheets = (assignedCharacter?.sheets ?? []).filter((sheet) => {
    const dataType = (sheet as { dataType?: string }).dataType;
    return !dataType || dataType === 'character-sheet';
  });
  const assignedSheetId =
    selectedSlotOrdinal >= 0 ? setup?.characterSheetSlots?.[selectedSlotOrdinal] ?? null : null;
  const assignedSheet =
    selectableSheets.find((entry) => entry.id === assignedSheetId)
    ?? selectableSheets[0]
    ?? null;
  const sourceMode =
    shot && selectedSlotIndex != null && selectedSlotOrdinal >= 0
      ? getSubjectCharacterSource(setup, shot, selectedSlotOrdinal, selectedSlotIndex)
      : 'none';
  const isManualSheet = sourceMode === 'manual';
  const manualSheetUrl =
    shot && selectedSlotIndex != null ? getManualCharacterSheetUrl(shot, selectedSlotIndex) : null;
  const canPickManualOption = Boolean(manualSheetUrl) || sourceMode === 'manual';

  const bounds = useMemo(
    () => anchorToBoundsFrame(mannequin, aspectRatio, placementX),
    [mannequin, aspectRatio, placementX],
  );

  useEffect(() => {
    let cancelled = false;
    void fetchPoseBlockPresetEntries()
      .then((poses: Record<string, PoseBlockPresetEntry>) => {
        if (cancelled) return;
        const ids = Object.keys(poses ?? {});
        setBasePoseMeta(poses ?? {});
        setBasePoseOptions(ids.length > 0 ? ids : [DEFAULT_POSEBLOCK_BASE_POSE_ID]);
      })
      .catch(() => {
        void import('poseblock/poses')
          .then(({ POSES }) => {
            if (cancelled) return;
            const ids = Object.keys(POSES ?? {});
            setBasePoseOptions(ids.length > 0 ? ids : [DEFAULT_POSEBLOCK_BASE_POSE_ID]);
          })
          .catch(() => {
            if (!cancelled) setBasePoseOptions([DEFAULT_POSEBLOCK_BASE_POSE_ID]);
          });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const widthToHeightMax = useMemo(
    () => maxWidthToFrameHeight(mannequinTrim(mannequinVariantFrom(mannequin))),
    [mannequin],
  );

  const applyBoundsPatch = (patch: Partial<MannequinBoundsFrame>) => {
    const nextBounds = patchBoundsFrame(
      bounds,
      patch,
      aspectRatio,
      mannequinTrim(mannequinVariantFrom(mannequin)),
    );
    onUpdate(
      mannequin.id,
      boundsFrameToMannequinPatch(nextBounds, mannequin, aspectRatio, placementX),
    );
  };

  return (
    <div className="flex flex-col gap-3 text-xs">
      <Select
        label="Base pose"
        value={mannequin.poseBlockBasePoseId ?? DEFAULT_POSEBLOCK_BASE_POSE_ID}
        onChange={(e) =>
          onUpdate(mannequin.id, { poseBlockBasePoseId: e.target.value })
        }
      >
        {basePoseOptions.map((poseId) => {
          const meta = basePoseMeta[poseId];
          const label = meta ? formatPosePresetLabel(meta) : poseId;
          return (
            <option key={poseId} value={poseId}>
              {label}
            </option>
          );
        })}
      </Select>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-gray-400">Face</span>
        <button
          type="button"
          className="w-7 h-7 rounded bg-surface-700 hover:bg-surface-600 text-gray-200 font-bold"
          aria-label="Rotate face left"
          onClick={() =>
            onUpdate(mannequin.id, {
              angle: rotateMannequinAngle(mannequin.angle, 'left'),
            })
          }
        >
          ←
        </button>
        <span className="text-gray-200 min-w-[4.5rem] text-center">
          {mannequinAngleLabel(mannequin.angle)}
        </span>
        <button
          type="button"
          className="w-7 h-7 rounded bg-surface-700 hover:bg-surface-600 text-gray-200 font-bold"
          aria-label="Rotate face right"
          onClick={() =>
            onUpdate(mannequin.id, {
              angle: rotateMannequinAngle(mannequin.angle, 'right'),
            })
          }
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 mb-1 block">Gender</label>
          <div className="frame-view-segment w-full">
            {MANNEQUIN_GENDER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`frame-view-segment-btn flex-1 justify-center ${mannequin.gender === option.value ? 'active' : ''}`}
                onClick={() => onUpdate(mannequin.id, { gender: option.value as Mannequin['gender'] })}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <Select
          label="Age"
          value={mannequin.age}
          onChange={(e) =>
            onUpdate(mannequin.id, { age: e.target.value as Mannequin['age'] })
          }
        >
          {MANNEQUIN_AGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-1 gap-2">
        <Select
          label="Pose"
          value={mannequin.pose}
          onChange={(e) =>
            onUpdate(mannequin.id, { pose: e.target.value as Mannequin['pose'] })
          }
        >
          {MANNEQUIN_POSE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} disabled={!o.enabled}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>

      {isPrincipalMannequin(mannequin) && shot && isBakeStartFrame(shot) && (
        <div className="flex flex-col gap-1">
          <Select
            label="Character slot"
            value={
              mannequin.subjectSlotIndex != null &&
              subjectSlotIndices.includes(mannequin.subjectSlotIndex)
                ? String(mannequin.subjectSlotIndex)
                : ''
            }
            onChange={(e) => {
              const raw = e.target.value;
              onAssignSubjectSlot(
                mannequin.id,
                raw === '' ? null : Number(raw),
              );
            }}
          >
            <option value="">Unassigned slot</option>
            {subjectSlotIndices.map((slotIndex) => {
              const role = normalizeReferenceRole(
                shot.referenceRoles[slotIndex] ?? 'Subject',
              );
              const ordinal = getSubjectSlotOrdinal(shot, slotIndex);
              const label =
                ordinal != null
                  ? getSubjectSlotDisplayLabel(shot, slotIndex, ordinal)
                  : getReferenceSlotLabel(shot, slotIndex, role);
              return (
                <option key={slotIndex} value={slotIndex}>
                  {label}
                </option>
              );
            })}
          </Select>
          {selectedSlotOrdinal >= 0 && (
            <>
              <EntityDropdown
                label="Character"
                value={isManualSheet ? MANUAL_CHARACTER_SHEET_LABEL : assignedCharacter?.name ?? ''}
                thumbnailUrl={
                  isManualSheet
                    ? manualSheetUrl ?? undefined
                    : assignedSheet?.url ?? selectableSheets[0]?.url
                }
                placeholder="Select character…"
                onToggle={() => {
                  setCharacterOpen((value) => !value);
                  setSheetOpen(false);
                }}
                open={characterOpen}
                thumbnailAspect="square"
                emptyIcon={
                  <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              >
                <EntityDropdownPanel>
                  <div className="p-1 space-y-0.5 max-h-48 overflow-y-auto">
                    {canPickManualOption && (
                      <button
                        type="button"
                        onClick={() => {
                          setSubjectSlotSourceMode(currentSetupId, selectedSlotOrdinal, 'manual');
                          onAssignSubjectSlot(mannequin.id, selectedSlotIndex!);
                          setCharacterOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-surface-700 transition-colors text-[11px]
                          ${isManualSheet ? 'bg-brand-500/10 text-brand-300' : 'text-gray-200'}`}
                      >
                        {manualSheetUrl ? (
                          <img
                            src={manualSheetUrl}
                            alt={MANUAL_CHARACTER_SHEET_LABEL}
                            className="w-7 h-7 rounded-md object-cover border border-surface-600 flex-shrink-0"
                          />
                        ) : (
                          <span className="w-7 h-7 rounded-md border border-surface-600 flex-shrink-0 flex items-center justify-center bg-surface-800">
                            <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </span>
                        )}
                        <span className="truncate flex-1">{MANUAL_CHARACTER_SHEET_LABEL}</span>
                      </button>
                    )}
                    {characters.map((character) => (
                      <button
                        key={character.id}
                        type="button"
                        onClick={() => {
                          assignCharacterToSlot(currentSetupId, selectedSlotOrdinal, character.id);
                          setSubjectSlotSourceMode(currentSetupId, selectedSlotOrdinal, 'typed');
                          onAssignSubjectSlot(mannequin.id, selectedSlotIndex!);
                          setCharacterOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-surface-700 transition-colors text-[11px]
                          ${character.id === assignedCharacterId ? 'bg-brand-500/10 text-brand-300' : 'text-gray-200'}`}
                      >
                        <img
                          src={character.sheets[0]?.url}
                          alt={character.name}
                          className="w-7 h-7 rounded-md object-cover border border-surface-600 flex-shrink-0"
                        />
                        <span className="truncate flex-1">{character.name}</span>
                      </button>
                    ))}
                  </div>
                </EntityDropdownPanel>
              </EntityDropdown>
              {assignedCharacter && assignedSheet && !isManualSheet && (
                <EntityDropdown
                  label="Character Sheet"
                  value={characterSheetLabel(
                    assignedSheet.label,
                    Math.max(0, assignedCharacter.sheets.findIndex((s) => s.id === assignedSheet.id)),
                  )}
                  thumbnailUrl={assignedSheet.url}
                  placeholder="Select character sheet…"
                  onToggle={() => {
                    setSheetOpen((value) => !value);
                    setCharacterOpen(false);
                  }}
                  open={sheetOpen}
                  thumbnailAspect="square"
                >
                  <EntityDropdownPanel>
                    <div className="p-1 space-y-0.5 max-h-48 overflow-y-auto">
                      {selectableSheets.map((sheet, sheetIndex) => (
                        <button
                          key={sheet.id}
                          type="button"
                          onClick={() => {
                            assignCharacterToSlot(currentSetupId, selectedSlotOrdinal, assignedCharacter.id, sheet.id);
                            setSubjectSlotSourceMode(currentSetupId, selectedSlotOrdinal, 'typed');
                            onAssignSubjectSlot(mannequin.id, selectedSlotIndex!);
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
            </>
          )}
          <p className="text-[10px] text-gray-500 leading-snug lg:hidden">
            Drag link on desktop — assign here on mobile.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-surface-700 pt-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-gray-300 font-semibold text-[11px] uppercase tracking-wide">
            Feet anchor
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <BoundsField
            label="X (0–1)"
            value={mannequin.x}
            min={0}
            max={1}
            onChange={(x) => onUpdate(mannequin.id, { x })}
          />
          <BoundsField
            label="Y (0–1+)"
            value={mannequin.y}
            min={0}
            max={maxFeetAnchorY(mannequin)}
            onChange={(y) => onUpdate(mannequin.id, { y })}
          />
          <BoundsField
            label="Scale"
            value={mannequin.scale}
            min={0.1}
            max={20}
            onChange={(scale) => onUpdate(mannequin.id, { scale })}
          />
          <BoundsField
            label="Tilt °"
            value={mannequin.rotation}
            min={-180}
            max={180}
            onChange={(rotation) => onUpdate(mannequin.id, { rotation })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-surface-700 pt-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-gray-300 font-semibold text-[11px] uppercase tracking-wide">
            Frame bounds
          </span>
          <span className="text-[10px] text-gray-500 tabular-nums">
            scale {mannequin.scale.toFixed(2)}
          </span>
        </div>
        <p className="text-[10px] text-gray-500 leading-snug">
          Inset from each bounds edge to the matching frame edge.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <BoundsField
            label="Left"
            value={bounds.insetLeft}
            min={BOUNDS_INPUT_MIN}
            max={BOUNDS_INPUT_MAX}
            onChange={(value) => applyBoundsPatch({ insetLeft: value })}
          />
          <BoundsField
            label="Right"
            value={bounds.insetRight}
            min={BOUNDS_INPUT_MIN}
            max={BOUNDS_INPUT_MAX}
            onChange={(value) => applyBoundsPatch({ insetRight: value })}
          />
          <BoundsField
            label="Top"
            value={bounds.insetTop}
            min={BOUNDS_INPUT_MIN}
            max={BOUNDS_INPUT_MAX}
            onChange={(value) => applyBoundsPatch({ insetTop: value })}
          />
          <BoundsField
            label="Bottom"
            value={bounds.insetBottom}
            min={BOUNDS_INPUT_MIN}
            max={BOUNDS_INPUT_MAX}
            onChange={(value) => applyBoundsPatch({ insetBottom: value })}
          />
          <BoundsField
            label="W÷H"
            value={bounds.widthToFrameHeight}
            min={WIDTH_TO_HEIGHT_MIN}
            max={widthToHeightMax}
            onChange={(value) => applyBoundsPatch({ widthToFrameHeight: value })}
          />
        </div>
      </div>

      <RangeSlider
        label="Opacity"
        valueLabel={String((mannequin.opacity ?? 1).toFixed(2))}
        min={0.1}
        max={1}
        step={0.05}
        value={mannequin.opacity ?? 1}
        onChange={(e) => onUpdate(mannequin.id, { opacity: Number(e.target.value) })}
      />
    </div>
  );
}
