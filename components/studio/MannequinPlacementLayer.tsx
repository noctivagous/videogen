'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  MANNEQUIN_AGE_OPTIONS,
  MANNEQUIN_GENDER_OPTIONS,
  MANNEQUIN_POSE_OPTIONS,
} from '@/lib/constants/workflows';
import { mannequinAssetPath, mannequinVariantFrom } from '@/lib/constants/mannequin-assets';
import {
  MANNEQUIN_SCALE_MIN_ANCHOR_DIST,
  mannequinFeetBottomPct,
  mannequinPreviewHeightPct,
  mannequinPreviewTransform,
  pointerDistanceToFeetAnchor,
  positionFromMoveDrag,
  scaleFromAnchorDrag,
} from '@/lib/studio/mannequin-layout';
import {
  mannequinAngleLabel,
  rotateMannequinAngle,
} from '@/lib/studio/mannequin-rotation';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import type { Mannequin } from '@/lib/types/studio';

interface MannequinPlacementLayerProps {
  mannequins: Mannequin[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, patch: Partial<Mannequin>) => void;
  canAdd: boolean;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

type DragMode = 'move' | 'scale';

interface DragSession {
  id: string;
  mode: DragMode;
  startClientX: number;
  startClientY: number;
  originX: number;
  originY: number;
  originScale: number;
  startAnchorDist?: number;
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

  const endDrag = useCallback(() => {
    dragRef.current = null;
  }, []);

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
        });
        onUpdateRef.current(drag.id, pos);
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
    dragRef.current = session;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const selected = mannequins.find((m) => m.id === selectedId);

  return (
    <div
      ref={layerRef}
      className="mannequin-placement-layer absolute inset-0 z-20 pointer-events-auto"
      {...uiSectionProps(UI_SECTIONS.studioMannequinPlacement)}
      onPointerDown={(e) => {
        if (e.target === layerRef.current) onSelect(null);
      }}
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
        return (
          <div
            key={m.id}
            className={`absolute select-none flex flex-col items-center justify-end ${
              isSelected ? 'z-10' : 'z-[5]'
            }`}
            style={{
              left: `${m.x * 100}%`,
              bottom: `${mannequinFeetBottomPct(m.y)}%`,
              transform: `translate(${feet.translateX}, 0) rotate(${m.rotation}deg)`,
              opacity: m.opacity ?? 1,
              height: `${heightPct}%`,
              width: 'auto',
              transformOrigin: feet.transformOrigin,
            }}
            onPointerDown={(e) => {
              onSelect(m.id);
              startDrag(e, m, 'move');
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mannequinAssetPath(mannequinVariantFrom(m))}
              alt=""
              draggable={false}
              className={`block h-full w-auto max-w-none pointer-events-none ${
                isSelected ? 'ring-2 ring-amber-400/80' : ''
              }`}
            />
            {isSelected && (
              <button
                type="button"
                className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-red-600 text-white text-xs leading-none z-20"
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
                className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-sm bg-amber-400 border-2 border-amber-200 shadow-sm cursor-nwse-resize z-20 touch-none"
                title="Drag to resize — pull away from feet"
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

      <div className="absolute top-3 right-3 flex flex-col gap-2 bg-surface-900/90 border border-surface-700 rounded-lg p-2 text-[10px]">
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
              <label className="text-gray-400">Facing</label>
              <button
                type="button"
                className="w-6 h-6 rounded bg-surface-700 hover:bg-surface-600 text-gray-200 font-bold"
                aria-label="Rotate facing left"
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
                aria-label="Rotate facing right"
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
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-gray-400">Scale</label>
              <span className="text-gray-200 tabular-nums">{selected.scale.toFixed(2)}</span>
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