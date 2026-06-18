'use client';

import { useMemo } from 'react';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { buildModelPayloadStack } from '@/lib/studio/model-payload';
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
  const prompt = useStudioStore((s) => s.prompt);
  const shots = useStudioStore((s) => s.shots);
  const currentShot = useStudioStore((s) => s.currentShot);
  const ai = useStudioStore((s) => s.ai);

  const shot = shots.find((s) => s.id === currentShot) || shots[0];

  const stack = useMemo(
    () => buildModelPayloadStack({ project, camera, lighting, motion, prompt, shot, ai }),
    [project, camera, lighting, motion, prompt, shot, ai],
  );

  return (
    <div
      className="prompt-stack-view absolute inset-0 overflow-y-auto overflow-x-hidden bg-surface-900/95 backdrop-blur-sm"
      {...uiSectionProps(UI_SECTIONS.studioPreviewPromptStack)}
    >
      <div className="prompt-stack-inner p-4 md:p-6">
        <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-4 font-semibold">
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