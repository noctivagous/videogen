'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export interface SplitButtonItem {
  id: string;
  label: string;
  description?: string;
  onSelect: () => void;
}

/** 'toggle-menu' opens the dropdown; pass a function for a custom action (e.g. open modal). */
export type SplitButtonSegmentAction = 'toggle-menu' | (() => void);

export interface SplitButtonProps {
  label: string;
  primaryAction: SplitButtonSegmentAction;
  menuAction?: SplitButtonSegmentAction;
  items?: SplitButtonItem[];
  renderMenu?: (closeMenu: () => void) => ReactNode;
  activeItemId?: string;
  compact?: boolean;
  className?: string;
  menuClassName?: string;
  menuUiSection?: Record<string, string>;
  primaryUiSection?: Record<string, string>;
}

function runSegmentAction(
  action: SplitButtonSegmentAction,
  toggleMenu: () => void,
) {
  if (action === 'toggle-menu') toggleMenu();
  else action();
}

function segmentOpensMenu(action: SplitButtonSegmentAction): boolean {
  return action === 'toggle-menu';
}

export function SplitButton({
  label,
  primaryAction,
  menuAction = 'toggle-menu',
  items,
  renderMenu,
  activeItemId,
  compact = false,
  className = '',
  menuClassName = '',
  menuUiSection,
  primaryUiSection,
}: SplitButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const toggleMenu = () => setMenuOpen((open) => !open);
  const closeMenu = () => setMenuOpen(false);

  const primaryOpensMenu = segmentOpensMenu(primaryAction);
  const menuOpensMenu = segmentOpensMenu(menuAction);
  const hasMenu = Boolean(renderMenu || (items && items.length > 0));

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

  const primaryButtonClass = compact
    ? 'px-1.5 py-0.5 text-[10px] font-medium bg-surface-800 hover:bg-surface-700 border border-surface-600 border-r-0 rounded-l-md transition-all text-gray-200 max-w-[7rem] truncate'
    : 'px-3 py-1.5 text-xs font-medium bg-surface-800 hover:bg-surface-700 border border-surface-600 border-r-0 rounded-l-lg transition-all text-gray-200';
  const menuButtonClass = compact
    ? 'px-1 py-0.5 text-[10px] bg-surface-800 hover:bg-surface-700 border border-surface-600 rounded-r-md transition-all text-gray-300'
    : 'px-2 py-1.5 text-xs bg-surface-800 hover:bg-surface-700 border border-surface-600 rounded-r-lg transition-all text-gray-300';

  return (
    <div ref={rootRef} className={`relative inline-flex ${className}`.trim()}>
      <button
        type="button"
        onClick={() => runSegmentAction(primaryAction, toggleMenu)}
        aria-haspopup={primaryOpensMenu && hasMenu ? 'menu' : undefined}
        aria-expanded={primaryOpensMenu && hasMenu ? menuOpen : undefined}
        aria-controls={primaryOpensMenu && hasMenu ? menuId : undefined}
        className={primaryButtonClass}
        {...primaryUiSection}
      >
        {label}
      </button>
      <button
        type="button"
        aria-haspopup={menuOpensMenu && hasMenu ? 'menu' : undefined}
        aria-expanded={menuOpensMenu && hasMenu ? menuOpen : undefined}
        aria-controls={menuOpensMenu && hasMenu ? menuId : undefined}
        onClick={() => runSegmentAction(menuAction, toggleMenu)}
        className={menuButtonClass}
        aria-label={`${label} menu`}
      >
        ▾
      </button>

      {menuOpen && hasMenu && (
        <div
          id={menuId}
          role="menu"
          className={`absolute top-full left-0 mt-1 bg-surface-800 border border-surface-600 rounded-lg shadow-xl z-50 ${
            renderMenu
              ? `w-[32rem] max-w-[90vw] max-h-[70vh] overflow-y-auto p-4 ${menuClassName}`.trim()
              : `min-w-[12rem] py-1 text-sm ${menuClassName}`.trim()
          }`}
          {...menuUiSection}
        >
          {renderMenu
            ? renderMenu(closeMenu)
            : items?.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  className={`w-full text-left px-3 py-2.5 hover:bg-surface-700 transition-colors ${
                    activeItemId === item.id ? 'bg-brand-600/15' : ''
                  }`}
                  onClick={() => {
                    item.onSelect();
                    closeMenu();
                  }}
                >
                  <div className="text-sm font-semibold text-gray-100">{item.label}</div>
                  {item.description ? (
                    <div className="text-xs text-gray-400 mt-1 leading-snug">{item.description}</div>
                  ) : null}
                </button>
              ))}
        </div>
      )}
    </div>
  );
}
