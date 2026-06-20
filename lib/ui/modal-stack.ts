export interface ModalStackEntry {
  id: string;
  onClose: () => void;
}

const stack: ModalStackEntry[] = [];
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeModalStack(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getModalStack(): readonly ModalStackEntry[] {
  return stack;
}

export function getTopModal(): ModalStackEntry | undefined {
  return stack[stack.length - 1];
}

export function pushModal(entry: ModalStackEntry): void {
  const existing = stack.findIndex((item) => item.id === entry.id);
  if (existing >= 0) {
    stack.splice(existing, 1);
  }
  stack.push(entry);
  notify();
}

export function popModal(id: string): void {
  const index = stack.findIndex((item) => item.id === id);
  if (index < 0) return;
  stack.splice(index, 1);
  notify();
}

export function isTopModal(id: string): boolean {
  return stack[stack.length - 1]?.id === id;
}