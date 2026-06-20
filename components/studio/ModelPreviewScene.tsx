'use client';

import { CAMERA_FIELD_SIZE_SHORT } from '@/lib/constants/camera';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import type { ScenePreviewPayload } from '@/lib/types/studio';

interface ModelPreviewSceneProps {
  payload: ScenePreviewPayload;
  imageUrl: string;
  stale?: boolean;
}

export function ModelPreviewScene({ payload, imageUrl, stale }: ModelPreviewSceneProps) {
  const fieldLabel =
    CAMERA_FIELD_SIZE_SHORT[payload.camera.fieldSize] || payload.camera.fieldSize.toUpperCase();

  return (
    <div
      className="model-preview-scene absolute inset-0 z-[2] overflow-hidden bg-[#242424]"
      {...uiSectionProps(UI_SECTIONS.studioPreviewVectorScene)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt="AI model preview frame"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1 pointer-events-none">
        <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-surface-900/75 border border-surface-600 text-gray-300">
          {fieldLabel}
        </span>
        {stale && (
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-200">
            Out of date — regenerate
          </span>
        )}
      </div>
    </div>
  );
}