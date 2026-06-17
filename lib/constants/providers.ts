import type { BuiltInProvider } from '@/lib/types/studio';

export const BUILT_IN_PROVIDERS: BuiltInProvider[] = [
  { id: 'runway', name: 'Runway ML', desc: 'Gen-3 Alpha • Cinematic text-to-video & motion brush', icon: '🎬', hint: 'Get your key from Runway dashboard → API' },
  { id: 'luma', name: 'Luma AI', desc: 'Dream Machine • Photorealistic motion and world models', icon: '🌌', hint: 'Create API key in Luma account settings' },
  { id: 'kling', name: 'Kling AI', desc: 'Kling 2.0 • High-fidelity motion and lip sync', icon: '🐉', hint: 'Available via Kling developer console' },
  { id: 'pika', name: 'Pika Labs', desc: 'Pika 2.2 • Creative effects, lip sync & stylization', icon: '⚡', hint: 'Access via Pika web or Discord integration' },
  { id: 'stability', name: 'Stability AI', desc: 'Stable Video 3 • Controllable open video diffusion', icon: '🔬', hint: 'Stability platform → API keys section' },
  { id: 'leonardo', name: 'Leonardo.AI', desc: 'Motion 2.0 • Character-consistent animation', icon: '🎨', hint: 'Leonardo dashboard → API & keys' },
  { id: 'replicate', name: 'Replicate', desc: 'Community video models • Run any open weights', icon: '🔄', hint: 'Create token at replicate.com/account/api-tokens' },
  { id: 'xai', name: 'xAI', desc: 'Grok Video • Reasoning-powered high quality generation', icon: '🚀', hint: 'xAI console → API keys (Grok Video access)' },
  { id: 'together', name: 'Together.AI', desc: 'Fast inference • Open video models at scale', icon: '🔗', hint: 'Together dashboard → API keys' },
  { id: 'fal', name: 'Fal.ai', desc: 'Serverless • Instant video & image-to-video APIs', icon: '⚡', hint: 'Fal dashboard → API keys' },
  { id: 'huggingface', name: 'Hugging Face', desc: 'Open video models • Inference Endpoints & Spaces', icon: '🤗', hint: 'HF settings → Access Tokens (with read/write)' },
  { id: 'minimax', name: 'Minimax', desc: 'Hailuo Video • Cinematic motion & prompt adherence', icon: '🌊', hint: 'Minimax developer portal → API credentials' },
  { id: 'viggle', name: 'Viggle', desc: 'Mix & Motion • Character animation from images', icon: '🕺', hint: 'Viggle account → API section' },
  { id: 'hedra', name: 'Hedra', desc: 'Expressive avatars • Talking head video with emotion', icon: '🎭', hint: 'Hedra platform → Developer API keys' },
  { id: 'openai', name: 'OpenAI', desc: 'Sora • Advanced world simulation & video', icon: '🔷', hint: 'OpenAI platform → API keys (Sora access)' },
];