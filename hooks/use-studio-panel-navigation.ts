'use client';

import { useCallback, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  DEFAULT_STUDIO_PANEL,
  panelFromPathname,
  studioPanelRoute,
  type StudioPanelId,
} from '@/lib/studio/studio-routes';
import { useStudioStore } from '@/store/useStudioStore';

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

    const panel = panelFromPathname(pathname);
    if (panel) {
      setWorkspaceView(panel);
      return;
    }

    if (pathname.startsWith('/studio/')) {
      router.replace(studioPanelRoute(DEFAULT_STUDIO_PANEL));
    }
  }, [pathname, router, setWorkspaceView]);
}

export function useNavigateToStudioPanel() {
  const router = useRouter();
  const setWorkspaceView = useStudioStore((s) => s.setWorkspaceView);

  return useCallback(
    (panel: StudioPanelId) => {
      setWorkspaceView(panel);
      router.push(studioPanelRoute(panel));
    },
    [router, setWorkspaceView],
  );
}
