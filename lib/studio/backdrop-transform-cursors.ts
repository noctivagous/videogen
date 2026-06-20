function svgDataCursor(svg: string, hotspotX = 12, hotspotY = 12, fallback = 'auto'): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${hotspotX} ${hotspotY}, ${fallback}`;
}

const STROKE = '#e5e7eb';
const ACCENT = '#818cf8';
const SHADOW = 'rgba(0,0,0,0.55)';

function cursorSvg(body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">${body}</svg>`;
}

export const BACKDROP_WIDGET_CURSORS = {
  rotate: svgDataCursor(
    cursorSvg(`
      <circle cx="12" cy="12" r="8" fill="none" stroke="${SHADOW}" stroke-width="3"/>
      <path d="M12 4a8 8 0 0 1 7.4 5" fill="none" stroke="${ACCENT}" stroke-width="2" stroke-linecap="round"/>
      <path d="M17 5l2-1-1 2" fill="none" stroke="${ACCENT}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="12" cy="12" r="1.5" fill="${STROKE}"/>
    `),
    12,
    12,
    'grab',
  ),
  'rotate-active': svgDataCursor(
    cursorSvg(`
      <circle cx="12" cy="12" r="8" fill="none" stroke="${SHADOW}" stroke-width="3"/>
      <path d="M12 4a8 8 0 1 1-7.4 5" fill="none" stroke="${ACCENT}" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M7 5L5 4l1 2" fill="none" stroke="${ACCENT}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="12" cy="12" r="1.5" fill="${STROKE}"/>
    `),
    12,
    12,
    'grabbing',
  ),
  pan: svgDataCursor(
    cursorSvg(`
      <path d="M12 3v18M3 12h18" stroke="${SHADOW}" stroke-width="3" stroke-linecap="round"/>
      <path d="M12 3v18M3 12h18" stroke="${STROKE}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M12 6l-2.5 3h5L12 6zM12 18l-2.5-3h5l-2.5 3zM6 12l3-2.5v5L6 12zM18 12l-3-2.5v5l3-2.5z" fill="${ACCENT}"/>
    `),
    12,
    12,
    'move',
  ),
  'pan-active': svgDataCursor(
    cursorSvg(`
      <path d="M12 3v18M3 12h18" stroke="${SHADOW}" stroke-width="3" stroke-linecap="round"/>
      <path d="M12 3v18M3 12h18" stroke="${ACCENT}" stroke-width="2" stroke-linecap="round"/>
      <path d="M12 6l-2.5 3h5L12 6zM12 18l-2.5-3h5l-2.5 3zM6 12l3-2.5v5L6 12zM18 12l-3-2.5v5l3-2.5z" fill="${STROKE}"/>
    `),
    12,
    12,
    'move',
  ),
  'scale-nwse': svgDataCursor(
    cursorSvg(`
      <path d="M7 17L17 7" stroke="${SHADOW}" stroke-width="3" stroke-linecap="round"/>
      <path d="M7 17L17 7M7 11V17H13M17 13H11V7" stroke="${STROKE}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M5 19l3-1.5V19H5zM19 5h-1.5V5H19V3.5L19 5z" fill="${ACCENT}"/>
    `),
    12,
    12,
    'nwse-resize',
  ),
  'scale-nesw': svgDataCursor(
    cursorSvg(`
      <path d="M7 7l10 10" stroke="${SHADOW}" stroke-width="3" stroke-linecap="round"/>
      <path d="M7 7l10 10M7 13V7h6M17 11v6h-6" stroke="${STROKE}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M5 5l3 1.5V5H5zM19 19h-1.5V19H19v1.5L19 19z" fill="${ACCENT}"/>
    `),
    12,
    12,
    'nesw-resize',
  ),
  'scale-free': svgDataCursor(
    cursorSvg(`
      <rect x="5" y="7" width="14" height="10" rx="1" fill="none" stroke="${SHADOW}" stroke-width="3"/>
      <rect x="5" y="7" width="14" height="10" rx="1" fill="none" stroke="${STROKE}" stroke-width="1.5"/>
      <path d="M5 7h5v4H5M19 17h-5v-4h5" fill="${ACCENT}"/>
    `),
    12,
    12,
    'nwse-resize',
  ),
  'skew-x': svgDataCursor(
    cursorSvg(`
      <path d="M4 16L20 8" stroke="${SHADOW}" stroke-width="3" stroke-linecap="round"/>
      <path d="M4 16L20 8M8 15l8-4" stroke="${STROKE}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M3 18h4v-4H3v4zM17 6h4v4h-4V6z" fill="${ACCENT}"/>
    `),
    12,
    12,
    'ew-resize',
  ),
  'skew-y': svgDataCursor(
    cursorSvg(`
      <path d="M8 4v16M16 4v16" stroke="${SHADOW}" stroke-width="3" stroke-linecap="round"/>
      <path d="M8 4v16M16 4v16M10 8h4M10 16h4" stroke="${STROKE}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M6 3h4v4H6V3zM14 17h4v4h-4v-4z" fill="${ACCENT}"/>
    `),
    12,
    12,
    'ns-resize',
  ),
  perspective: svgDataCursor(
    cursorSvg(`
      <path d="M5 18L12 6l7 12H5z" fill="none" stroke="${SHADOW}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M5 18L12 6l7 12H5z" fill="none" stroke="${STROKE}" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M8 15h8" stroke="${ACCENT}" stroke-width="2" stroke-linecap="round"/>
    `),
    12,
    12,
    'ns-resize',
  ),
  zoom: svgDataCursor(
    cursorSvg(`
      <circle cx="10" cy="10" r="6" fill="none" stroke="${SHADOW}" stroke-width="3"/>
      <circle cx="10" cy="10" r="6" fill="none" stroke="${STROKE}" stroke-width="1.5"/>
      <path d="M10 7v6M7 10h6" stroke="${ACCENT}" stroke-width="2" stroke-linecap="round"/>
      <path d="M15 15l4 4" stroke="${STROKE}" stroke-width="2" stroke-linecap="round"/>
    `),
    10,
    10,
    'zoom-in',
  ),
} as const;

export type BackdropWidgetCursorKind = keyof typeof BACKDROP_WIDGET_CURSORS;

export function cursorForScaleCorner(
  corner: 'scale-tl' | 'scale-tr' | 'scale-bl' | 'scale-br',
  shiftKey: boolean,
): BackdropWidgetCursorKind {
  if (shiftKey) return 'scale-free';
  return corner === 'scale-tl' || corner === 'scale-br' ? 'scale-nwse' : 'scale-nesw';
}

export function activeCursorForWidget(widget: string): BackdropWidgetCursorKind | null {
  switch (widget) {
    case 'rotate':
      return 'rotate-active';
    case 'pan':
      return 'pan-active';
    case 'scale-tl':
    case 'scale-tr':
    case 'scale-bl':
    case 'scale-br':
      return 'scale-nwse';
    case 'skew-x':
      return 'skew-x';
    case 'skew-y':
      return 'skew-y';
    case 'perspective':
      return 'perspective';
    default:
      return null;
  }
}

export const BACKDROP_WIDGET_DRAGGING_CLASS = 'backdrop-widget-dragging';