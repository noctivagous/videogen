import { getBuiltInProvider } from '@/lib/studio/provider-modalities';
import { hasGenerationAdapter } from '@/lib/studio/generation/capabilities';
import { isCustomProvider } from '@/lib/storage/ai-settings';
import {
  getWorkflowDefinition,
  resolveWorkflowId,
  type WorkflowModelRequirements,
} from '@/lib/constants/video-generation-workflows';
import type { AIState, Workflow } from '@/lib/types/studio';

export interface WorkflowModelAvailability {
  available: boolean;
  message?: string;
}

const IMAGE_EDIT_PROVIDERS = new Set(['xai', 'openai', 'replicate']);
const VIDEO_PROVIDERS_WITH_I2V = new Set([
  'xai',
  'runway',
  'luma',
  'kling',
  'pika',
  'stability',
  'replicate',
]);

function providerConfigured(ai: AIState, providerId: string): boolean {
  if (isCustomProvider(providerId, ai)) {
    return ai.customProviders.some((p) => p.id === providerId);
  }
  return Boolean(ai.configured[providerId]?.apiKey);
}

function hasImageEditProvider(ai: AIState): boolean {
  if (providerConfigured(ai, ai.defaultImageProvider)) {
    const id = ai.defaultImageProvider;
    if (IMAGE_EDIT_PROVIDERS.has(id) || isCustomProvider(id, ai)) return true;
  }
  return IMAGE_EDIT_PROVIDERS.has(ai.defaultImageProvider);
}

function hasVideoGenerationProvider(ai: AIState): boolean {
  const videoId = ai.defaultVideoProvider;
  if (!providerConfigured(ai, videoId)) return false;
  return hasGenerationAdapter(videoId, isCustomProvider(videoId, ai));
}

function hasI2vProvider(ai: AIState): boolean {
  if (!hasVideoGenerationProvider(ai)) return false;
  const id = ai.defaultVideoProvider;
  if (VIDEO_PROVIDERS_WITH_I2V.has(id) || isCustomProvider(id, ai)) return true;
  const builtIn = getBuiltInProvider(id);
  return Boolean(builtIn?.purposes?.some((p) => /image-to-video/i.test(p)));
}

function hasT2vProvider(ai: AIState): boolean {
  if (!hasVideoGenerationProvider(ai)) return false;
  const id = ai.defaultVideoProvider;
  const builtIn = getBuiltInProvider(id);
  return Boolean(
    builtIn?.purposes?.some((p) => /text-to-video/i.test(p)) ||
      isCustomProvider(id, ai),
  );
}

function checkCapability(capability: string, ai: AIState): boolean {
  switch (capability) {
    case 'image-edit':
    case 'inpaint':
      return hasImageEditProvider(ai);
    case 'i2v':
      return hasI2vProvider(ai);
    case 't2v':
      return hasT2vProvider(ai);
    case 'first-last-frame':
    case 'motion-transfer':
    case 'multi-shot':
    case 'camera-control':
    case 'video-inpaint':
    case 'video-edit':
    case 'lipsync':
      return hasVideoGenerationProvider(ai);
    default:
      return false;
  }
}

function requirementsMet(requirements: WorkflowModelRequirements, ai: AIState): boolean {
  const { capabilities, anyOf } = requirements;
  if (anyOf?.length) {
    return anyOf.some((cap) => checkCapability(cap, ai));
  }
  return capabilities.every((cap) => checkCapability(cap, ai));
}

export function getWorkflowModelAvailability(
  workflowId: Workflow | string | undefined,
  ai: AIState,
): WorkflowModelAvailability {
  const resolved = resolveWorkflowId(workflowId) ?? (workflowId as Workflow | undefined);
  const def = getWorkflowDefinition(resolved);
  const requirements = def?.modelRequirements;
  if (!requirements) return { available: true };

  const available = requirementsMet(requirements, ai);
  if (available) return { available: true };

  return {
    available: false,
    message: requirements.unavailableMessage,
  };
}
