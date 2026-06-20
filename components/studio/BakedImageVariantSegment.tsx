'use client';

import type { BakedImageVariant } from '@/lib/types/studio';

interface BakedImageVariantSegmentProps {
  value: BakedImageVariant;
  onChange: (variant: BakedImageVariant) => void;
}

export function BakedImageVariantSegment({ value, onChange }: BakedImageVariantSegmentProps) {
  return (
    <div
      className="frame-view-segment preview-submode-segment flex items-center gap-1"
      role="tablist"
      aria-label="Baked image variant"
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === 'intermediate'}
        className={`frame-view-segment-btn text-[10px] px-2 py-1 ${value === 'intermediate' ? 'active' : ''}`}
        onClick={() => onChange('intermediate')}
      >
        Intermediate
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'final'}
        className={`frame-view-segment-btn text-[10px] px-2 py-1 ${value === 'final' ? 'active' : ''}`}
        onClick={() => onChange('final')}
      >
        Final
      </button>
    </div>
  );
}