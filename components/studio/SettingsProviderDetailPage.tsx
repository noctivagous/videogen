'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { LabLinkChip } from '@/components/studio/LabLinkChip';
import { ProviderCard } from '@/components/studio/ProviderCard';
import { ProviderLinkChip } from '@/components/studio/ProviderLinkChip';
import { getLabByDirectProviderId, getLabsForAggregator } from '@/lib/constants/labs';
import { AGGREGATOR_PROVIDERS, getBuiltInProviderById } from '@/lib/constants/providers';
import { getProviderCategoryMatrix } from '@/lib/constants/model-catalog';
import { settingsAiTabRoute } from '@/lib/studio/settings-routes';

export function SettingsProviderDetailPage({ providerId }: { providerId: string }) {
  const provider = getBuiltInProviderById(providerId);
  const [showUnsupported, setShowUnsupported] = useState(false);
  const matrix = useMemo(() => getProviderCategoryMatrix(providerId), [providerId]);
  const visibleRows = useMemo(
    () => {
      if (!showUnsupported) return matrix.filter((row) => row.supported);
      const supportedRows = matrix.filter((row) => row.supported);
      const unsupportedRows = matrix.filter((row) => !row.supported);
      return [...supportedRows, ...unsupportedRows];
    },
    [matrix, showUnsupported],
  );
  const supportedCount = matrix.filter((row) => row.supported).length;
  const firstUnsupportedIndex = showUnsupported ? visibleRows.findIndex((row) => !row.supported) : -1;

  if (!provider) {
    return (
      <div className="glass rounded-xl p-6 border border-surface-700">
        <h2 className="font-semibold text-lg">Provider not found</h2>
        <p className="text-sm text-gray-400 mt-1">No built-in provider matches `{providerId}`.</p>
        <Link href={settingsAiTabRoute('providers')} className="inline-flex mt-3 text-sm text-brand-300 hover:text-brand-200">
          Back to Settings
        </Link>
      </div>
    );
  }

  if (provider.kind === 'direct') {
    const lab = getLabByDirectProviderId(providerId);
    return (
      <div className="glass rounded-xl p-6 border border-surface-700">
        <h2 className="font-semibold text-lg">{provider.name} is a lab direct API</h2>
        <p className="text-sm text-gray-400 mt-1">
          Direct lab APIs are documented on their lab page under <span className="text-gray-300">PROVIDED BY</span>.
        </p>
        {lab ? (
          <div className="mt-3">
            <LabLinkChip lab={lab} title={`View ${lab.name} lab page`} />
          </div>
        ) : null}
        <Link href={settingsAiTabRoute('providers')} className="inline-flex mt-3 ml-4 text-sm text-gray-400 hover:text-gray-200">
          Back to Settings
        </Link>
      </div>
    );
  }

  const relatedProviders = AGGREGATOR_PROVIDERS.filter((entry) => entry.id !== providerId);
  const accessibleLabs = getLabsForAggregator(providerId);

  return (
    <div className="space-y-6">
      <div className="glass rounded-xl p-6 border border-surface-700">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-lg">{provider.name}</h2>
            {provider.tagline ? (
              <p className="text-xs uppercase tracking-wider text-brand-300/90 mt-1">{provider.tagline}</p>
            ) : null}
            <p className="text-sm text-gray-400 mt-2">{provider.desc}</p>
          </div>
          <Link href={settingsAiTabRoute('providers')} className="text-sm text-brand-300 hover:text-brand-200 shrink-0">
            Back to all settings
          </Link>
        </div>
      </div>

      <ProviderCard provider={provider} isCustom={false} />

      {accessibleLabs.length > 0 ? (
        <div className="glass rounded-xl p-6 border border-surface-700">
          <h3 className="text-sm font-semibold text-gray-200">
            Labs accessible through {provider.name} ({accessibleLabs.length})
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {accessibleLabs.map((lab) => (
              <LabLinkChip key={lab.id} lab={lab} />
            ))}
          </div>
        </div>
      ) : null}

      <div className="glass rounded-xl p-6 border border-surface-700">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-200">
              Supported categories + mapped default models ({supportedCount}/{matrix.length})
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Matrix is mapped from category support and current default model slots.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowUnsupported((current) => !current)}
            className="px-3 py-1.5 text-xs rounded-xl border border-surface-600 bg-surface-800 hover:bg-surface-700 text-gray-300"
          >
            {showUnsupported ? 'Hide unsupported' : 'Show all categories'}
          </button>
        </div>
        <div className="mt-4 rounded-lg border border-surface-700 bg-surface-900/40 overflow-hidden">
          <div className="grid grid-cols-[minmax(0,1.1fr)_auto_minmax(0,1fr)] gap-3 px-3 py-2 text-[10px] uppercase tracking-wider text-gray-500 border-b border-surface-700">
            <div>Category</div>
            <div>Status</div>
            <div>Mapped default model</div>
          </div>
          <ul className="divide-y divide-surface-700">
            {visibleRows.map((row) => (
              <li
                key={row.categoryId}
                className={`grid grid-cols-[minmax(0,1.1fr)_auto_minmax(0,1fr)] gap-3 px-3 py-2.5 text-xs ${
                  firstUnsupportedIndex >= 0 && visibleRows[firstUnsupportedIndex]?.categoryId === row.categoryId
                    ? 'border-t border-dashed border-surface-500/80'
                    : ''
                }`}
              >
                <div>
                  <div className="text-gray-100">{row.categoryLabel}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{row.categoryId}</div>
                </div>
                <div>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-[10px] border ${
                      row.supported
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                        : 'border-surface-600 bg-surface-800 text-gray-400'
                    }`}
                  >
                    {row.supported ? 'Supported' : 'Not mapped'}
                  </span>
                </div>
                <div className="text-gray-300 break-all">
                  {row.defaultModelId ?? <span className="text-gray-500">—</span>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="glass rounded-xl p-6 border border-surface-700">
        <h3 className="text-sm font-semibold text-gray-200">Other aggregators</h3>
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {relatedProviders.map((entry) => (
            <ProviderLinkChip key={entry.id} providerId={entry.id} />
          ))}
        </div>
      </div>
    </div>
  );
}