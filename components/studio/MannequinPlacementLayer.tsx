'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  mannequinAssetPath,
  mannequinVariantFrom,
} from '@/lib/constants/mannequin-assets';
import {
  MANNEQUIN_SCALE_MIN_ANCHOR_DIST,
  maxFeetAnchorY,
  mannequinFeetBottomPct,
  mannequinHitTargetStyle,
  mannequinLocalBoundsStyle,
  mannequinPreviewHeightPct,
  mannequinPreviewTransform,
  pointerAngleFromFeetAnchor,
  pointerDistanceToFeetAnchor,
  positionFromMoveDrag,
  rotationFromTiltDrag,
  scaleFromAnchorDrag,
} from '@/lib/studio/mannequin-layout';
import { rotateMannequinAngle } from '@/lib/studio/mannequin-rotation';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { useCharacterAssignmentConnectorContext } from '@/components/studio/ThemeTransformConnectorProvider';
import {
  isPrincipalMannequin,
  isValidSubjectSlotAssignment,
} from '@/lib/studio/mannequin-character-assignment';
import { openContextMenu } from '@/components/ui/ContextMenuManager';
import type { Mannequin } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

interface MannequinFacingArrowProps {
  direction: 'left' | 'right';
  label: string;
  onClick: () => void;
}

function MannequinFacingArrow({ direction, label, onClick }: MannequinFacingArrowProps) {
  return (
    <button
      type="button"
      className={`mannequin-bounds-face-btn mannequin-bounds-face-btn--${direction}`}
      aria-label={label}
      title={label}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <svg
        className="mannequin-bounds-face-btn__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        aria-hidden
      >
        {direction === 'left' ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        )}
      </svg>
    </button>
  );
}

interface MannequinPlacementLayerProps {
  mannequins: Mannequin[];
  selectedId: string | null;
  onSelect: (id: string | null, options?: { shiftKey?: boolean }) => void;
  onUpdate: (id: string, patch: Partial<Mannequin>) => void;
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
        target.closest(
          '.mannequin-hit-target, .mannequin-inspector-panel, .mannequin-handle, .mannequin-bounds-overlay, .mannequin-bounds-face-btn',
        )
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

  const handleRemove = useCallback(
    (id: string) => {
      onRemove(id);
      onSelect(null);
    },
    [onRemove, onSelect],
  );

  const openMannequinContextMenu = useCallback(
    (mannequin: Mannequin, clientX: number, clientY: number) => {
      onSelect(mannequin.id);
      openContextMenu({
        x: clientX,
        y: clientY,
        items: [
          {
            id: 'delete',
            label: 'Delete',
            destructive: true,
            onSelect: () => handleRemove(mannequin.id),
          },
        ],
      });
    },
    [handleRemove, onSelect],
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
            Click <span className="text-gray-200 font-semibold">Add mannequin</span> in the
            checklist to place a subject
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
                if (e.button !== 0) return;
                onSelect(m.id, { shiftKey: e.shiftKey });
                startDrag(e, m, 'move');
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openMannequinContextMenu(m, e.clientX, e.clientY);
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
              <div className="mannequin-bounds-overlay" style={mannequinLocalBoundsStyle(m)}>
                <div className="mannequin-bounds-overlay__frame" aria-hidden />
                <MannequinFacingArrow
                  direction="left"
                  label="Rotate facing left"
                  onClick={() =>
                    onUpdate(m.id, { angle: rotateMannequinAngle(m.angle, 'left') })
                  }
                />
                <MannequinFacingArrow
                  direction="right"
                  label="Rotate facing right"
                  onClick={() =>
                    onUpdate(m.id, { angle: rotateMannequinAngle(m.angle, 'right') })
                  }
                />
              </div>
            )}
            {isSelected && (
              <button
                type="button"
                className="mannequin-handle absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-red-600 text-white text-xs leading-none z-20 pointer-events-auto"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => handleRemove(m.id)}
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

    </div>
  );
}