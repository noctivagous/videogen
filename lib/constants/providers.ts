import type { BuiltInProvider } from '@/lib/types/studio';

/**
 * Built-in providers users can configure and select in the app today.
 * All other built-in cards remain visible in Settings but are grayed out.
 */
export const ENABLED_PROVIDER_IDS = ['fal', 'replicate', 'xai', 'together', 'huggingface', 'openrouter'] as const;

export type EnabledProviderId = (typeof ENABLED_PROVIDER_IDS)[number];

export function isBuiltInProviderEnabled(providerId: string): boolean {
  return (ENABLED_PROVIDER_IDS as readonly string[]).includes(providerId);
}

export function getDefaultEnabledProviderId(): EnabledProviderId {
  return 'xai';
}

export const BUILT_IN_PROVIDERS: BuiltInProvider[] = [
  {
    id: 'runway',
    name: 'Runway ML',
    tagline: 'Gen-4 cinematic video',
    desc: 'Gen-3 Alpha • Cinematic text-to-video & motion brush',
    icon: '🎬',
    hint: 'Get your key from Runway dashboard → API',
    purposes: ['Text-to-Video', 'Image-to-Video', 'Motion Brush'],
    modalities: ['video', 'image'],
    kind: 'direct',
  },
  {
    id: 'luma',
    name: 'Luma AI',
    tagline: 'Dream Machine world models',
    desc: 'Dream Machine • Photorealistic motion and world models',
    icon: '🌌',
    hint: 'Create API key in Luma account settings',
    purposes: ['Text-to-Video', 'Image-to-Video'],
    modalities: ['video', 'image'],
    kind: 'direct',
  },
  {
    id: 'kling',
    name: 'Kling AI',
    tagline: 'High-fidelity motion & lip sync',
    desc: 'Kling 2.0 • High-fidelity motion and lip sync',
    icon: '🐉',
    hint: 'Available via Kling developer console',
    purposes: ['Text-to-Video', 'Image-to-Video', 'Lip Sync'],
    modalities: ['video', 'image'],
    kind: 'direct',
  },
  {
    id: 'pika',
    name: 'Pika Labs',
    tagline: 'Effects-first video generation',
    desc: 'Pika on fal.ai • Text/image-to-video, effects & scenes',
    icon: '⚡',
    hint: 'Create a fal.ai API key — Pika models run on fal',
    purposes: ['Text-to-Video', 'Image-to-Video', 'Lip Sync', 'Effects'],
    modalities: ['video', 'image'],
    kind: 'direct',
  },
  {
    id: 'stability',
    name: 'Stability AI',
    tagline: 'Open diffusion video',
    desc: 'Stable Video 3 • Controllable open video diffusion',
    icon: '🔬',
    hint: 'Stability platform → API keys section',
    purposes: ['Text-to-Video', 'Image-to-Video'],
    modalities: ['video', 'image'],
    kind: 'direct',
  },
  {
    id: 'leonardo',
    name: 'Leonardo.AI',
    tagline: 'Character-consistent animation',
    desc: 'Motion 2.0 • Character-consistent animation',
    icon: '🎨',
    hint: 'Leonardo dashboard → API & keys',
    purposes: ['Image-to-Video', 'Character Animation'],
    modalities: ['video', 'image'],
    kind: 'direct',
  },
  {
    id: 'fal',
    name: 'Fal.ai',
    tagline: 'Generative Media',
    desc: 'The Generative Media Specialist Fal.ai is optimized specifically for generative media (image, video, audio) with a focus on high-performance inference.',
    icon: '⚡',
    hint: 'Fal dashboard → API keys',
    purposes: ['Text-to-Video', 'Image-to-Video', 'Serverless'],
    modalities: ['video', 'image'],
    kind: 'aggregator',
  },
  {
    id: 'replicate',
    name: 'Replicate',
    tagline: 'The Developer-Centric',
    desc: 'While it hosts many of the same foundational models as Fal.ai (like Flux and Kling), its library is smaller (~200 models) and generally more expensive. It is often the preferred choice for prototyping, learning, and teams that prioritize developer experience and community support over raw cost savings.',
    icon: '🔄',
    hint: 'Create token at replicate.com/account/api-tokens',
    purposes: ['Community Models', 'Open Weights'],
    modalities: ['video', 'image', 'llm'],
    kind: 'aggregator',
  },
  {
    id: 'xai',
    name: 'xAI',
    tagline: 'Grok Imagine & reasoning',
    desc: 'Grok Imagine • Video and image generation',
    icon: '🚀',
    hint: 'xAI console → API keys (Grok Imagine access)',
    purposes: ['Text-to-Video', 'Text-to-Image', 'Reasoning Video'],
    modalities: ['video', 'image', 'llm'],
    kind: 'direct',
  },
  {
    id: 'together',
    name: 'Together AI',
    tagline: 'The Open-Source LLM & Infrastructure Engine',
    desc: 'Together AI is a high-performance inference platform focused primarily on open-source Large Language Models (LLMs) and foundational AI. Unlike media-specialized aggregators, it excels in text generation, fine-tuning, and training with optimized engines (FlashAttention) for models like Llama, Qwen, and DeepSeek. It offers serverless API access and dedicated GPU clusters, making it the top choice for scalable text-based applications and custom model training rather than generative media.',
    icon: '🔗',
    hint: 'Together dashboard → API keys',
    purposes: ['Open Models', 'Fast Inference'],
    modalities: ['video', 'image', 'llm'],
    kind: 'aggregator',
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    tagline: 'The Model Hub & Community Gateway',
    desc: 'Hugging Face serves as the central repository for the AI community, hosting over 500,000 open-source models, datasets, and demos. While primarily a collaboration platform ("The GitHub of AI"), its Inference API and Inference Endpoints allow developers to access this massive library programmatically. It is the standard for model discovery, research, and experimentation, offering the widest variety of models but with variable latency compared to specialized aggregators.',
    icon: '🤗',
    hint: 'HF settings → Access Tokens (with read/write)',
    purposes: ['Inference Endpoints', 'Open Models'],
    modalities: ['video', 'image', 'llm'],
    kind: 'aggregator',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    tagline: 'The Universal LLM Gateway & Router',
    desc: 'OpenRouter is a unified API aggregator that provides access to 400+ AI models (text, image, video, audio) from 60+ providers (including OpenAI, Anthropic, Google, and Meta) through a single OpenAI-compatible endpoint. Unlike media-specialized aggregators, its core strength is intelligent routing, automatic fallbacks, and consolidated billing, allowing developers to switch between models dynamically without changing code.',
    icon: '🔀',
    hint: 'OpenRouter dashboard → API keys',
    purposes: ['Model Routing', 'Unified Billing', 'OpenAI-compatible'],
    modalities: ['video', 'image', 'llm'],
    kind: 'aggregator',
  },
  {
    id: 'minimax',
    name: 'Minimax',
    tagline: 'Hailuo cinematic video',
    desc: 'Hailuo Video • Cinematic motion & prompt adherence',
    icon: '🌊',
    hint: 'Minimax developer portal → API credentials',
    purposes: ['Text-to-Video', 'Cinematic Motion'],
    modalities: ['video'],
    kind: 'direct',
  },
  {
    id: 'viggle',
    name: 'Viggle',
    tagline: 'Mix & motion character animation',
    desc: 'Mix & Motion • Character animation from images',
    icon: '🕺',
    hint: 'Viggle account → API section',
    purposes: ['Motion Control', 'Character Swap'],
    modalities: ['video', 'image'],
    kind: 'direct',
  },
  {
    id: 'hedra',
    name: 'Hedra',
    tagline: 'Expressive talking avatars',
    desc: 'Expressive avatars • Talking head video with emotion',
    icon: '🎭',
    hint: 'Hedra platform → Developer API keys',
    purposes: ['Talking Head', 'Avatar', 'Lip Sync'],
    modalities: ['video', 'tts'],
    kind: 'direct',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    tagline: 'Sora & GPT media stack',
    desc: 'Sora • Advanced world simulation & video',
    icon: '🔷',
    hint: 'OpenAI platform → API keys (Sora access)',
    purposes: ['World Simulation', 'Text-to-Video'],
    modalities: ['video', 'llm', 'image', 'tts'],
    kind: 'direct',
  },
];

export const AGGREGATOR_PROVIDERS = BUILT_IN_PROVIDERS.filter((provider) => provider.kind === 'aggregator');

export function isAggregatorProvider(providerId: string): boolean {
  return AGGREGATOR_PROVIDERS.some((provider) => provider.id === providerId);
}

export function getBuiltInProviderById(providerId: string): BuiltInProvider | undefined {
  return BUILT_IN_PROVIDERS.find((provider) => provider.id === providerId);
}