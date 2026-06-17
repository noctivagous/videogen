'use client';

import { useStudioStore } from '@/store/useStudioStore';

export function ShotTimeline() {
  const shots = useStudioStore((s) => s.shots);
  const selectShot = useStudioStore((s) => s.selectShot);
  const deleteShot = useStudioStore((s) => s.deleteShot);
  const addShot = useStudioStore((s) => s.addShot);

  return (
    <div>
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
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Shot
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {shots.map((shot) => (
          <div
            key={shot.id}
            className="shot-item relative flex-shrink-0 w-40 group cursor-pointer"
            onClick={() => selectShot(shot.id)}
          >
            <div className={`timeline-thumb ${shot.active ? 'active' : ''} aspect-video bg-surface-700 rounded-lg border-2 ${shot.active ? 'border-brand-500' : 'border-surface-600'} overflow-hidden transition-all hover:border-brand-400`}>
              <div className="w-full h-full bg-gradient-to-br from-surface-600 to-surface-700 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="shot-overlay absolute inset-0 bg-black/60 opacity-0 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  className="p-2 bg-surface-800 hover:bg-red-600 rounded-lg transition-all"
                  onClick={(e) => { e.stopPropagation(); deleteShot(shot.id); }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-300">{shot.name}</span>
              <span className="text-xs text-gray-500">{shot.duration}s</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}