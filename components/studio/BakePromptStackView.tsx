'use client';

import { useMemo } from 'react';
import { useStudioStore } from '@/store/useStudioStore';
import {
  resolveBakeStartFramePass1Prompt,
  appendBakePromptAdditions,
} from '@/lib/studio/bake-start-frame';
import { buildIdentityPassPlan } from '@/lib/studio/bake-identity-pass';
import { getEffectivePreviewModelId } from '@/lib/studio/provider-modalities';
import { DEFAULT_XAI_BAKE_IMAGE_MODEL } from '@/lib/constants/workflows';
import { shouldUseBakedStartFrameForVideo } from '@/lib/studio/workflow';

const VARIANT_STYLES: Record<string, string> = {
  provider: 'payload-node-provider',
  project: 'payload-node-project',
  references: 'payload-node-references',
  prompt: 'payload-node-prompt',
  output: 'payload-node-output',
};

interface BakePayloadBlock {
  id: string;
  title: string;
  lines: string[];
  chips?: string[];
  refs?: { role: string; url: string }[];
  variant: 'provider' | 'project' | 'references' | 'prompt' | 'output';
}

export function BakePromptStackView() {
  const shots = useStudioStore((s) => s.shots);
  const currentShot = useStudioStore((s) => s.currentShot);
  const ai = useStudioStore((s) => s.ai);

  const shot = shots.find((s) => s.id === currentShot) || shots[0];

  const modelId = getEffectivePreviewModelId(ai) ?? DEFAULT_XAI_BAKE_IMAGE_MODEL;
  const hasAtmosphere = Boolean(shot?.lightingAtmospherePrompt?.trim());
  const atmosphereText = shot?.lightingAtmospherePrompt?.trim() ?? '';

  const hasBakedFrame = shouldUseBakedStartFrameForVideo(shot);

  const blocks = useMemo<BakePayloadBlock[]>(() => {
    if (!shot) return [];

    const result: BakePayloadBlock[] = [];

    result.push({
      id: 'provider',
      title: 'Image Edit Provider',
      variant: 'provider',
      lines: ['xAI · Grok Image Edit', `Model: ${modelId}`],
      chips: ['POST /v1/images/edits'],
    });

    const pass1Prompt = resolveBakeStartFramePass1Prompt(shot);

    result.push({
      id: 'pass1-input',
      title: 'Pass 1 Input — Composite',
      variant: 'references',
      lines: [
        'Backdrop with gray mannequin silhouettes composited on top.',
        'Rendered client-side from your backdrop + mannequin placement.',
      ],
      ...(shot.bakedIntermediateFrame || shot.bakedStartFrame
        ? { refs: [{ role: 'Composite (rendered)', url: shot.bakedIntermediateFrame ?? shot.bakedStartFrame ?? '' }] }
        : {}),
    });

    result.push({
      id: 'pass1-prompt',
      title: 'Pass 1 Prompt — Silhouette Edit',
      variant: 'prompt',
      lines: [pass1Prompt],
      ...(hasAtmosphere ? { chips: ['Includes atmosphere'] } : {}),
    });

    const identityPlan = buildIdentityPassPlan(shot, '<scene>');
    if (identityPlan) {
      identityPlan.passes.forEach((spec, i) => {
        const passNumber = i + 2;
        const subjectRefs = spec.refs.filter((r) => r.role === 'Subject');
        const identityPrompt = appendBakePromptAdditions(spec.prompt, shot.promptAdditions);

        result.push({
          id: `pass${passNumber}-refs`,
          title: `Pass ${passNumber} Input — Character References`,
          variant: 'references',
          lines: [`${subjectRefs.length} character sheet(s) sent alongside the Pass ${passNumber - 1} output.`],
          refs: subjectRefs.map((r) => ({ role: 'Character Sheet', url: r.url })),
        });

        result.push({
          id: `pass${passNumber}-prompt`,
          title: `Pass ${passNumber} Prompt — Identity`,
          variant: 'prompt',
          lines: [identityPrompt],
        });
      });
    } else {
      result.push({
        id: 'pass2-skipped',
        title: 'Pass 2 — Identity (skipped)',
        variant: 'prompt',
        lines: ['No mannequins are assigned to character sheets. Only Pass 1 runs.'],
      });
    }

    result.push({
      id: 'output',
      title: 'Output — Baked Start Frame',
      variant: 'output',
      lines: [
        hasBakedFrame
          ? 'Baked frame is ready and will be used as the locked start frame for video generation.'
          : 'No baked frame yet. Run Bake Start Frame to produce output.',
      ],
      ...(shot.bakedStartFrame ? { refs: [{ role: 'Baked Start Frame', url: shot.bakedStartFrame }] } : {}),
    });

    return result;
  }, [shot, modelId, hasAtmosphere, hasBakedFrame]);

  return (
    <div className="prompt-stack-view prompt-stack-view--panel h-full overflow-y-auto overflow-x-hidden bg-surface-900">
      <div className="prompt-stack-inner p-4 md:p-8 pt-16 md:pt-20">
        <p className="prompt-stack-eyebrow text-xs uppercase tracking-widest text-gray-500 mb-5 font-semibold">
          Baked Image API payload · image edit passes
        </p>

        {hasAtmosphere && (
          <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            <span className="font-semibold">Atmosphere overlap</span>
            <span className="mx-2 text-amber-400/60">·</span>
            <span className="text-amber-100/80">&ldquo;{atmosphereText}&rdquo;</span>
            <p className="mt-1.5 text-xs text-amber-300/70">
              This atmosphere text is appended to Pass 1 so the image looks right, and sent separately to the
              Video Payload as &ldquo;Preserve the atmosphere: …&rdquo; so the video model animates it correctly
              (drifting fog, flickering light, falling rain, etc.).
            </p>
          </div>
        )}

        <div className="payload-diagram-stack">
          {blocks.map((block, index) => (
            <div key={block.id} className="payload-diagram-step">
              {index > 0 && (
                <div className="payload-connector" aria-hidden>
                  <div className="payload-connector-line" />
                  <div className="payload-connector-arrow" />
                </div>
              )}
              <div className={`payload-node ${VARIANT_STYLES[block.variant] ?? ''}`}>
                <div className="payload-node-header">
                  <span className="payload-node-kind">{block.variant}</span>
                  <h4 className="payload-node-title">{block.title}</h4>
                </div>
                <div className="payload-node-body">
                  {block.lines.map((line, i) => (
                    <p key={i} className="payload-node-line">{line}</p>
                  ))}
                  {block.chips && (
                    <div className="payload-node-chips">
                      {block.chips.map((chip) => (
                        <span key={chip} className="payload-chip">{chip}</span>
                      ))}
                    </div>
                  )}
                  {block.refs && block.refs.length > 0 && (
                    <div className="payload-ref-grid">
                      {block.refs.map((ref, i) => (
                        <div key={`${ref.url}-${i}`} className="payload-ref-card">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={ref.url} alt="" className="payload-ref-thumb" />
                          <span className="payload-ref-role">{ref.role}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
