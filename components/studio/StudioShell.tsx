'use client';

import { useEffect } from 'react';
import { CameraPanel } from '@/components/studio/CameraPanel';
import { HeaderBar } from '@/components/studio/HeaderBar';
import { BottomPanelSlot } from '@/components/studio/StudioBottomBar';
import { LeftPanelSlot } from '@/components/studio/LeftPanelSlot';
import { PreviewPanel } from '@/components/studio/PreviewPanel';
import { RightPanelSlot } from '@/components/studio/RightPanelSlot';
import { RightPanelContent } from '@/components/studio/StudioWorkspaceRightPanel';
import { ContextMenuManager } from '@/components/ui/ContextMenuManager';
import { KeybindingsManager } from '@/components/ui/KeybindingsManager';
import { ModalManager } from '@/components/ui/ModalManager';
import { ThemeTransformConnectorProvider } from '@/components/studio/ThemeTransformConnectorProvider';
import { ProviderEditModal } from '@/components/studio/ProviderEditModal';
import { AppsLauncherModal } from '@/components/studio/AppsLauncherModal';
import { EntityImageAssociateModal } from '@/components/studio/EntityImageAssociateModal';
import { ProjectSettingsModal } from '@/components/studio/ProjectSettingsModal';
import { SettingsModal } from '@/components/studio/SettingsModal';
import { WelcomeModal } from '@/components/studio/WelcomeModal';
import { Toast } from '@/components/studio/Toast';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { useStudioPanelRouteSync } from '@/hooks/use-studio-panel-navigation';
import { usesStudioRightSidebar } from '@/lib/studio/right-sidebar-panels';
import { useStudioStore } from '@/store/useStudioStore';

export function StudioShell() {
  const init = useStudioStore((s) => s.init);
  const mobileDrawerOpen = useStudioStore((s) => s.mobileDrawerOpen);
  const setMobileDrawerOpen = useStudioStore((s) => s.setMobileDrawerOpen);
  const workspaceView = useStudioStore((s) => s.workspaceView);

  useStudioPanelRouteSync();

  useEffect(() => {
    init();
  }, [init]);

  return (
    <ModalManager>
    <ContextMenuManager>
    <KeybindingsManager>
    <div className="h-screen flex flex-col overflow-hidden" {...uiSectionProps(UI_SECTIONS.studioRoot)}>
      <HeaderBar />

      <ThemeTransformConnectorProvider>
        <LeftPanelSlot />

        <main
          className="flex-1 flex flex-col bg-surface-900 min-h-0"
          {...uiSectionProps(UI_SECTIONS.studioPreviewMain)}
        >
          <PreviewPanel />
        </main>

        <RightPanelSlot />
      </ThemeTransformConnectorProvider>

      <BottomPanelSlot />

      <div className="lg:hidden fixed bottom-4 right-4 z-50" {...uiSectionProps(UI_SECTIONS.studioMobileFab)}>
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className="pro-btn w-14 h-14 bg-gradient-to-r from-brand-500 to-brand-600 rounded-md shadow-lg shadow-brand-500/40 flex items-center justify-center border-brand-600 normal-case p-0"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </button>
      </div>

      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-40" {...uiSectionProps(UI_SECTIONS.studioMobileDrawer)}>
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
            {...uiSectionProps(UI_SECTIONS.studioMobileDrawerBackdrop)}
          />
          <div className="absolute bottom-0 left-0 right-0 pro-panel bg-surface-800 rounded-t-xl border-t border-surface-700 max-h-[80vh] overflow-y-auto animate-slide-up">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Controls</h3>
                <button type="button" onClick={() => setMobileDrawerOpen(false)} className="pro-btn pro-btn--compact p-2 normal-case">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <CameraPanel />
              {usesStudioRightSidebar(workspaceView) ? (
                <div className="mt-6 border-t border-surface-700 pt-4">
                  <RightPanelContent panel={workspaceView} />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      <Toast />
      <SettingsModal />
      <ProviderEditModal />
      <AppsLauncherModal />
      <EntityImageAssociateModal />
      <ProjectSettingsModal />
      <WelcomeModal />
    </div>
    </KeybindingsManager>
    </ContextMenuManager>
    </ModalManager>
  );
}