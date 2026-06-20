'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import {
  centerInContainer,
  hitKeyedTargets,
  type ConnectorPoint,
} from '@/lib/studio/drag-connector';

export interface CharacterAssignmentConnectorProps {
  containerRef: RefObject<HTMLElement | null>;
  subjectOutletRefs: RefObject<Record<number, HTMLElement | null>>;
  mannequinAnchorRefs: RefObject<Record<string, HTMLElement | null>>;
  principalMannequinIds: ReadonlySet<string>;
  onConnect: (slotIndex: number, mannequinId: string) => void;
  enabled: boolean;
}

function hitMannequinTarget(
  anchors: Record<string, HTMLElement | null>,
  principalIds: ReadonlySet<string>,
  clientX: number,
  clientY: number,
): string | null {
  return hitKeyedTargets(anchors, clientX, clientY, (id) => principalIds.has(id));
}

export function useCharacterAssignmentConnector({
  containerRef,
  subjectOutletRefs,
  mannequinAnchorRefs,
  principalMannequinIds,
  onConnect,
  enabled,
}: CharacterAssignmentConnectorProps) {
  const [dragTo, setDragTo] = useState<ConnectorPoint | null>(null);
  const [dragFromSlot, setDragFromSlot] = useState<number | null>(null);
  const [hoverMannequinId, setHoverMannequinId] = useState<string | null>(null);
  const draggingRef = useRef(false);
  const activeSlotRef = useRef<number | null>(null);

  const finishDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (!draggingRef.current) return;
      const slotIndex = activeSlotRef.current;
      draggingRef.current = false;
      activeSlotRef.current = null;
      setDragTo(null);
      setDragFromSlot(null);
      const mannequinId = hitMannequinTarget(
        mannequinAnchorRefs.current,
        principalMannequinIds,
        clientX,
        clientY,
      );
      setHoverMannequinId(null);
      if (slotIndex !== null && mannequinId) onConnect(slotIndex, mannequinId);
    },
    [mannequinAnchorRefs, principalMannequinIds, onConnect],
  );

  useEffect(() => {
    if (!enabled) return;

    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current || !containerRef.current) return;
      const cr = containerRef.current.getBoundingClientRect();
      setDragTo({ x: e.clientX - cr.left, y: e.clientY - cr.top });
      setHoverMannequinId(
        hitMannequinTarget(
          mannequinAnchorRefs.current,
          principalMannequinIds,
          e.clientX,
          e.clientY,
        ),
      );
    };

    const onUp = (e: PointerEvent) => finishDrag(e.clientX, e.clientY);

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [enabled, containerRef, mannequinAnchorRefs, principalMannequinIds, finishDrag]);

  const startCharacterDrag = useCallback(
    (e: React.PointerEvent, slotIndex: number) => {
      if (!enabled || !containerRef.current) return;
      const outlet = subjectOutletRefs.current[slotIndex];
      if (!outlet) return;
      e.preventDefault();
      e.stopPropagation();
      draggingRef.current = true;
      activeSlotRef.current = slotIndex;
      setDragFromSlot(slotIndex);
      const from = centerInContainer(outlet, containerRef.current);
      setDragTo(from);
    },
    [enabled, containerRef, subjectOutletRefs],
  );

  const connectorLine =
    enabled && dragTo && dragFromSlot !== null && containerRef.current ? (
      <svg className="character-assignment-connector" aria-hidden>
        <line
          className={`character-assignment-connector__line ${
            hoverMannequinId ? 'character-assignment-connector__line--target' : ''
          } character-assignment-connector__line--slot-${dragFromSlot % 3}`}
          x1={
            subjectOutletRefs.current[dragFromSlot]
              ? centerInContainer(subjectOutletRefs.current[dragFromSlot]!, containerRef.current).x
              : dragTo.x
          }
          y1={
            subjectOutletRefs.current[dragFromSlot]
              ? centerInContainer(subjectOutletRefs.current[dragFromSlot]!, containerRef.current).y
              : dragTo.y
          }
          x2={
            hoverMannequinId && mannequinAnchorRefs.current[hoverMannequinId]
              ? centerInContainer(
                  mannequinAnchorRefs.current[hoverMannequinId]!,
                  containerRef.current,
                ).x
              : dragTo.x
          }
          y2={
            hoverMannequinId && mannequinAnchorRefs.current[hoverMannequinId]
              ? centerInContainer(
                  mannequinAnchorRefs.current[hoverMannequinId]!,
                  containerRef.current,
                ).y
              : dragTo.y
          }
        />
      </svg>
    ) : null;

  return {
    startCharacterDrag,
    connectorLine,
    hoverMannequinId,
    draggingCharacterSlotIndex: dragFromSlot,
    isDragging: dragTo !== null,
  };
}