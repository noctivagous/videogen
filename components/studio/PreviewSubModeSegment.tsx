'use client';

import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import type { PreviewSubMode } from '@/lib/types/studio';

interface PreviewSubModeSegmentProps {
  value: PreviewSubMode;
  onChange: (mode: PreviewSubMode) => void;
  modelStale?: boolean;
  hasModelPreview?: boolean;
}

export function PreviewSubModeSegment({
  value,
  onChange,
  modelStale,
  hasModelPreview,
}: PreviewSubModeSegmentProps) {
  return (
    <div
      className="preview-submode-segment flex items-center gap-1"
      role="tablist"
      aria-label="Preview sub-mode"
      {...uiSectionProps(UI_SECTIONS.studioPreviewFrameViewSegment)}
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === 'framing'}
        className={`frame-view-segment-btn text-[10px] px-2 py-1 ${value === 'framing' ? 'active' : ''}`}
        onClick={() => onChange('framing')}
      >
        Framing
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'model'}
        className={`frame-view-segment-btn text-[10px] px-2 py-1 relative ${value === 'model' ? 'active' : ''}`}
        onClick={() => onChange('model')}
        disabled={!hasModelPreview}
        title={hasModelPreview ? 'AI model preview' : 'Generate a quick preview first'}
      >
        Model
        {modelStale && hasModelPreview && (
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400" aria-label="Out of date" />
        )}
      </button>
    </div>
  );
}