import type { ProviderModel } from '@/lib/types/studio';

/** Static video model catalog per provider — merged with discovered models after connection test. */
export const PROVIDER_STATIC_MODELS: Record<string, ProviderModel[]> = {
  replicate: [
    { id: 'minimax/video-01', name: 'MiniMax video-01', modalities: ['video'] },
  ],
  runway: [
    { id: 'gen3a_turbo', name: 'Gen-3 Alpha Turbo', modalities: ['video'] },
    { id: 'gen3a', name: 'Gen-3 Alpha', modalities: ['video'] },
    { id: 'gen4_turbo', name: 'Gen-4 Turbo', modalities: ['video'] },
  ],
  luma: [
    { id: 'ray-2', name: 'Ray 2', modalities: ['video'] },
    { id: 'ray-flash-2', name: 'Ray 2 Flash', modalities: ['video'] },
  ],
  kling: [
    { id: 'kling-v2', name: 'Kling 2.0', modalities: ['video'] },
    { id: 'kling-v2-master', name: 'Kling 2.0 Master', modalities: ['video'] },
  ],
  pika: [
    { id: 'pika-2.2', name: 'Pika 2.2', modalities: ['video'] },
    { id: 'pika-effects', name: 'Pika Effects', modalities: ['video'] },
  ],
  stability: [
    { id: 'stable-video-diffusion', name: 'Stable Video Diffusion', modalities: ['video'] },
    { id: 'stable-video-3', name: 'Stable Video 3', modalities: ['video'] },
  ],
  xai: [
    { id: 'grok-video', name: 'Grok Video', modalities: ['video'] },
  ],
  openai: [
    { id: 'sora', name: 'Sora', modalities: ['video'] },
  ],
};