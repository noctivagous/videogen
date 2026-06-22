'use client';

import { useMemo } from 'react';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { buildModelPayloadStack } from '@/lib/studio/model-payload';
import { formatReferenceRoleLabel } from '@/lib/studio/reference-slots';
import { shouldUseBakedStartFrameForVideo } from '@/lib/studio/workflow';
import { useStudioStore } from '@/store/useStudioStore';

const VARIANT_STYLES: Record<string, string> = {
  provider: 'payload-node-provider',
  project: 'payload-node-project',
  shot: 'payload-node-shot',
  references: 'payload-node-references',
  prompt: 'payload-node-prompt',
  composition: 'payload-node-composition',
  settings: 'payload-node-settings',
  output: 'payload-node-output',
};

export function PromptStackView() {
  const project = useStudioStore((s) => s.project);
  const camera = useStudioStore((s) => s.camera);
  const lighting = useStudioStore((s) => s.lighting);
  const motion = useStudioStore((s) => s.motion);
  const sceneSetup = useStudioStore((s) => s.sceneSetup);
  const shotActivity = useStudioStore((s) => s.shotActivity);
  const shots = useStudioStore((s) => s.shots);
  const currentShot = useStudioStore((s) => s.currentShot);
  const ai = useStudioStore((s) => s.ai);

  const shot = shots.find((s) => s.id === currentShot) || shots[0];

  const useBakedFrame = shouldUseBakedStartFrameForVideo(shot);
  const atmosphereText = shot?.lightingAtmospherePrompt?.trim() ?? '';
  const showAtmosphereOverlap = useBakedFrame && Boolean(atmosphereText);

  const stack = useMemo(
    () => buildModelPayloadStack({ project, camera, lighting, motion, sceneSetup, shotActivity, shot, ai }),
    [project, camera, lighting, motion, sceneSetup, shotActivity, shot, ai],
  );

  return (
    <div
      className="prompt-stack-view prompt-stack-view--panel h-full overflow-y-auto overflow-x-hidden bg-surface-900"
      {...uiSectionProps(UI_SECTIONS.studioPreviewPromptStack)}
    >
      <div className="prompt-stack-inner p-4 md:p-8 pt-16 md:pt-20">
        {showAtmosphereOverlap && (
          <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            <span className="font-semibold">Atmosphere (from bake)</span>
            <span className="mx-2 text-amber-400/60">·</span>
            <span className="text-amber-100/80">&ldquo;{atmosphereText}&rdquo;</span>
            <p className="mt-1.5 text-xs text-amber-300/70">
              This atmosphere was also sent to the Baked Image payload (Pass 1). Here it instructs the video
              model to animate the atmosphere — drifting fog, flickering light, falling rain, etc. —
              matching what was baked into the start frame.
            </p>
          </div>
        )}

        <section className="prompt-table-section mb-8" {...uiSectionProps(UI_SECTIONS.studioPromptTable)}>
          <h3 className="prompt-table-heading text-xs uppercase tracking-widest text-gray-300 mb-3 font-semibold">
            Prompt Table
          </h3>
          <table className="prompt-table">
            <thead>
              <tr>
                <th scope="col" className="prompt-table__source-head">Source</th>
                <th scope="col" className="prompt-table__text-head">Prompt</th>
              </tr>
            </thead>
            <tbody>
              {stack.promptTable.length > 0 ? (
                stack.promptTable.map((row, index) => (
                  <tr key={`${row.source}-${index}`}>
                    <td className="prompt-table__source">{row.source}</td>
                    <td className="prompt-table__text">{row.text}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="prompt-table__source prompt-table__source--empty">—</td>
                  <td className="prompt-table__text prompt-table__text--empty">
                    Empty — add scene setup or shot activity to generate
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <p className="prompt-stack-eyebrow text-xs uppercase tracking-widest text-gray-500 mb-5 font-semibold">
          API payload · assembled from your controls
        </p>

        <div className="payload-diagram-stack" {...uiSectionProps(UI_SECTIONS.studioPromptStackDiagram)}>
          {stack.blocks.map((block, index) => (
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
                  {block.refs && (
                    <div className="payload-ref-grid">
                      {block.refs.map((ref) => (
                        <div key={ref.url} className="payload-ref-card">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={ref.url} alt="" className="payload-ref-thumb" />
                          <span className="payload-ref-role">{formatReferenceRoleLabel(ref.role)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <details className="payload-mermaid-details mt-6" {...uiSectionProps(UI_SECTIONS.studioPromptStackMermaid)}>
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
            Mermaid flowchart source
          </summary>
          <pre className="payload-mermaid-source mt-2">{stack.mermaid}</pre>
        </details>
      </div>
    </div>
  );
}