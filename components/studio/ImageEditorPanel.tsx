'use client';

import { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ImageEditorModeSegment } from '@/components/studio/ImageEditorModeSegment';
import { StudioPanelHeader } from '@/components/studio/StudioPanelHeader';
import { STUDIO_LAUNCHER_ICONS } from '@/components/studio/studio-launcher-icons';
import { getStudioApp } from '@/lib/constants/studio-apps';
import {
  imageEditorModeRoute,
  IMAGE_EDITOR_MODE_DESCRIPTIONS,
  parseImageEditorPathname,
  resolveImageEditorPathRedirect,
  type ImageEditorMode,
} from '@/lib/studio/image-editor-routes';
import { getLauncherShortcutLabelForItem } from '@/lib/studio/studio-launcher-keybindings';
import { useNavigateToStudioPanel } from '@/hooks/use-studio-panel-navigation';

export function ImageEditorPanel() {
  const pathname = usePathname();
  const router = useRouter();
  const app = getStudioApp('image-editor');
  const navigateToPanel = useNavigateToStudioPanel();

  useEffect(() => {
    const redirect = resolveImageEditorPathRedirect(pathname);
    if (redirect) router.replace(redirect);
  }, [pathname, router]);

  const mode = useMemo<ImageEditorMode>(
    () => parseImageEditorPathname(pathname)?.mode ?? 'generate',
    [pathname],
  );

  const handleModeChange = (nextMode: ImageEditorMode) => {
    router.push(imageEditorModeRoute(nextMode));
  };

  return (
    <div className="image-editor-panel flex flex-col h-full min-h-0 bg-surface-900">
      <StudioPanelHeader
        title={app.title}
        description={IMAGE_EDITOR_MODE_DESCRIPTIONS[mode]}
        icon={STUDIO_LAUNCHER_ICONS['image-editor']}
        launcherItemId="image-editor"
        shortcut={getLauncherShortcutLabelForItem('image-editor')}
        onBack={() => navigateToPanel('app-summary')}
        backTitle="Back to Apps"
        titleTrailing={
          <ImageEditorModeSegment value={mode} onChange={handleModeChange} />
        }
      />
      <div className="flex flex-1 min-h-0 flex-col items-center justify-center p-8 text-center">
        <div className="max-w-md space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-surface-800 border border-surface-600 flex items-center justify-center">
            <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
          </div>
          <p className="text-xs uppercase tracking-widest font-semibold text-gray-500">Coming soon</p>
          <p className="text-sm text-gray-500">
            {mode === 'generate' ? 'Generate mode' : 'Edit mode'} — placeholder
          </p>
        </div>
      </div>
    </div>
  );
}