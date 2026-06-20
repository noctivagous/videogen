'use client';

interface GenerationProgressOverlayProps {
  title: string;
  message: string;
  detail?: string;
  size?: 'sm' | 'md';
}

export function GenerationProgressOverlay({
  title,
  message,
  detail,
  size = 'md',
}: GenerationProgressOverlayProps) {
  const spinnerClass = size === 'sm' ? 'w-12 h-12 mb-3' : 'w-16 h-16 mb-4';

  return (
    <div className="text-center max-w-md px-6">
      <div
        className={`${spinnerClass} border-4 border-surface-600 border-t-brand-500 rounded-full animate-spin mx-auto`}
      />
      <p className="text-sm text-gray-300 font-medium">{title}</p>
      <p className="text-xs text-brand-200/90 mt-2 font-medium leading-snug">{message}</p>
      {detail ? (
        <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed font-mono">{detail}</p>
      ) : null}
    </div>
  );
}