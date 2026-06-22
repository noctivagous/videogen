'use client';

import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';

export type FrameView = 'preview' | 'bake-prompt' | 'prompt' | 'generated';

interface FrameViewSegmentProps {
  value: FrameView;
  onChange: (view: FrameView) => void;
  generatedVideoCount?: number;
  showBakePromptTab?: boolean;
}

export function FrameViewSegment({ value, onChange, generatedVideoCount = 0, showBakePromptTab = false }: FrameViewSegmentProps) {
  const hasGeneratedVideo = generatedVideoCount > 0;
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
      {showBakePromptTab && (
        <button
          type="button"
          role="tab"
          aria-selected={value === 'bake-prompt'}
          className={`frame-view-segment-btn ${value === 'bake-prompt' ? 'active' : ''}`}
          onClick={() => onChange('bake-prompt')}
        >
          Baked Image Payload
        </button>
      )}
      <button
        type="button"
        role="tab"
        aria-selected={value === 'prompt'}
        className={`frame-view-segment-btn ${value === 'prompt' ? 'active' : ''}`}
        onClick={() => onChange('prompt')}
      >
        Video Payload
      </button>
      {hasGeneratedVideo && (
        <button
          type="button"
          role="tab"
          aria-selected={value === 'generated'}
          className={`frame-view-segment-btn ${value === 'generated' ? 'active' : ''}`}
          onClick={() => onChange('generated')}
        >
          Generated
          <span className="frame-view-segment-count" aria-label={`${generatedVideoCount} videos`}>
            {generatedVideoCount}
          </span>
        </button>
      )}
    </div>
  );
}