'use client';

import { useMemo } from 'react';
import { MentionTextarea } from '@/components/ui/MentionTextarea';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { buildPromptMentionOptions } from '@/lib/studio/prompt-mentions';
import { ShotTimeline } from '@/components/studio/ShotTimeline';
import { useStudioStore } from '@/store/useStudioStore';

export function BottomBar() {
  const sceneSetup = useStudioStore((s) => s.sceneSetup);
  const shotActivity = useStudioStore((s) => s.shotActivity);
  const setSceneSetup = useStudioStore((s) => s.setSceneSetup);
  const setShotActivity = useStudioStore((s) => s.setShotActivity);
  const generate = useStudioStore((s) => s.generate);
  const isGenerating = useStudioStore((s) => s.isGenerating);
  const shots = useStudioStore((s) => s.shots);
  const currentShot = useStudioStore((s) => s.currentShot);

  const shot = shots.find((s) => s.id === currentShot) || shots[0];
  const hasAnyImage = shot?.references.some(Boolean) ?? false;
  const mentionOptions = useMemo(() => buildPromptMentionOptions(shot), [shot]);

  const textareaClass =
    'w-full bg-surface-700 hover:bg-surface-600 focus:bg-surface-600 border border-surface-600 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500 transition-all resize-none h-[80px]';

  return (
    <div className="border-t border-surface-700" {...uiSectionProps(UI_SECTIONS.studioBottomBar)}>
      <div className="p-4 space-y-3">
        <div className="flex gap-3 items-stretch">
          <div
            className="studio-bottom-panel flex-1 flex flex-col min-w-0"
            {...uiSectionProps(UI_SECTIONS.studioBottomPrompt)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <label className="text-xs uppercase tracking-wider font-semibold text-gray-300">Prompt</label>
              </div>
              {hasAnyImage && (
                <div className="text-[10px] text-gray-500 italic max-w-xs text-right">
                  References guide generation. Blocking preview shows framing only.
                </div>
              )}
            </div>
            <div className="flex gap-3 flex-1">
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <label className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Scene Setup</label>
                <MentionTextarea
                  value={sceneSetup}
                  onChange={setSceneSetup}
                  mentionOptions={mentionOptions}
                  placeholder={
                    hasAnyImage
                      ? 'Optional scene context. Type @ to insert a reference from a filled slot.'
                      : 'Describe the scene… Type @ to reference a filled slot image'
                  }
                  className={textareaClass}
                />
              </div>
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <label className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Shot Activity</label>
                <MentionTextarea
                  value={shotActivity}
                  onChange={setShotActivity}
                  mentionOptions={mentionOptions}
                  placeholder="Shot activity… Type @ to reference a filled slot image."
                  className={textareaClass}
                />
              </div>
            </div>
          </div>

          <div
            className="studio-bottom-panel studio-bottom-panel--generate shrink-0 flex"
            {...uiSectionProps(UI_SECTIONS.studioBottomGenerate)}
          >
            <button
              type="button"
              onClick={generate}
              disabled={isGenerating}
              className="w-full min-w-[5.5rem] bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-500 disabled:opacity-50 px-6 rounded-lg font-bold text-base transition-all shadow-lg shadow-brand-500/30 flex flex-col items-center justify-center gap-1 group"
            >
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Generate</span>
            </button>
          </div>
        </div>

        <ShotTimeline />
      </div>
    </div>
  );
}