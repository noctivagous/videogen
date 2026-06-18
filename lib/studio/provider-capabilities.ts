export type SettingChannel = 'api' | 'prompt' | 'preview-only' | 'unused';

export interface SettingCapability {
  id: string;
  label: string;
  channel: SettingChannel;
  note?: string;
}

export interface ProviderCapabilities {
  providerId: string;
  providerLabel: string;
  apiFields: string[];
  settings: SettingCapability[];
  summary: string;
}

const PROMPT_NOTE = 'Included in assembled text prompt';
const IMAGE_NOTE = 'Sent as first_frame_image when Subject/Backdrop ref exists';
const PREVIEW_NOTE = 'Blocking preview & composition overlay only';
const UNUSED_NOTE = 'Not sent to this provider yet';

export function getProviderCapabilities(providerId: string, isCustom: boolean): ProviderCapabilities {
  if (isCustom) {
    return {
      providerId: 'custom',
      providerLabel: 'Custom provider',
      apiFields: ['prompt', 'refs', 'duration', 'resolution', 'aspectRatio', 'fps'],
      summary: 'JSON POST to your /generate endpoint — field support depends on your API.',
      settings: baseSettings('prompt', IMAGE_NOTE),
    };
  }

  if (providerId === 'replicate') {
    return {
      providerId: 'replicate',
      providerLabel: 'Replicate · MiniMax video-01',
      apiFields: ['prompt', 'first_frame_image', 'prompt_optimizer'],
      summary:
        'Structured API accepts prompt text and one reference still. All camera, lighting, and motion controls are interpreted via natural language in the prompt.',
      settings: [
        { id: 'prompt', label: 'Scene prompt', channel: 'api', note: 'Primary text input' },
        { id: 'refs-subject', label: 'Subject reference', channel: 'api', note: IMAGE_NOTE },
        { id: 'refs-backdrop', label: 'Backdrop reference', channel: 'prompt', note: 'Used in prompt text; image only if no Subject ref' },
        { id: 'field-size', label: 'Field size / coverage', channel: 'prompt', note: PROMPT_NOTE },
        { id: 'composition', label: 'Frame composition', channel: 'prompt', note: PROMPT_NOTE },
        { id: 'lens', label: 'Lens (type + focal length)', channel: 'prompt', note: PROMPT_NOTE },
        { id: 'angle', label: 'Camera angle', channel: 'prompt', note: PROMPT_NOTE },
        { id: 'movement', label: 'Camera movement', channel: 'prompt', note: 'Weak — most video models fix camera path' },
        { id: 'lighting', label: 'Lighting & time of day', channel: 'prompt', note: PROMPT_NOTE },
        { id: 'motion', label: 'Subject motion', channel: 'prompt', note: PROMPT_NOTE },
        { id: 'blocking-preview', label: 'Blocking preview image', channel: 'preview-only', note: PREVIEW_NOTE },
        { id: 'resolution', label: 'Resolution / aspect / fps', channel: 'unused', note: UNUSED_NOTE },
        { id: 'duration', label: 'Clip duration', channel: 'unused', note: 'Model outputs ~6s fixed length' },
      ],
    };
  }

  return {
    providerId,
    providerLabel: providerId,
    apiFields: [],
    summary: 'Provider not wired — settings are saved per shot but not sent until an adapter is added.',
    settings: baseSettings('unused', 'Not connected'),
  };
}

function baseSettings(channel: SettingChannel, note: string): SettingCapability[] {
  return [
    { id: 'prompt', label: 'Scene prompt', channel, note },
    { id: 'refs', label: 'Reference images', channel, note },
    { id: 'camera', label: 'Camera settings', channel, note },
    { id: 'lighting', label: 'Lighting', channel, note },
    { id: 'motion', label: 'Motion', channel, note },
  ];
}

export const CHANNEL_LABELS: Record<SettingChannel, string> = {
  api: 'API',
  prompt: 'Prompt',
  'preview-only': 'Preview',
  unused: '—',
};