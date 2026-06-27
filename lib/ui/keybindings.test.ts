import { describe, expect, it } from 'vitest';
import { matchAltArrowKeydown, matchAltShortcutKeydown } from '@/lib/ui/keybindings';

function createEvent(overrides: Partial<KeyboardEvent> = {}): KeyboardEvent {
  return {
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    key: '',
    code: '',
    ...overrides,
  } as KeyboardEvent;
}

describe('matchAltShortcutKeydown', () => {
  it('matches by event code for layout-independent Option/Alt+digit', () => {
    const event = createEvent({ altKey: true, key: '¡', code: 'Digit1' });
    expect(matchAltShortcutKeydown(event)).toBe('alt+1');
  });

  it('matches numpad digits when Alt is pressed', () => {
    const event = createEvent({ altKey: true, key: '1', code: 'Numpad1' });
    expect(matchAltShortcutKeydown(event)).toBe('alt+1');
  });

  it('matches by event code for layout-independent Option/Alt+letters', () => {
    const event = createEvent({ altKey: true, key: '∂', code: 'KeyD' });
    expect(matchAltShortcutKeydown(event)).toBe('alt+d');
  });

  it('falls back to event key when code is unavailable', () => {
    const event = createEvent({ altKey: true, key: 'm' });
    expect(matchAltShortcutKeydown(event)).toBe('alt+m');
  });

  it('rejects non-Alt digits and modified combinations', () => {
    expect(matchAltShortcutKeydown(createEvent({ key: '1', code: 'Digit1' }))).toBeNull();
    expect(matchAltShortcutKeydown(createEvent({ altKey: true, ctrlKey: true, code: 'Digit1' }))).toBeNull();
    expect(matchAltShortcutKeydown(createEvent({ altKey: true, metaKey: true, code: 'Digit1' }))).toBeNull();
    expect(matchAltShortcutKeydown(createEvent({ altKey: true, shiftKey: true, code: 'Digit1' }))).toBeNull();
  });
});

describe('matchAltArrowKeydown', () => {
  it('matches Alt+ArrowLeft and Alt+ArrowRight', () => {
    expect(matchAltArrowKeydown(createEvent({ altKey: true, code: 'ArrowLeft' }))).toBe('alt+arrowleft');
    expect(matchAltArrowKeydown(createEvent({ altKey: true, key: 'ArrowRight' }))).toBe('alt+arrowright');
  });

  it('rejects arrow keys without Alt or with extra modifiers', () => {
    expect(matchAltArrowKeydown(createEvent({ code: 'ArrowLeft' }))).toBeNull();
    expect(matchAltArrowKeydown(createEvent({ altKey: true, ctrlKey: true, code: 'ArrowLeft' }))).toBeNull();
    expect(matchAltArrowKeydown(createEvent({ altKey: true, metaKey: true, code: 'ArrowRight' }))).toBeNull();
    expect(matchAltArrowKeydown(createEvent({ altKey: true, shiftKey: true, code: 'ArrowRight' }))).toBeNull();
  });
});
