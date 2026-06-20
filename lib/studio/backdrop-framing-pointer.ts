import { panFramingByPixelDelta, scaleFramingFromWheel } from '@/lib/studio/backdrop-framing';
import type { BackdropFraming } from '@/lib/types/studio';

export function bindBackdropFramingPointer(opts: {
  element: HTMLElement;
  getFraming: () => BackdropFraming;
  imageWidth: number;
  imageHeight: number;
  frameWidth: number;
  frameHeight: number;
  onFramingChange: (patch: Partial<BackdropFraming>) => void;
}): () => void {
  let startX = 0;
  let startY = 0;
  let startFraming = opts.getFraming();

  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    const next = scaleFramingFromWheel(opts.getFraming(), event.deltaY);
    opts.onFramingChange(next);
  };

  const onMove = (event: PointerEvent) => {
    event.preventDefault();
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    const pan = panFramingByPixelDelta(
      startFraming,
      opts.imageWidth,
      opts.imageHeight,
      opts.frameWidth,
      opts.frameHeight,
      deltaX,
      deltaY,
    );
    opts.onFramingChange(pan);
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
    startX = event.clientX;
    startY = event.clientY;
    startFraming = opts.getFraming();
    opts.element.setPointerCapture(event.pointerId);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  opts.element.addEventListener('pointerdown', onDown);
  opts.element.addEventListener('wheel', onWheel, { passive: false });

  return () => {
    opts.element.removeEventListener('pointerdown', onDown);
    opts.element.removeEventListener('wheel', onWheel);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
  };
}