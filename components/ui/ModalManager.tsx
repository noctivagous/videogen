'use client';

import { getModalStack, subscribeModalStack } from '@/lib/ui/modal-stack';
import { useSyncExternalStore, type ReactNode } from 'react';

export { ManagedModal } from '@/components/ui/ManagedModal';
export type { ManagedModalProps } from '@/components/ui/ManagedModal';
export { ManagedPopover } from '@/components/ui/ManagedPopover';
export type { ManagedPopoverProps } from '@/components/ui/ManagedPopover';
export {
  getModalStack,
  getTopModal,
  isTopModal,
  popModal,
  pushModal,
} from '@/lib/ui/modal-stack';

/** Tracks open modals (Popover API top layer + shared escape-key stack). */
export function useModalStack() {
  return useSyncExternalStore(subscribeModalStack, getModalStack, getModalStack);
}

export function useIsTopModal(modalId: string): boolean {
  const stack = useModalStack();
  return stack[stack.length - 1]?.id === modalId;
}

interface ModalManagerProps {
  children: ReactNode;
}

/** Mount once at the app shell; modals portal via `ManagedModal`. */
export function ModalManager({ children }: ModalManagerProps) {
  return children;
}
