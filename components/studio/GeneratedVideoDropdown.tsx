'use client';

import { useEffect, useRef, useState } from 'react';
import {
  formatGeneratedVideoLabel,
  GeneratedVideoList,
} from '@/components/studio/GeneratedVideoList';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { getActiveVideoIndex, getShotGeneratedVideos } from '@/lib/studio/shot-videos';
import type { Shot } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

interface GeneratedVideoDropdownProps {
  shot: Shot;
}

export function GeneratedVideoDropdown({ shot }: GeneratedVideoDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectGeneratedVideo = useStudioStore((s) => s.selectGeneratedVideo);
  const videos = getShotGeneratedVideos(shot);
  const activeIndex = getActiveVideoIndex(shot);
  const active = videos[activeIndex];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  if (!active || videos.length === 0) return null;

  return (
    <div
      ref={rootRef}
      className="generated-video-dropdown"
      {...uiSectionProps(UI_SECTIONS.studioPreviewGeneratedVideoDropdown)}
    >
      <div className="frame-view-segment generated-video-dropdown__segment">
        <button
          type="button"
          className={`frame-view-segment-btn generated-video-dropdown__trigger ${open ? 'active' : ''}`}
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-haspopup="listbox"
          title="Select generated video"
        >
          <span className="truncate max-w-[10rem]">
            {formatGeneratedVideoLabel(activeIndex, active.createdAt)}
          </span>
          <svg
            className={`generated-video-dropdown__chevron ${open ? 'generated-video-dropdown__chevron--open' : ''}`}
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden
          >
            <path d="M6 4l4 4-4 4" />
          </svg>
        </button>
      </div>
      {open && (
        <div className="generated-video-dropdown__panel">
          <GeneratedVideoList
            videos={videos}
            activeIndex={activeIndex}
            onVideoClick={(_video, index) => {
              selectGeneratedVideo(index);
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
