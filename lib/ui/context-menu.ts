export interface ContextMenuItem {
  id: string;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

export interface ContextMenuState {
  x: number;
  y: number;
  items: ContextMenuItem[];
}

let activeMenu: ContextMenuState | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeContextMenu(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getContextMenu(): ContextMenuState | null {
  return activeMenu;
}

export function openContextMenu(menu: ContextMenuState): void {
  activeMenu = menu;
  notify();
}

export function closeContextMenu(): void {
  if (!activeMenu) return;
  activeMenu = null;
  notify();
}