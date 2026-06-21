'use client';

import { ManagedModal } from '@/components/ui/ModalManager';
import { STUDIO_APPS } from '@/lib/constants/studio-apps';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { launchStudioApp } from '@/lib/studio/launch-studio-app';
import { useStudioStore } from '@/store/useStudioStore';

export function AppsLauncherModal() {
  const appsLauncherOpen = useStudioStore((s) => s.appsLauncherOpen);
  const closeAppsLauncher = useStudioStore((s) => s.closeAppsLauncher);
  const showToast = useStudioStore((s) => s.showToast);

  const handleSelect = (id: (typeof STUDIO_APPS)[number]['id']) => {
    closeAppsLauncher();
    launchStudioApp(id, showToast);
  };

  return (
    <ManagedModal
      open={appsLauncherOpen}
      onClose={closeAppsLauncher}
      className="glass w-full max-w-2xl max-h-[85vh] rounded-2xl border border-surface-700 overflow-hidden flex flex-col modal"
      role="dialog"
      aria-modal="true"
      aria-label="Apps"
      {...uiSectionProps(UI_SECTIONS.studioAppsLauncherModal)}
    >
      <div className="px-5 py-4 border-b border-surface-700 flex items-center justify-between gap-3 flex-shrink-0">
        <div>
          <div className="font-semibold text-lg text-gray-100">Apps</div>
          <div className="text-xs text-gray-400 mt-0.5">
            Standalone tools for references, looks, and image editing
          </div>
        </div>
        <button
          type="button"
          onClick={closeAppsLauncher}
          className="p-2 hover:bg-surface-700 rounded-lg transition-all text-gray-400 hover:text-white shrink-0"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {STUDIO_APPS.map((app) => (
            <button
              key={app.id}
              type="button"
              onClick={() => handleSelect(app.id)}
              className="apps-launcher-card text-left rounded-xl border border-surface-700 bg-surface-800/60 hover:border-brand-500/40 hover:bg-surface-800 p-4 transition-colors"
            >
              <div className="text-sm font-semibold text-gray-100">{app.title}</div>
              <div className="text-xs text-gray-400 mt-1.5 leading-snug">{app.description}</div>
            </button>
          ))}
        </div>
      </div>
    </ManagedModal>
  );
}
