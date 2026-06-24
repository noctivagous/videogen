'use client';

import type { GeneratedVideo } from '@/lib/types/studio';

export function formatGeneratedVideoLabel(index: number, createdAt: number): string {
  return `${index + 1}. ${new Date(createdAt).toLocaleString()}`;
}

interface GeneratedVideoListProps {
  videos: GeneratedVideo[];
  onVideoClick: (video: GeneratedVideo, index: number) => void;
  activeIndex?: number;
  className?: string;
}

export function GeneratedVideoList({
  videos,
  onVideoClick,
  activeIndex,
  className = 'text-[10px] text-gray-500 rounded-lg border border-surface-700 bg-surface-800/60 px-2 py-1.5',
}: GeneratedVideoListProps) {
  if (videos.length === 0) return null;

  return (
    <div className={className}>
      <div className="font-semibold text-gray-400 mb-1">Generated videos</div>
      <ul className="flex flex-col gap-0.5" role="listbox" aria-label="Generated videos">
        {videos.map((video, index) => (
          <li key={video.id} className="truncate">
            <button
              type="button"
              role="option"
              aria-selected={activeIndex === index}
              onClick={() => onVideoClick(video, index)}
              className={`w-full truncate text-left ${
                activeIndex === index
                  ? 'text-brand-300'
                  : 'text-brand-400 hover:text-brand-300 underline-offset-2 hover:underline'
              }`}
            >
              {formatGeneratedVideoLabel(index, video.createdAt)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
