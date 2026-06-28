'use client';

import Link from 'next/link';
import { LabCard } from '@/components/studio/LabCard';
import { LabIcon } from '@/components/studio/LabIcon';
import { LabLinkChip } from '@/components/studio/LabLinkChip';
import { ProviderCard } from '@/components/studio/ProviderCard';
import { ProviderLinkChip } from '@/components/studio/ProviderLinkChip';
import { getLabById, sortLabs } from '@/lib/constants/labs';
import { getBuiltInProviderById } from '@/lib/constants/providers';

import { settingsAiTabRoute } from '@/lib/studio/settings-routes';

export function SettingsLabDetailPage({ labId }: { labId: string }) {
  const lab = getLabById(labId);
  const directProvider = lab?.directProviderId ? getBuiltInProviderById(lab.directProviderId) : undefined;
  const aggregatorProviders = (lab?.aggregatorIds ?? [])
    .map((id) => getBuiltInProviderById(id))
    .filter((provider): provider is NonNullable<typeof provider> => provider != null);
  const relatedLabs = sortLabs().filter((entry) => entry.id !== labId).slice(0, 6);

  if (!lab) {
    return (
      <div className="glass rounded-xl p-6 border border-surface-700">
        <h2 className="font-semibold text-lg">Lab not found</h2>
        <p className="text-sm text-gray-400 mt-1">No lab matches `{labId}`.</p>
        <Link href={settingsAiTabRoute('providers')} className="inline-flex mt-3 text-sm text-brand-300 hover:text-brand-200">
          Back to Settings
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-xl p-6 border border-surface-700">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <LabIcon lab={lab} size="sm" />
            <div className="min-w-0">
            <h2 className="font-semibold text-lg">{lab.name}</h2>
            {lab.tagline ? (
              <p className="text-xs uppercase tracking-wider text-brand-300/90 mt-1">{lab.tagline}</p>
            ) : null}
            <p className="text-sm text-gray-400 mt-2">{lab.description}</p>
            </div>
          </div>
          <Link href={settingsAiTabRoute('providers')} className="text-sm text-brand-300 hover:text-brand-200 shrink-0">
            Back to all settings
          </Link>
        </div>
      </div>

      <LabCard lab={lab} />

      <div className="glass rounded-xl p-6 border border-surface-700">
        <h3 className="text-[10px] uppercase tracking-wider text-gray-500 mb-4">Provided by:</h3>

        {lab.hasDirectApi && directProvider ? (
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-300 mb-3">Direct API</p>
            <ProviderCard provider={directProvider} isCustom={false} />
          </div>
        ) : null}

        {aggregatorProviders.length > 0 ? (
          <div>
            <p className="text-xs font-semibold text-gray-300 mb-3">Aggregators</p>
            <div className="flex flex-wrap items-center gap-1">
              {aggregatorProviders.map((provider) => (
                <ProviderLinkChip key={provider.id} providerId={provider.id} />
              ))}
            </div>
          </div>
        ) : null}

        {!lab.hasDirectApi && aggregatorProviders.length === 0 ? (
          <p className="text-sm text-gray-400">No configured access paths yet for this lab.</p>
        ) : null}
      </div>

      {lab.notableModels && lab.notableModels.length > 0 ? (
        <div className="glass rounded-xl p-6 border border-surface-700">
          <h3 className="text-sm font-semibold text-gray-200 mb-3">Notable models</h3>
          <ul className="space-y-1.5">
            {lab.notableModels.map((modelId) => (
              <li key={modelId} className="text-xs text-gray-300 font-mono break-all">{modelId}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="glass rounded-xl p-6 border border-surface-700">
        <h3 className="text-sm font-semibold text-gray-200">Other labs</h3>
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {relatedLabs.map((entry) => (
            <LabLinkChip key={entry.id} lab={entry} />
          ))}
        </div>
      </div>
    </div>
  );
}