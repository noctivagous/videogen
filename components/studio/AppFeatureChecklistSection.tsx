'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import { ModelCategoryLinkChip } from '@/components/studio/ModelCategoryLinkChip';
import { ProviderLinkChip } from '@/components/studio/ProviderLinkChip';
import { SummarySection } from '@/components/studio/SummarySection';
import {
  checklistSettingsPath,
  FEATURE_CHECKLIST_ITEMS,
  MODEL_CATEGORY_DEFINITIONS,
} from '@/lib/constants/model-catalog';
import { isBuiltInProviderEnabled } from '@/lib/constants/providers';
import { isCustomProvider, isProviderConnected } from '@/lib/storage/ai-settings';
import { useStudioStore } from '@/store/useStudioStore';

function FeatureChecklistProgressThumbnail({
  title,
  readyCount,
  totalCount,
  ready,
}: {
  title: string;
  readyCount: number;
  totalCount: number;
  ready: boolean;
}) {
  const percent = totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 0;

  return (
    <div className="mt-0.5 w-[3.75rem] flex-shrink-0 flex flex-col gap-1">
      <div
        className="h-[1.125rem] bg-surface-700 overflow-hidden"
        role="progressbar"
        aria-valuenow={readyCount}
        aria-valuemin={0}
        aria-valuemax={totalCount}
        aria-label={`${title} setup progress`}
        title={`${readyCount}/${totalCount} requirements complete`}
      >
        <div
          className={`h-full transition-[width] duration-300 ${
            ready ? 'bg-emerald-400' : 'bg-amber-400'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span
        aria-hidden
        className="w-full h-[3.75rem] rounded-sm border border-dashed border-surface-500 bg-surface-800/70"
        title="Feature thumbnail placeholder"
      />
    </div>
  );
}

export function AppFeatureChecklistSection() {
  const ai = useStudioStore((s) => s.ai);

  const functionalChecklist = useMemo(() => FEATURE_CHECKLIST_ITEMS.map((item) => {
    const categoryChecks = item.categories.map((categoryId) => {
      const slot = ai.modelSlots?.[categoryId];
      const hasSlot = slot != null;
      const hasModel = (slot?.modelId ?? '').trim().length > 0;
      const providerId = slot?.providerId ?? '';
      const providerConnected = providerId.length > 0
        ? isProviderConnected(providerId, isCustomProvider(providerId, ai), ai)
        : false;
      return {
        categoryId,
        label: MODEL_CATEGORY_DEFINITIONS.find((entry) => entry.id === categoryId)?.label ?? categoryId,
        description: MODEL_CATEGORY_DEFINITIONS.find((entry) => entry.id === categoryId)?.description ?? '',
        providerId,
        hasSlot,
        hasModel,
        providerConnected,
        notReadyReasons: [
          ...(hasSlot ? [] : ['slot missing']),
          ...(hasSlot && !hasModel ? ['model missing'] : []),
          ...(hasSlot && !providerConnected ? ['provider not connected'] : []),
        ],
        ready: hasSlot && hasModel && providerConnected,
      };
    });
    const readyCategoryCount = categoryChecks.filter((category) => category.ready).length;
    const notReadyDetails = categoryChecks
      .filter((category) => !category.ready)
      .map((category) => `${category.label}: ${category.notReadyReasons.join(', ')}`);
    const providersOrdered = [...item.providers]
      .sort((a, b) => {
        const aEnabled = isBuiltInProviderEnabled(a.id);
        const bEnabled = isBuiltInProviderEnabled(b.id);
        if (aEnabled !== bEnabled) return aEnabled ? -1 : 1;
        return a.label.localeCompare(b.label);
      })
      .map((provider) => ({
        ...provider,
        enabled: isBuiltInProviderEnabled(provider.id),
        connected: isProviderConnected(provider.id, isCustomProvider(provider.id, ai), ai),
      }));

    return {
      ...item,
      categoryChecks,
      providersOrdered,
      readyCategoryCount,
      totalCategoryCount: categoryChecks.length,
      whyNotReadyMessage: notReadyDetails.length > 0
        ? `Why not ready? ${notReadyDetails.join(' | ')}`
        : 'Ready',
      ready: categoryChecks.every((category) => category.ready),
    };
  }), [ai]);
  const readyChecklistCount = functionalChecklist.filter((item) => item.ready).length;

  return (
    <SummarySection
      title="App feature checklist"
      summary={`${readyChecklistCount}/${functionalChecklist.length} features ready (provider connected + model mapped)`}
    >
      <ul className="space-y-2">
        {functionalChecklist.map((item) => (
          <li
            key={item.id}
            className="rounded-lg border border-surface-700 bg-surface-900/40 px-3 py-2 text-xs text-gray-300"
          >
            <table className="w-full table-fixed border-separate border-spacing-x-2 border-spacing-y-0">
              <tbody>
                <tr>
                  <td className="align-top pr-2 w-[5.25rem]">
                    <div className="flex items-start gap-2">
                      <span title={item.whyNotReadyMessage}>
                        {item.ready ? (
                          <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-400 flex-shrink-0" aria-hidden />
                        ) : (
                          <Circle className="w-3.5 h-3.5 mt-0.5 text-amber-300 flex-shrink-0" aria-hidden />
                        )}
                      </span>
                      <FeatureChecklistProgressThumbnail
                        title={item.title}
                        readyCount={item.readyCategoryCount}
                        totalCount={item.totalCategoryCount}
                        ready={item.ready}
                      />
                    </div>
                  </td>
                  <td className="align-top min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-gray-100 leading-tight">{item.title}</div>
                      {item.ready ? (
                        <span
                          className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md border flex-shrink-0 text-emerald-300 border-emerald-500/40 bg-emerald-500/10"
                        >
                          Ready
                        </span>
                      ) : (
                        <Link
                          href={checklistSettingsPath(item.id)}
                          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md border flex-shrink-0 text-amber-200 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
                          title={`Open setup checklist for ${item.title}`}
                        >
                          <span>Needs setup</span>
                          <ArrowRight className="w-3 h-3" aria-hidden />
                        </Link>
                      )}
                    </div>

                    <table className="workflow-settings-table mt-0.5">
                  <thead>
                    <tr>
                      <th scope="col" className="w-[6.5rem]">Item</th>
                      <th scope="col">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="workflow-settings-table__label !w-[6.5rem] text-[10px] uppercase tracking-wider text-gray-500">
                        Requires{' '}
                        <span className="text-[11px] normal-case tracking-normal font-normal text-gray-400">
                          ({item.readyCategoryCount}/{item.totalCategoryCount})
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap items-center gap-1">
                          {item.categoryChecks.map((category) => (
                            <ModelCategoryLinkChip
                              key={category.categoryId}
                              categoryId={category.categoryId}
                              label={category.label}
                              description={category.description}
                              ready={category.ready}
                            />
                          ))}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="workflow-settings-table__label !w-[6.5rem] text-[10px] uppercase tracking-wider text-gray-500">
                        Providers
                      </td>
                      <td>
                        <div className="flex flex-wrap items-center gap-1">
                          {item.providersOrdered.map((provider) => (
                            <ProviderLinkChip
                              key={provider.id}
                              providerId={provider.id}
                              label={provider.label}
                            />
                          ))}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </li>
        ))}
      </ul>
    </SummarySection>
  );
}
