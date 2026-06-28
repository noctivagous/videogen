import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  transpilePackages: ['poseblock'],
  serverExternalPackages: [
    '@fal-ai/client',
    '@huggingface/inference',
    '@openrouter/sdk',
    'openai',
    'replicate',
    'together-ai',
  ],
};

export default nextConfig;