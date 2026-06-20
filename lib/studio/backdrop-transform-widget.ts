import {
  panFramingByPixelDelta,
  perspectiveFramingFromDrag,
  resizeFramingFromCorner,
  scaleFramingFromWheel,
  skewFramingFromDrag,
} from '@/lib/studio/backdrop-framing';
import type { BackdropFraming } from '@/lib/types/studio';

export type BackdropWidgetKind =
  | 'rotate'
  | 'pan'
  | 'scale-tl'
  | 'scale-tr'
  | 'scale-bl'
  | 'scale-br'
  | 'skew-x'
  | 'skew-y'
  | 'perspective';

export function bindBackdropTransformWidget(opts: {
  element: HTMLElement;
  getFraming: () => BackdropFraming;
  imageWidth: number;
  imageHeight: number;
  frameWidth: number;
  frameHeight: number;
  onFramingChange: (patch: Partial<BackdropFraming>) => void;
  onSelect?: () => void;
}): () => void {
  let activeWidget: BackdropWidgetKind | null = null;
  let startX = 0;
  let startY = 0;
  let startFraming: BackdropFraming = opts.getFraming();
  let startAngle = 0;
  let widgetCenterX = 0;
  let widgetCenterY = 0;

  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    opts.onFramingChange(scaleFramingFromWheel(opts.getFraming(), event.deltaY));
  };

  const onMove = (event: PointerEvent) => {
    if (!activeWidget) return;
    event.preventDefault();
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    switch (activeWidget) {
      case 'pan':
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
      case 'scale-tl':
        opts.onFramingChange(
          resizeFramingFromCorner(startFraming, 'corner-tl', deltaX, deltaY),
        );
        break;
      case 'scale-tr':
        opts.onFramingChange(
          resizeFramingFromCorner(startFraming, 'corner-tr', deltaX, deltaY),
        );
        break;
      case 'scale-bl':
        opts.onFramingChange(
          resizeFramingFromCorner(startFraming, 'corner-bl', deltaX, deltaY),
        );
        break;
      case 'scale-br':
        opts.onFramingChange(
          resizeFramingFromCorner(startFraming, 'corner-br', deltaX, deltaY),
        );
        break;
      case 'rotate': {
        const angle = Math.atan2(event.clientY - widgetCenterY, event.clientX - widgetCenterX);
        const deltaDeg = ((angle - startAngle) * 180) / Math.PI;
        opts.onFramingChange({ rotation: startFraming.rotation + deltaDeg });
        break;
      }
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
    activeWidget = null;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    opts.element.releasePointerCapture?.(event.pointerId);
  };

  const onWidgetDown = (event: PointerEvent) => {
    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(
      '[data-backdrop-widget]',
    );
    if (!target || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();

    const widget = target.dataset.backdropWidget as BackdropWidgetKind | undefined;
    if (!widget) return;

    activeWidget = widget;
    startX = event.clientX;
    startY = event.clientY;
    startFraming = opts.getFraming();
    opts.onSelect?.();

    if (widget === 'rotate') {
      const rect = opts.element.getBoundingClientRect();
      widgetCenterX = rect.left + rect.width / 2;
      widgetCenterY = rect.top + rect.height / 2;
      startAngle = Math.atan2(startY - widgetCenterY, startX - widgetCenterX);
    }

    opts.element.setPointerCapture(event.pointerId);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  opts.element.addEventListener('pointerdown', onWidgetDown);
  opts.element.addEventListener('wheel', onWheel, { passive: false });

  return () => {
    opts.element.removeEventListener('pointerdown', onWidgetDown);
    opts.element.removeEventListener('wheel', onWheel);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
  };
}