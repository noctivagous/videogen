import type { ReactNode } from 'react';

export function ShortcutChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center px-1.5 py-px text-[9px] leading-none rounded-full border border-surface-600/50 bg-surface-700/50 text-gray-400 tabular-nums">
      {children}
    </span>
  );
}