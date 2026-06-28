import { InferenceClient } from '@huggingface/inference';

export function createHfInferenceClient(apiKey: string): InferenceClient {
  return new InferenceClient(apiKey);
}

export async function blobToDataUrl(blob: Blob, mimeType: string): Promise<string> {
  const buffer = Buffer.from(await blob.arrayBuffer());
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}
