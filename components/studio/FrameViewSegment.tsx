'use client';

import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';

export type FrameView = 'preview' | 'prompt';

interface FrameViewSegmentProps {
  value: FrameView;
  onChange: (view: FrameView) => void;
}

export function FrameViewSegment({ value, onChange }: FrameViewSegmentProps) {
  return (
    <div
      className="frame-view-segment"
      role="tablist"
      aria-label="Frame view"
      {...uiSectionProps(UI_SECTIONS.studioPreviewFrameViewSegment)}
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === 'preview'}
        className={`frame-view-segment-btn ${value === 'preview' ? 'active' : ''}`}
        onClick={() => onChange('preview')}
      >
        Preview
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'prompt'}
        className={`frame-view-segment-btn ${value === 'prompt' ? 'active' : ''}`}
        onClick={() => onChange('prompt')}
      >
        Prompt
      </button>
    </div>
  );
}