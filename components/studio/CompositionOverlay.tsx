'use client';

import { useEffect, useRef } from 'react';
import { PLACEMENT_LABELS } from '@/lib/constants/camera';
import { GRID_CELLS, GRID_INTERSECTIONS } from '@/lib/constants/placement-grid';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import {
  getCompositionSvgLines,
  getPlacementMarkerPosition,
  getShotFrameComposition,
  showPlacementGrid,
} from '@/lib/studio/composition';
import { bindPlacementDrag } from '@/lib/studio/placement-pointer';
import { useStudioStore } from '@/store/useStudioStore';

interface CompositionOverlayProps {
  /** Let backdrop framing layer receive pan/zoom; placement marker stays draggable. */
  allowBackdropPan?: boolean;
}

export function CompositionOverlay({ allowBackdropPan = false }: CompositionOverlayProps) {
  const shots = useStudioStore((s) => s.shots);
  const currentShot = useStudioStore((s) => s.currentShot);
  const toggleOverlay = useStudioStore((s) => s.toggleCompositionOverlay);
  const setShotFrameComposition = useStudioStore((s) => s.setShotFrameComposition);

  const overlayRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);

  const shot = shots.find((s) => s.id === currentShot) || shots[0];
  const frame = getShotFrameComposition(shot);

  const placementInteractive = showPlacementGrid(frame.guide);

  useEffect(() => {
    const target =
      allowBackdropPan && markerRef.current ? markerRef.current : overlayRef.current;
    if (!target || !placementInteractive) return;

    return bindPlacementDrag({
      element: target,
      onPlacement: (placement) => setShotFrameComposition({ placement }),
    });
  }, [allowBackdropPan, placementInteractive, setShotFrameComposition]);

  if (!frame.showOverlay || frame.guide === 'none') {
    return null;
  }

  const svgContent = getCompositionSvgLines(frame.guide);
  const markerPos = placementInteractive ? getPlacementMarkerPosition(frame.placement) : null;
  const markerLabel = placementInteractive
    ? PLACEMENT_LABELS[frame.placement] ?? frame.placement
    : '';

  return (
    <div
      ref={overlayRef}
      className={`absolute inset-0 z-10 composition-overlay ${
        placementInteractive
          ? allowBackdropPan
            ? 'composition-overlay-interactive composition-overlay--backdrop-pan'
            : 'composition-overlay-interactive'
          : 'pointer-events-none'
      }`}
      {...uiSectionProps(UI_SECTIONS.studioPreviewCompositionOverlay)}
    >
      <svg
        className="composition-guide-svg w-full h-full pointer-events-none"
        preserveAspectRatio="none"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
      {markerPos && (
        <div
          ref={markerRef}
          className="composition-placement-marker composition-placement-marker-draggable"
          style={{ left: `${markerPos.x}%`, top: `${markerPos.y}%` }}
          title={markerLabel}
          aria-hidden
        />
      )}
      {placementInteractive && allowBackdropPan && (
        <div className="composition-placement-hits" aria-hidden>
          {GRID_CELLS.map((cell) => {
            const [, row, col] = cell.id.split('-');
            return (
              <button
                key={cell.id}
                type="button"
                className="composition-placement-hit composition-placement-hit-cell"
                style={{
                  left: `${Number(col) * (100 / 3)}%`,
                  top: `${Number(row) * (100 / 3)}%`,
                }}
                title={cell.label}
                aria-label={cell.label}
                onClick={() => setShotFrameComposition({ placement: cell.id })}
              />
            );
          })}
          {GRID_INTERSECTIONS.map((ix) => (
            <button
              key={ix.id}
              type="button"
              className={`composition-placement-hit composition-placement-hit-ix ${
                ix.dotSize === 'sm' ? 'composition-placement-hit-ix-sm' : ''
              }`}
              style={{ left: `${ix.x}%`, top: `${ix.y}%` }}
              title={ix.label}
              aria-label={ix.label}
              onClick={() => setShotFrameComposition({ placement: ix.id })}
            />
          ))}
        </div>
      )}
      <button
        type="button"
        className="sr-only"
        onClick={toggleOverlay}
        aria-label="Toggle composition overlay"
      />
    </div>
  );
}