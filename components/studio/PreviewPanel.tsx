'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { CompositionOverlay } from '@/components/studio/CompositionOverlay';
import { useStudioStore } from '@/store/useStudioStore';

const ScenePreviewMount = dynamic(
  () => import('@/components/studio/ScenePreviewMount').then((m) => m.ScenePreviewMount),
  { ssr: false },
);

export function PreviewPanel() {
  const previewFrameRef = useRef<HTMLDivElement>(null);
  const project = useStudioStore((s) => s.project);
  const isGenerating = useStudioStore((s) => s.isGenerating);
  const progressText = useStudioStore((s) => s.progressText);
  const showPreviewSuccess = useStudioStore((s) => s.showPreviewSuccess);
  const previewSuccessProvider = useStudioStore((s) => s.previewSuccessProvider);
  const previewSuccessPrompt = useStudioStore((s) => s.previewSuccessPrompt);
  const toggleCompositionOverlay = useStudioStore((s) => s.toggleCompositionOverlay);
  const shots = useStudioStore((s) => s.shots);
  const currentShot = useStudioStore((s) => s.currentShot);

  const shot = shots.find((s) => s.id === currentShot) || shots[0];
  const showOverlay = shot?.frameComposition?.showOverlay ?? true;

  useEffect(() => {
    const frame = previewFrameRef.current;
    if (!frame) return;

    const [w, h] = (project.aspectRatio || '16:9').split(':');
    frame.style.aspectRatio = `${w}/${h}`;

    const container = frame.parentElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const containerRatio = containerRect.width / containerRect.height;
    const targetRatio = parseInt(w) / parseInt(h);

    if (targetRatio > containerRatio) {
      frame.style.width = '100%';
      frame.style.height = 'auto';
    } else {
      frame.style.width = 'auto';
      frame.style.height = '100%';
    }

    frame.style.maxWidth = '100%';
    frame.style.maxHeight = '100%';
  }, [project.aspectRatio]);

  const resIndicator = (() => {
    const ar = project.aspectRatio;
    const res = project.resolution;
    return `${res} — ${ar} @ ${project.fps}fps`;
  })();

  return (
    <div className="flex-1 flex items-center justify-center p-4 md:p-8 min-h-0">
      <div className="relative w-full max-w-5xl h-full flex items-center justify-center">
        <div className="aspect-video w-full max-h-full bg-surface-800 rounded-xl border-2 border-surface-700 overflow-hidden shadow-2xl relative group">
          <div ref={previewFrameRef} className="preview-frame relative w-full h-full overflow-hidden bg-surface-900">
            <ScenePreviewMount observeRef={previewFrameRef} />

            {showPreviewSuccess && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-surface-900/85 backdrop-blur-sm text-center animate-fade-in">
                <div className="p-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-500/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-300 font-medium">Video Generated Successfully</p>
                  <p className="text-xs text-gray-500 mt-2">{previewSuccessProvider}</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto line-clamp-2">{previewSuccessPrompt}</p>
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="absolute inset-0 z-20 bg-surface-900/90 flex items-center justify-center backdrop-blur-sm">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-surface-600 border-t-brand-500 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-sm text-gray-300 font-medium">Generating video...</p>
                  <p className="text-xs text-gray-500 mt-1">{progressText}</p>
                </div>
              </div>
            )}
          </div>

          <CompositionOverlay />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-surface-900/80 backdrop-blur-md rounded-xl px-4 py-2 border border-surface-700 opacity-0 group-hover:opacity-100 transition-all z-20">
            <button
              type="button"
              onClick={toggleCompositionOverlay}
              className={`p-2 hover:bg-surface-700 rounded-lg transition-all ${showOverlay ? 'text-brand-400' : 'text-gray-500'}`}
              title="Toggle composition guides"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </button>
            <div className="h-6 w-px bg-surface-600" />
            <span className="text-xs text-gray-400">00:00 / 00:05</span>
          </div>

          <div className="absolute -top-3 right-4 bg-surface-800 border border-surface-700 px-3 py-1 rounded-lg text-xs text-gray-400">
            {resIndicator}
          </div>
        </div>
      </div>
    </div>
  );
}