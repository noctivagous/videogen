'use client';

import {
  GRID_CELLS,
  GRID_INTERSECTIONS,
  PLACEMENT_POSITIONS,
  normalizePlacement,
} from '@/lib/constants/placement-grid';
import type { Placement } from '@/lib/types/studio';

interface PlacementGridProps {
  value: Placement;
  onChange: (placement: Placement) => void;
}

export function PlacementGrid({ value, onChange }: PlacementGridProps) {
  const placement = normalizePlacement(value);
  const marker = PLACEMENT_POSITIONS[placement];

  return (
    <div className="placement-grid-frame" role="group" aria-label="Composition guide placement overlay">
      <div className="placement-grid-lines" aria-hidden>
        <span className="placement-grid-line placement-grid-line-v" style={{ left: '33.33%' }} />
        <span className="placement-grid-line placement-grid-line-v" style={{ left: '66.66%' }} />
        <span className="placement-grid-line placement-grid-line-h" style={{ top: '33.33%' }} />
        <span className="placement-grid-line placement-grid-line-h" style={{ top: '66.66%' }} />
      </div>

      {GRID_CELLS.map((cell) => {
        const [, row, col] = cell.id.split('-');
        return (
          <button
            key={cell.id}
            type="button"
            className={`placement-grid-cell ${placement === cell.id ? 'active' : ''}`}
            style={{
              left: `${Number(col) * (100 / 3)}%`,
              top: `${Number(row) * (100 / 3)}%`,
            }}
            title={cell.label}
            aria-label={cell.label}
            aria-pressed={placement === cell.id}
            onClick={() => onChange(cell.id)}
          />
        );
      })}

      {GRID_INTERSECTIONS.map((ix) => (
        <button
          key={ix.id}
          type="button"
          className={`placement-grid-ix ${ix.dotSize === 'sm' ? 'placement-grid-ix-sm' : ''}`}
          style={{ left: `${ix.x}%`, top: `${ix.y}%` }}
          title={ix.label}
          aria-label={ix.label}
          aria-pressed={placement === ix.id}
          onClick={() => onChange(ix.id)}
        />
      ))}

      {marker && (
        <div
          className="placement-grid-marker"
          style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
          aria-hidden
        />
      )}
    </div>
  );
}