import type { Placement } from '@/lib/types/studio';

const THIRD = 100 / 3;
const LATTICE = [0, THIRD, THIRD * 2, 100] as const;

export type PlacementKind = 'intersection' | 'cell';
export type PlacementDotSize = 'sm' | 'md';

export interface PlacementSpec {
  id: Placement;
  kind: PlacementKind;
  x: number;
  y: number;
  label: string;
  dotSize?: PlacementDotSize;
}

function ix(row: number, col: number): { x: number; y: number } {
  return {
    x: col === 3 ? 100 : col * THIRD,
    y: row === 3 ? 100 : row * THIRD,
  };
}

function cell(row: number, col: number): { x: number; y: number } {
  return {
    x: (col + 0.5) * THIRD,
    y: (row + 0.5) * THIRD,
  };
}

function posKey(x: number, y: number): string {
  return `${Math.round(x * 100) / 100},${Math.round(y * 100) / 100}`;
}

const ROW_LABELS = ['Top', 'Upper', 'Lower', 'Bottom'] as const;
const COL_LABELS = ['Left', 'Center-Left', 'Center-Right', 'Right'] as const;
const CELL_ROW = ['Top', 'Middle', 'Bottom'] as const;
const CELL_COL = ['Left', 'Center', 'Right'] as const;

function ixLabel(row: number, col: number): string {
  if (row === 0 && col === 0) return 'Top-left corner';
  if (row === 0 && col === 3) return 'Top-right corner';
  if (row === 3 && col === 0) return 'Bottom-left corner';
  if (row === 3 && col === 3) return 'Bottom-right corner';
  if (row === 0 && col === 1) return 'Top edge, left third';
  if (row === 0 && col === 2) return 'Top edge, right third';
  if (row === 3 && col === 1) return 'Bottom edge, left third';
  if (row === 3 && col === 2) return 'Bottom edge, right third';
  if (row === 1 && col === 0) return 'Left edge, upper third';
  if (row === 2 && col === 0) return 'Left edge, lower third';
  if (row === 1 && col === 3) return 'Right edge, upper third';
  if (row === 2 && col === 3) return 'Right edge, lower third';
  return `${ROW_LABELS[row]} ${COL_LABELS[col]} intersection`;
}

/** Stable ids for well-known segment midpoints (backward compatible). */
const NAMED_SEGMENT_IDS: Record<string, Placement> = {
  [posKey(50, 0)]: 'ix-edge-t',
  [posKey(50, 100)]: 'ix-edge-b',
  [posKey(0, 50)]: 'ix-edge-l',
  [posKey(100, 50)]: 'ix-edge-r',
  [posKey(50, THIRD)]: 'ix-mid-t',
  [posKey(50, THIRD * 2)]: 'ix-mid-b',
  [posKey(THIRD, 50)]: 'ix-mid-l',
  [posKey(THIRD * 2, 50)]: 'ix-mid-r',
};

const NAMED_SEGMENT_LABELS: Record<string, string> = {
  [posKey(50, 0)]: 'Top edge center',
  [posKey(50, 100)]: 'Bottom edge center',
  [posKey(0, 50)]: 'Left edge center',
  [posKey(100, 50)]: 'Right edge center',
  [posKey(50, THIRD)]: 'Upper center intersection',
  [posKey(50, THIRD * 2)]: 'Lower center intersection',
  [posKey(THIRD, 50)]: 'Left center intersection',
  [posKey(THIRD * 2, 50)]: 'Right center intersection',
};

function latticeCoord(index: number): number {
  return index === 3 ? 100 : index * THIRD;
}

function segmentBand(index: number): string {
  if (index === 0) return 'upper';
  if (index === 1) return 'middle';
  return 'lower';
}

function segmentMidLabelVertical(col: number, seg: number, x: number, y: number): string {
  const key = posKey(x, y);
  if (NAMED_SEGMENT_LABELS[key]) return NAMED_SEGMENT_LABELS[key];

  const band = segmentBand(seg);
  if (col === 0) return `Left edge, ${band} segment`;
  if (col === 3) return `Right edge, ${band} segment`;
  if (col === 1) return `Left grid line, ${band} segment`;
  return `Right grid line, ${band} segment`;
}

function segmentMidLabelHorizontal(row: number, seg: number, x: number, y: number): string {
  const key = posKey(x, y);
  if (NAMED_SEGMENT_LABELS[key]) return NAMED_SEGMENT_LABELS[key];

  const band = seg === 0 ? 'left' : seg === 1 ? 'center' : 'right';
  if (row === 0) return `Top edge, ${band} segment`;
  if (row === 3) return `Bottom edge, ${band} segment`;
  if (row === 1) return `Upper grid line, ${band} segment`;
  return `Lower grid line, ${band} segment`;
}

function buildSpecs(): PlacementSpec[] {
  const intersectionMap = new Map<string, PlacementSpec>();

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const pos = ix(row, col);
      intersectionMap.set(posKey(pos.x, pos.y), {
        id: `ix-${row}-${col}` as Placement,
        kind: 'intersection',
        x: pos.x,
        y: pos.y,
        label: ixLabel(row, col),
        dotSize: 'md',
      });
    }
  }

  const addSegmentMid = (
    x: number,
    y: number,
    fallbackId: Placement,
    label: string,
  ) => {
    const key = posKey(x, y);
    if (intersectionMap.has(key)) return;

    const id = NAMED_SEGMENT_IDS[key] ?? fallbackId;
    const named = Boolean(NAMED_SEGMENT_IDS[key]);
    intersectionMap.set(key, {
      id,
      kind: 'intersection',
      x,
      y,
      label: NAMED_SEGMENT_LABELS[key] ?? label,
      dotSize: named ? 'md' : 'sm',
    });
  };

  for (let col = 0; col < 4; col++) {
    const x = latticeCoord(col);
    for (let seg = 0; seg < 3; seg++) {
      const y = (LATTICE[seg] + LATTICE[seg + 1]) / 2;
      addSegmentMid(
        x,
        y,
        `ix-seg-v${col}-${seg}` as Placement,
        segmentMidLabelVertical(col, seg, x, y),
      );
    }
  }

  for (let row = 0; row < 4; row++) {
    const y = latticeCoord(row);
    for (let seg = 0; seg < 3; seg++) {
      const x = (LATTICE[seg] + LATTICE[seg + 1]) / 2;
      addSegmentMid(
        x,
        y,
        `ix-seg-h${row}-${seg}` as Placement,
        segmentMidLabelHorizontal(row, seg, x, y),
      );
    }
  }

  const specs: PlacementSpec[] = [...intersectionMap.values()];

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const pos = cell(row, col);
      specs.push({
        id: `cell-${row}-${col}` as Placement,
        kind: 'cell',
        x: pos.x,
        y: pos.y,
        label: `${CELL_ROW[row]} ${CELL_COL[col]} cell`,
      });
    }
  }

  return specs;
}

export const PLACEMENT_SPECS = buildSpecs();

export const PLACEMENT_POSITIONS: Record<Placement, { x: number; y: number }> = Object.fromEntries(
  PLACEMENT_SPECS.map((s) => [s.id, { x: s.x, y: s.y }]),
) as Record<Placement, { x: number; y: number }>;

export const PLACEMENT_LABELS: Record<Placement, string> = Object.fromEntries(
  PLACEMENT_SPECS.map((s) => [s.id, s.label]),
) as Record<Placement, string>;

export const GRID_INTERSECTIONS = PLACEMENT_SPECS.filter((s) => s.kind === 'intersection');
export const GRID_CELLS = PLACEMENT_SPECS.filter((s) => s.kind === 'cell');

export const DEFAULT_GRID_PLACEMENT: Placement = 'ix-mid-r';

/** Legacy 9-name placements → extended grid ids. */
const LEGACY_PLACEMENT_MAP: Record<string, Placement> = {
  'top-left': 'ix-1-1',
  'top-center': 'ix-edge-t',
  'top-right': 'ix-1-2',
  'middle-left': 'ix-mid-l',
  center: 'cell-1-1',
  'middle-right': 'ix-mid-r',
  'bottom-left': 'ix-2-1',
  'bottom-center': 'ix-edge-b',
  'bottom-right': 'ix-2-2',
};

export function normalizePlacement(placement: string | undefined): Placement {
  if (!placement) return DEFAULT_GRID_PLACEMENT;
  if (placement in PLACEMENT_POSITIONS) return placement as Placement;
  return LEGACY_PLACEMENT_MAP[placement] ?? DEFAULT_GRID_PLACEMENT;
}

export function getPlacementSpec(placement: Placement): PlacementSpec | undefined {
  return PLACEMENT_SPECS.find((s) => s.id === placement);
}

function cellFramingPrompt(row: number, col: number): string {
  if (row === 1 && col === 1) {
    return 'subject centered in the frame';
  }

  const vertical = ['upper', 'middle', 'lower'][row] ?? 'middle';
  const horizontal = ['left', 'center', 'right'][col] ?? 'center';

  if (col === 1) {
    return `subject in the ${vertical} center of the frame`;
  }
  if (row === 1) {
    return `subject in the ${horizontal} center of the frame`;
  }
  return `subject in the ${vertical} ${horizontal} portion of the frame`;
}

/** Turn UI placement labels into specific cinematic framing instructions. */
function promptFromPlacementLabel(label: string): string {
  const lower = label.toLowerCase();

  if (lower.endsWith(' corner')) {
    return `subject anchored at the ${lower} of the frame`;
  }

  const edgeCenter = lower.match(/^(top|bottom|left|right) edge center$/);
  if (edgeCenter) {
    return `subject centered on the ${edgeCenter[1]} edge of the frame`;
  }

  const edgeThird = lower.match(/^(top|bottom|left|right) edge, (left third|right third|upper third|lower third)$/);
  if (edgeThird) {
    return `subject on the ${edgeThird[1]} edge of the frame, at the ${edgeThird[2]}`;
  }

  const edgeSegment = lower.match(/^(top|bottom|left|right) edge, (upper|middle|lower|left|center|right) segment$/);
  if (edgeSegment) {
    return `subject on the ${edgeSegment[1]} edge of the frame, ${edgeSegment[2]} segment`;
  }

  const gridLineSegment = lower.match(/^(left|right|upper|lower) grid line, (upper|middle|lower|left|center|right) segment$/);
  if (gridLineSegment) {
    const line =
      gridLineSegment[1] === 'left' || gridLineSegment[1] === 'right'
        ? `${gridLineSegment[1]} vertical grid line`
        : `${gridLineSegment[1]} horizontal grid line`;
    return `subject aligned to the ${line}, ${gridLineSegment[2]} segment of the frame`;
  }

  if (lower.endsWith(' intersection')) {
    const point = lower.replace(/ intersection$/, '');
    return `subject at the ${point} grid intersection in the frame`;
  }

  if (lower.endsWith(' cell')) {
    const zone = lower.replace(/ cell$/, '');
    return `subject in the ${zone.toLowerCase()} area of the frame`;
  }

  return `subject positioned at the ${lower}`;
}

function intersectionFramingPrompt(spec: PlacementSpec): string {
  return promptFromPlacementLabel(spec.label);
}

/** Natural cinematic framing language for a specific 3×3 placement target. */
export function placementFramingPrompt(placement: Placement): string {
  const spec = getPlacementSpec(placement);
  if (!spec) return 'balanced subject placement in frame';

  if (spec.kind === 'cell') {
    const match = spec.id.match(/^cell-(\d)-(\d)$/);
    if (match) {
      return cellFramingPrompt(Number(match[1]), Number(match[2]));
    }
  }

  return intersectionFramingPrompt(spec);
}

/** @deprecated Use placementFramingPrompt for generation prompts */
export function placementPrompt(placement: Placement): string {
  return placementFramingPrompt(placement);
}

/** Map a frame-relative pointer position (0–100%) to the nearest placement target. */
export function findNearestPlacement(x: number, y: number): Placement {
  const clampedX = Math.max(0, Math.min(100, x));
  const clampedY = Math.max(0, Math.min(100, y));

  let best: Placement = DEFAULT_GRID_PLACEMENT;
  let bestDist = Infinity;

  for (const spec of PLACEMENT_SPECS) {
    const dx = spec.x - clampedX;
    const dy = spec.y - clampedY;
    const dist = dx * dx + dy * dy;
    if (dist < bestDist) {
      bestDist = dist;
      best = spec.id;
    }
  }

  return best;
}

export function percentFromElementRect(
  rect: DOMRectReadOnly,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  if (rect.width === 0 || rect.height === 0) {
    return { x: 50, y: 50 };
  }
  return {
    x: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
    y: Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)),
  };
}