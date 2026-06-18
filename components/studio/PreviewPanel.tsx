'use client';

import { useEffect, useMemo, useRef } from 'react';
import { CompositionOverlay } from '@/components/studio/CompositionOverlay';
import { GeneratedVideoStrip } from '@/components/studio/GeneratedVideoStrip';
import { FrameViewSegment } from '@/components/studio/FrameViewSegment';
import { ModelPreviewScene } from '@/components/studio/ModelPreviewScene';
import { PreviewSubModeSegment } from '@/components/studio/PreviewSubModeSegment';
import { PromptStackView } from '@/components/studio/PromptStackView';
import { ReferencePreviewScene } from '@/components/studio/ReferencePreviewScene';
import { previewFramingFingerprint } from '@/lib/constants/subject-cutouts';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { formatDuration } from '@/lib/studio/shot-display';
import { getShotActiveVideoUrl } from '@/lib/studio/shot-videos';
import { isPreviewFrameSupported } from '@/lib/studio/generation/preview-frame-supported';
import { isCustomProvider } from '@/lib/storage/ai-settings';
import { useStudioStore } from '@/store/useStudioStore';

function fitPreviewFrame(frame: HTMLElement, aspectRatio: string) {
  const [w, h] = aspectRatio.split(':').map(Number);
  if (!w || !h) return;

  const targetRatio = w / h;
  const container = frame.parentElement;
  if (!container) return;

  const { width: maxW, height: maxH } = container.getBoundingClientRect();
  if (maxW === 0 || maxH === 0) return;

  let frameW: number;
  let frameH: number;

  if (targetRatio > maxW / maxH) {
    frameW = maxW;
    frameH = maxW / targetRatio;
  } else {
    frameH = maxH;
    frameW = maxH * targetRatio;
  }

  frame.style.width = `${frameW}px`;
  frame.style.height = `${frameH}px`;
  frame.style.aspectRatio = `${w} / ${h}`;
}

export function PreviewPanel() {
  const previewFrameRef = useRef<HTMLDivElement>(null);
  const frameView = useStudioStore((s) => s.frameView);
  const setFrameView = useStudioStore((s) => s.setFrameView);
  const project = useStudioStore((s) => s.project);
  const camera = useStudioStore((s) => s.camera);
  const lighting = useStudioStore((s) => s.lighting);
  const motion = useStudioStore((s) => s.motion);
  const isGenerating = useStudioStore((s) => s.isGenerating);
  const isPreviewFrameGenerating = useStudioStore((s) => s.isPreviewFrameGenerating);
  const progressText = useStudioStore((s) => s.progressText);
  const previewFrameProgress = useStudioStore((s) => s.previewFrameProgress);
  const showPreviewSuccess = useStudioStore((s) => s.showPreviewSuccess);
  const previewSuccessProvider = useStudioStore((s) => s.previewSuccessProvider);
  const previewSuccessPrompt = useStudioStore((s) => s.previewSuccessPrompt);
  const toggleCompositionOverlay = useStudioStore((s) => s.toggleCompositionOverlay);
  const shots = useStudioStore((s) => s.shots);
  const currentShot = useStudioStore((s) => s.currentShot);
  const previewSubMode = useStudioStore((s) => s.previewSubMode);
  const setPreviewSubMode = useStudioStore((s) => s.setPreviewSubMode);
  const generatePreviewFrame = useStudioStore((s) => s.generatePreviewFrame);
  const ai = useStudioStore((s) => s.ai);

  const shot = shots.find((s) => s.id === currentShot) || shots[0];
  const showOverlay = shot?.frameComposition?.showOverlay ?? true;
  const generatedVideo = getShotActiveVideoUrl(shot);
  const modelPreviewUrl = shot?.previewFrameUrl ?? null;
  const shotDuration = shot?.duration ?? project.duration;
  const timecode = `00:00 / ${formatDuration(shotDuration)}`;

  const payload = useMemo(
    () => ({
      project,
      camera: shot?.camera ?? camera,
      lighting: shot?.lighting ?? lighting,
      motion: shot?.motion ?? motion,
      shot,
    }),
    [project, camera, lighting, motion, shot],
  );

  const currentFingerprint = previewFramingFingerprint(
    shot?.camera ?? camera,
    project.aspectRatio || '16:9',
  );
  const modelStale = Boolean(
    modelPreviewUrl &&
    shot?.previewFrameFingerprint &&
    shot.previewFrameFingerprint !== currentFingerprint,
  );

  const imageProviderId = ai.defaultImageProvider;
  const isCustom = isCustomProvider(imageProviderId, ai);
  const canQuickPreview = isPreviewFrameSupported(imageProviderId, isCustom);

  useEffect(() => {
    const frame = previewFrameRef.current;
    if (!frame) return;

    const update = () => fitPreviewFrame(frame, project.aspectRatio || '16:9');

    update();
    const observer = new ResizeObserver(update);
    const container = frame.parentElement;
    if (container) observer.observe(container);

    return () => observer.disconnect();
  }, [project.aspectRatio]);

  const resIndicator = `${project.resolution} — ${project.aspectRatio} @ ${project.fps}fps`;

  const previewBadge = generatedVideo
    ? 'Generated video'
    : previewSubMode === 'model' && modelPreviewUrl
      ? 'AI model preview'
      : 'Framing guide';

  const showFramingGuides =
    frameView === 'preview' && !generatedVideo && previewSubMode === 'framing';

  const renderPreviewContent = () => {
    if (generatedVideo) {
      return (
        <video
          key={generatedVideo}
          src={generatedVideo}
          className="absolute inset-0 w-full h-full object-cover"
          controls
          playsInline
          loop
        />
      );
    }
    if (previewSubMode === 'model' && modelPreviewUrl) {
      return (
        <ModelPreviewScene payload={payload} imageUrl={modelPreviewUrl} stale={modelStale} />
      );
    }
    return <ReferencePreviewScene payload={payload} />;
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 md:p-8 min-h-0" {...uiSectionProps(UI_SECTIONS.studioPreviewPanel)}>
      <div className="relative w-full h-full max-w-5xl flex items-center justify-center">
        {shot && (
          <div className="absolute top-0 left-0 z-10 bg-surface-800 border border-surface-700 px-3 py-1 rounded-lg text-xs font-semibold text-gray-300">
            {shot.name}
          </div>
        )}
        <div
          ref={previewFrameRef}
          className="preview-frame relative bg-surface-800 rounded-xl border-2 border-surface-700 overflow-hidden shadow-2xl group shrink-0"
          {...uiSectionProps(UI_SECTIONS.studioPreviewFrame)}
        >
          <div className="absolute inset-0 bg-surface-900" {...uiSectionProps(UI_SECTIONS.studioPreviewContent)}>
            {frameView === 'preview' ? renderPreviewContent() : <PromptStackView />}

            {showPreviewSuccess && (
              <div
                className="absolute inset-0 z-30 flex items-center justify-center bg-surface-900/85 backdrop-blur-sm text-center animate-fade-in"
                {...uiSectionProps(UI_SECTIONS.studioPreviewSuccessOverlay)}
              >
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
              <div
                className="absolute inset-0 z-20 bg-surface-900/90 flex items-center justify-center backdrop-blur-sm"
                {...uiSectionProps(UI_SECTIONS.studioPreviewGeneratingOverlay)}
              >
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-surface-600 border-t-brand-500 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-sm text-gray-300 font-medium">Generating video...</p>
                  <p className="text-xs text-gray-500 mt-1">{progressText}</p>
                </div>
              </div>
            )}

            {isPreviewFrameGenerating && (
              <div className="absolute inset-0 z-20 bg-surface-900/90 flex items-center justify-center backdrop-blur-sm">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-surface-600 border-t-brand-500 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-300 font-medium">Generating preview frame...</p>
                  <p className="text-xs text-gray-500 mt-1">{previewFrameProgress}</p>
                </div>
              </div>
            )}
          </div>

          {showFramingGuides && <CompositionOverlay />}

          <div className="absolute top-3 left-3 z-30 flex flex-col gap-2">
            <FrameViewSegment value={frameView} onChange={setFrameView} />
            {frameView === 'preview' && !generatedVideo && (
              <PreviewSubModeSegment
                value={previewSubMode}
                onChange={setPreviewSubMode}
                hasModelPreview={Boolean(modelPreviewUrl)}
                modelStale={modelStale}
              />
            )}
          </div>

          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-surface-900/80 backdrop-blur-md rounded-xl px-4 py-2 border border-surface-700 opacity-0 group-hover:opacity-100 transition-all z-20"
            {...uiSectionProps(UI_SECTIONS.studioPreviewHoverBar)}
          >
            <button
              type="button"
              onClick={toggleCompositionOverlay}
              className={`p-2 hover:bg-surface-700 rounded-lg transition-all ${showOverlay ? 'text-brand-400' : 'text-gray-500'}`}
              title="Toggle composition guides"
              disabled={!showFramingGuides}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </button>
            <div className="h-6 w-px bg-surface-600" />
            {frameView === 'preview' && !generatedVideo && (
              <>
                <button
                  type="button"
                  onClick={() => generatePreviewFrame()}
                  disabled={!canQuickPreview || isPreviewFrameGenerating || isGenerating}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
                  title={canQuickPreview ? 'Generate a single AI preview frame' : 'Configure an image provider (xAI, OpenAI, or Replicate) in Settings'}
                >
                  Quick Preview (1 gen)
                </button>
                <div className="h-6 w-px bg-surface-600" />
              </>
            )}
            <span
              className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-lg border ${
                generatedVideo
                  ? 'text-brand-300 bg-brand-500/20 border-brand-500/40'
                  : previewSubMode === 'model' && modelPreviewUrl
                    ? 'text-brand-300 bg-brand-500/15 border-brand-500/30'
                    : 'text-gray-400 bg-surface-700/80 border-surface-600'
              }`}
              {...uiSectionProps(UI_SECTIONS.studioPreviewBlockingLabel)}
            >
              {previewBadge}
            </span>
            {frameView === 'preview' && generatedVideo && shot && (
              <>
                <div className="h-6 w-px bg-surface-600" />
                <GeneratedVideoStrip shot={shot} />
              </>
            )}
            <div className="h-6 w-px bg-surface-600" />
            <span className="text-xs text-gray-400">{timecode}</span>
          </div>

          <div
            className="absolute -top-3 right-4 bg-surface-800 border border-surface-700 px-3 py-1 rounded-lg text-xs text-gray-400 z-20"
            {...uiSectionProps(UI_SECTIONS.studioPreviewResolutionBadge)}
          >
            {resIndicator}
          </div>
        </div>
      </div>
    </div>
  );
}