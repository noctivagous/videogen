import {
  findNearestPlacement,
  percentFromElementRect,
} from '@/lib/constants/placement-grid';
import type { Placement } from '@/lib/types/studio';

export function placementFromPointer(
  element: HTMLElement,
  clientX: number,
  clientY: number,
): Placement {
  const rect = element.getBoundingClientRect();
  const { x, y } = percentFromElementRect(rect, clientX, clientY);
  return findNearestPlacement(x, y);
}

export function bindPlacementDrag(opts: {
  element: HTMLElement;
  onPlacement: (placement: Placement) => void;
}): () => void {
  const onMove = (event: PointerEvent) => {
    event.preventDefault();
    opts.onPlacement(placementFromPointer(opts.element, event.clientX, event.clientY));
  };

  const onUp = (event: PointerEvent) => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    opts.element.releasePointerCapture?.(event.pointerId);
  };

  const onDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    opts.element.setPointerCapture(event.pointerId);
    opts.onPlacement(placementFromPointer(opts.element, event.clientX, event.clientY));
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  opts.element.addEventListener('pointerdown', onDown);

  return () => {
    opts.element.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
  };
}

