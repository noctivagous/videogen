'use client';

import { useEffect } from 'react';
import {
  fetchPoseBlockPresetEntries,
  posePresetsFromEntries,
} from '@/lib/poseblock/posePresets';

const POSEBLOCK_PKG = 'poseblock';

/** Load PoseBlock bone presets into the shared compositor store. */
export function usePoseBlockPresetBootstrap(): void {
  useEffect(() => {
    let cancelled = false;

    void import(POSEBLOCK_PKG).then((poseblock) => {
      if (cancelled) return;

      void fetchPoseBlockPresetEntries()
        .then((entries) => {
          if (cancelled) return;
          poseblock.useStore.getState().set({
            posePresets: posePresetsFromEntries(entries),
          });
        })
        .catch(() => {
          if (cancelled) return;
          void import('poseblock/poses')
            .then(({ POSES }) => {
              if (cancelled) return;
              poseblock.useStore.getState().set({ posePresets: POSES });
            })
            .catch(() => {
              // Keep built-in fallback presets when external JSON presets fail to load.
            });
        });
    });

    return () => {
      cancelled = true;
    };
  }, []);
}
