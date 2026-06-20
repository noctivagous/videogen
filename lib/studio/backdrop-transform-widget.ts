import {
  activeCursorForWidget,
  BACKDROP_WIDGET_CURSORS,
  BACKDROP_WIDGET_DRAGGING_CLASS,
  cursorForScaleCorner,
  type BackdropWidgetCursorKind,
} from '@/lib/studio/backdrop-transform-cursors';
import {
  panFramingByPixelDelta,
  perspectiveFramingFromDrag,
  resizeFramingFromCornerAnchored,
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

const SCALE_CORNER_MAP = {
  'scale-tl': 'corner-tl',
  'scale-tr': 'corner-tr',
  'scale-bl': 'corner-bl',
  'scale-br': 'corner-br',
} as const;

function applyDraggingCursor(kind: BackdropWidgetKind, shiftKey: boolean) {
  let cursor: BackdropWidgetCursorKind | null = null;
  if (
    kind === 'scale-tl' ||
    kind === 'scale-tr' ||
    kind === 'scale-bl' ||
    kind === 'scale-br'
  ) {
    cursor = cursorForScaleCorner(kind, shiftKey);
  } else {
    cursor = activeCursorForWidget(kind);
  }
  if (!cursor) return;
  document.body.classList.add(BACKDROP_WIDGET_DRAGGING_CLASS);
  document.body.style.setProperty('--backdrop-active-cursor', BACKDROP_WIDGET_CURSORS[cursor]);
}

function clearDraggingCursor() {
  document.body.classList.remove(BACKDROP_WIDGET_DRAGGING_CLASS);
  document.body.style.removeProperty('--backdrop-active-cursor');
}

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
  let wheelCursorTimer: ReturnType<typeof setTimeout> | null = null;

  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    document.body.classList.add(BACKDROP_WIDGET_DRAGGING_CLASS);
    document.body.style.setProperty('--backdrop-active-cursor', BACKDROP_WIDGET_CURSORS.zoom);
    opts.onFramingChange(scaleFramingFromWheel(opts.getFraming(), event.deltaY));
    if (wheelCursorTimer) clearTimeout(wheelCursorTimer);
    wheelCursorTimer = setTimeout(() => {
      wheelCursorTimer = null;
      if (!activeWidget) clearDraggingCursor();
    }, 150);
  };

  const onMove = (event: PointerEvent) => {
    if (!activeWidget) return;
    event.preventDefault();
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    if (activeWidget.startsWith('scale-')) {
      applyDraggingCursor(activeWidget, event.shiftKey);
    }

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
      case 'scale-tr':
      case 'scale-bl':
      case 'scale-br':
        opts.onFramingChange(
          resizeFramingFromCornerAnchored(
            startFraming,
            SCALE_CORNER_MAP[activeWidget],
            opts.imageWidth,
            opts.imageHeight,
            opts.frameWidth,
            opts.frameHeight,
            deltaX,
            deltaY,
            !event.shiftKey,
          ),
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
    clearDraggingCursor();
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
    applyDraggingCursor(widget, event.shiftKey);

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
    clearDraggingCursor();
  };
}