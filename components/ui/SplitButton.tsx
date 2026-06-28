'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
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
  primaryClassName?: string;
  primaryStyle?: CSSProperties;
  menuButtonStyle?: CSSProperties;
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
  primaryClassName = '',
  primaryStyle,
  menuButtonStyle,
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
    ? 'pro-btn pro-btn--compact border-r-0 rounded-l-md rounded-r-none max-w-[7rem] truncate normal-case'
    : 'pro-btn border-r-0 rounded-l-md rounded-r-none normal-case';
  const menuButtonClass = compact
    ? 'pro-btn pro-btn--compact pro-btn--tint rounded-l-none rounded-r-md normal-case px-1'
    : 'pro-btn pro-btn--tint rounded-l-none rounded-r-md normal-case px-2';

  return (
    <div ref={rootRef} className={`relative inline-flex ${className}`.trim()}>
      <button
        type="button"
        onClick={() => runSegmentAction(primaryAction, toggleMenu)}
        aria-haspopup={primaryOpensMenu && hasMenu ? 'menu' : undefined}
        aria-expanded={primaryOpensMenu && hasMenu ? menuOpen : undefined}
        aria-controls={primaryOpensMenu && hasMenu ? menuId : undefined}
        className={`${primaryButtonClass} ${primaryClassName}`.trim()}
        style={primaryStyle}
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
        style={menuButtonStyle}
        aria-label={`${label} menu`}
      >
        ▾
      </button>

      {menuOpen && hasMenu && (
        <div
          id={menuId}
          role="menu"
          className={`absolute top-full left-0 mt-1 pro-menu z-50 ${
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
                  className={`pro-menu-item ${
                    activeItemId === item.id ? 'pro-menu-item--active' : ''
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
