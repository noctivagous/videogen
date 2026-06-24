'use client';

import { useState, type ReactNode } from 'react';

interface WorkflowCollapsibleSectionProps {
  label: string;
  defaultCollapsed?: boolean;
  children: ReactNode;
  className?: string;
}

/** Triangle-toggle collapsible block matching workflow prompt editor styling. */
export function WorkflowCollapsibleSection({
  label,
  defaultCollapsed = true,
  children,
  className = '',
}: WorkflowCollapsibleSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className={`collapsible-prompt-editor ${className}`.trim()}>
      <div className="collapsible-prompt-editor__header">
        <button
          type="button"
          className="collapsible-prompt-editor__toggle"
          onClick={() => setCollapsed((open) => !open)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? `Expand ${label}` : `Collapse ${label}`}
        >
          <svg
            className={`collapsible-prompt-editor__chevron ${
              collapsed ? '' : 'collapsible-prompt-editor__chevron--open'
            }`}
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden
          >
            <path d="M6 4l4 4-4 4" />
          </svg>
        </button>
        <span className="collapsible-prompt-editor__label">{label}</span>
      </div>
      {!collapsed && children}
    </div>
  );
}
