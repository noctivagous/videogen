'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getBackdropReference } from '@/lib/constants/stock-project';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { getBlockingFigures } from '@/lib/studio/blocking-layout';
import { figureTransform, renderPaperFigure } from '@/lib/studio/vector/figure-paths';
import type { ScenePreviewPayload } from '@/lib/types/studio';

interface VectorBlockingSceneProps {
  payload: ScenePreviewPayload;
}

function angleTransform(angle: string): string {
  switch (angle) {
    case 'low-angle':
    case 'worms-eye':
      return 'scale(1 1.1)';
    case 'high-angle':
    case 'birds-eye':
      return 'scale(1 0.92)';
    case 'dutch':
      return 'rotate(-8 50 50)';
    default:
      return '';
  }
}

export function VectorBlockingScene({ payload }: VectorBlockingSceneProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [animTime, setAnimTime] = useState(0);
  const needsAnim = payload.motion?.subjectAction !== 'still';

  useEffect(() => {
    if (!needsAnim) return;
    let raf = 0;
    const tick = (t: number) => {
      setAnimTime(t / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [needsAnim]);

  const figures = useMemo(
    () => getBlockingFigures(payload, animTime),
    [payload, animTime],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.__sceneDebug = {
      camera: { position: [0, 0, 0], fov: 0, aspect: 16 / 9 },
      framing: { mode: 'vector', angle: payload.camera.angle },
      bounds: null,
      figures,
      mount: { w: 0, h: 0 },
    };
  }, [figures, payload.camera.angle]);

  const sceneTransform = angleTransform(payload.camera.angle);
  const sorted = [...figures].sort((a, b) => a.zIndex - b.zIndex);
  const backdropUrl = getBackdropReference(payload.shot);

  return (
    <svg
      ref={svgRef}
      className="vector-blocking-scene absolute inset-0 w-full h-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      aria-label="Storyboard blocking preview"
      {...uiSectionProps(UI_SECTIONS.studioPreviewVectorScene)}
    >
      {backdropUrl ? (
        <image href={backdropUrl} x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice" />
      ) : (
        <rect x="0" y="0" width="100" height="100" fill="#1c1c21" />
      )}
      <rect x="0" y="88" width="100" height="12" fill="#2a2a32" opacity={backdropUrl ? 0.85 : 1} />
      <g transform={sceneTransform || undefined}>
        {sorted.map((fig) => (
          <g key={fig.id} transform={figureTransform(fig)}>
            <g dangerouslySetInnerHTML={{ __html: renderPaperFigure(fig, animTime) }} />
          </g>
        ))}
      </g>
    </svg>
  );
}