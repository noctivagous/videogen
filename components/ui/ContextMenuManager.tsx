'use client';

import {
  closeContextMenu,
  getContextMenu,
  subscribeContextMenu,
  type ContextMenuItem,
  type ContextMenuState,
} from '@/lib/ui/context-menu';
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

export {
  closeContextMenu,
  openContextMenu,
  type ContextMenuItem,
  type ContextMenuState,
} from '@/lib/ui/context-menu';

function useContextMenu(): ContextMenuState | null {
  return useSyncExternalStore(subscribeContextMenu, getContextMenu, getContextMenu);
}

interface ContextMenuManagerProps {
  children: React.ReactNode;
}

/** Mount once at the app shell; surfaces open via `openContextMenu`. */
export function ContextMenuManager({ children }: ContextMenuManagerProps) {
  const menu = useContextMenu();

  const dismiss = useCallback(() => {
    closeContextMenu();
  }, []);

  useEffect(() => {
    if (!menu) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        dismiss();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menu, dismiss]);

  return (
    <>
      {children}
      {menu &&
        createPortal(
          <>
            <div
              className="studio-context-menu-scrim fixed inset-0 z-[200]"
              aria-hidden
              onClick={dismiss}
              onContextMenu={(e) => {
                e.preventDefault();
                dismiss();
              }}
            />
            <div
              role="menu"
              className="studio-context-menu pro-menu fixed z-[201] min-w-[9rem] py-1"
              style={{ left: menu.x, top: menu.y }}
            >
              {menu.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  className={`pro-menu-item text-sm ${
                    item.destructive ? 'pro-menu-item--destructive' : ''
                  } disabled:cursor-not-allowed`}
                  onClick={() => {
                    if (item.disabled) return;
                    item.onSelect();
                    dismiss();
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </>,
          document.body,
        )}
    </>
  );
}