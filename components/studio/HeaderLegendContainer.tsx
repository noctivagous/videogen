'use client';

import type { ReactNode } from 'react';

export function HeaderLegendContainer({
  legend,
  rotateLegend = true,
  className = '',
  children,
}: {
  legend: string;
  rotateLegend?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`relative self-stretch flex items-stretch gap-2 border border-surface-600 rounded-md pl-5 pr-2 py-0.5 ${className}`.trim()}>
      <span
        className={`absolute top-1/2 -translate-y-1/2 px-1 py-0.5 rounded-sm border border-surface-600 bg-surface-900 text-[9px] tracking-wider text-gray-400 uppercase ${
          rotateLegend
            ? '-left-5 -rotate-90'
            : 'left-2'
        }`}
      >
        {legend}
      </span>
      {children}
    </div>
  );
}
