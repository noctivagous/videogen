'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronLeft, Settings } from 'lucide-react';
import { ChecklistSetupPage } from '@/components/studio/ChecklistSetupPage';
import { SettingsModelCatalogContent } from '@/components/studio/SettingsModelCatalogContent';
import { SettingsProviderDetailPage } from '@/components/studio/SettingsProviderDetailPage';
import { SettingsProvidersContent } from '@/components/studio/SettingsProvidersContent';
import { MODEL_CATEGORY_DEFINITIONS, type ModelCategoryId } from '@/lib/constants/model-catalog';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { useNavigateToStudioPanel } from '@/hooks/use-studio-panel-navigation';
import { useStudioStore } from '@/store/useStudioStore';

type SettingsTab = 'model-categories' | 'providers';

export function SettingsPanel() {
  const pathname = usePathname();
  const navigateToPanel = useNavigateToStudioPanel();
  const showToast = useStudioStore((s) => s.showToast);
  const [activeTab, setActiveTab] = useState<SettingsTab>('model-categories');

  const providerDetailId = useMemo(() => {
    const match = pathname.match(/^\/studio\/settings\/provider\/([^/]+)$/);
    return match ? decodeURIComponent(match[1]) : null;
  }, [pathname]);
  const categoryDetailId = useMemo<ModelCategoryId | null>(() => {
    const match = pathname.match(/^\/studio\/settings\/category\/([^/]+)$/);
    const categoryId = match ? decodeURIComponent(match[1]) : null;
    if (!categoryId) return null;
    return MODEL_CATEGORY_DEFINITIONS.some((category) => category.id === categoryId)
      ? categoryId as ModelCategoryId
      : null;
  }, [pathname]);
  const checklistDetailId = useMemo(() => {
    const match = pathname.match(/^\/studio\/settings\/checklist\/([^/]+)$/);
    return match ? decodeURIComponent(match[1]) : null;
  }, [pathname]);

  useEffect(() => {
    if (categoryDetailId) setActiveTab('model-categories');
  }, [categoryDetailId]);

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
          <h1 className="text-sm font-semibold text-gray-100">AI Settings</h1>
          <p className="text-[10px] text-gray-500">Model categories, provider pages, API keys, and defaults</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6">
        {providerDetailId ? (
          <SettingsProviderDetailPage providerId={providerDetailId} />
        ) : checklistDetailId ? (
          <ChecklistSetupPage checklistId={checklistDetailId} />
        ) : (
          <div className="space-y-5">
            <div className="inline-flex rounded-2xl border border-surface-700 bg-surface-800/60 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('model-categories')}
                className={`px-3 py-1.5 text-xs rounded-xl transition-colors ${
                  activeTab === 'model-categories'
                    ? 'bg-brand-500/20 text-brand-200'
                    : 'text-gray-300 hover:bg-surface-700'
                }`}
              >
                Model categories
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('providers')}
                className={`px-3 py-1.5 text-xs rounded-xl transition-colors ${
                  activeTab === 'providers'
                    ? 'bg-brand-500/20 text-brand-200'
                    : 'text-gray-300 hover:bg-surface-700'
                }`}
              >
                Providers
              </button>
            </div>

            {activeTab === 'model-categories'
              ? <SettingsModelCatalogContent initialCategoryId={categoryDetailId} />
              : <SettingsProvidersContent />}
          </div>
        )}
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
