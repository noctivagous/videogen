import Together from 'together-ai';

export function createTogetherClient(apiKey: string): Together {
  return new Together({ apiKey });
}
