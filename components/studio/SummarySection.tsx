'use client';

import { Search } from 'lucide-react';
import type { ReactNode } from 'react';

export function SummarySection({
  title,
  summary,
  searchId,
  searchQuery,
  onSearchQueryChange,
  children,
}: {
  title: string;
  summary: string;
  searchId?: string;
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  children: ReactNode;
}) {
  const showSearch = searchId != null && onSearchQueryChange != null && searchQuery != null;

  return (
    <section className="rounded-xl border border-surface-700 bg-surface-800/40 overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-surface-700/80">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-100">{title}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{summary}</p>
        </div>
        {showSearch ? (
          <div className="relative ml-auto min-w-0 w-[7.5rem] flex-shrink-0 pt-0.5">
            <Search
              className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none"
              aria-hidden
            />
            <input
              type="search"
              id={searchId}
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder="Search…"
              className="w-full rounded-lg bg-surface-900/80 border border-surface-600 pl-7 pr-2.5 py-1 text-[10px] text-gray-200 placeholder:text-gray-500 outline-none focus:ring-1 focus:ring-brand-500/60 focus:border-brand-500/40"
            />
          </div>
        ) : null}
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </section>
  );
}
