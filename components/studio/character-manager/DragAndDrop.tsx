'use client';

import { useState, type ReactNode } from 'react';

interface DraggableImageWellProps {
  className?: string;
  children: ReactNode;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function DraggableImageWell({ className, children, onDragStart, onDragEnd }: DraggableImageWellProps) {
  return (
    <div
      draggable
      className={className}
      onDragStart={() => onDragStart?.()}
      onDragEnd={() => onDragEnd?.()}
    >
      {children}
    </div>
  );
}

interface DropWellProps {
  className?: string;
  activeClassName?: string;
  children: ReactNode;
  disabled?: boolean;
  overlayLabel?: string;
  onDropWell?: () => void;
}

export function DropWell({
  className,
  activeClassName = 'ring-1 ring-brand-500/60 rounded-lg',
  children,
  disabled,
  overlayLabel,
  onDropWell,
}: DropWellProps) {
  const [isOver, setIsOver] = useState(false);

  return (
    <div
      style={{ position: 'relative' }}
      className={`${className ?? ''} ${isOver ? activeClassName : ''}`.trim()}
      onDragOver={(event) => {
        if (disabled || !onDropWell) return;
        event.preventDefault();
        if (!isOver) setIsOver(true);
      }}
      onDragLeave={() => {
        if (isOver) setIsOver(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        if (!disabled && onDropWell) {
          onDropWell();
        }
        setIsOver(false);
      }}
    >
      {children}
      {isOver && overlayLabel && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 px-1 py-0.5 bg-brand-500/90 text-[9px] text-white text-center rounded-b-lg">
          {overlayLabel}
        </div>
      )}
    </div>
  );
}
