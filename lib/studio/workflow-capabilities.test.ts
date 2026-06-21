import { describe, expect, it } from 'vitest';
import { getWorkflowModelAvailability } from '@/lib/studio/workflow-capabilities';
import type { AIState } from '@/lib/types/studio';

function baseAi(overrides: Partial<AIState> = {}): AIState {
  return {
    defaultVideoProvider: 'xai',
    defaultImageProvider: 'xai',
    configured: {
      xai: { apiKey: 'test-key', models: [] },
    },
    customProviders: [],
    ...overrides,
  } as AIState;
}

describe('getWorkflowModelAvailability', () => {
  it('reports available when configured providers satisfy auto-place', () => {
    const result = getWorkflowModelAvailability('auto-place', baseAi());
    expect(result.available).toBe(true);
  });

  it('reports unavailable with JSON message when no providers configured', () => {
    const ai = baseAi({
      configured: {},
      defaultVideoProvider: 'runway',
      defaultImageProvider: 'openai',
    });
    const result = getWorkflowModelAvailability('auto-place', ai);
    expect(result.available).toBe(false);
    expect(result.message).toContain('image-to-video');
  });

  it('resolves legacy workflow IDs before checking requirements', () => {
    const result = getWorkflowModelAvailability('lock-start-frame', baseAi());
    expect(result.available).toBe(true);
  });
});
