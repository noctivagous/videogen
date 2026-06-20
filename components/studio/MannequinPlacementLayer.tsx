'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  MANNEQUIN_AGE_OPTIONS,
  MANNEQUIN_GENDER_OPTIONS,
  MANNEQUIN_POSE_OPTIONS,
} from '@/lib/constants/workflows';
import {
  mannequinAssetPath,
  mannequinTrim,
  mannequinVariantFrom,
} from '@/lib/constants/mannequin-assets';
import {
  MANNEQUIN_SCALE_MIN_ANCHOR_DIST,
  maxFeetAnchorY,
  mannequinFeetBottomPct,
  mannequinHitTargetStyle,
  mannequinPreviewHeightPct,
  mannequinPreviewTransform,
  pointerAngleFromFeetAnchor,
  pointerDistanceToFeetAnchor,
  positionFromMoveDrag,
  rotationFromTiltDrag,
  scaleFromAnchorDrag,
} from '@/lib/studio/mannequin-layout';
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
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { useCharacterAssignmentConnectorContext } from '@/components/studio/ThemeTransformConnectorProvider';
import {
  getSubjectSlotIndices,
  isPrincipalMannequin,
  isValidSubjectSlotAssignment,
} from '@/lib/studio/mannequin-character-assignment';
import { getReferenceSlotLabel } from '@/lib/studio/reference-slots';
import type { AspectRatio, Mannequin } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

const BOUNDS_INPUT_MIN = -0.75;
const BOUNDS_INPUT_MAX = 1.5;
const WIDTH_TO_HEIGHT_MIN = 0.02;

function clampBoundsValue(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatBoundsValue(value: number): string {
  return value.toFixed(3);
}

interface BoundsFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

function BoundsField({ label, value, min, max, onChange }: BoundsFieldProps) {
  return (
    <label className="flex flex-col gap-0.5 min-w-[3.25rem]">
      <span className="text-gray-500 text-[9px] uppercase tracking-wide">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={0.01}
        value={formatBoundsValue(value)}
        onChange={(e) => {
          const next = Number(e.target.value);
          if (!Number.isFinite(next)) return;
          onChange(clampBoundsValue(next, min, max));
        }}
        className="w-full bg-surface-800 border border-surface-600 rounded px-1 py-0.5 text-gray-200 tabular-nums"
      />
    </label>
  );
}

interface MannequinPlacementLayerProps {
  mannequins: Mannequin[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, patch: Partial<Mannequin>) => void;
  canAdd: boolean;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

type DragMode = 'move' | 'scale' | 'tilt';

interface DragSession {
  id: string;
  mode: DragMode;
  startClientX: number;
  startClientY: number;
  originX: number;
  originY: number;
  originScale: number;
  originRotation: number;
  maxAnchorY: number;
  startAnchorDist?: number;
  startAngleDeg?: number;
}

export function MannequinPlacementLayer({
  mannequins,
  selectedId,
  onSelect,
  onUpdate,
  canAdd,
  onAdd,
  onRemove,
}: MannequinPlacementLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragSession | null>(null);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const shot = useStudioStore((s) => {
    const list = s.shots;
    return list.find((item) => item.id === s.currentShot) || list[0];
  });
  const aspectRatio = useStudioStore(
    (s) => (s.project.aspectRatio || '16:9') as AspectRatio,
  );
  const assignMannequinSubjectSlot = useStudioStore((s) => s.assignMannequinSubjectSlot);
  const subjectSlotIndices = shot ? getSubjectSlotIndices(shot) : [];
  const characterConnector = useCharacterAssignmentConnectorContext();

  const endDrag = useCallback(() => {
    dragRef.current = null;
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const onDocPointerDown = (e: PointerEvent) => {
      const layer = layerRef.current;
      if (!layer) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (
        target.closest('.mannequin-hit-target, .mannequin-inspector-panel, .mannequin-handle')
      ) {
        return;
      }
      if (layer.contains(target)) return;
      onSelect(null);
    };
    document.addEventListener('pointerdown', onDocPointerDown);
    return () => document.removeEventListener('pointerdown', onDocPointerDown);
  }, [selectedId, onSelect]);

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      const layer = layerRef.current;
      if (!drag || !layer) return;
      const rect = layer.getBoundingClientRect();

      if (drag.mode === 'move') {
        const pos = positionFromMoveDrag({
          originX: drag.originX,
          originY: drag.originY,
          startClientX: drag.startClientX,
          startClientY: drag.startClientY,
          currentClientX: e.clientX,
          currentClientY: e.clientY,
          layerRect: rect,
          maxAnchorY: drag.maxAnchorY,
        });
        onUpdateRef.current(drag.id, pos);
        return;
      }

      if (drag.mode === 'tilt') {
        const rotation = rotationFromTiltDrag({
          originRotation: drag.originRotation,
          anchorX: drag.originX,
          anchorY: drag.originY,
          startAngleDeg: drag.startAngleDeg ?? 0,
          currentClientX: e.clientX,
          currentClientY: e.clientY,
          layerRect: rect,
        });
        onUpdateRef.current(drag.id, { rotation });
        return;
      }

      const scale = scaleFromAnchorDrag({
        originScale: drag.originScale,
        anchorX: drag.originX,
        anchorY: drag.originY,
        startAnchorDist: drag.startAnchorDist ?? MANNEQUIN_SCALE_MIN_ANCHOR_DIST,
        currentClientX: e.clientX,
        currentClientY: e.clientY,
        layerRect: rect,
      });
      onUpdateRef.current(drag.id, { scale });
    };

    const onPointerUp = () => endDrag();

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [endDrag]);

  const startDrag = (
    e: React.PointerEvent,
    mannequin: Mannequin,
    mode: DragMode,
    layerEl?: HTMLDivElement | null,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const layerRect = (layerEl ?? layerRef.current)?.getBoundingClientRect();
    const session: DragSession = {
      id: mannequin.id,
      mode,
      startClientX: e.clientX,
      startClientY: e.clientY,
      originX: mannequin.x,
      originY: mannequin.y,
      originScale: mannequin.scale,
      originRotation: mannequin.rotation,
      maxAnchorY: maxFeetAnchorY(mannequin),
    };
    if (mode === 'scale' && layerRect) {
      session.startAnchorDist = pointerDistanceToFeetAnchor(
        e.clientX,
        e.clientY,
        mannequin.x,
        mannequin.y,
        layerRect,
      );
    }
    if (mode === 'tilt' && layerRect) {
      session.startAngleDeg = pointerAngleFromFeetAnchor(
        e.clientX,
        e.clientY,
        mannequin.x,
        mannequin.y,
        layerRect,
      );
    }
    dragRef.current = session;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const selected = mannequins.find((m) => m.id === selectedId);

  const placementX = shot ? placementAnchorX(shot) : 0.5;

  const selectedBounds = useMemo(() => {
    if (!selected) return null;
    return anchorToBoundsFrame(selected, aspectRatio, placementX);
  }, [selected, aspectRatio, placementX]);

  const widthToHeightMax = useMemo(() => {
    if (!selected) return 2.5;
    return maxWidthToFrameHeight(mannequinTrim(mannequinVariantFrom(selected)));
  }, [selected]);

  const applyBoundsPatch = useCallback(
    (patch: Partial<MannequinBoundsFrame>) => {
      if (!selected || !selectedBounds) return;
      const nextBounds = patchBoundsFrame(
        selectedBounds,
        patch,
        aspectRatio,
        mannequinTrim(mannequinVariantFrom(selected)),
      );
      onUpdate(
        selected.id,
        boundsFrameToMannequinPatch(nextBounds, selected, aspectRatio, placementX),
      );
    },
    [aspectRatio, onUpdate, placementX, selected, selectedBounds],
  );

  return (
    <div
      ref={layerRef}
      className="mannequin-placement-layer absolute inset-0 z-20 pointer-events-none"
      {...uiSectionProps(UI_SECTIONS.studioMannequinPlacement)}
    >
      {mannequins.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-xs text-gray-400 bg-surface-900/80 px-3 py-2 rounded-lg border border-surface-700">
            Click <span className="text-gray-200 font-semibold">Add Mannequin</span> to place a subject
          </p>
        </div>
      )}

      {mannequins.map((m) => {
        const heightPct = mannequinPreviewHeightPct(m);
        const feet = mannequinPreviewTransform(m);
        const isSelected = m.id === selectedId;
        const isPrincipal = isPrincipalMannequin(m);
        const isLinked =
          shot != null &&
          m.subjectSlotIndex != null &&
          isValidSubjectSlotAssignment(shot, m.subjectSlotIndex);
        const linkRingClass = isLinked
          ? characterConnector?.mannequinLinkRingClass(m.subjectSlotIndex) ?? ''
          : isSelected
            ? 'ring-2 ring-amber-400/80'
            : '';
        const isCharacterTarget = characterConnector?.hoverMannequinId === m.id;
        return (
          <div
            key={m.id}
            className={`absolute select-none flex flex-col items-center justify-end pointer-events-none ${
              isSelected ? 'z-10' : 'z-[5]'
            } ${isCharacterTarget ? 'mannequin--character-target' : ''}`}
            style={{
              left: `${m.x * 100}%`,
              bottom: `${mannequinFeetBottomPct(m.y)}%`,
              transform: `translate(${feet.translateX}, 0) rotate(${m.rotation}deg)`,
              opacity: m.opacity ?? 1,
              height: `${heightPct}%`,
              width: 'auto',
              transformOrigin: feet.transformOrigin,
            }}
          >
            <div
              role="presentation"
              className="mannequin-hit-target absolute pointer-events-auto cursor-grab touch-none active:cursor-grabbing"
              style={mannequinHitTargetStyle(m)}
              onPointerDown={(e) => {
                onSelect(m.id);
                startDrag(e, m, 'move');
              }}
            />
            {isPrincipal && characterConnector?.characterAssignmentEnabled && (
              <div
                ref={(el) => characterConnector.registerMannequinAnchor(m.id, el)}
                className="mannequin-character-anchor"
                aria-hidden
              />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mannequinAssetPath(mannequinVariantFrom(m))}
              alt=""
              draggable={false}
              className={`block h-full w-auto max-w-none pointer-events-none ${linkRingClass}`}
            />
            {isSelected && (
              <button
                type="button"
                className="mannequin-handle absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-red-600 text-white text-xs leading-none z-20 pointer-events-auto"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onRemove(m.id)}
                aria-label="Remove mannequin"
              >
                ×
              </button>
            )}
            {isSelected && (
              <div
                role="presentation"
                className="mannequin-handle absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center z-20 touch-none cursor-grab active:cursor-grabbing pointer-events-auto"
                title="Drag to tilt — pivots at feet"
                aria-label="Tilt mannequin"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onSelect(m.id);
                  startDrag(e, m, 'tilt', layerRef.current);
                }}
              >
                <div className="w-3 h-3 rotate-45 bg-sky-400 border-2 border-sky-200 shadow-sm" />
              </div>
            )}
            {isSelected && (
              <div
                role="presentation"
                className="mannequin-handle absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-sm bg-amber-400 border-2 border-amber-200 shadow-sm cursor-nwse-resize z-20 touch-none pointer-events-auto"
                title="Drag to resize — pull away from feet"
                aria-label="Scale mannequin"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onSelect(m.id);
                  startDrag(e, m, 'scale', layerRef.current);
                }}
              />
            )}
          </div>
        );
      })}

      <div className="mannequin-inspector-panel absolute top-3 right-3 z-50 flex flex-col gap-2 min-w-[11.5rem] max-w-[14rem] bg-surface-900/90 border border-surface-700 rounded-lg p-2 text-[10px] pointer-events-auto">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canAdd}
            onClick={onAdd}
            className="px-2 py-1 rounded bg-surface-700 hover:bg-surface-600 disabled:opacity-40 text-gray-200 font-semibold"
          >
            Add Mannequin
          </button>
        </div>
        {selected && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-gray-400">Face</label>
              <button
                type="button"
                className="w-6 h-6 rounded bg-surface-700 hover:bg-surface-600 text-gray-200 font-bold"
                aria-label="Rotate face left"
                onClick={() =>
                  onUpdate(selected.id, {
                    angle: rotateMannequinAngle(selected.angle, 'left'),
                  })
                }
              >
                ←
              </button>
              <span className="text-gray-200 min-w-[4.5rem] text-center">
                {mannequinAngleLabel(selected.angle)}
              </span>
              <button
                type="button"
                className="w-6 h-6 rounded bg-surface-700 hover:bg-surface-600 text-gray-200 font-bold"
                aria-label="Rotate face right"
                onClick={() =>
                  onUpdate(selected.id, {
                    angle: rotateMannequinAngle(selected.angle, 'right'),
                  })
                }
              >
                →
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-gray-400">Gender</label>
              <select
                value={selected.gender}
                onChange={(e) =>
                  onUpdate(selected.id, { gender: e.target.value as Mannequin['gender'] })
                }
                className="bg-surface-800 border border-surface-600 rounded px-1 py-0.5 text-gray-200"
              >
                {MANNEQUIN_GENDER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <label className="text-gray-400">Age</label>
              <select
                value={selected.age}
                onChange={(e) =>
                  onUpdate(selected.id, { age: e.target.value as Mannequin['age'] })
                }
                className="bg-surface-800 border border-surface-600 rounded px-1 py-0.5 text-gray-200"
              >
                {MANNEQUIN_AGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <label className="text-gray-400">Pose</label>
              <select
                value={selected.pose}
                onChange={(e) =>
                  onUpdate(selected.id, { pose: e.target.value as Mannequin['pose'] })
                }
                className="bg-surface-800 border border-surface-600 rounded px-1 py-0.5 text-gray-200"
              >
                {MANNEQUIN_POSE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} disabled={!o.enabled}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            {isPrincipalMannequin(selected) && (
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-gray-400">Character</label>
                <select
                  value={
                    selected.subjectSlotIndex != null &&
                    subjectSlotIndices.includes(selected.subjectSlotIndex)
                      ? String(selected.subjectSlotIndex)
                      : ''
                  }
                  onChange={(e) => {
                    const raw = e.target.value;
                    assignMannequinSubjectSlot(
                      selected.id,
                      raw === '' ? null : Number(raw),
                    );
                  }}
                  className="min-w-[6.5rem] max-w-[9rem] bg-surface-800 border border-surface-600 rounded px-1 py-0.5 text-gray-200"
                  aria-label="Assign character sheet"
                >
                  <option value="">Unassigned</option>
                  {subjectSlotIndices.map((slotIndex) => {
                    const role = normalizeReferenceRole(
                      shot?.referenceRoles[slotIndex] ?? 'Subject',
                    );
                    const label = shot
                      ? getReferenceSlotLabel(shot, slotIndex, role)
                      : `Subject ${slotIndex + 1}`;
                    return (
                      <option key={slotIndex} value={slotIndex}>
                        {label}
                      </option>
                    );
                  })}
                </select>
                <p className="w-full text-[9px] text-gray-500 leading-snug lg:hidden">
                  Drag link on desktop — assign here on mobile.
                </p>
              </div>
            )}
            {selectedBounds && (
              <div className="flex flex-col gap-1.5 border-t border-surface-700 pt-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-gray-400 font-semibold">Frame bounds</span>
                  <span className="text-[9px] text-gray-500 tabular-nums">
                    scale {selected.scale.toFixed(2)}
                  </span>
                </div>
                <p className="text-[9px] text-gray-500 leading-snug">
                  Inset from each bounds edge to the matching frame edge. W÷H is bounds width
                  relative to frame height.
                </p>
                <div className="grid grid-cols-3 gap-x-2 gap-y-1.5">
                  <BoundsField
                    label="Left"
                    value={selectedBounds.insetLeft}
                    min={BOUNDS_INPUT_MIN}
                    max={BOUNDS_INPUT_MAX}
                    onChange={(value) => applyBoundsPatch({ insetLeft: value })}
                  />
                  <BoundsField
                    label="Right"
                    value={selectedBounds.insetRight}
                    min={BOUNDS_INPUT_MIN}
                    max={BOUNDS_INPUT_MAX}
                    onChange={(value) => applyBoundsPatch({ insetRight: value })}
                  />
                  <BoundsField
                    label="W÷H"
                    value={selectedBounds.widthToFrameHeight}
                    min={WIDTH_TO_HEIGHT_MIN}
                    max={widthToHeightMax}
                    onChange={(value) => applyBoundsPatch({ widthToFrameHeight: value })}
                  />
                  <BoundsField
                    label="Top"
                    value={selectedBounds.insetTop}
                    min={BOUNDS_INPUT_MIN}
                    max={BOUNDS_INPUT_MAX}
                    onChange={(value) => applyBoundsPatch({ insetTop: value })}
                  />
                  <BoundsField
                    label="Bottom"
                    value={selectedBounds.insetBottom}
                    min={BOUNDS_INPUT_MIN}
                    max={BOUNDS_INPUT_MAX}
                    onChange={(value) => applyBoundsPatch({ insetBottom: value })}
                  />
                </div>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-gray-400">Tilt°</label>
              <input
                type="number"
                value={Math.round(selected.rotation)}
                onChange={(e) =>
                  onUpdate(selected.id, { rotation: Number(e.target.value) })
                }
                className="w-12 bg-surface-800 border border-surface-600 rounded px-1 py-0.5 text-gray-200"
              />
              <label className="text-gray-400">α</label>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={selected.opacity ?? 1}
                onChange={(e) =>
                  onUpdate(selected.id, { opacity: Number(e.target.value) })
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}