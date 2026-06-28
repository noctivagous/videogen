'use client';

import { SettingsModelCatalogContent } from '@/components/studio/SettingsModelCatalogContent';
import { SettingsProvidersContent } from '@/components/studio/SettingsProvidersContent';
import type { ModelCategoryId } from '@/lib/constants/model-catalog';
import type { SettingsAiTab } from '@/lib/studio/settings-routes';

interface SettingsAiContentProps {
  activeTab: SettingsAiTab;
  categoryDetailId?: ModelCategoryId | null;
}

export function SettingsAiContent({
  activeTab,
  categoryDetailId = null,
}: SettingsAiContentProps) {
  if (activeTab === 'providers') {
    return <SettingsProvidersContent />;
  }

  return <SettingsModelCatalogContent initialCategoryId={categoryDetailId} />;
}