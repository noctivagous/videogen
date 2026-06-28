import type { ReactNode } from 'react';

export function ShortcutChip({ children }: { children: ReactNode }) {
  return (
    <span className="pro-value-pill inline-flex items-center px-1.5 py-px text-[9px] leading-none rounded-sm min-w-0 text-gray-400 tabular-nums">
      {children}
    </span>
  );
}