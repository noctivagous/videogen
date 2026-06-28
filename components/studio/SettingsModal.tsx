'use client';

import { Settings } from 'lucide-react';
import { ManagedModal } from '@/components/ui/ModalManager';
import { SettingsProvidersContent } from '@/components/studio/SettingsProvidersContent';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { useStudioStore } from '@/store/useStudioStore';

export function SettingsModal() {
  const settingsOpen = useStudioStore((s) => s.settingsOpen);
  const closeSettings = useStudioStore((s) => s.closeSettings);
  const showToast = useStudioStore((s) => s.showToast);

  const handleSaveAll = () => {
    closeSettings();
    showToast('All settings saved');
  };

  return (
    <ManagedModal
      open={settingsOpen}
      onClose={closeSettings}
      className="glass pro-panel w-full max-w-6xl max-h-[92vh] rounded-lg border border-surface-700 overflow-hidden flex flex-col modal"
      {...uiSectionProps(UI_SECTIONS.studioSettingsModal)}
    >
      <div className="px-6 py-5 border-b border-surface-700 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" aria-hidden />
          </div>
          <div>
            <div className="font-semibold text-xl">AI Provider Settings</div>
            <div className="text-xs text-gray-400">Manage providers, models & API keys • Stored locally in your browser</div>
          </div>
        </div>
        <button type="button" onClick={closeSettings} className="p-2 hover:bg-surface-700 rounded-xl transition-all">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <SettingsProvidersContent />
      </div>

      <div className="px-6 py-4 border-t border-surface-700 flex justify-end gap-3 flex-shrink-0" {...uiSectionProps(UI_SECTIONS.studioSettingsFooter)}>
        <button type="button" onClick={closeSettings} className="px-6 py-2.5 rounded-lg border border-surface-600 hover:bg-surface-700 text-sm font-medium">Close</button>
        <button type="button" onClick={handleSaveAll} className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 text-sm font-semibold">Save Changes</button>
      </div>
    </ManagedModal>
  );
}
