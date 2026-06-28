'use client';

import { SegmentedControl, type SegmentedControlItem } from '@/components/ui/SegmentedControl';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';

export type FrameView = 'preview' | 'bake-prompt' | 'prompt' | 'generated';

interface FrameViewSegmentProps {
  value: FrameView;
  onChange: (view: FrameView) => void;
  generatedVideoCount?: number;
  showBakePromptTab?: boolean;
}

export function FrameViewSegment({
  value,
  onChange,
  generatedVideoCount = 0,
  showBakePromptTab = false,
}: FrameViewSegmentProps) {
  const hasGeneratedVideo = generatedVideoCount > 0;

  const items: SegmentedControlItem[] = [{ id: 'preview', label: 'Preview' }];

  if (showBakePromptTab) {
    items.push({ id: 'bake-prompt', label: 'Baked Image Payload' });
  }

  items.push({ id: 'prompt', label: 'Video Payload' });

  if (hasGeneratedVideo) {
    items.push({
      id: 'generated',
      label: (
        <>
          Generated
          <span className="segmented-control-count" aria-label={`${generatedVideoCount} videos`}>
            {generatedVideoCount}
          </span>
        </>
      ),
    });
  }

  return (
    <SegmentedControl
      value={value}
      onChange={(id) => onChange(id as FrameView)}
      items={items}
      aria-label="Frame view"
      {...uiSectionProps(UI_SECTIONS.studioPreviewFrameViewSegment)}
    />
  );
}