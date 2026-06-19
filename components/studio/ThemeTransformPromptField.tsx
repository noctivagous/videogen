'use client';

import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';

export interface ThemeTransformPromptFieldProps {
  value: string;
  lines: 1 | 2;
  label?: string;
  className?: string;
}

export function ThemeTransformPromptField({
  value,
  lines,
  label = 'Transform prompt',
  className = '',
}: ThemeTransformPromptFieldProps) {
  if (!value.trim()) return null;

  return (
    <div
      className={`theme-transform-prompt-field ${className}`.trim()}
      {...uiSectionProps(UI_SECTIONS.studioThemeTransformPrompt)}
    >
      {label ? (
        <span className="theme-transform-prompt-field__label">{label}</span>
      ) : null}
      <textarea
        readOnly
        rows={lines}
        value={value}
        className={`theme-transform-prompt-field__input theme-transform-prompt-field__input--${lines}l`}
        aria-label={label}
      />
    </div>
  );
}