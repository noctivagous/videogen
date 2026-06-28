'use client';

import Link from 'next/link';
import { ModelCategoryThumbnail } from '@/components/studio/ModelCategoryThumbnail';
import {
  categorySettingsPath,
  MODEL_CATEGORY_DEFINITIONS,
  type ModelCategoryId,
} from '@/lib/constants/model-catalog';

export function ModelCategoryLinkChip({
  categoryId,
  label,
  description,
  ready,
}: {
  categoryId: ModelCategoryId;
  label?: string;
  description?: string;
  ready?: boolean;
}) {
  const definition = MODEL_CATEGORY_DEFINITIONS.find((entry) => entry.id === categoryId);
  const displayLabel = label ?? definition?.label ?? categoryId;
  const displayDescription = description ?? definition?.description ?? '';

  return (
    <span className="relative inline-flex group">
      <Link
        href={categorySettingsPath(categoryId)}
        title={displayDescription}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 min-h-[1.875rem] leading-none rounded border ${
          ready === true
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
            : ready === false
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
              : 'border-amber-500/40 bg-amber-500/10 text-amber-200'
        }`}
      >
        <span aria-hidden>{ready === true ? '✓' : '○'}</span>
        <ModelCategoryThumbnail categoryId={categoryId} title={displayLabel} />
        <span>{displayLabel}</span>
      </Link>
      {displayDescription ? (
        <span className="pointer-events-none absolute left-0 -top-1 -translate-y-full hidden group-hover:block group-focus-within:block z-20 w-56 rounded-md border border-surface-600 bg-surface-900/95 px-2 py-1.5 text-[10px] leading-relaxed text-gray-300 shadow-lg">
          {displayDescription}
        </span>
      ) : null}
    </span>
  );
}