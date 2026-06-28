import OpenAI from 'openai';

export const XAI_API_BASE = 'https://api.x.ai/v1';

export function createOpenAIClient(apiKey: string, baseURL: string): OpenAI {
  return new OpenAI({ apiKey, baseURL });
}

export function createXAIClient(apiKey: string): OpenAI {
  return createOpenAIClient(apiKey, XAI_API_BASE);
}
