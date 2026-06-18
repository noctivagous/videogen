'use client';

import { useMemo, type CSSProperties } from 'react';
import { DEFAULT_FRAME_COMPOSITION, PLACEMENT_POSITIONS } from '@/lib/constants/camera';
import { getPreviewImageUrl } from '@/lib/constants/stock-demo';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import type { ScenePreviewPayload } from '@/lib/types/studio';

interface ReferencePreviewSceneProps {
  payload: ScenePreviewPayload;
}

function angleStyles(angle: string): CSSProperties {
  switch (angle) {
    case 'low-angle':
    case 'worms-eye':
      return { transform: 'perspective(900px) rotateX(6deg) scale(1.04)', transformOrigin: '50% 100%' };
    case 'high-angle':
    case 'birds-eye':
      return { transform: 'perspective(900px) rotateX(-6deg) scale(0.98)', transformOrigin: '50% 0%' };
    case 'dutch':
      return { transform: 'rotate(-2.5deg) scale(1.03)' };
    default:
      return {};
  }
}

export function ReferencePreviewScene({ payload }: ReferencePreviewSceneProps) {
  const frame = payload.shot?.frameComposition ?? DEFAULT_FRAME_COMPOSITION;
  const placement = PLACEMENT_POSITIONS[frame.placement] ?? PLACEMENT_POSITIONS.center;
  const previewUrl = useMemo(() => getPreviewImageUrl(payload.camera), [payload.camera]);

  const imageStyle = useMemo<CSSProperties>(() => {
    const panX = (placement.x - 50) * 0.35;
    const panY = (placement.y - 50) * 0.25;
    return {
      objectFit: 'cover',
      objectPosition: `${50 + panX}% ${45 + panY}%`,
      ...angleStyles(payload.camera.angle),
    };
  }, [placement.x, placement.y, payload.camera.angle]);

  return (
    <div
      className="reference-preview-scene absolute inset-0 overflow-hidden bg-[#242424]"
      {...uiSectionProps(UI_SECTIONS.studioPreviewVectorScene)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={previewUrl}
        alt="Cinematography reference preview"
        className="absolute inset-0 w-full h-full"
        style={imageStyle}
        draggable={false}
      />
    </div>
  );
}