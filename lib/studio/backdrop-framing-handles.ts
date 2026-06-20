import {
  panFramingByPixelDelta,
  perspectiveFramingFromDrag,
  resizeFramingFromCorner,
  rotateFramingFromDrag,
  scaleFramingFromWheel,
  skewFramingFromDrag,
  type BackdropHandleKind,
} from '@/lib/studio/backdrop-framing';
import type { BackdropFraming } from '@/lib/types/studio';

export function bindBackdropFramingHandles(opts: {
  element: HTMLElement;
  getFraming: () => BackdropFraming;
  imageWidth: number;
  imageHeight: number;
  frameWidth: number;
  frameHeight: number;
  onFramingChange: (patch: Partial<BackdropFraming>) => void;
  onSelect?: () => void;
}): () => void {
  let activeHandle: BackdropHandleKind | null = null;
  let startX = 0;
  let startY = 0;
  let startFraming: BackdropFraming = opts.getFraming();

  const onWheel = (event: WheelEvent) => {
    if (!activeHandle) return;
    event.preventDefault();
    opts.onFramingChange(scaleFramingFromWheel(opts.getFraming(), event.deltaY));
  };

  const onMove = (event: PointerEvent) => {
    if (!activeHandle) return;
    event.preventDefault();
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    switch (activeHandle) {
      case 'move':
        opts.onFramingChange(
          panFramingByPixelDelta(
            startFraming,
            opts.imageWidth,
            opts.imageHeight,
            opts.frameWidth,
            opts.frameHeight,
            deltaX,
            deltaY,
          ),
        );
        break;
      case 'corner-tl':
      case 'corner-tr':
      case 'corner-bl':
      case 'corner-br':
        opts.onFramingChange(
          resizeFramingFromCorner(startFraming, activeHandle, deltaX, deltaY),
        );
        break;
      case 'rotate':
        opts.onFramingChange(rotateFramingFromDrag(startFraming, deltaX, deltaY));
        break;
      case 'skew-x':
        opts.onFramingChange(skewFramingFromDrag(startFraming, 'skew-x', deltaX, deltaY));
        break;
      case 'skew-y':
        opts.onFramingChange(skewFramingFromDrag(startFraming, 'skew-y', deltaX, deltaY));
        break;
      case 'perspective':
        opts.onFramingChange(perspectiveFramingFromDrag(startFraming, deltaY));
        break;
      default:
        break;
    }
  };

  const onUp = (event: PointerEvent) => {
    activeHandle = null;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    opts.element.releasePointerCapture?.(event.pointerId);
  };

  const onHandleDown = (event: PointerEvent) => {
    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(
      '[data-backdrop-handle]',
    );
    if (!target || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();

    const handle = target.dataset.backdropHandle as BackdropHandleKind | undefined;
    if (!handle) return;

    activeHandle = handle;
    startX = event.clientX;
    startY = event.clientY;
    startFraming = opts.getFraming();
    opts.onSelect?.();
    opts.element.setPointerCapture(event.pointerId);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  opts.element.addEventListener('pointerdown', onHandleDown);
  opts.element.addEventListener('wheel', onWheel, { passive: false });

  return () => {
    opts.element.removeEventListener('pointerdown', onHandleDown);
    opts.element.removeEventListener('wheel', onWheel);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
  };
}