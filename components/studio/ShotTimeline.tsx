'use client';

import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { getShotThumbnailOverlayLines, getShotThumbnailUrl } from '@/lib/studio/shot-display';
import { getGeneratedVideoCount, getShotActiveVideoUrl } from '@/lib/studio/shot-videos';
import { useStudioStore } from '@/store/useStudioStore';

export function ShotTimeline() {
  const shots = useStudioStore((s) => s.shots);
  const selectShot = useStudioStore((s) => s.selectShot);
  const deleteShot = useStudioStore((s) => s.deleteShot);
  const addShot = useStudioStore((s) => s.addShot);

  return (
    <div {...uiSectionProps(UI_SECTIONS.studioShotTimeline)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
          <label className="text-xs uppercase tracking-wider font-semibold text-gray-300">Shot List</label>
          <span className="text-xs text-gray-500 bg-surface-700 px-2 py-0.5 rounded">
            {shots.length} shot{shots.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          type="button"
          onClick={addShot}
          className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1 transition-colors"
          title="Append a new shot after the current list"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Shot
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {shots.map((shot) => {
          const thumbUrl = getShotThumbnailUrl(shot);
          const [overlayLine1, overlayLine2] = getShotThumbnailOverlayLines(shot);
          const genCount = getGeneratedVideoCount(shot);
          const hasGeneratedVideo = Boolean(getShotActiveVideoUrl(shot));
          return (
            <div
              key={shot.id}
              className="shot-item relative flex-shrink-0 w-40 group cursor-pointer"
              onClick={() => selectShot(shot.id)}
              {...uiSectionProps(UI_SECTIONS.studioShotItem, { suffix: shot.id })}
            >
              <div className={`timeline-thumb relative ${shot.active ? 'active' : ''} aspect-video bg-surface-700 rounded-lg border-2 ${shot.active ? 'border-brand-500' : 'border-surface-600'} overflow-hidden transition-all hover:border-brand-400`}>
                {thumbUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-surface-600 to-surface-700 flex flex-col items-center justify-center">
                    <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[8px] text-gray-500 mt-1">No preview</span>
                  </div>
                )}

                <div
                  className="absolute bottom-1 left-1 right-1 z-10 flex flex-col gap-0.5 pointer-events-none"
                  title="Shot framing, lens, angle & movement"
                >
                  <span className="text-[8px] font-bold tracking-wide text-white/95 bg-black/55 backdrop-blur-sm px-1.5 py-0.5 rounded leading-tight truncate">
                    {overlayLine1}
                  </span>
                  <span className="text-[8px] font-semibold tracking-wide text-white/90 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded leading-tight w-fit max-w-full truncate">
                    {overlayLine2}
                  </span>
                </div>

                {hasGeneratedVideo && (
                  <span className="absolute top-1 right-1 z-10 text-[8px] bg-brand-500/90 text-white px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-0.5">
                    Gen
                    {genCount > 1 && (
                      <span className="text-orange-300">{genCount}</span>
                    )}
                  </span>
                )}

                <div className="shot-overlay absolute inset-0 z-20 bg-black/60 opacity-0 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    className="p-2 bg-surface-800 hover:bg-red-600 rounded-lg transition-all"
                    onClick={(e) => { e.stopPropagation(); deleteShot(shot.id); }}
                    title="Delete shot"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-300">{shot.name}</span>
                <span className="text-xs text-gray-500" title="Timeline segment length">{shot.duration}s</span>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={addShot}
          className="flex-shrink-0 w-40 aspect-video rounded-lg border-2 border-dashed border-surface-600 hover:border-brand-500 bg-surface-800/50 hover:bg-surface-800 flex flex-col items-center justify-center gap-1 transition-all text-gray-500 hover:text-brand-400"
          title="Add a new shot to the timeline"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-[10px] font-semibold uppercase tracking-wider">Add Shot</span>
        </button>
      </div>
    </div>
  );
}