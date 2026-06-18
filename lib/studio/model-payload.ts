import { getCurrentProviderName } from '@/lib/storage/ai-settings';
import { getFullCameraPrompt, getShotFrameComposition } from '@/lib/studio/composition';
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

function buildCombinedPrompt(input: {
  prompt: string;
  compositionPrompt: string;
  camera: CameraSettings;
  lighting: LightingSettings;
  motion: MotionSettings;
  refs: { role: ReferenceRole; url: string }[];
}): string {
  const { prompt, compositionPrompt, camera, lighting, motion, refs } = input;

  const cameraLine = [
    compositionPrompt,
    `${camera.lensType} ${camera.focalLength}mm f/${camera.aperture}`,
    `${camera.angle.replace(/-/g, ' ')}, ${camera.movement.replace(/-/g, ' ')}`,
    `${camera.dof} depth of field`,
  ].filter(Boolean).join('. ');

  const lightingLine = [
    `${lighting.style} ${lighting.keyLight} key`,
    `${lighting.timeOfDay}, ${lighting.colorTemp}K`,
    lighting.atmosphere !== 'clear' ? `${lighting.atmosphere} atmosphere` : '',
  ].filter(Boolean).join('. ');

  const motionLine =
    motion.subjectAction === 'still'
      ? ''
      : `${motion.subjectAction} subject, ${motion.intensity} intensity`;

  const refLine = refs.length
    ? `Reference images (${refs.map((r) => r.role).join(', ')}) guide subject and environment.`
    : '';

  return [prompt.trim(), cameraLine, lightingLine, motionLine, refLine]
    .filter(Boolean)
    .join(' ');
}

export function buildModelPayloadStack(input: {
  project: ProjectSettings;
  camera: CameraSettings;
  lighting: LightingSettings;
  motion: MotionSettings;
  prompt: string;
  shot: Shot | undefined;
  ai: AIState;
}): ModelPayloadStack {
  const { project, camera, lighting, motion, prompt, shot, ai } = input;
  const frame = getShotFrameComposition(shot);
  const compositionPrompt = getFullCameraPrompt(camera, frame);
  const provider = getCurrentProviderName(ai);

  const refs = (shot?.references ?? [])
    .map((url, i) => ({ url, role: shot?.referenceRoles[i] ?? 'None' }))
    .filter((r): r is { role: ReferenceRole; url: string } => Boolean(r.url));

  const combinedPrompt = buildCombinedPrompt({
    prompt,
    compositionPrompt,
    camera,
    lighting,
    motion,
    refs,
  });

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
      id: 'assembled-prompt',
      title: 'Assembled Prompt',
      lines: combinedPrompt
        ? [combinedPrompt]
        : ['(empty — add a scene prompt to generate)'],
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