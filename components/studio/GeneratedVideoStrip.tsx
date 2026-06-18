'use client';

import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import {
  getActiveGeneratedVideo,
  getActiveVideoIndex,
  getGeneratedVideoCount,
  getShotGeneratedVideos,
} from '@/lib/studio/shot-videos';
import type { Shot } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

interface GeneratedVideoStripProps {
  shot: Shot;
}

export function GeneratedVideoStrip({ shot }: GeneratedVideoStripProps) {
  const selectGeneratedVideo = useStudioStore((s) => s.selectGeneratedVideo);
  const deleteGeneratedVideo = useStudioStore((s) => s.deleteGeneratedVideo);

  const videos = getShotGeneratedVideos(shot);
  const count = getGeneratedVideoCount(shot);
  const activeIndex = getActiveVideoIndex(shot);
  const active = getActiveGeneratedVideo(shot);

  if (!count || !active) return null;

  const canPrev = activeIndex > 0;
  const canNext = activeIndex < count - 1;

  return (
    <div
      className="flex items-center gap-1.5"
      {...uiSectionProps(UI_SECTIONS.studioPreviewVideoVersions)}
    >
      <button
        type="button"
        onClick={() => selectGeneratedVideo(activeIndex - 1)}
        disabled={!canPrev}
        className="p-1.5 rounded-lg hover:bg-surface-700 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 transition-colors"
        title="Previous generation"
        aria-label="Previous generation"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <span className="text-xs font-medium text-gray-300 tabular-nums min-w-[2.5rem] text-center">
        {activeIndex + 1}
        <span className="text-gray-500"> / </span>
        <span className="text-orange-400">{count}</span>
      </span>

      <button
        type="button"
        onClick={() => selectGeneratedVideo(activeIndex + 1)}
        disabled={!canNext}
        className="p-1.5 rounded-lg hover:bg-surface-700 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 transition-colors"
        title="Next generation"
        aria-label="Next generation"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div className="h-5 w-px bg-surface-600" />

      <button
        type="button"
        onClick={() => deleteGeneratedVideo(active.id)}
        className="p-1.5 rounded-lg hover:bg-red-600/80 text-gray-400 hover:text-white transition-colors"
        title="Delete this generation"
        aria-label="Delete this generation"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}