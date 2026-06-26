'use client';

import { useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function InstantTooltip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();

  const show = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition({
      top: rect.bottom + 6,
      left: rect.left + rect.width / 2,
    });
    setOpen(true);
  };

  const hide = () => {
    setOpen(false);
    setPosition(null);
  };

  return (
    <span
      ref={triggerRef}
      className="inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      aria-describedby={open ? tooltipId : undefined}
    >
      {children}
      {open && position && typeof document !== 'undefined' && createPortal(
        <span
          id={tooltipId}
          role="tooltip"
          className="fixed z-[100] -translate-x-1/2 px-2 py-1 text-[10px] rounded-md border border-surface-600 bg-surface-900 text-gray-200 whitespace-nowrap pointer-events-none shadow-lg"
          style={{ top: position.top, left: position.left }}
        >
          {label}
        </span>,
        document.body,
      )}
    </span>
  );
}
