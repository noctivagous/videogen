'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

/** Non-literal specifiers so VideoGen tsc does not follow into the PoseBlock submodule. */
const POSEBLOCK_PKG = 'poseblock';
const POSEBLOCK_POSES = 'poseblock/poses';
const POSEBLOCK_TOOLBAR = 'poseblock/PoseAdjustToolbar';

const PoseAdjustToolbar = dynamic(
  () => import(POSEBLOCK_TOOLBAR).then((m) => m.PoseAdjustToolbar),
  { ssr: false },
);

/** Initializes PoseBlock store for embedded pose-editing UI (Phase 4 compositor sync). */
export function PoseBlockPoseSection() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([import(POSEBLOCK_POSES), import(POSEBLOCK_PKG)]).then(
      ([{ POSES }, poseblock]) => {
        if (cancelled) return;
        poseblock.useStore.getState().set({
          posePresets: POSES,
        });
        setReady(true);
      },
    );
    return () => {
      cancelled = true;
    };
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
