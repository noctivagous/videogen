import { BUILT_IN_PROVIDERS } from '@/lib/constants/providers';
import { hasGenerationAdapter } from '@/lib/studio/generation/capabilities';
import { isXAIImageToVideoOnlyModel } from '@/lib/studio/xai-video-models';

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
const IMAGE_NOTE = 'Sent as reference still when Subject/Backdrop ref exists';
const PREVIEW_NOTE = 'Blocking preview & composition overlay only';
export function getProviderCapabilities(
  providerId: string,
  isCustom: boolean,
  videoModelId?: string,
): ProviderCapabilities {
  if (isCustom) {
    return {
      providerId: 'custom',
      providerLabel: 'Custom BYOK endpoint',
      apiFields: ['prompt', 'refs', 'duration', 'resolution', 'aspectRatio', 'fps'],
      summary: 'JSON POST to your /generate endpoint — field support depends on your API.',
      settings: baseSettings('prompt', IMAGE_NOTE),
    };
  }

  const builtIn = BUILT_IN_PROVIDERS.find((p) => p.id === providerId);
  const label = builtIn?.name ?? providerId;
  const generates = hasGenerationAdapter(providerId, false);

  if (generates) {
    const isXAI = providerId === 'xai';
    const xaiImageToVideoOnly = isXAI && isXAIImageToVideoOnlyModel(videoModelId);
    const subjectRefNote = xaiImageToVideoOnly
      ? 'Image 2 — not used by grok-imagine-video-1.5 (Image 1 only)'
      : isXAI
        ? 'Subject ref (Image 2) — role-tagged in reference-to-video prompt'
        : IMAGE_NOTE;
    const backdropRefNote = xaiImageToVideoOnly
      ? 'Image 1 — required starting frame, sent as API `image` (image-to-video only)'
      : isXAI
        ? 'Backdrop ref (Image 1) — role-tagged in reference-to-video prompt'
        : 'Sent as reference image when provider supports it (e.g. xAI)';
    const summary = xaiImageToVideoOnly
      ? `${label} BYOK adapter (grok-imagine-video-1.5): image-to-video only — Image 1 is the starting frame via API \`image\`. Prompt describes motion; camera, lighting, and motion controls are folded into the prompt.`
      : isXAI
        ? `${label} BYOK adapter: Subject + Backdrop use reference-to-video (both refs influence output without locking the first frame). Subject-only or Backdrop-only uses image-to-video (locks starting frame). Other providers send one image (Subject preferred). Camera, lighting, and motion are folded into the prompt.`
        : `${label} BYOK adapter sends your prompt and reference images using your API key. Only one reference image is sent (Subject preferred over Backdrop). Camera, lighting, and motion controls are folded into the assembled prompt.`;

    return {
      providerId,
      providerLabel: label,
      apiFields: ['prompt', 'refs', 'duration', 'resolution', 'aspectRatio'],
      summary,
      settings: [
        { id: 'prompt', label: 'Scene prompt', channel: 'api', note: 'Primary text input' },
        { id: 'refs-subject', label: 'Subject reference', channel: 'api', note: subjectRefNote },
        { id: 'refs-backdrop', label: 'Backdrop reference', channel: 'api', note: backdropRefNote },
        { id: 'field-size', label: 'Field size / coverage', channel: 'prompt', note: PROMPT_NOTE },
        { id: 'composition', label: 'Frame composition', channel: 'prompt', note: PROMPT_NOTE },
        { id: 'lens', label: 'Lens (type + focal length)', channel: 'prompt', note: PROMPT_NOTE },
        { id: 'angle', label: 'Camera angle', channel: 'prompt', note: PROMPT_NOTE },
        { id: 'movement', label: 'Camera movement', channel: 'prompt', note: PROMPT_NOTE },
        { id: 'lighting', label: 'Lighting & time of day', channel: 'prompt', note: PROMPT_NOTE },
        { id: 'motion', label: 'Subject motion', channel: 'prompt', note: PROMPT_NOTE },
        { id: 'blocking-preview', label: 'Blocking preview image', channel: 'preview-only', note: PREVIEW_NOTE },
        { id: 'resolution', label: 'Resolution / aspect / fps', channel: 'prompt', note: 'Passed when provider API supports it' },
        { id: 'duration', label: 'Clip duration', channel: 'prompt', note: 'Passed when provider API supports it' },
      ],
    };
  }

  return {
    providerId,
    providerLabel: label,
    apiFields: [],
    summary: `${label} is catalogued for BYOK setup. Connect and test your key — video generation adapter coming soon.`,
    settings: baseSettings('unused', 'Generation adapter not available yet'),
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