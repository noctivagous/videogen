'use client';

import { useEffect, useRef, type ReactNode } from 'react';

interface EntityDropdownProps {
  label: string;
  value: string;
  thumbnailUrl?: string | null;
  placeholder: string;
  open: boolean;
  onToggle: () => void;
  thumbnailAspect?: 'square' | 'landscape';
  emptyIcon?: ReactNode;
  children: ReactNode;
}

export function EntityDropdown({
  label,
  value,
  thumbnailUrl,
  placeholder,
  open,
  onToggle,
  thumbnailAspect = 'landscape',
  emptyIcon,
  children,
}: EntityDropdownProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const thumbClass =
    thumbnailAspect === 'square'
      ? 'w-7 h-7 rounded-md object-cover border border-surface-600 flex-shrink-0'
      : 'w-10 h-6 rounded object-cover border border-surface-600 flex-shrink-0';

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (rootRef.current?.contains(target)) return;
      onToggle();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open, onToggle]);

  return (
    <div className="flex flex-col gap-1">
      <div className="text-[9px] text-gray-600 uppercase tracking-wider">{label}</div>
      <div className="relative" ref={rootRef}>
        <button
          type="button"
          onClick={onToggle}
          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left transition-colors text-[11px]
            ${value
              ? 'border-surface-600 bg-surface-800 hover:bg-surface-700'
              : 'border-dashed border-surface-500 hover:border-brand-500 bg-surface-900 hover:bg-surface-800'
            }`}
        >
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt="" className={thumbClass} />
          ) : (
            <div
              className={`${thumbnailAspect === 'square' ? 'w-7 h-7 rounded-md' : 'w-10 h-6 rounded'} border border-dashed border-surface-500 flex items-center justify-center flex-shrink-0`}
            >
              {emptyIcon ?? (
                <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              )}
            </div>
          )}
          <span className={`truncate flex-1 ${value ? 'text-gray-200' : 'text-gray-500'}`}>
            {value || placeholder}
          </span>
          <span className="text-gray-600 text-[9px] flex-shrink-0">▾</span>
        </button>
        {open && children}
      </div>
    </div>
  );
}

export function EntityDropdownPanel({ children }: { children: ReactNode }) {
  return (
    <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-surface-800 border border-surface-600 rounded-xl shadow-xl overflow-hidden">
      {children}
    </div>
  );
}

function characterSheetLabel(label: string | undefined, index: number): string {
  return label?.trim() || `Character Sheet ${index + 1}`;
}

export { characterSheetLabel };
