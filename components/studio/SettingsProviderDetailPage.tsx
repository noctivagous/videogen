'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ProviderCard } from '@/components/studio/ProviderCard';
import { BUILT_IN_PROVIDERS } from '@/lib/constants/providers';
import { getProviderCategoryMatrix, providerSettingsPath } from '@/lib/constants/model-catalog';
import { settingsSectionRoute } from '@/lib/studio/settings-routes';

export function SettingsProviderDetailPage({ providerId }: { providerId: string }) {
  const provider = BUILT_IN_PROVIDERS.find((item) => item.id === providerId);
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
      <div className="glass rounded-3xl p-6 border border-surface-700">
        <h2 className="font-semibold text-lg">Provider not found</h2>
        <p className="text-sm text-gray-400 mt-1">No built-in provider matches `{providerId}`.</p>
        <Link href={settingsSectionRoute('ai')} className="inline-flex mt-3 text-sm text-brand-300 hover:text-brand-200">
          Back to Settings
        </Link>
      </div>
    );
  }

  const relatedProviders = ['replicate', 'fal', 'xai'].filter((id) => id !== providerId);

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6 border border-surface-700">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-lg">{provider.name}</h2>
            <p className="text-sm text-gray-400 mt-1">{provider.desc}</p>
          </div>
          <Link href={settingsSectionRoute('ai')} className="text-sm text-brand-300 hover:text-brand-200">
            Back to all settings
          </Link>
        </div>
      </div>

      <ProviderCard provider={provider} isCustom={false} />

      <div className="glass rounded-3xl p-6 border border-surface-700">
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
        <div className="mt-4 rounded-2xl border border-surface-700 bg-surface-900/40 overflow-hidden">
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

      <div className="glass rounded-3xl p-6 border border-surface-700">
        <h3 className="text-sm font-semibold text-gray-200">Other dedicated provider pages</h3>
        <div className="mt-2 flex flex-wrap gap-3 text-sm">
          {relatedProviders.map((id) => (
            <Link key={id} href={providerSettingsPath(id)} className="text-brand-300 hover:text-brand-200">
              {BUILT_IN_PROVIDERS.find((entry) => entry.id === id)?.name ?? id}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
