import { describe, expect, it } from 'vitest';
import {
  appendBakePromptAdditions,
  BAKE_XAI_EDIT_PROMPT,
} from '@/lib/studio/bake-start-frame';

describe('appendBakePromptAdditions', () => {
  it('returns base prompt when additions are empty', () => {
    expect(appendBakePromptAdditions(BAKE_XAI_EDIT_PROMPT, '')).toBe(BAKE_XAI_EDIT_PROMPT);
    expect(appendBakePromptAdditions(BAKE_XAI_EDIT_PROMPT, '   ')).toBe(BAKE_XAI_EDIT_PROMPT);
    expect(appendBakePromptAdditions(BAKE_XAI_EDIT_PROMPT, null)).toBe(BAKE_XAI_EDIT_PROMPT);
  });

  it('appends trimmed additions to the base prompt', () => {
    expect(
      appendBakePromptAdditions(BAKE_XAI_EDIT_PROMPT, '  Subject wears a yellow raincoat.  '),
    ).toBe(`${BAKE_XAI_EDIT_PROMPT} Subject wears a yellow raincoat.`);
  });
});
