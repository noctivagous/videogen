import { describe, expect, it } from 'vitest';
import { BUILT_IN_PROVIDERS, ENABLED_PROVIDER_IDS } from '@/lib/constants/providers';
import {
  PROVIDER_GENERATION_HANDLER_IDS,
  PROVIDER_TEST_HANDLER_IDS,
} from '@/lib/studio/generation/registry';

describe('provider connection test registry', () => {
  it('registers a live test handler for every built-in provider', () => {
    const registered = new Set(PROVIDER_TEST_HANDLER_IDS);
    for (const provider of BUILT_IN_PROVIDERS) {
      expect(registered.has(provider.id), `missing test handler for ${provider.id}`).toBe(true);
    }
  });
});

describe('provider generation registry', () => {
  it('registers a generation handler for every enabled aggregator', () => {
    const registered = new Set(PROVIDER_GENERATION_HANDLER_IDS);
    for (const providerId of ENABLED_PROVIDER_IDS) {
      expect(registered.has(providerId), `missing generation handler for ${providerId}`).toBe(true);
    }
  });
});
