'use client';

import { useEffect, useState } from 'react';
import { SettingsModelCatalogContent } from '@/components/studio/SettingsModelCatalogContent';
import { SettingsProvidersContent } from '@/components/studio/SettingsProvidersContent';
import { MODEL_CATEGORY_DEFINITIONS, type ModelCategoryId } from '@/lib/constants/model-catalog';

type SettingsAiTab = 'model-categories' | 'providers';

interface SettingsAiContentProps {
  categoryDetailId?: ModelCategoryId | null;
}

export function SettingsAiContent({ categoryDetailId = null }: SettingsAiContentProps) {
  const [activeTab, setActiveTab] = useState<SettingsAiTab>('model-categories');

  useEffect(() => {
    if (categoryDetailId) setActiveTab('model-categories');
  }, [categoryDetailId]);

  return (
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
  );
}