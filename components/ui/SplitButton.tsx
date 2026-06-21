'use client';

import { useEffect, useId, useRef, useState } from 'react';

export interface SplitButtonItem {
  id: string;
  label: string;
  onSelect: () => void;
}

export interface SplitButtonProps {
  label: string;
  onPrimaryClick: () => void;
  items: SplitButtonItem[];
  className?: string;
  menuUiSection?: Record<string, string>;
  primaryUiSection?: Record<string, string>;
}

export function SplitButton({
  label,
  onPrimaryClick,
  items,
  className = '',
  menuUiSection,
  primaryUiSection,
}: SplitButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  return (
    <div ref={rootRef} className={`relative inline-flex ${className}`.trim()}>
      <button
        type="button"
        onClick={onPrimaryClick}
        className="px-3 py-1.5 text-xs font-medium bg-surface-800 hover:bg-surface-700 border border-surface-600 border-r-0 rounded-l-lg transition-all text-gray-200"
        {...primaryUiSection}
      >
        {label}
      </button>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-controls={menuId}
        onClick={() => setMenuOpen((open) => !open)}
        className="px-2 py-1.5 text-xs bg-surface-800 hover:bg-surface-700 border border-surface-600 rounded-r-lg transition-all text-gray-300"
        aria-label={`${label} menu`}
      >
        ▾
      </button>

      {menuOpen && (
        <div
          id={menuId}
          role="menu"
          className="absolute top-full left-0 mt-1 min-w-[12rem] bg-surface-800 border border-surface-600 rounded-lg shadow-xl z-50 py-1 text-sm"
          {...menuUiSection}
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className="w-full text-left px-3 py-2 hover:bg-surface-700 text-gray-200"
              onClick={() => {
                item.onSelect();
                setMenuOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
