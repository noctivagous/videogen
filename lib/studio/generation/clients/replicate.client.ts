import Replicate from 'replicate';

export function createReplicateClient(apiKey: string): Replicate {
  return new Replicate({ auth: apiKey, useFileOutput: false });
}
