'use client';

import Link from 'next/link';
import { LabIcon } from '@/components/studio/LabIcon';
import { ModelCategoryLinkChip } from '@/components/studio/ModelCategoryLinkChip';
import { getLabCategories } from '@/lib/constants/labs';
import { labSettingsPath } from '@/lib/constants/model-catalog';
import { getBuiltInProviderById, isBuiltInProviderEnabled } from '@/lib/constants/providers';
import type { LabDefinition } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

interface LabCardProps {
  lab: LabDefinition;
}

export function LabCard({ lab }: LabCardProps) {
  const openProviderEdit = useStudioStore((s) => s.openProviderEdit);
  const directProvider = lab.directProviderId ? getBuiltInProviderById(lab.directProviderId) : undefined;
  const directEnabled = lab.directProviderId ? isBuiltInProviderEnabled(lab.directProviderId) : false;
  const categories = getLabCategories(lab);

  return (
    <div className="provider-card glass rounded-3xl p-5 border border-surface-700 flex flex-col">
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <LabIcon lab={lab} size="md" />
          <div className="min-w-0">
            <div className="font-semibold text-[15px] leading-tight">
              <Link href={labSettingsPath(lab.id)} className="hover:text-brand-200 transition-colors">
                {lab.name}
              </Link>
            </div>
            {lab.tagline ? (
              <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{lab.tagline}</div>
            ) : null}
          </div>
        </div>
        <span
          className={`inline-flex shrink-0 items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
            lab.hasDirectApi
              ? 'border-brand-500/40 bg-brand-500/10 text-brand-200'
              : 'border-surface-600 bg-surface-800 text-gray-400'
          }`}
        >
          {lab.hasDirectApi ? 'Direct API' : 'Via aggregators'}
        </span>
      </div>

      <div className="text-xs text-gray-400 line-clamp-2 leading-snug min-h-[32px] mb-3">
        {lab.description}
      </div>

      {categories.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1 mb-4">
          {categories.map((category) => (
            <ModelCategoryLinkChip
              key={category.categoryId}
              categoryId={category.categoryId}
              label={category.label}
              description={category.description}
            />
          ))}
        </div>
      ) : null}

      {lab.hasDirectApi && lab.directProviderId && directEnabled ? (
        <div className="mt-auto flex justify-end">
          <button
            type="button"
            onClick={() => openProviderEdit(lab.directProviderId!, false)}
            className="text-xs font-semibold px-4 py-1.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white transition-all"
          >
            Configure API
          </button>
        </div>
      ) : null}
    </div>
  );
}