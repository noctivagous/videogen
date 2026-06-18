import { getVideoProviderName, isCustomProvider } from '@/lib/storage/ai-settings';
import { getShotFrameComposition } from '@/lib/studio/composition';
import {
  augmentPromptForXAI,
  buildGenerationPrompt,
  buildGenerationRefs,
} from '@/lib/studio/generation-prompt';
import { CHANNEL_LABELS, getProviderCapabilities } from '@/lib/studio/provider-capabilities';
import type {
  AIState,
  CameraSettings,
  LightingSettings,
  MotionSettings,
  ProjectSettings,
  ReferenceRole,
  Shot,
} from '@/lib/types/studio';

export interface PayloadStackBlock {
  id: string;
  title: string;
  lines: string[];
  chips?: string[];
  refs?: { role: ReferenceRole; url: string }[];
  variant: 'provider' | 'project' | 'shot' | 'references' | 'prompt' | 'composition' | 'settings' | 'output';
}

export interface ModelPayloadStack {
  blocks: PayloadStackBlock[];
  mermaid: string;
  combinedPrompt: string;
}

export function buildShotPrompt(sceneSetup: string, shotActivity: string): string {
  const setup = sceneSetup.trim();
  const activity = shotActivity.trim();
  if (!setup && !activity) return '';
  if (!setup) return activity;
  if (!activity) return setup;
  return `${setup} ${activity}`;
}

export function buildModelPayloadStack(input: {
  project: ProjectSettings;
  camera: CameraSettings;
  lighting: LightingSettings;
  motion: MotionSettings;
  sceneSetup: string;
  shotActivity: string;
  shot: Shot | undefined;
  ai: AIState;
}): ModelPayloadStack {
  const { project, camera, lighting, motion, sceneSetup, shotActivity, shot, ai } = input;
  getShotFrameComposition(shot);
  const videoProviderId = ai.defaultVideoProvider;
  const provider = getVideoProviderName(ai);
  const isCustom = isCustomProvider(videoProviderId, ai);
  const capabilities = getProviderCapabilities(videoProviderId, isCustom);

  const refs = buildGenerationRefs(shot);

  let combinedPrompt = buildGenerationPrompt({
    sceneSetup,
    shotActivity,
    camera,
    lighting,
    motion,
    shot,
    refs,
  });

  if (videoProviderId === 'xai' && refs.length > 0) {
    combinedPrompt = augmentPromptForXAI(combinedPrompt, refs);
  }

  const blocks: PayloadStackBlock[] = [
    {
      id: 'provider',
      title: 'AI Provider',
      lines: [provider],
      variant: 'provider',
    },
  ];

  if (refs.length) {
    blocks.push({
      id: 'references',
      title: 'Reference Images',
      lines: refs.map((r) => `${r.role}`),
      refs,
      variant: 'references',
    });
  }

  blocks.push(
    {
      id: 'model-io',
      title: 'What the model receives',
      lines: [
        capabilities.summary,
        `API fields: ${capabilities.apiFields.join(', ')}`,
      ],
      chips: capabilities.settings
        .filter((s) => s.channel === 'api' || s.channel === 'prompt')
        .map((s) => `${s.label} · ${CHANNEL_LABELS[s.channel]}`),
      variant: 'settings',
    },
    {
      id: 'assembled-prompt',
      title: 'Assembled Prompt',
      lines: combinedPrompt
        ? [combinedPrompt]
        : ['(empty — add scene setup or shot activity to generate)'],
      variant: 'prompt',
    },
    {
      id: 'output',
      title: 'Output',
      lines: [
        `${project.resolution} · ${project.aspectRatio} · ${project.fps}fps`,
        `${project.duration}s · ${shot?.name ?? 'Shot 01'}`,
      ],
      variant: 'output',
    },
  );

  const mermaidLines = [
    'flowchart TB',
    `  provider["AI Provider\\n${provider}"]`,
  ];

  let prev = 'provider';
  if (refs.length) {
    mermaidLines.push(`  refs["References\\n${refs.map((r) => r.role).join(', ')}"]`);
    mermaidLines.push(`  ${prev} --> refs`);
    prev = 'refs';
  }

  mermaidLines.push(
    `  prompt["Assembled Prompt"]`,
    `  out["Output\\n${project.resolution}"]`,
    `  ${prev} --> prompt`,
    '  prompt --> out',
  );

  return { blocks, mermaid: mermaidLines.join('\n'), combinedPrompt };
}