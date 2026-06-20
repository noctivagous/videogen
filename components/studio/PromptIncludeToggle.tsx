'use client';

interface PromptIncludeToggleProps {
  pressed: boolean;
  onToggle: () => void;
}

const INCLUDED_TITLE =
  'Included in generation prompt. Controls still affect preview, composition, and start-frame bake.';
const EXCLUDED_TITLE =
  'Excluded from generation prompt. Controls still affect preview, composition, and start-frame bake.';

/** Opt-in: include this camera section in generation prompts only. */
export function PromptIncludeToggle({ pressed, onToggle }: PromptIncludeToggleProps) {
  return (
    <div className="prompt-include-toggle">
      <span className="prompt-include-toggle__label">Include in Prompt</span>
      <button
        type="button"
        className={`composition-toggle ${pressed ? 'active' : ''}`}
        aria-pressed={pressed}
        aria-label={`${pressed ? 'Exclude' : 'Include'} in generation prompt`}
        title={pressed ? INCLUDED_TITLE : EXCLUDED_TITLE}
        onClick={onToggle}
      >
        <span className="composition-toggle-knob" />
      </button>
    </div>
  );
}