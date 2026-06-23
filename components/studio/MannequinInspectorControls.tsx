'use client';

import { useMemo } from 'react';
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
import { getReferenceSlotLabel } from '@/lib/studio/reference-slots';
import { isBakeStartFrame } from '@/lib/studio/workflow';
import { maxFeetAnchorY } from '@/lib/studio/mannequin-layout';
import type { AspectRatio, Mannequin, Shot } from '@/lib/types/studio';
import { Select } from '@/components/ui/Select';
import { RangeSlider } from '@/components/ui/RangeSlider';

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
  const subjectSlotIndices = shot ? getSubjectSlotIndices(shot) : [];
  const placementX = shot ? placementAnchorX(shot) : 0.5;

  const bounds = useMemo(
    () => anchorToBoundsFrame(mannequin, aspectRatio, placementX),
    [mannequin, aspectRatio, placementX],
  );

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

      <div className="grid grid-cols-1 gap-2">
        <Select
          label="Gender"
          value={mannequin.gender}
          onChange={(e) =>
            onUpdate(mannequin.id, { gender: e.target.value as Mannequin['gender'] })
          }
        >
          {MANNEQUIN_GENDER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
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
            label="Character sheet"
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
            <option value="">Unassigned</option>
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
