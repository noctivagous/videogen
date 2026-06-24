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
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

export interface ManagedPopoverProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  anchorRect: DOMRect | null;
  offset?: number;
}

function supportsPopover(element: HTMLElement): element is HTMLElement & {
  showPopover: () => void;
  hidePopover: () => void;
} {
  return 'showPopover' in element && 'hidePopover' in element;
}

export function ManagedPopover({
  open,
  onClose,
  children,
  anchorRect,
  className = '',
  style,
  offset = 8,
  ...rest
}: ManagedPopoverProps) {
  const modalId = useId();
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      popModal(modalId);
      return;
    }
    pushModal({ id: modalId, onClose });
    return () => popModal(modalId);
  }, [open, modalId, onClose]);

  useEffect(() => {
    const element = popoverRef.current;
    if (!element || !supportsPopover(element)) return;

    if (open) {
      if (!element.matches(':popover-open')) element.showPopover();
      return;
    }

    if (element.matches(':popover-open')) element.hidePopover();
  }, [open]);

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

  if (typeof document === 'undefined' || !open || !anchorRect) return null;

  const popoverStyle: CSSProperties = {
    left: anchorRect.left + anchorRect.width / 2,
    top: anchorRect.top - offset,
    ...style,
  };

  return createPortal(
    <div
      ref={popoverRef}
      popover="manual"
      className={`studio-floating-popover ${className}`.trim()}
      style={popoverStyle}
      {...rest}
    >
      {children}
    </div>,
    document.body,
  );
}
