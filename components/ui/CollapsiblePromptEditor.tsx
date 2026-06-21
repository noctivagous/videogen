'use client';

import { useState } from 'react';

export interface CollapsiblePromptEditorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  defaultCollapsed?: boolean;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
}

export function CollapsiblePromptEditor({
  label = 'Prompt',
  value,
  onChange,
  rows = 3,
  defaultCollapsed = true,
  placeholder,
  className = '',
  ariaLabel,
}: CollapsiblePromptEditorProps) {
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
      {!collapsed && (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className="collapsible-prompt-editor__input"
          placeholder={placeholder}
          aria-label={ariaLabel ?? label}
        />
      )}
    </div>
  );
}
