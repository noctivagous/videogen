'use client';

import { ChevronLeft, Settings } from 'lucide-react';
import { SettingsProvidersContent } from '@/components/studio/SettingsProvidersContent';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { useNavigateToStudioPanel } from '@/hooks/use-studio-panel-navigation';
import { useStudioStore } from '@/store/useStudioStore';

export function SettingsPanel() {
  const navigateToPanel = useNavigateToStudioPanel();
  const showToast = useStudioStore((s) => s.showToast);

  const handleSaveAll = () => {
    showToast('All settings saved');
  };

  return (
    <div
      className="h-full flex flex-col bg-surface-900 min-h-0"
      {...uiSectionProps(UI_SECTIONS.studioSettingsPanel)}
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-700 flex-shrink-0">
        <button
          type="button"
          onClick={() => navigateToPanel('app-summary')}
          className="p-1.5 rounded-lg hover:bg-surface-700 text-gray-400 hover:text-gray-200 transition-colors"
          title="Back to Apps"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden />
        </button>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0">
          <Settings className="w-4 h-4 text-white" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-gray-100">AI Provider Settings</h1>
          <p className="text-[10px] text-gray-500">Providers, models & API keys — stored locally in your browser</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6">
        <SettingsProvidersContent />
      </div>

      <div className="px-4 md:px-6 py-3 border-t border-surface-700 flex justify-end gap-3 flex-shrink-0" {...uiSectionProps(UI_SECTIONS.studioSettingsFooter)}>
        <button
          type="button"
          onClick={() => navigateToPanel('shot-designer')}
          className="px-5 py-2 rounded-2xl border border-surface-600 hover:bg-surface-700 text-sm font-medium"
        >
          Back to Shot Designer
        </button>
        <button
          type="button"
          onClick={handleSaveAll}
          className="px-5 py-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 text-sm font-semibold"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
