'use client';

import type { ProviderConnectionTestUi } from '@/hooks/useProviderConnectionTest';

export function ProviderConnectionTestStatus({
  ui,
  message,
  detail,
  compact = false,
}: {
  ui: ProviderConnectionTestUi;
  message: string | null;
  detail: string | null;
  compact?: boolean;
}) {
  if (!message) return null;

  const alertClass =
    ui === 'testing'
      ? 'test-result-alert--testing'
      : ui === 'success'
        ? 'test-result-alert--success'
        : ui === 'error'
          ? 'test-result-alert--error'
          : '';

  return (
    <div className={`test-result-alert ${alertClass} ${compact ? 'text-[10px] py-2 px-2.5' : ''}`}>
      <div className="flex items-start gap-2">
        {ui === 'testing' && (
          <span
            className="inline-block w-3.5 h-3.5 mt-0.5 flex-shrink-0 border-2 border-amber-300 border-t-transparent rounded-full animate-spin"
            aria-hidden
          />
        )}
        {ui === 'success' && (
          <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        )}
        {ui === 'error' && (
          <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        <div className="min-w-0">
          <div className="leading-snug">{message}</div>
          {detail && <div className={`${compact ? 'text-[9px]' : 'text-[10px]'} opacity-80 mt-0.5`}>{detail}</div>}
        </div>
      </div>
    </div>
  );
}
