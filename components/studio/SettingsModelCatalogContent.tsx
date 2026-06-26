'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AppFeatureChecklistSection } from '@/components/studio/AppFeatureChecklistSection';
import {
  DEFAULT_MODEL_SLOTS,
  MODEL_CATEGORY_DEFINITIONS,
  PROVIDER_SUPPORTED_CATEGORIES,
  providerSettingsPath,
  type ModelCategoryId,
} from '@/lib/constants/model-catalog';
import { BUILT_IN_PROVIDERS } from '@/lib/constants/providers';
import { useStudioStore } from '@/store/useStudioStore';

function providerName(providerId: string): string {
  return BUILT_IN_PROVIDERS.find((provider) => provider.id === providerId)?.name ?? providerId;
}

export function SettingsModelCatalogContent({
  initialCategoryId,
}: {
  initialCategoryId?: ModelCategoryId | null;
}) {
  const ai = useStudioStore((s) => s.ai);
  const setModelSlotConfig = useStudioStore((s) => s.setModelSlotConfig);
  const [activeCategory, setActiveCategory] = useState<ModelCategoryId>(MODEL_CATEGORY_DEFINITIONS[0].id);
  const [providerFilter, setProviderFilter] = useState<'all' | string>('all');

  const filteredCategories = useMemo(() => {
    if (providerFilter === 'all') return MODEL_CATEGORY_DEFINITIONS;
    const supported = new Set(PROVIDER_SUPPORTED_CATEGORIES[providerFilter] ?? []);
    return MODEL_CATEGORY_DEFINITIONS.filter((category) => supported.has(category.id));
  }, [providerFilter]);

  useEffect(() => {
    if (filteredCategories.length === 0) return;
    if (!filteredCategories.some((category) => category.id === activeCategory)) {
      setActiveCategory(filteredCategories[0].id);
    }
  }, [filteredCategories, activeCategory]);

  useEffect(() => {
    if (!initialCategoryId) return;
    if (MODEL_CATEGORY_DEFINITIONS.some((category) => category.id === initialCategoryId)) {
      setActiveCategory(initialCategoryId);
    }
  }, [initialCategoryId]);

  const activeDefinition = useMemo(
    () => MODEL_CATEGORY_DEFINITIONS.find((item) => item.id === activeCategory) ?? MODEL_CATEGORY_DEFINITIONS[0],
    [activeCategory],
  );
  const slot = ai.modelSlots?.[activeCategory] ?? DEFAULT_MODEL_SLOTS[activeCategory];
  const isScopedToProvider = providerFilter !== 'all';
  const scopedProviderName = isScopedToProvider ? providerName(providerFilter) : null;
  const slotMatchesScope = !isScopedToProvider || slot.providerId === providerFilter;
  const visibleCountLabel = `${filteredCategories.length} categories visible`;

  return (
    <div className="space-y-8">
      <AppFeatureChecklistSection />

      <div className="glass rounded-3xl p-6 border border-surface-700">
        <div className="mb-4">
          <h2 className="font-semibold text-lg">Model categories</h2>
          <p className="text-sm text-gray-400">Each category is part of app data and can be tuned per provider/model.</p>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <label className="text-[10px] uppercase tracking-wider text-gray-500 block">
              Scope categories by provider
            </label>
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-surface-600 bg-surface-800 text-gray-400">
              {visibleCountLabel}
            </span>
          </div>
          <select
            value={providerFilter}
            onChange={(event) => setProviderFilter(event.target.value)}
            className="w-full max-w-sm bg-surface-700 hover:bg-surface-600 border border-surface-600 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 transition-all select-arrow appearance-none"
          >
            <option value="all">All providers</option>
            {BUILT_IN_PROVIDERS.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-gray-500 mt-1">
            {isScopedToProvider
              ? `Showing categories supported by ${scopedProviderName}.`
              : 'Showing all categories across providers.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {filteredCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category.id)}
              className={`px-3 py-1.5 rounded-xl text-xs border transition-colors ${
                activeCategory === category.id
                  ? 'bg-brand-500/20 border-brand-500/50 text-brand-200'
                  : 'bg-surface-800 border-surface-600 text-gray-300 hover:bg-surface-700'
              }`}
            >
              {category.id}
            </button>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-surface-700 bg-surface-900/40 p-4 space-y-4">
          <div>
            <div className="text-sm font-medium text-gray-100">{activeDefinition.label}</div>
            <p className="text-xs text-gray-400 mt-1">{activeDefinition.description}</p>
            <div className="text-[11px] text-gray-500 mt-2">Source: `{activeDefinition.sourceDoc}`</div>
          </div>

          {isScopedToProvider && !slotMatchesScope ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              Current slot uses `{providerName(slot.providerId)}`. Switch this category to `{scopedProviderName}` to edit it in this scope.
              <button
                type="button"
                onClick={() => setModelSlotConfig(activeCategory, { providerId: providerFilter })}
                className="ml-2 underline decoration-dotted underline-offset-2 hover:text-amber-100"
              >
                Switch provider
              </button>
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1.5">Provider</label>
              <select
                value={slot.providerId}
                onChange={(event) => {
                  setModelSlotConfig(activeCategory, { providerId: event.target.value });
                }}
                disabled={isScopedToProvider}
                className="w-full bg-surface-700 hover:bg-surface-600 border border-surface-600 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500 transition-all select-arrow appearance-none"
              >
                {BUILT_IN_PROVIDERS.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
              <div className="text-[11px] text-gray-500 mt-1">
                Provider page:{' '}
                <Link
                  href={providerSettingsPath(slot.providerId)}
                  className="text-brand-300 hover:text-brand-200 underline decoration-dotted underline-offset-2"
                >
                  {providerName(slot.providerId)}
                </Link>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1.5">Model ID</label>
              <input
                type="text"
                value={slot.modelId}
                onChange={(event) => {
                  setModelSlotConfig(activeCategory, { modelId: event.target.value });
                }}
                className="w-full bg-surface-700 hover:bg-surface-600 border border-surface-600 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500 transition-all"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
