'use client';

import { useEffect, useRef } from 'react';
import { PLACEMENT_LABELS } from '@/lib/constants/camera';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import {
  getCompositionSvgLines,
  getPlacementMarkerPosition,
  getShotFrameComposition,
  showPlacementGrid,
} from '@/lib/studio/composition';
import { bindPlacementDrag } from '@/lib/studio/placement-pointer';
import { useStudioStore } from '@/store/useStudioStore';

export function CompositionOverlay() {
  const shots = useStudioStore((s) => s.shots);
  const currentShot = useStudioStore((s) => s.currentShot);
  const toggleOverlay = useStudioStore((s) => s.toggleCompositionOverlay);
  const setShotFrameComposition = useStudioStore((s) => s.setShotFrameComposition);

  const overlayRef = useRef<HTMLDivElement>(null);

  const shot = shots.find((s) => s.id === currentShot) || shots[0];
  const frame = getShotFrameComposition(shot);

  const placementInteractive = showPlacementGrid(frame.guide);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay || !placementInteractive) return;

    return bindPlacementDrag({
      element: overlay,
      onPlacement: (placement) => setShotFrameComposition({ placement }),
    });
  }, [placementInteractive, setShotFrameComposition]);

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
        placementInteractive ? 'composition-overlay-interactive' : 'pointer-events-none'
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
          className="composition-placement-marker composition-placement-marker-draggable"
          style={{ left: `${markerPos.x}%`, top: `${markerPos.y}%` }}
          title={markerLabel}
          aria-hidden
        />
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