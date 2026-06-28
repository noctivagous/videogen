'use client';

import Link from 'next/link';
import { CheckCircle2, Circle } from 'lucide-react';
import {
  categorySettingsPath,
  FEATURE_CHECKLIST_ITEMS,
  MODEL_CATEGORY_DEFINITIONS,
  providerSettingsPath,
} from '@/lib/constants/model-catalog';
import { BUILT_IN_PROVIDERS } from '@/lib/constants/providers';
import { isCustomProvider, isProviderConnected } from '@/lib/storage/ai-settings';
import { settingsSectionRoute } from '@/lib/studio/settings-routes';
import { useStudioStore } from '@/store/useStudioStore';

export function ChecklistSetupPage({ checklistId }: { checklistId: string }) {
  const ai = useStudioStore((s) => s.ai);
  const item = FEATURE_CHECKLIST_ITEMS.find((entry) => entry.id === checklistId);

  if (!item) {
    return (
      <div className="glass rounded-3xl p-6 border border-surface-700">
        <h2 className="font-semibold text-lg">Checklist not found</h2>
        <p className="text-sm text-gray-400 mt-1">No checklist item matches `{checklistId}`.</p>
        <Link href={settingsSectionRoute('ai')} className="inline-flex mt-3 text-sm text-brand-300 hover:text-brand-200">
          Back to Settings
        </Link>
      </div>
    );
  }

  const categoryChecks = item.categories.map((categoryId) => {
    const slot = ai.modelSlots?.[categoryId];
    const hasSlot = slot != null;
    const hasModel = (slot?.modelId ?? '').trim().length > 0;
    const providerId = slot?.providerId ?? '';
    const providerConnected = providerId
      ? isProviderConnected(providerId, isCustomProvider(providerId, ai), ai)
      : false;
    return {
      categoryId,
      label: MODEL_CATEGORY_DEFINITIONS.find((entry) => entry.id === categoryId)?.label ?? categoryId,
      hasSlot,
      hasModel,
      providerId,
      providerConnected,
      ready: hasSlot && hasModel && providerConnected,
    };
  });

  const providerChecks = item.providers.map((provider) => ({
    ...provider,
    connected: isProviderConnected(provider.id, isCustomProvider(provider.id, ai), ai),
  }));

  const completedCount = categoryChecks.filter((category) => category.ready).length;

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6 border border-surface-700">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-lg">{item.title}</h2>
            <p className="text-sm text-gray-400 mt-1">
              Complete each required category to mark this checklist as ready.
            </p>
          </div>
          <Link href={settingsSectionRoute('ai')} className="text-sm text-brand-300 hover:text-brand-200">
            Back to settings
          </Link>
        </div>
        <div className="mt-3 inline-flex px-2 py-1 rounded-md border border-surface-600 bg-surface-800 text-xs text-gray-300">
          Progress: {completedCount}/{categoryChecks.length}
        </div>
      </div>

      <div className="glass rounded-3xl p-6 border border-surface-700">
        <h3 className="text-sm font-semibold text-gray-200">Required categories</h3>
        <ul className="mt-3 space-y-2">
          {categoryChecks.map((category) => (
            <li key={category.categoryId} className="rounded-lg border border-surface-700 bg-surface-900/40 px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {category.ready ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" aria-hidden />
                  ) : (
                    <Circle className="w-4 h-4 text-amber-300 flex-shrink-0" aria-hidden />
                  )}
                  <span className="text-sm text-gray-200 truncate">{category.label}</span>
                </div>
                <Link
                  href={categorySettingsPath(category.categoryId)}
                  className="text-xs text-brand-300 hover:text-brand-200 flex-shrink-0"
                >
                  Open category
                </Link>
              </div>
              {!category.ready ? (
                <div className="text-[11px] text-gray-500 mt-1">
                  Missing:
                  {!category.hasSlot ? ' slot' : ''}
                  {category.hasSlot && !category.hasModel ? ' model' : ''}
                  {category.hasSlot && !category.providerConnected ? ' provider connection' : ''}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      <div className="glass rounded-3xl p-6 border border-surface-700">
        <h3 className="text-sm font-semibold text-gray-200">Suggested providers</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {providerChecks.map((provider) => {
            const providerMeta = BUILT_IN_PROVIDERS.find((entry) => entry.id === provider.id);
            return (
              <Link
                key={provider.id}
                href={providerSettingsPath(provider.id)}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs ${
                  provider.connected
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                }`}
              >
                <span>{providerMeta?.icon ?? '•'}</span>
                <span>{provider.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
