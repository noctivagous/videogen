import { getContextMenu } from '@/lib/ui/context-menu';
import { getTopModal } from '@/lib/ui/modal-stack';

export interface Keybinding {
  id: string;
  match: (event: KeyboardEvent) => boolean;
  handler: (event: KeyboardEvent) => void;
  when?: () => boolean;
}

const bindings: Keybinding[] = [];
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeKeybindings(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getKeybindings(): readonly Keybinding[] {
  return bindings;
}

export function registerKeybinding(binding: Keybinding): void {
  const existing = bindings.findIndex((entry) => entry.id === binding.id);
  if (existing >= 0) {
    bindings.splice(existing, 1);
  }
  bindings.push(binding);
  notify();
}

export function unregisterKeybinding(id: string): void {
  const index = bindings.findIndex((entry) => entry.id === id);
  if (index < 0) return;
  bindings.splice(index, 1);
  notify();
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

export function shouldIgnoreGlobalShortcut(): boolean {
  if (getTopModal()) return true;
  if (getContextMenu()) return true;
  if (isEditableTarget(document.activeElement)) return true;
  return false;
}

export function matchAltShortcutKeydown(event: KeyboardEvent): string | null {
  if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return null;

  const key = getShortcutKeyFromEventCode(event.code) ?? getShortcutKeyFromEventKey(event.key);
  if (!key) return null;

  return `alt+${key}`;
}

export function matchAltArrowKeydown(event: KeyboardEvent): string | null {
  if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return null;

  const direction = getArrowDirectionFromEventCode(event.code) ?? getArrowDirectionFromEventKey(event.key);
  if (!direction) return null;

  return `alt+arrow${direction}`;
}

function getShortcutKeyFromEventCode(code: string): string | null {
  const letterMatch = /^Key([A-Z])$/.exec(code);
  if (letterMatch) return letterMatch[1].toLowerCase();

  const digitMatch = /^(?:Digit|Numpad)([0-9])$/.exec(code);
  if (digitMatch) return digitMatch[1];

  return null;
}

function getShortcutKeyFromEventKey(key: string): string | null {
  const normalized = key.trim().toLowerCase();
  if (!/^[a-z0-9]$/.test(normalized)) return null;
  return normalized;
}

function getArrowDirectionFromEventCode(code: string): 'left' | 'right' | null {
  if (code === 'ArrowLeft') return 'left';
  if (code === 'ArrowRight') return 'right';
  return null;
}

function getArrowDirectionFromEventKey(key: string): 'left' | 'right' | null {
  if (key === 'ArrowLeft') return 'left';
  if (key === 'ArrowRight') return 'right';
  return null;
}

export function matchAltDigitKeydown(event: KeyboardEvent): string | null {
  const shortcut = matchAltShortcutKeydown(event);
  const match = /^alt\+([0-9])$/.exec(shortcut ?? '');
  if (!match) return null;
  return shortcut;
}

export function handleKeydown(event: KeyboardEvent): boolean {
  if (shouldIgnoreGlobalShortcut()) return false;

  for (const binding of bindings) {
    if (binding.when && !binding.when()) continue;
    if (!binding.match(event)) continue;
    binding.handler(event);
    return true;
  }

  return false;
}
