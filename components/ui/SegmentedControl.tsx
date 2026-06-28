'use client';

import type { HTMLAttributes, ReactNode } from 'react';

export interface SegmentedControlItem {
  id: string;
  label: ReactNode;
  disabled?: boolean;
  title?: string;
}

export interface SegmentedControlProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'role'> {
  value: string;
  onChange: (id: string) => void;
  items: SegmentedControlItem[];
  'aria-label': string;
  buttonClassName?: string;
  fullWidth?: boolean;
  role?: 'tablist' | 'group';
  /** When set (TabControl), each tab gets aria-controls + a stable id for the tabpanel. */
  tabPanelId?: string;
}

export function SegmentedControl({
  value,
  onChange,
  items,
  'aria-label': ariaLabel,
  className = '',
  buttonClassName = '',
  fullWidth = false,
  role = 'tablist',
  tabPanelId,
  ...rest
}: SegmentedControlProps) {
  return (
    <div
      className={`segmented-control ${fullWidth ? 'segmented-control--full' : ''} ${className}`.trim()}
      role={role}
      aria-label={ariaLabel}
      {...rest}
    >
      {items.map((item) => {
        const selected = value === item.id;

        return (
          <button
            key={item.id}
            type="button"
            role={role === 'tablist' ? 'tab' : undefined}
            aria-selected={role === 'tablist' ? selected : undefined}
            aria-pressed={role === 'group' ? selected : undefined}
            disabled={item.disabled}
            title={item.title}
            id={tabPanelId ? `${tabPanelId}-tab-${item.id}` : undefined}
            aria-controls={tabPanelId && role === 'tablist' ? tabPanelId : undefined}
            className={`segmented-control-btn ${selected ? 'active' : ''} ${buttonClassName}`.trim()}
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}