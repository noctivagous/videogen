'use client';

import { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Settings } from 'lucide-react';
import { ChecklistSetupPage } from '@/components/studio/ChecklistSetupPage';
import { SettingsAiContent } from '@/components/studio/SettingsAiContent';
import { SettingsAppContent } from '@/components/studio/SettingsAppContent';
import { SettingsProjectContent } from '@/components/studio/SettingsProjectContent';
import { SettingsProviderDetailPage } from '@/components/studio/SettingsProviderDetailPage';
import { SettingsScopeSegment } from '@/components/studio/SettingsScopeSegment';
import { StudioPanelHeader } from '@/components/studio/StudioPanelHeader';
import { MODEL_CATEGORY_DEFINITIONS, type ModelCategoryId } from '@/lib/constants/model-catalog';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { getLauncherShortcutLabelForItem } from '@/lib/studio/studio-launcher-keybindings';
import {
  parseSettingsPathname,
  resolveSettingsPathRedirect,
  settingsSectionRoute,
  SETTINGS_SECTION_DESCRIPTIONS,
  type SettingsSection,
} from '@/lib/studio/settings-routes';
import { useNavigateToStudioPanel } from '@/hooks/use-studio-panel-navigation';
import { useStudioStore } from '@/store/useStudioStore';

export function SettingsPanel() {
  const pathname = usePathname();
  const router = useRouter();
  const navigateToPanel = useNavigateToStudioPanel();
  const showToast = useStudioStore((s) => s.showToast);

  useEffect(() => {
    const redirect = resolveSettingsPathRedirect(pathname);
    if (redirect) router.replace(redirect);
  }, [pathname, router]);

  const parsedSettings = useMemo(() => parseSettingsPathname(pathname), [pathname]);
  const settingsSection = parsedSettings?.section ?? 'ai';

  const providerDetailId = parsedSettings?.providerDetailId ?? null;
  const categoryDetailId = useMemo<ModelCategoryId | null>(() => {
    const categoryId = parsedSettings?.categoryDetailId ?? null;
    if (!categoryId) return null;
    return MODEL_CATEGORY_DEFINITIONS.some((category) => category.id === categoryId)
      ? categoryId as ModelCategoryId
      : null;
  }, [parsedSettings?.categoryDetailId]);
  const checklistDetailId = parsedSettings?.checklistDetailId ?? null;

  const handleSectionChange = (section: SettingsSection) => {
    router.push(settingsSectionRoute(section));
  };

  const handleSaveAll = () => {
    showToast('All settings saved');
  };

  const renderContent = () => {
    if (settingsSection === 'ai' && providerDetailId) {
      return <SettingsProviderDetailPage providerId={providerDetailId} />;
    }

    if (settingsSection === 'ai' && checklistDetailId) {
      return <ChecklistSetupPage checklistId={checklistDetailId} />;
    }

    switch (settingsSection) {
      case 'app':
        return <SettingsAppContent />;
      case 'project':
        return <SettingsProjectContent />;
      case 'ai':
      default:
        return <SettingsAiContent categoryDetailId={categoryDetailId} />;
    }
  };

  return (
    <div
      className="h-full flex flex-col bg-surface-900 min-h-0"
      {...uiSectionProps(UI_SECTIONS.studioSettingsPanel)}
    >
      <StudioPanelHeader
        title="Settings"
        description={SETTINGS_SECTION_DESCRIPTIONS[settingsSection]}
        icon={Settings}
        launcherItemId="settings"
        shortcut={getLauncherShortcutLabelForItem('settings')}
        onBack={() => navigateToPanel('app-summary')}
        backTitle="Back to Apps"
        titleTrailing={
          <SettingsScopeSegment
            value={settingsSection}
            onChange={handleSectionChange}
          />
        }
      />

      <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6">
        {renderContent()}
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