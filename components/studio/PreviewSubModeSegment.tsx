'use client';

import { SegmentedControl, type SegmentedControlItem } from '@/components/ui/SegmentedControl';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import type { PreviewSubMode } from '@/lib/types/studio';

interface PreviewSubModeSegmentProps {
  value: PreviewSubMode;
  onChange: (mode: PreviewSubMode) => void;
  modelStale?: boolean;
  hasBakedImage?: boolean;
  bakeWorkflow?: boolean;
}

export function PreviewSubModeSegment({
  value,
  onChange,
  modelStale,
  hasBakedImage,
  bakeWorkflow,
}: PreviewSubModeSegmentProps) {
  const bakedImageTitle =
    bakeWorkflow && !hasBakedImage
      ? 'View baked image or load from Assets'
      : hasBakedImage
        ? 'Baked start frame'
        : 'Model preview';

  const items: SegmentedControlItem[] = [
    { id: 'framing', label: 'Blocking' },
    {
      id: 'model',
      label: (
        <>
          Baked Image
          {modelStale && hasBakedImage && (
            <span
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400"
              aria-label="Out of date"
            />
          )}
        </>
      ),
      title: bakedImageTitle,
    },
  ];

  return (
    <SegmentedControl
      className="preview-submode-segment"
      buttonClassName="text-[10px] px-2 py-1 relative"
      value={value}
      onChange={(id) => onChange(id as PreviewSubMode)}
      items={items}
      aria-label="Preview sub-mode"
      {...uiSectionProps(UI_SECTIONS.studioPreviewFrameViewSegment)}
    />
  );
}