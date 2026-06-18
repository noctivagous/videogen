import type { Placement } from '@/lib/types/studio';

const THIRD = 100 / 3;

export type PlacementKind = 'intersection' | 'cell';

export interface PlacementSpec {
  id: Placement;
  kind: PlacementKind;
  x: number;
  y: number;
  label: string;
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

function buildSpecs(): PlacementSpec[] {
  const specs: PlacementSpec[] = [];

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const pos = ix(row, col);
      specs.push({
        id: `ix-${row}-${col}` as Placement,
        kind: 'intersection',
        x: pos.x,
        y: pos.y,
        label: ixLabel(row, col),
      });
    }
  }

  const mids: Array<{ id: Placement; x: number; y: number; label: string }> = [
    { id: 'ix-edge-t', x: 50, y: 0, label: 'Top edge center' },
    { id: 'ix-edge-b', x: 50, y: 100, label: 'Bottom edge center' },
    { id: 'ix-edge-l', x: 0, y: 50, label: 'Left edge center' },
    { id: 'ix-edge-r', x: 100, y: 50, label: 'Right edge center' },
    { id: 'ix-mid-t', x: 50, y: THIRD, label: 'Upper center intersection' },
    { id: 'ix-mid-b', x: 50, y: THIRD * 2, label: 'Lower center intersection' },
    { id: 'ix-mid-l', x: THIRD, y: 50, label: 'Left center intersection' },
    { id: 'ix-mid-r', x: THIRD * 2, y: 50, label: 'Right center intersection' },
  ];
  for (const m of mids) {
    specs.push({ id: m.id, kind: 'intersection', x: m.x, y: m.y, label: m.label });
  }

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

export function placementPrompt(placement: Placement): string {
  const spec = getPlacementSpec(placement);
  if (!spec) return 'subject positioned in frame';
  if (spec.kind === 'cell') {
    return `subject centered in the ${spec.label.replace(' cell', '')} grid cell`;
  }
  return `subject at ${spec.label.toLowerCase()}`;
}