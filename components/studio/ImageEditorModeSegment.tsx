'use client';

import {
  IMAGE_EDITOR_MODE_LABELS,
  IMAGE_EDITOR_MODES,
  type ImageEditorMode,
} from '@/lib/studio/image-editor-routes';

interface ImageEditorModeSegmentProps {
  value: ImageEditorMode;
  onChange: (mode: ImageEditorMode) => void;
}

export function ImageEditorModeSegment({ value, onChange }: ImageEditorModeSegmentProps) {
  return (
    <div
      className="frame-view-segment image-editor-mode-segment flex items-center gap-1 shrink-0"
      role="tablist"
      aria-label="Image editor mode"
    >
      {IMAGE_EDITOR_MODES.map((mode) => (
        <button
          key={mode}
          type="button"
          role="tab"
          aria-selected={value === mode}
          className={`frame-view-segment-btn text-[10px] px-2.5 py-1 ${value === mode ? 'active' : ''}`}
          onClick={() => onChange(mode)}
        >
          {IMAGE_EDITOR_MODE_LABELS[mode]}
        </button>
      ))}
    </div>
  );
}