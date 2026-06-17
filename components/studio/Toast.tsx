'use client';

import { useStudioStore } from '@/store/useStudioStore';

export function Toast() {
  const toast = useStudioStore((s) => s.toast);

  if (!toast) return null;

  return (
    <div className="fixed top-20 right-4 bg-surface-700 border border-surface-600 rounded-lg px-4 py-3 shadow-xl z-50 animate-fade-in">
      <div className="flex items-center gap-3">
        <svg
          className={`w-5 h-5 ${toast.type === 'error' ? 'text-red-400' : 'text-green-400'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm font-medium">{toast.message}</span>
      </div>
    </div>
  );
}