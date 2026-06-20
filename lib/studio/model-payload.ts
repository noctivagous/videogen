import { formatResolutionWithLabel } from '@/lib/constants/resolutions';
import { getVideoProviderName, isCustomProvider } from '@/lib/storage/ai-settings';
import { getShotFrameComposition } from '@/lib/studio/composition';
import {
  augmentPromptForXAI,
  buildGenerationPrompt,
  buildGenerationRefs,
} from '@/lib/studio/generation-prompt';
import { getLookRecipe } from '@/lib/constants/look-recipes';
import { getVideoEnvironmentPreset } from '@/lib/constants/video-environment';
import {
  getActiveVideoLightingTechniques,
  getVideoLightingTechnique,
} from '@/lib/constants/video-lighting';
import { buildVideoLightingPrompt } from '@/lib/studio/video-lighting-prompt';
import { needsThemeTransformer } from '@/lib/studio/theme-transform';
import { buildPromptTable, type PromptTableRow } from '@/lib/studio/prompt-table';
import { expandPromptMentions } from '@/lib/studio/prompt-mentions';
import { getEffectiveModelId } from '@/lib/studio/provider-modalities';
import { formatReferenceRoleLabel, isCinematographyRefs } from '@/lib/studio/reference-slots';
import { CHANNEL_LABELS, getProviderCapabilities } from '@/lib/studio/provider-capabilities';
import {
  filterRefsForImageToVideoOnly,
  isXAIImageToVideoOnlyModel,
} from '@/lib/studio/xai-video-models';
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
  promptTable: PromptTableRow[];
}

export type { PromptTableRow };

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
  const videoModelId = getEffectiveModelId(ai);
  const capabilities = getProviderCapabilities(videoProviderId, isCustom, videoModelId);

  let refs = buildGenerationRefs(shot, lighting, project.aspectRatio);
  if (videoProviderId === 'xai' && isXAIImageToVideoOnlyModel(videoModelId)) {
    refs = filterRefsForImageToVideoOnly(refs);
  }
  const cinematographyRefs = isCinematographyRefs(shot);

  let combinedPrompt = buildGenerationPrompt({
    sceneSetup,
    shotActivity,
    camera,
    lighting,
    motion,
    shot,
  });

  if (refs.length > 0) {
    combinedPrompt = expandPromptMentions(combinedPrompt, shot, videoProviderId);
  }

  if (videoProviderId === 'xai' && refs.length > 0) {
    combinedPrompt = augmentPromptForXAI(combinedPrompt, refs, cinematographyRefs);
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
      lines: [
        ...refs.map((r) =>
          cinematographyRefs
            ? `${formatReferenceRoleLabel(r.role)} (@Image${r.slotIndex + 1})`
            : `Image${r.slotIndex + 1} (@Image${r.slotIndex + 1})`,
        ),
        cinematographyRefs
          ? 'Auto-roles — role-aware binding; @ImageN tokens optional.'
          : 'Manual — describe each image in your prompt or use @ImageN.',
      ],
      refs,
      variant: 'references',
    });
  }

  const activeRecipe = getLookRecipe(lighting.colorPalette?.activeLookRecipeId);
  const activeVideoLightingIds = getActiveVideoLightingTechniques(lighting);
  const videoLightingPrompt = buildVideoLightingPrompt(lighting);
  const activeVideoEnvironment = getVideoEnvironmentPreset(lighting.videoEnvironment?.presetId);
  const themeOn = needsThemeTransformer(lighting);
  const linkedSlots = shot?.themeTransformLinked
    ?.map((linked, i) => (linked ? i + 1 : null))
    .filter((v): v is number => v !== null) ?? [];
  const readySlots = shot?.themeTransformStatus
    ?.map((status, i) => (status === 'ready' ? i + 1 : null))
    .filter((v): v is number => v !== null) ?? [];
  const staleSlots = shot?.themeTransformStatus
    ?.map((status, i) => (status === 'stale' || status === 'error' ? i + 1 : null))
    .filter((v): v is number => v !== null) ?? [];

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
    ...(activeRecipe
      ? [
          {
            id: 'look-recipe',
            title: 'Look Recipe',
            lines: [`${activeRecipe.label} — compiled from controls`],
            variant: 'composition' as const,
          },
        ]
      : []),
    {
      id: 'theme-transformer',
      title: 'Theme Transformer',
      lines: [
        themeOn
          ? activeRecipe
            ? `Look: ${activeRecipe.label} — drag outlet to reference slots in preview`
            : 'Palette active — drag Theme Transformer outlet to reference slots'
          : 'Off — enable Color, B&W, FX, or a Look Library recipe',
        linkedSlots.length > 0
          ? `Linked slots: ${linkedSlots.map((n) => `@Image${n}`).join(', ')}`
          : 'No slots linked yet',
        readySlots.length > 0 ? `Transformed: ${readySlots.map((n) => `@Image${n}`).join(', ')}` : '',
        staleSlots.length > 0 ? `Stale — re-drag outlet: ${staleSlots.map((n) => `@Image${n}`).join(', ')}` : '',
      ].filter(Boolean),
      variant: 'composition',
    },
    {
      id: 'video-lighting',
      title: 'Lighting Techniques',
      lines: activeVideoLightingIds.length
        ? [
            activeVideoLightingIds
              .map((id) => getVideoLightingTechnique(id)?.label ?? id)
              .join(', '),
            videoLightingPrompt,
          ]
        : ['Off — no lighting techniques in video prompt'],
      variant: 'composition',
    },
    {
      id: 'video-environment',
      title: 'Atmosphere / Environment',
      lines: activeVideoEnvironment
        ? [activeVideoEnvironment.label, activeVideoEnvironment.promptPhrase]
        : ['Off — no atmospheric effects in video prompt'],
      variant: 'composition',
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
        `${formatResolutionWithLabel(project.resolution, project.aspectRatio, ' · ')} · ${project.aspectRatio} · ${project.fps}fps`,
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
    mermaidLines.push(
      `  refs["References\\n${refs.map((r) => formatReferenceRoleLabel(r.role)).join(', ')}"]`,
    );
    mermaidLines.push(`  ${prev} --> refs`);
    prev = 'refs';
  }

  mermaidLines.push(
    `  prompt["Assembled Prompt"]`,
    `  out["Output\\n${formatResolutionWithLabel(project.resolution, project.aspectRatio, ' · ')}"]`,
    `  ${prev} --> prompt`,
    '  prompt --> out',
  );

  const promptTable = buildPromptTable({
    sceneSetup,
    shotActivity,
    camera,
    lighting,
    motion,
    shot,
    providerId: videoProviderId,
    refs,
    cinematographyRefs,
  });

  return { blocks, mermaid: mermaidLines.join('\n'), combinedPrompt, promptTable };
}