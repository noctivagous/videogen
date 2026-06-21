import { describe, expect, it } from 'vitest';
import {
  getDefaultWorkflowId,
  getWorkflowDefinition,
  isWorkflowImplemented,
  resolveWorkflowId,
} from '@/lib/constants/video-generation-workflows';
import { normalizeWorkflow } from '@/lib/constants/workflows';

describe('video-generation-workflows registry', () => {
  it('defaults to bake-start-frame from JSON', () => {
    expect(getDefaultWorkflowId()).toBe('bake-start-frame');
  });

  it('resolves legacy workflow IDs', () => {
    expect(resolveWorkflowId('lock-start-frame')).toBe('bake-start-frame');
    expect(resolveWorkflowId('broll')).toBe('pure-broll');
    expect(resolveWorkflowId('auto-place')).toBe('auto-place');
  });

  it('normalizes legacy persisted shot workflows', () => {
    expect(normalizeWorkflow({ workflow: 'lock-start-frame' })).toBe('bake-start-frame');
    expect(normalizeWorkflow({ workflow: 'broll' })).toBe('pure-broll');
    expect(normalizeWorkflow(undefined)).toBe('bake-start-frame');
  });

  it('marks only auto-place and bake-start-frame as implemented', () => {
    expect(isWorkflowImplemented('auto-place')).toBe(true);
    expect(isWorkflowImplemented('bake-start-frame')).toBe(true);
    expect(isWorkflowImplemented('pure-broll')).toBe(false);
    expect(isWorkflowImplemented('motion-transfer')).toBe(false);
  });

  it('loads workflow metadata from JSON', () => {
    const def = getWorkflowDefinition('bake-start-frame');
    expect(def?.label).toBe('Bake Start Frame');
    expect(def?.description).toContain('mannequins');
    expect(def?.modelRequirements?.capabilities).toContain('image-edit');
  });
});
