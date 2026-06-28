'use client';

import Link from 'next/link';
import { LabIcon } from '@/components/studio/LabIcon';
import { labSettingsPath } from '@/lib/constants/model-catalog';
import type { LabDefinition } from '@/lib/types/studio';

const CHIP_CLASS =
  'inline-flex items-center gap-1 px-1.5 py-0.5 min-h-[1.875rem] leading-none rounded border border-brand-500/30 bg-brand-500/10 text-brand-200 hover:bg-brand-500/20 transition-colors';

export function LabLinkChip({
  lab,
  title,
}: {
  lab: Pick<LabDefinition, 'id' | 'name' | 'directProviderId' | 'hasDirectApi'>;
  title?: string;
}) {
  return (
    <Link
      href={labSettingsPath(lab.id)}
      title={title ?? lab.name}
      className={CHIP_CLASS}
    >
      <LabIcon lab={lab} size="xs" />
      <span>{lab.name}</span>
      {lab.hasDirectApi ? (
        <span className="text-[9px] uppercase tracking-wider text-brand-300/80">API</span>
      ) : null}
    </Link>
  );
}