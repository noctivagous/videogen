import {
  MODEL_CATEGORY_DEFINITIONS,
  type ModelCategoryId,
} from '@/lib/constants/model-catalog';
import type { LabDefinition } from '@/lib/types/studio';

export type LabCategoryRef = {
  categoryId: ModelCategoryId;
  label: string;
  description: string;
};

export const LAB_DEFINITIONS: LabDefinition[] = [
  {
    id: 'black-forest-labs',
    name: 'Black Forest Labs',
    tagline: 'FLUX diffusion family',
    description:
      'Creators of the FLUX image generation and inpainting model family, widely hosted on Replicate and fal.ai for mask inpaint, identity edit, and still generation workflows.',
    hasDirectApi: false,
    aggregatorIds: ['replicate', 'fal'],
    categoryIds: ['mask-inpaint', 'multi-image-identity-edit', 'text-to-image', 'image-to-image', 'image-outpaint'],
    notableModels: ['black-forest-labs/flux-fill-pro', 'fal-ai/flux-pro/v1/fill'],
  },
  {
    id: 'bytedance',
    name: 'ByteDance',
    tagline: 'Seedance video models',
    description:
      'Research lab behind Seedance text-to-video and reference-to-video models, plus video upscaling endpoints commonly accessed through Replicate.',
    hasDirectApi: false,
    aggregatorIds: ['replicate'],
    categoryIds: ['text-to-video', 'reference-to-video', 'video-upscale'],
    notableModels: ['bytedance/seedance-2.0', 'bytedance/video-upscaler'],
  },
  {
    id: 'google',
    name: 'Google',
    tagline: 'Veo & research video',
    description:
      'Google DeepMind and Google Research models including Veo for first/last-frame video and frame-interpolation research endpoints on Replicate.',
    hasDirectApi: false,
    aggregatorIds: ['replicate'],
    categoryIds: ['text-to-video', 'first-last-frame', 'frame-interpolation'],
    notableModels: ['google/veo-3.1', 'google-research/frame-interpolation'],
  },
  {
    id: 'meta',
    name: 'Meta',
    tagline: 'Segment Anything (SAM)',
    description:
      'Meta AI research lab behind SAM and SAM 2 segmentation models used for image and video mask generation in bake and compositing prep.',
    hasDirectApi: false,
    aggregatorIds: ['replicate'],
    categoryIds: ['image-segmentation', 'video-segmentation'],
    notableModels: ['meta/sam-2', 'meta/sam-2-video'],
  },
  {
    id: 'wan',
    name: 'Wan Video',
    tagline: 'Open video diffusion',
    description:
      'Alibaba Wan video diffusion family for image-to-video, character replace, and animate workflows — hosted on Replicate and fal.ai.',
    hasDirectApi: false,
    aggregatorIds: ['replicate', 'fal'],
    categoryIds: ['image-to-video', 'video-edit', 'character-replace'],
    notableModels: ['wan-video/wan-2.7-videoedit', 'fal-ai/wan-2.2-animate/replace'],
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    tagline: 'Voice & speech synthesis',
    description:
      'Voice synthesis and cloning lab whose models power text-to-speech and voice-cloning slots when accessed through aggregator endpoints.',
    hasDirectApi: false,
    aggregatorIds: ['replicate'],
    categoryIds: ['text-to-speech', 'voice-cloning'],
    notableModels: ['elevenlabs/tts'],
  },
  {
    id: 'pika',
    name: 'Pika Labs',
    tagline: 'Effects-first video generation',
    description:
      'Pika creates text/image-to-video models with strong effects and scene control. In VideoGen, Pika endpoints run through fal.ai rather than a separate direct API.',
    hasDirectApi: false,
    aggregatorIds: ['fal'],
    categoryIds: ['text-to-video', 'image-to-video'],
    notableModels: ['fal-ai/pika/v2.2/text-to-video'],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    tagline: 'Sora & GPT media stack',
    description:
      'OpenAI develops Sora video, GPT image, Whisper speech-to-text, and TTS models. VideoGen can connect via OpenAI direct API or OpenRouter.',
    hasDirectApi: true,
    directProviderId: 'openai',
    aggregatorIds: ['openrouter'],
    categoryIds: ['text-to-image', 'text-to-video', 'speech-to-text', 'text-to-speech', 'llm'],
    notableModels: ['sora', 'whisper-1', 'gpt-4o'],
  },
  {
    id: 'xai',
    name: 'xAI',
    tagline: 'Grok Imagine & reasoning',
    description:
      'xAI builds Grok Imagine image and video models plus Grok LLMs. Direct API is the primary path in VideoGen; OpenRouter provides an alternate gateway.',
    hasDirectApi: true,
    directProviderId: 'xai',
    aggregatorIds: ['openrouter'],
    categoryIds: ['image-edit', 'multi-image-identity-edit', 'text-to-image', 'text-to-video', 'image-to-video', 'llm'],
    notableModels: ['grok-imagine-video-1.5', 'grok-imagine-image-quality', 'grok-4'],
  },
  {
    id: 'kling',
    name: 'Kling AI',
    tagline: 'High-fidelity motion & lip sync',
    description:
      'Kuaishou Kling team behind Kling 2.x/3.x video, multi-shot Omni, motion control, and lip-sync models — available via direct API and aggregator mirrors.',
    hasDirectApi: true,
    directProviderId: 'kling',
    aggregatorIds: ['fal', 'replicate'],
    categoryIds: ['text-to-video', 'image-to-video', 'reference-to-video', 'camera-control', 'motion-transfer', 'multi-shot', 'lip-sync'],
    notableModels: ['kling-v3', 'kling-v3-omni', 'kling-lip-sync'],
  },
  {
    id: 'runway',
    name: 'Runway ML',
    tagline: 'Gen-4 cinematic video',
    description:
      'Runway develops Gen-3/Gen-4 video, Aleph compositing, and motion-brush tooling for professional generative video editing and inpaint workflows.',
    hasDirectApi: true,
    directProviderId: 'runway',
    aggregatorIds: [],
    categoryIds: ['text-to-video', 'image-to-video', 'camera-control', 'motion-transfer', 'video-edit', 'video-inpaint', 'video-compositing-generative'],
    notableModels: ['gen4-video-edit', 'gen4-video-inpaint', 'aleph'],
  },
  {
    id: 'luma',
    name: 'Luma AI',
    tagline: 'Dream Machine world models',
    description:
      'Luma AI builds Dream Machine photorealistic text-to-video and image-to-video models with camera-control support.',
    hasDirectApi: true,
    directProviderId: 'luma',
    aggregatorIds: [],
    categoryIds: ['text-to-video', 'image-to-video', 'camera-control'],
    notableModels: ['dream-machine'],
  },
  {
    id: 'stability',
    name: 'Stability AI',
    tagline: 'Open diffusion video',
    description:
      'Stability AI develops Stable Video and open diffusion image/video models with controllable generation parameters.',
    hasDirectApi: true,
    directProviderId: 'stability',
    aggregatorIds: [],
    categoryIds: ['text-to-video', 'image-to-video'],
    notableModels: ['stable-video-3'],
  },
  {
    id: 'leonardo',
    name: 'Leonardo.AI',
    tagline: 'Character-consistent animation',
    description:
      'Leonardo.AI focuses on character-consistent image and motion generation for creative teams and game art pipelines.',
    hasDirectApi: true,
    directProviderId: 'leonardo',
    aggregatorIds: [],
    categoryIds: ['image-to-video'],
    notableModels: ['motion-2.0'],
  },
  {
    id: 'minimax',
    name: 'Minimax',
    tagline: 'Hailuo cinematic video',
    description:
      'Minimax develops Hailuo Video for cinematic motion and prompt adherence, plus voice-cloning endpoints on Replicate.',
    hasDirectApi: true,
    directProviderId: 'minimax',
    aggregatorIds: ['replicate'],
    categoryIds: ['text-to-video', 'voice-cloning'],
    notableModels: ['hailuo-video', 'minimax/voice-cloning'],
  },
  {
    id: 'viggle',
    name: 'Viggle',
    tagline: 'Mix & motion character animation',
    description:
      'Viggle specializes in motion transfer and character swap from reference performances into generated video.',
    hasDirectApi: true,
    directProviderId: 'viggle',
    aggregatorIds: [],
    categoryIds: ['motion-transfer', 'character-replace'],
    notableModels: ['viggle-mix-motion-v1', 'viggle-character-swap-v1'],
  },
  {
    id: 'hedra',
    name: 'Hedra',
    tagline: 'Expressive talking avatars',
    description:
      'Hedra builds expressive talking-head and avatar video with emotion-driven lip sync and TTS integration.',
    hasDirectApi: true,
    directProviderId: 'hedra',
    aggregatorIds: [],
    categoryIds: ['lip-sync', 'text-to-speech'],
    notableModels: ['hedra-character-3'],
  },
];

const LAB_BY_ID = new Map(LAB_DEFINITIONS.map((lab) => [lab.id, lab]));

const LAB_BY_DIRECT_PROVIDER_ID = new Map(
  LAB_DEFINITIONS.filter((lab) => lab.directProviderId).map((lab) => [lab.directProviderId!, lab]),
);

export function getLabById(labId: string): LabDefinition | undefined {
  return LAB_BY_ID.get(labId);
}

export function getLabByDirectProviderId(providerId: string): LabDefinition | undefined {
  return LAB_BY_DIRECT_PROVIDER_ID.get(providerId);
}

export function getLabCategories(lab: Pick<LabDefinition, 'categoryIds'>): LabCategoryRef[] {
  const categories: LabCategoryRef[] = [];
  for (const categoryId of lab.categoryIds) {
    const definition = MODEL_CATEGORY_DEFINITIONS.find((entry) => entry.id === categoryId);
    if (!definition) continue;
    categories.push({
      categoryId: definition.id,
      label: definition.label,
      description: definition.description,
    });
  }
  return categories;
}

export function sortLabs(labs: LabDefinition[] = LAB_DEFINITIONS): LabDefinition[] {
  return [...labs].sort((a, b) => a.name.localeCompare(b.name));
}

export function getLabsForAggregator(aggregatorId: string): LabDefinition[] {
  return sortLabs(LAB_DEFINITIONS.filter((lab) => lab.aggregatorIds.includes(aggregatorId)));
}

export function getLabProvidedBy(labId: string): {
  directProviderId: string | null;
  aggregatorIds: string[];
} {
  const lab = getLabById(labId);
  if (!lab) return { directProviderId: null, aggregatorIds: [] };
  return {
    directProviderId: lab.hasDirectApi ? (lab.directProviderId ?? null) : null,
    aggregatorIds: lab.aggregatorIds,
  };
}