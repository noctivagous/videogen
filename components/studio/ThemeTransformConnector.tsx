'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

interface Point {
  x: number;
  y: number;
}

export interface ThemeTransformConnectorProps {
  containerRef: RefObject<HTMLElement | null>;
  outletRef: RefObject<HTMLElement | null>;
  slotRefs: RefObject<(HTMLElement | null)[]>;
  onConnect: (slotIndex: number) => void;
  enabled: boolean;
}

function centerInContainer(el: HTMLElement, container: HTMLElement): Point {
  const cr = container.getBoundingClientRect();
  const er = el.getBoundingClientRect();
  return {
    x: er.left + er.width / 2 - cr.left,
    y: er.top + er.height / 2 - cr.top,
  };
}

function hitSlotTarget(
  slots: (HTMLElement | null)[],
  clientX: number,
  clientY: number,
): number | null {
  for (let i = 0; i < slots.length; i++) {
    const el = slots[i];
    if (!el || !el.classList.contains('has-image')) continue;
    const r = el.getBoundingClientRect();
    if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
      return i;
    }
  }
  return null;
}

export function useThemeTransformConnector({
  containerRef,
  outletRef,
  slotRefs,
  onConnect,
  enabled,
}: ThemeTransformConnectorProps) {
  const [dragTo, setDragTo] = useState<Point | null>(null);
  const [hoverSlot, setHoverSlot] = useState<number | null>(null);
  const draggingRef = useRef(false);

  const finishDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      setDragTo(null);
      const slot = hitSlotTarget(slotRefs.current, clientX, clientY);
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
      setHoverSlot(hitSlotTarget(slotRefs.current, e.clientX, e.clientY));
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