'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import {
  centerInContainer,
  hitIndexedTargets,
  type ConnectorPoint,
} from '@/lib/studio/drag-connector';

export interface ThemeTransformConnectorProps {
  containerRef: RefObject<HTMLElement | null>;
  outletRef: RefObject<HTMLElement | null>;
  slotRefs: RefObject<(HTMLElement | null)[]>;
  onConnect: (slotIndex: number) => void;
  enabled: boolean;
}

export function useThemeTransformConnector({
  containerRef,
  outletRef,
  slotRefs,
  onConnect,
  enabled,
}: ThemeTransformConnectorProps) {
  const [dragTo, setDragTo] = useState<ConnectorPoint | null>(null);
  const [hoverSlot, setHoverSlot] = useState<number | null>(null);
  const draggingRef = useRef(false);

  const finishDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      setDragTo(null);
      const slot = hitIndexedTargets(slotRefs.current, clientX, clientY, {
        requiredClass: 'has-image',
      });
      setHoverSlot(null);
      if (slot !== null) onConnect(slot);
    },
    [slotRefs, onConnect],
  );

  useEffect(() => {
    if (!enabled) return;

    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current || !containerRef.current) return;
      const cr = containerRef.current.getBoundingClientRect();
      setDragTo({ x: e.clientX - cr.left, y: e.clientY - cr.top });
      setHoverSlot(
        hitIndexedTargets(slotRefs.current, e.clientX, e.clientY, {
          requiredClass: 'has-image',
        }),
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
  }, [enabled, containerRef, slotRefs, finishDrag]);

  const startDrag = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled || !containerRef.current || !outletRef.current) return;
      e.preventDefault();
      draggingRef.current = true;
      const from = centerInContainer(outletRef.current, containerRef.current);
      setDragTo(from);
    },
    [enabled, containerRef, outletRef],
  );

  const connectorLine =
    enabled && dragTo && containerRef.current && outletRef.current ? (
      <svg className="theme-transform-connector" aria-hidden>
        <line
          className={`theme-transform-connector__line ${hoverSlot !== null ? 'theme-transform-connector__line--target' : ''}`}
          x1={centerInContainer(outletRef.current, containerRef.current).x}
          y1={centerInContainer(outletRef.current, containerRef.current).y}
          x2={
            hoverSlot !== null && slotRefs.current[hoverSlot]
              ? centerInContainer(slotRefs.current[hoverSlot]!, containerRef.current).x
              : dragTo.x
          }
          y2={
            hoverSlot !== null && slotRefs.current[hoverSlot]
              ? centerInContainer(slotRefs.current[hoverSlot]!, containerRef.current).y
              : dragTo.y
          }
        />
      </svg>
    ) : null;

  return { startDrag, connectorLine, hoverSlot, isDragging: dragTo !== null };
}