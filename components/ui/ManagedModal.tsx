'use client';

import {
  isTopModal,
  popModal,
  pushModal,
} from '@/lib/ui/modal-stack';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

export interface ManagedModalProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Applied to the full-screen popover shell (centering + padding). */
  shellClassName?: string;
  /** Modal variant that affects default shell sizing. */
  variant?: 'default' | 'walkthrough';
}

function supportsPopover(element: HTMLElement): element is HTMLElement & {
  showPopover: () => void;
  hidePopover: () => void;
} {
  return 'showPopover' in element && 'hidePopover' in element;
}

export function ManagedModal({
  open,
  onClose,
  children,
  className = '',
  shellClassName = '',
  variant = 'default',
  ...rest
}: ManagedModalProps) {
  const modalId = useId();
  const popoverRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      popModal(modalId);
      return;
    }
    pushModal({ id: modalId, onClose });
    return () => popModal(modalId);
  }, [open, modalId, onClose]);

  useEffect(() => {
    if (!open || !mounted) return;

    const element = popoverRef.current;
    if (!element || !supportsPopover(element)) return;
    if (!element.matches(':popover-open')) element.showPopover();
  }, [open, mounted]);

  useEffect(() => {
    const element = popoverRef.current;
    if (!element) return;

    const onToggle = (event: Event) => {
      const toggle = event as ToggleEvent;
      if (toggle.newState === 'closed' && open) {
        onClose();
      }
    };

    element.addEventListener('toggle', onToggle);
    return () => element.removeEventListener('toggle', onToggle);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !isTopModal(modalId)) return;
      event.preventDefault();
      onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, modalId, onClose]);

  if (!mounted || !open) return null;

  const defaultShellClass = variant === 'walkthrough' ? 'max-w-4xl' : '';
  const effectiveShellClassName = shellClassName || defaultShellClass;

  return createPortal(
    <div
      ref={popoverRef}
      popover="manual"
      className={`studio-modal ${effectiveShellClassName}`.trim()}
      style={{ pointerEvents: 'none' }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      {...rest}
    >
      <div className={className} style={{ pointerEvents: 'auto' }} onClick={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body,
  );
}