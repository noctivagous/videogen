'use client';

import { useMemo, type CSSProperties } from 'react';
import { DEFAULT_FRAME_COMPOSITION } from '@/lib/constants/camera';
import { CAMERA_FIELD_SIZE_SHORT } from '@/lib/constants/camera';
import {
  getBackdropReference,
  getPreviewSubjectUrl,
  usesFieldSizeCutout,
} from '@/lib/constants/stock-demo';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { getBackdropLayerStyle, getSubjectLayerStyle } from '@/lib/studio/subject-framing';
import type { ScenePreviewPayload } from '@/lib/types/studio';

interface ReferencePreviewSceneProps {
  payload: ScenePreviewPayload;
}

export function ReferencePreviewScene({ payload }: ReferencePreviewSceneProps) {
  const frame = payload.shot?.frameComposition ?? DEFAULT_FRAME_COMPOSITION;
  const aspectRatio = payload.project.aspectRatio || '16:9';
  const subjectUrl = getPreviewSubjectUrl(payload.shot, payload.camera);

  const backdropUrl = getBackdropReference(payload.shot);

  const backdropStyle = useMemo<CSSProperties>(
    () => getBackdropLayerStyle(frame.placement, payload.camera.angle),
    [frame.placement, payload.camera.angle],
  );

  const fieldSpecificAsset = usesFieldSizeCutout(payload.shot);

  const subjectStyle = useMemo<CSSProperties>(
    () =>
      getSubjectLayerStyle({
        aspectRatio,
        fieldSize: payload.camera.fieldSize,
        placement: frame.placement,
        headroom: frame.headroom,
        angle: payload.camera.angle,
        guide: frame.guide,
        coverage: payload.camera.coverage,
        fieldSpecificAsset,
      }),
    [
      aspectRatio,
      payload.camera.fieldSize,
      payload.camera.coverage,
      payload.camera.angle,
      frame.placement,
      frame.headroom,
      frame.guide,
      fieldSpecificAsset,
    ],
  );

  const fieldLabel =
    CAMERA_FIELD_SIZE_SHORT[payload.camera.fieldSize] || payload.camera.fieldSize.toUpperCase();

  return (
    <div
      className="reference-preview-scene absolute inset-0 overflow-hidden bg-[#242424]"
      {...uiSectionProps(UI_SECTIONS.studioPreviewVectorScene)}
    >
      {backdropUrl && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={backdropUrl}
          alt=""
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={backdropStyle}
          draggable={false}
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={subjectUrl}
        src={subjectUrl}
        alt="Subject framing preview"
        className="absolute inset-0 pointer-events-none"
        style={subjectStyle}
        draggable={false}
      />
      <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
        <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-surface-900/75 border border-surface-600 text-gray-300">
          {fieldLabel}
        </span>
      </div>
    </div>
  );
}