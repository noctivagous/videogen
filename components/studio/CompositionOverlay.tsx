'use client';

import { PLACEMENT_LABELS } from '@/lib/constants/camera';
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

  const shot = shots.find((s) => s.id === currentShot) || shots[0];
  const frame = getShotFrameComposition(shot);

  const placementInteractive = showPlacementGrid(frame.guide);

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
      className="absolute inset-0 z-10 composition-overlay pointer-events-none"
      {...uiSectionProps(UI_SECTIONS.studioPreviewCompositionOverlay)}
    >
      <svg
        className="composition-guide-svg w-full h-full pointer-events-none"
        preserveAspectRatio="none"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
      {markerPos && (
        <div
          className="composition-placement-marker pointer-events-none"
          style={{ left: `${markerPos.x}%`, top: `${markerPos.y}%` }}
          title={markerLabel}
          aria-hidden
        />
      )}
    </div>
  );
}