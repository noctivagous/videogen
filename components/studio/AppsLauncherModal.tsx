'use client';

import { AppsLauncherMenu } from '@/components/studio/AppsLauncherMenu';
import { ManagedModal } from '@/components/ui/ModalManager';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { useStudioStore } from '@/store/useStudioStore';

export function AppsLauncherModal() {
  const appsLauncherOpen = useStudioStore((s) => s.appsLauncherOpen);
  const closeAppsLauncher = useStudioStore((s) => s.closeAppsLauncher);

  return (
    <ManagedModal
      open={appsLauncherOpen}
      onClose={closeAppsLauncher}
      className="glass w-full max-w-2xl max-h-[85vh] rounded-2xl border border-surface-700 overflow-hidden flex flex-col modal"
      role="dialog"
      aria-modal="true"
      aria-label="App"
      {...uiSectionProps(UI_SECTIONS.studioAppsLauncherModal)}
    >
      <div className="px-5 py-4 border-b border-surface-700 flex items-center justify-between gap-3 flex-shrink-0">
        <div>
          <div className="font-semibold text-lg text-gray-100">App</div>
          <div className="text-xs text-gray-400 mt-0.5">
            Shot design, media library, reference tools, and settings
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
        <AppsLauncherMenu onDismiss={closeAppsLauncher} />
      </div>
    </ManagedModal>
  );
}
