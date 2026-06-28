import { OpenRouter } from '@openrouter/sdk';

export const OPENROUTER_HTTP_REFERER = 'https://videogen.local';
export const OPENROUTER_APP_TITLE = 'VideoGen';

export function createOpenRouterClient(apiKey: string): OpenRouter {
  return new OpenRouter({
    apiKey,
    httpReferer: OPENROUTER_HTTP_REFERER,
    appTitle: OPENROUTER_APP_TITLE,
  });
}
