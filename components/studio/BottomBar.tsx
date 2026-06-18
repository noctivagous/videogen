'use client';

import { ReferenceSlots } from '@/components/studio/ReferenceSlots';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { ShotTimeline } from '@/components/studio/ShotTimeline';
import { useStudioStore } from '@/store/useStudioStore';

export function BottomBar() {
  const prompt = useStudioStore((s) => s.prompt);
  const setPrompt = useStudioStore((s) => s.setPrompt);
  const generate = useStudioStore((s) => s.generate);
  const isGenerating = useStudioStore((s) => s.isGenerating);
  const shots = useStudioStore((s) => s.shots);
  const currentShot = useStudioStore((s) => s.currentShot);

  const shot = shots.find((s) => s.id === currentShot) || shots[0];
  const hasAnyImage = shot?.references.some(Boolean) ?? false;

  return (
    <div className="glass border-t border-surface-700" {...uiSectionProps(UI_SECTIONS.studioBottomBar)}>
      <div className="p-4 space-y-4">
        <div className="flex gap-4 items-end">
          <ReferenceSlots />

          <div className="flex-1 flex flex-col parameter-enclosure" {...uiSectionProps(UI_SECTIONS.studioBottomPrompt)}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <label className="text-xs uppercase tracking-wider font-semibold text-gray-300">Prompt</label>
              </div>
              {hasAnyImage && (
                <div className="text-[10px] text-gray-500 italic">Tip: Reference images will guide the generation.</div>
              )}
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                hasAnyImage
                  ? 'Describe how to use these references... e.g., A cinematic shot of the subject in this style...'
                  : 'Describe your scene... e.g., A cinematic shot of a person walking through a neon-lit cyberpunk city at night'
              }
              className="w-full bg-surface-700 hover:bg-surface-600 focus:bg-surface-600 border border-surface-600 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500 transition-all resize-none h-[80px]"
            />
          </div>

          <button
            type="button"
            onClick={generate}
            disabled={isGenerating}
            className="bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-500 disabled:opacity-50 px-6 h-[80px] rounded-xl font-bold text-base transition-all shadow-lg shadow-brand-500/30 flex flex-col items-center justify-center gap-1 group"
            {...uiSectionProps(UI_SECTIONS.studioBottomGenerate)}
          >
            <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Generate</span>
          </button>
        </div>

        <div {...uiSectionProps(UI_SECTIONS.studioBottomShotTimeline)}>
          <ShotTimeline />
        </div>
      </div>
    </div>
  );
}