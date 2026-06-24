'use client';

import { useMemo, type CSSProperties } from 'react';
import { DEFAULT_FRAME_COMPOSITION } from '@/lib/constants/camera';
import { CAMERA_FIELD_SIZE_SHORT } from '@/lib/constants/camera';
import { getBackdropReference } from '@/lib/constants/stock-demo';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { getFirstSlotReferenceUrl, isCinematographyRefs } from '@/lib/studio/reference-slots';
import { getBackdropLayerStyle } from '@/lib/studio/subject-framing';
import type { ScenePreviewPayload } from '@/lib/types/studio';

interface ReferencePreviewSceneProps {
  payload: ScenePreviewPayload;
  /** Framing mode: environment/backdrop only — subjects are placed via mannequins. */
  backdropOnly?: boolean;
  /** Backdrop rendered by BackdropFramingLayer instead. */
  hideBackdrop?: boolean;
}

export function ReferencePreviewScene({
  payload,
  backdropOnly = false,
  hideBackdrop = false,
}: ReferencePreviewSceneProps) {
  const frame = payload.shot?.frameComposition ?? DEFAULT_FRAME_COMPOSITION;
  const cinematographyRefs = isCinematographyRefs(payload.shot);
  const genericRefUrl = cinematographyRefs ? null : getFirstSlotReferenceUrl(payload.shot);

  const backdropUrl =
    hideBackdrop || !(cinematographyRefs || backdropOnly)
      ? null
      : getBackdropReference(payload.shot);

  const backdropStyle = useMemo<CSSProperties>(
    () => getBackdropLayerStyle(payload.camera.angle),
    [payload.camera.angle],
  );

  const fieldLabel =
    CAMERA_FIELD_SIZE_SHORT[payload.camera.fieldSize] || payload.camera.fieldSize.toUpperCase();

  const fieldBadge = (
    <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
      <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-surface-900/75 border border-surface-600 text-gray-300">
        {fieldLabel}
      </span>
    </div>
  );

  if (backdropOnly) {
    return (
      <div
        className={`reference-preview-scene absolute inset-0 overflow-hidden ${
          hideBackdrop ? 'bg-transparent pointer-events-none' : 'bg-[#242424]'
        }`}
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
        {fieldBadge}
      </div>
    );
  }

  if (genericRefUrl) {
    return (
      <div
        className="reference-preview-scene absolute inset-0 overflow-hidden bg-[#242424]"
        {...uiSectionProps(UI_SECTIONS.studioPreviewVectorScene)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={genericRefUrl}
          alt="Reference preview"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          draggable={false}
        />
        {fieldBadge}
      </div>
    );
  }

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
      {fieldBadge}
    </div>
  );
}