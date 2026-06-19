'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

interface Point {
  x: number;
  y: number;
}

export interface ThemeTransformConnectorProps {
  containerRef: RefObject<HTMLElement | null>;
  outletRef: RefObject<HTMLElement | null>;
  inletRefs: RefObject<(HTMLElement | null)[]>;
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

function hitInlet(
  inlets: (HTMLElement | null)[],
  clientX: number,
  clientY: number,
): number | null {
  const radius = 20;
  for (let i = 0; i < inlets.length; i++) {
    const el = inlets[i];
    if (!el) continue;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    if (dx * dx + dy * dy <= radius * radius) return i;
  }
  return null;
}

export function useThemeTransformConnector({
  containerRef,
  outletRef,
  inletRefs,
  onConnect,
  enabled,
}: ThemeTransformConnectorProps) {
  const [dragTo, setDragTo] = useState<Point | null>(null);
  const [hoverInlet, setHoverInlet] = useState<number | null>(null);
  const draggingRef = useRef(false);

  const finishDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      setDragTo(null);
      const slot = hitInlet(inletRefs.current, clientX, clientY);
      setHoverInlet(null);
      if (slot !== null) onConnect(slot);
    },
    [inletRefs, onConnect],
  );

  useEffect(() => {
    if (!enabled) return;

    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current || !containerRef.current) return;
      const cr = containerRef.current.getBoundingClientRect();
      setDragTo({ x: e.clientX - cr.left, y: e.clientY - cr.top });
      setHoverInlet(hitInlet(inletRefs.current, e.clientX, e.clientY));
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
  }, [enabled, containerRef, inletRefs, finishDrag]);

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
          className={`theme-transform-connector__line ${hoverInlet !== null ? 'theme-transform-connector__line--target' : ''}`}
          x1={centerInContainer(outletRef.current, containerRef.current).x}
          y1={centerInContainer(outletRef.current, containerRef.current).y}
          x2={dragTo.x}
          y2={dragTo.y}
        />
      </svg>
    ) : null;

  return { startDrag, connectorLine, hoverInlet, isDragging: dragTo !== null };
}