'use client';

import Link from 'next/link';
import { ProviderIcon } from '@/components/studio/ProviderIcon';
import { providerSettingsPath } from '@/lib/constants/model-catalog';
import { getBuiltInProviderById, isBuiltInProviderEnabled } from '@/lib/constants/providers';
import { isCustomProvider, isProviderConnected } from '@/lib/storage/ai-settings';
import { useStudioStore } from '@/store/useStudioStore';

const CHIP_CLASS =
  'inline-flex items-center gap-1 px-1.5 py-0.5 min-h-[1.875rem] leading-none rounded border border-brand-500/30 bg-brand-500/10 text-brand-200 hover:bg-brand-500/20 transition-colors';

export function ProviderLinkChip({
  providerId,
  label,
  title,
}: {
  providerId: string;
  label?: string;
  title?: string;
}) {
  const ai = useStudioStore((s) => s.ai);
  const providerMeta = getBuiltInProviderById(providerId);
  const enabled = isBuiltInProviderEnabled(providerId);
  const connected = isProviderConnected(providerId, isCustomProvider(providerId, ai), ai);
  const displayLabel = label ?? providerMeta?.name ?? providerId;

  return (
    <Link
      href={providerSettingsPath(providerId)}
      title={title ?? displayLabel}
      className={CHIP_CLASS}
    >
      <span
        aria-hidden
        className={`w-1.5 h-1.5 rounded-full ${
          connected
            ? 'bg-emerald-400'
            : enabled
              ? 'bg-amber-400'
              : 'bg-gray-500'
        }`}
      />
      <ProviderIcon
        providerId={providerId}
        fallbackIcon={providerMeta?.icon ?? displayLabel[0] ?? '•'}
        size="xs"
      />
      <span>{displayLabel}</span>
    </Link>
  );
}