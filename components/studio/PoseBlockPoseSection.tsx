'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { usePoseBlockPresetBootstrap } from '@/lib/poseblock/usePoseBlockPresetBootstrap';

const POSEBLOCK_TOOLBAR = 'poseblock/PoseAdjustToolbar';

const PoseAdjustToolbar = dynamic(
  () => import(POSEBLOCK_TOOLBAR).then((m) => m.PoseAdjustToolbar),
  { ssr: false },
);

/** Initializes PoseBlock store for embedded pose-editing UI (Phase 4 compositor sync). */
export function PoseBlockPoseSection() {
  const [ready, setReady] = useState(false);

  usePoseBlockPresetBootstrap();

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] uppercase tracking-wide text-gray-400">3D pose adjust</p>
      <p className="text-[10px] text-gray-500 leading-snug">
        Fine-tune pose ops numerically while the canvas gizmo mode is controlled above.
      </p>

      <div className="poseblock-embed rounded-lg border border-surface-700 bg-surface-900/80 p-1">
        {ready ? <PoseAdjustToolbar /> : (
          <p className="px-2 py-3 text-[10px] text-gray-500">Loading pose controls…</p>
        )}
      </div>
    </div>
  );
}
