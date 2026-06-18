'use client';

import { ModalityChips } from '@/components/studio/ModalityChips';
import { isBuiltInProviderEnabled } from '@/lib/constants/providers';
import { hasGenerationAdapter } from '@/lib/studio/generation/capabilities';
import {
  formatRelativeTime,
  getProviderDiscovery,
  getProviderStatus,
  hasApiKey,
  mergeProviderCapabilities,
} from '@/lib/studio/provider-modalities';
import type { BuiltInProvider, CustomProvider } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

interface ProviderCardProps {
  provider: BuiltInProvider | CustomProvider;
  isCustom: boolean;
}

function statusLabel(status: ReturnType<typeof getProviderStatus>, modelCount: number): string {
  if (status === 'verified' && modelCount > 0) return 'Verified';
  if (status === 'verified') return 'Verified';
  if (status === 'configured') return 'Unverified';
  if (status === 'failed') return 'Test failed';
  return 'Not configured';
}

function statusClasses(status: ReturnType<typeof getProviderStatus>): string {
  if (status === 'verified') return 'bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20';
  if (status === 'configured') return 'bg-amber-500/10 text-amber-300 ring-1 ring-inset ring-amber-500/20';
  if (status === 'failed') return 'bg-red-500/10 text-red-300 ring-1 ring-inset ring-red-500/20';
  return 'bg-gray-500/10 text-gray-400';
}

function cardTierClass(status: ReturnType<typeof getProviderStatus>, modelCount: number): string {
  if (status === 'verified' && modelCount > 0) return 'provider-card--active';
  if (status === 'configured' || status === 'failed') return 'provider-card--configured';
  return '';
}

export function ProviderCard({ provider, isCustom }: ProviderCardProps) {
  const ai = useStudioStore((s) => s.ai);
  const openProviderEdit = useStudioStore((s) => s.openProviderEdit);

  const id = provider.id;
  const enabled = !isCustom && isBuiltInProviderEnabled(id);
  const status = getProviderStatus(id, isCustom, ai);
  const configured = hasApiKey(id, isCustom, ai);
  const discovery = getProviderDiscovery(id, isCustom, ai);

  const builtIn = !isCustom ? (provider as BuiltInProvider) : null;
  const custom = isCustom ? (provider as CustomProvider) : null;

  const staticPurposes = builtIn?.purposes ?? [];
  const staticModalities = builtIn?.modalities ?? ['video'];
  const capabilities = mergeProviderCapabilities(staticPurposes, staticModalities, discovery);
  const modelCount = capabilities.models.length;
  const showModalities = modelCount > 0;

  const masked = configured
    ? `••••••${(isCustom ? custom!.apiKey : ai.configured[id]?.apiKey)?.slice(-4)}`
    : '—';

  const verifiedAt = formatRelativeTime(discovery?.lastTested);
  const canGenerate = hasGenerationAdapter(id, isCustom);

  return (
    <div
      className={`provider-card glass rounded-3xl p-5 border flex flex-col ${enabled ? cardTierClass(status, modelCount) : 'provider-card--disabled'} ${
        !enabled
          ? 'border-surface-700'
          : status === 'verified'
            ? 'border-emerald-500/40'
            : status === 'configured' || status === 'failed'
              ? 'border-amber-500/30'
              : 'border-surface-700'
      }`}
      aria-disabled={!enabled}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-surface-700 flex items-center justify-center text-3xl flex-shrink-0 ring-1 ring-inset ring-white/5">
            {isCustom ? '🛠️' : builtIn!.icon}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-[15px] leading-tight">
              {isCustom ? custom!.name : builtIn!.name}
              {isCustom && (
                <span className="text-[9px] px-1.5 py-px rounded bg-surface-600 text-gray-400 font-mono ml-1">CUSTOM</span>
              )}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
              {isCustom
                ? (custom!.baseUrl ? custom!.baseUrl.replace(/^https?:\/\//, '') : 'No endpoint configured')
                : builtIn!.desc.split('•')[0].trim()}
            </div>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium ${
            enabled ? statusClasses(status) : 'bg-gray-500/10 text-gray-500 ring-1 ring-inset ring-gray-500/20'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${
            !enabled
              ? 'bg-gray-500'
              : status === 'verified'
                ? 'bg-emerald-400'
                : status === 'configured'
                  ? 'bg-amber-400'
                  : status === 'failed'
                    ? 'bg-red-400'
                    : 'bg-gray-400'
          }`} />
          {enabled ? statusLabel(status, modelCount) : 'Not yet available'}
        </span>
      </div>

      <div className="text-xs text-gray-400 line-clamp-2 leading-snug min-h-[32px] mb-3">
        {isCustom ? (custom!.desc || custom!.baseUrl || 'Custom video provider') : builtIn!.desc}
      </div>

      <div className="text-[10px] font-medium mb-2 flex flex-wrap gap-2">
        {canGenerate && (
          <span className="text-brand-300/90">Generate ready</span>
        )}
        {modelCount > 0 && (
          <span className="text-emerald-400/90">
            {modelCount} model{modelCount === 1 ? '' : 's'}
            {verifiedAt ? ` · tested ${verifiedAt}` : ''}
          </span>
        )}
      </div>

      <ModalityChips
        purposes={capabilities.purposes}
        modalities={capabilities.modalities}
        showModalities={showModalities}
        compact
      />

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="font-mono text-[10px] text-gray-500 truncate flex-1">{masked}</div>
        <button
          type="button"
          disabled={!enabled}
          onClick={() => enabled && openProviderEdit(id, isCustom)}
          className={`text-xs font-semibold px-4 py-1.5 rounded-2xl transition-all ${
            !enabled
              ? 'bg-surface-700 text-gray-500 cursor-not-allowed'
              : configured
                ? 'bg-surface-600 hover:bg-surface-500'
                : 'bg-brand-500 hover:bg-brand-600 text-white'
          }`}
        >
          {enabled ? (configured ? 'Edit' : 'Configure') : 'Unavailable'}
        </button>
      </div>
    </div>
  );
}