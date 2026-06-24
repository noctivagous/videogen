'use client';

import { useCallback, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { resolveGeneratedVideoMediaAssetId } from '@/lib/media/generated-video-media';
import {
  DEFAULT_STUDIO_PANEL,
  parseStudioPathname,
  studioMediaLibraryVideoRoute,
  studioPanelRoute,
  studioShotDesignerGeneratedVideoRoute,
  type StudioPanelId,
  type StudioRouteTarget,
} from '@/lib/studio/studio-routes';
import type { GeneratedVideo } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

function applyStudioRouteTarget(target: StudioRouteTarget) {
  const {
    setWorkspaceView,
    selectMediaLibraryItem,
    selectShot,
    selectGeneratedVideo,
    setFrameView,
    shots,
    currentShot,
  } = useStudioStore.getState();

  setWorkspaceView(target.panel);

  if (target.mediaAssetId) {
    selectMediaLibraryItem(target.mediaAssetId);
    return;
  }

  if (!target.generatedVideoId) return;

  const match =
    shots.find((shot) => shot.id === currentShot && shot.generatedVideos?.some((video) => video.id === target.generatedVideoId))
    ?? shots.find((shot) => shot.generatedVideos?.some((video) => video.id === target.generatedVideoId));

  if (!match) return;

  if (currentShot !== match.id) {
    selectShot(match.id);
  }

  const index = match.generatedVideos?.findIndex((video) => video.id === target.generatedVideoId) ?? -1;
  if (index >= 0) {
    selectGeneratedVideo(index);
    setFrameView('generated');
  }
}

/** Keeps URL pathname and studio panel store in sync. Mount once in StudioShell. */
export function useStudioPanelRouteSync() {
  const pathname = usePathname();
  const router = useRouter();
  const setWorkspaceView = useStudioStore((s) => s.setWorkspaceView);

  useEffect(() => {
    if (pathname === '/studio' || pathname === '/studio/') {
      router.replace(studioPanelRoute(DEFAULT_STUDIO_PANEL));
      return;
    }

    const target = parseStudioPathname(pathname);
    if (target) {
      applyStudioRouteTarget(target);
      return;
    }

    if (pathname.startsWith('/studio/')) {
      router.replace(studioPanelRoute(DEFAULT_STUDIO_PANEL));
    }
  }, [pathname, router, setWorkspaceView]);
}

export function useNavigateToStudioPanel() {
  const router = useRouter();

  return useCallback(
    (panel: StudioPanelId) => {
      applyStudioRouteTarget({ panel });
      router.push(studioPanelRoute(panel));
    },
    [router],
  );
}

export function useOpenGeneratedVideo() {
  const router = useRouter();
  const mediaLibrary = useStudioStore((s) => s.mediaLibrary);
  const currentShot = useStudioStore((s) => s.currentShot);
  const shots = useStudioStore((s) => s.shots);

  return useCallback(
    (video: GeneratedVideo, shotId?: number) => {
      const resolvedShotId = shotId ?? currentShot ?? shots[0]?.id;
      const shot = shots.find((entry) => entry.id === resolvedShotId);
      if (!shot) return;

      const assetId = resolveGeneratedVideoMediaAssetId(mediaLibrary, video, shot.id);
      if (assetId) {
        applyStudioRouteTarget({ panel: 'media-library', mediaAssetId: assetId });
        router.push(studioMediaLibraryVideoRoute(assetId));
        return;
      }

      applyStudioRouteTarget({ panel: 'shot-designer', generatedVideoId: video.id });
      router.push(studioShotDesignerGeneratedVideoRoute(video.id));
    },
    [router, mediaLibrary, currentShot, shots],
  );
}
