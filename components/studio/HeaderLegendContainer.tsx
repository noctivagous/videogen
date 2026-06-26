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
  const legendClasses =
    'px-1 py-0.5 rounded-sm border border-surface-600 bg-surface-900 text-[9px] tracking-wider text-gray-400 uppercase';

  return (
    <div className={`self-stretch flex items-stretch gap-2 border border-surface-600 rounded-md px-2 py-0.5 ${className}`.trim()}>
      {rotateLegend ? (
        <div className="flex w-5 flex-shrink-0 items-center justify-center self-stretch">
          <span className={`${legendClasses} -rotate-90 whitespace-nowrap`}>{legend}</span>
        </div>
      ) : (
        <span className={`${legendClasses} self-center flex-shrink-0`}>{legend}</span>
      )}
      {children}
    </div>
  );
}
