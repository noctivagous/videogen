'use client';

interface ThemeTransformApplyToggleProps {
  pressed: boolean;
  onToggle: () => void;
  label: string;
}

/** Opt-in: include this lighting control in Theme Transformer prompts. */
export function ThemeTransformApplyToggle({ pressed, onToggle, label }: ThemeTransformApplyToggleProps) {
  return (
    <button
      type="button"
      className={`theme-transform-apply-toggle ${pressed ? 'active' : ''}`}
      aria-pressed={pressed}
      aria-label={`${pressed ? 'Remove' : 'Apply'} ${label} to Theme Transformer prompt`}
      title={pressed ? 'Included in Theme Transformer prompt' : 'Not applied to Theme Transformer prompt'}
      onClick={onToggle}
    >
      <span className="theme-transform-apply-toggle__label">TT</span>
    </button>
  );
}