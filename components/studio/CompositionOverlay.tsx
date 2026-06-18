'use client';

import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import {
  getCompositionSvgLines,
  getPlacementMarkerPosition,
  getShotFrameComposition,
  showPlacementGrid,
} from '@/lib/studio/composition';
import { useStudioStore } from '@/store/useStudioStore';

export function CompositionOverlay() {
  const shots = useStudioStore((s) => s.shots);
  const currentShot = useStudioStore((s) => s.currentShot);
  const toggleOverlay = useStudioStore((s) => s.toggleCompositionOverlay);

  const shot = shots.find((s) => s.id === currentShot) || shots[0];
  const frame = getShotFrameComposition(shot);

  if (!frame.showOverlay || frame.guide === 'none') {
    return null;
  }

  const svgContent = getCompositionSvgLines(frame.guide);
  const showMarker = showPlacementGrid(frame.guide);
  const markerPos = showMarker ? getPlacementMarkerPosition(frame.placement) : null;

  return (
    <div
      className="absolute inset-0 pointer-events-none z-10 composition-overlay"
      {...uiSectionProps(UI_SECTIONS.studioPreviewCompositionOverlay)}
    >
      <svg
        className="composition-guide-svg w-full h-full"
        preserveAspectRatio="none"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
      {markerPos && (
        <div
          className="composition-placement-marker"
          style={{ left: `${markerPos.x}%`, top: `${markerPos.y}%` }}
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