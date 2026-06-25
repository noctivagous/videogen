'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { BakedImageVariantSegment } from '@/components/studio/BakedImageVariantSegment';
import { BackdropFramingEditStack, BackdropFramingLayer } from '@/components/studio/BackdropFramingLayer';
import {
  BackdropFramingControlsInFrame,
  BackdropFramingControlsOverflow,
} from '@/components/studio/BackdropFramingControls';
import { CompositionOverlay } from '@/components/studio/CompositionOverlay';
import { GeneratedVideoStrip } from '@/components/studio/GeneratedVideoStrip';
import { GeneratedVideoDropdown } from '@/components/studio/GeneratedVideoDropdown';
import { FrameViewSegment } from '@/components/studio/FrameViewSegment';
import { GenerationProgressOverlay } from '@/components/studio/GenerationProgressOverlay';
import { MannequinPlacementLayer } from '@/components/studio/MannequinPlacementLayer';
import {
  PoseBlockCompositorEmbed,
  usePoseBlockCompositorProps,
} from '@/components/studio/PoseBlockCompositorEmbed';
import { ModelPreviewScene } from '@/components/studio/ModelPreviewScene';
import { PreviewProjectSettingsBar } from '@/components/studio/PreviewProjectSettingsBar';
import { LoadAssetModal } from '@/components/studio/LoadAssetModal';
import { MediaLibraryViewer } from '@/components/studio/media-library/MediaLibraryViewer';
import { PreviewSubModeSegment } from '@/components/studio/PreviewSubModeSegment';
import { BakePromptStackView } from '@/components/studio/BakePromptStackView';
import { PromptStackView } from '@/components/studio/PromptStackView';
import { ReferencePreviewScene } from '@/components/studio/ReferencePreviewScene';
import type { BakedImageVariant } from '@/lib/types/studio';
import {
  getWorkflowReferenceSteps,
  isBakeStartFrame,
} from '@/lib/studio/workflow';
import { migrateMannequins } from '@/lib/studio/migrate-mannequin';
import { previewFramingFingerprint } from '@/lib/constants/subject-cutouts';
import {
  getEffectiveBackdropSourceUrl,
  isBackdropCropCommitted,
} from '@/lib/studio/backdrop-framing';
import type { AspectRatio } from '@/lib/types/studio';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { isShotDesignerPanel, isStudioAppPanel } from '@/lib/studio/studio-routes';
import { useNavigateToStudioPanel } from '@/hooks/use-studio-panel-navigation';
import { AppPlaceholderPanel } from '@/components/studio/AppPlaceholderPanel';
import { CharacterManager } from '@/components/studio/character-manager/CharacterManager';
import { LocationManager } from '@/components/studio/location-manager/LocationManager';
import { formatDuration } from '@/lib/studio/shot-display';
import { getGeneratedVideoCount, getShotActiveVideoUrl } from '@/lib/studio/shot-videos';
import { isPreviewFrameSupported } from '@/lib/studio/generation/preview-frame-supported';

import { isCustomProvider } from '@/lib/storage/ai-settings';
import { useStudioStore } from '@/store/useStudioStore';

function fitPreviewFrame(
  frame: HTMLElement,
  container: HTMLElement,
  aspectRatio: string,
) {
  const [w, h] = aspectRatio.split(':').map(Number);
  if (!w || !h) return;

  const targetRatio = w / h;

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

/** Set NEXT_PUBLIC_POSEBLOCK_COMPOSITOR=1 to enable 3D compositor in framing mode. */
const COMPOSITOR_ENABLED = process.env.NEXT_PUBLIC_POSEBLOCK_COMPOSITOR === '1';

export function PreviewPanel() {
  const previewStageRef = useRef<HTMLDivElement>(null);
  const previewFrameRef = useRef<HTMLDivElement>(null);
  const frameView = useStudioStore((s) => s.frameView);
  const setFrameView = useStudioStore((s) => s.setFrameView);
  const workspaceView = useStudioStore((s) => s.workspaceView);
  const navigateToPanel = useNavigateToStudioPanel();
  const isShotDesigner = isShotDesignerPanel(workspaceView);
  const project = useStudioStore((s) => s.project);
  const camera = useStudioStore((s) => s.camera);
  const lighting = useStudioStore((s) => s.lighting);
  const motion = useStudioStore((s) => s.motion);
  const isGenerating = useStudioStore((s) => s.isGenerating);
  const isPreviewFrameGenerating = useStudioStore((s) => s.isPreviewFrameGenerating);
  const progressText = useStudioStore((s) => s.progressText);
  const progressDetail = useStudioStore((s) => s.progressDetail);
  const previewFrameProgress = useStudioStore((s) => s.previewFrameProgress);
  const previewFrameProgressDetail = useStudioStore((s) => s.previewFrameProgressDetail);
  const showPreviewSuccess = useStudioStore((s) => s.showPreviewSuccess);
  const previewSuccessProvider = useStudioStore((s) => s.previewSuccessProvider);
  const previewSuccessPrompt = useStudioStore((s) => s.previewSuccessPrompt);
  const toggleCompositionOverlay = useStudioStore((s) => s.toggleCompositionOverlay);
  const shots = useStudioStore((s) => s.shots);
  const currentShot = useStudioStore((s) => s.currentShot);
  const previewSubMode = useStudioStore((s) => s.previewSubMode);
  const setPreviewSubMode = useStudioStore((s) => s.setPreviewSubMode);
  const generatePreviewFrame = useStudioStore((s) => s.generatePreviewFrame);
  const resetBackdropFraming = useStudioStore((s) => s.resetBackdropFraming);
  const updateMannequin = useStudioStore((s) => s.updateMannequin);
  const removeMannequin = useStudioStore((s) => s.removeMannequin);
  const isBakingStartFrame = useStudioStore((s) => s.isBakingStartFrame);
  const bakeProgress = useStudioStore((s) => s.bakeProgress);
  const bakeProgressDetail = useStudioStore((s) => s.bakeProgressDetail);
  const bakeStartFrameAction = useStudioStore((s) => s.bakeStartFrame);
  const saveBakedFrameToAssets = useStudioStore((s) => s.saveBakedFrameToAssets);
  const loadBakedFrameFromAsset = useStudioStore((s) => s.loadBakedFrameFromAsset);
  const ai = useStudioStore((s) => s.ai);
  const selectedMannequinIds = useStudioStore((s) => s.selectedMannequinIds);
  const selectMannequin = useStudioStore((s) => s.selectMannequin);
  const clearMannequinSelection = useStudioStore((s) => s.clearMannequinSelection);
  const compositorProps = usePoseBlockCompositorProps();
  const [bakedImageVariant, setBakedImageVariant] = useState<BakedImageVariant>('final');
  const [loadAssetOpen, setLoadAssetOpen] = useState(false);

  const shot = shots.find((s) => s.id === currentShot) || shots[0];
  const mannequins = useMemo(
    () => migrateMannequins(shot?.mannequins),
    [shot?.mannequins],
  );
  const showOverlay = shot?.frameComposition?.showOverlay ?? true;
  const generatedVideo = getShotActiveVideoUrl(shot);
  const generatedVideoCount = getGeneratedVideoCount(shot);
  const bakeStartFrame = isBakeStartFrame(shot);
  const bakedPreviewUrl = shot?.bakedStartFrame ?? null;
  const bakedIntermediateUrl = shot?.bakedIntermediateFrame ?? null;
  const hasBakeVariantChoice =
    bakeStartFrame &&
    Boolean(bakedIntermediateUrl) &&
    Boolean(bakedPreviewUrl) &&
    bakedIntermediateUrl !== bakedPreviewUrl;
  const activeBakedUrl =
    bakedImageVariant === 'intermediate' && bakedIntermediateUrl
      ? bakedIntermediateUrl
      : bakedPreviewUrl;
  const modelPreviewUrl =
    bakeStartFrame && activeBakedUrl
      ? activeBakedUrl
      : shot?.previewFrameUrl ?? null;
  const hasBakedImage = bakeStartFrame
    ? Boolean(bakedPreviewUrl)
    : Boolean(shot?.previewFrameUrl);
  const workflowSteps = useMemo(
    () =>
      shot
        ? getWorkflowReferenceSteps(shot, shot.lighting, (project.aspectRatio || '16:9') as AspectRatio)
        : [],
    [shot, project.aspectRatio],
  );
  const checklistIncomplete = workflowSteps.some((step) => !step.done && step.id !== 'bake');
  const showBakedEmptyState =
    frameView === 'preview' && previewSubMode === 'model' && bakeStartFrame && !modelPreviewUrl;
  const showModelPreview = Boolean(modelPreviewUrl) && previewSubMode === 'model';
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
    if (frameView === 'bake-prompt' && !bakeStartFrame) {
      setFrameView('preview');
    }
  }, [bakeStartFrame, frameView, setFrameView]);

  useEffect(() => {
    if (frameView === 'prompt' || frameView === 'bake-prompt') return;
    if (!isShotDesigner) return;

    const frame = previewFrameRef.current;
    const container = previewStageRef.current;
    if (!frame || !container) return;

    const update = () => fitPreviewFrame(frame, container, project.aspectRatio || '16:9');

    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);

    return () => observer.disconnect();
  }, [project.aspectRatio, frameView, workspaceView, isShotDesigner]);

  useEffect(() => {
    if (frameView === 'generated' && !generatedVideo) {
      setFrameView('preview');
    }
  }, [frameView, generatedVideo, setFrameView]);

  useEffect(() => {
    if (!hasBakeVariantChoice && bakedImageVariant !== 'final') {
      setBakedImageVariant('final');
    }
  }, [hasBakeVariantChoice, bakedImageVariant]);

  const previewBadge =
    frameView === 'generated' && generatedVideo
      ? 'Generated video'
      : showModelPreview
        ? bakeStartFrame && bakedPreviewUrl
          ? bakedImageVariant === 'intermediate' && hasBakeVariantChoice
            ? 'Intermediate bake'
            : 'Baked image'
          : 'AI model preview'
        : 'Blocking';

  const showFramingGuides =
    frameView === 'preview' && !showModelPreview && previewSubMode === 'framing';

  const aspectRatio = (project.aspectRatio || '16:9') as AspectRatio;
  const backdropSourceUrl = shot ? getEffectiveBackdropSourceUrl(shot, shot.lighting) : null;
  const backdropCropCommitted = shot ? isBackdropCropCommitted(shot, aspectRatio) : false;
  const showFramingBackdrop = showFramingGuides && Boolean(backdropSourceUrl);
  const showBackdropEditStack = showFramingBackdrop && !backdropCropCommitted;

  const renderPreviewContent = () => {
    if (showBakedEmptyState && shot) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center bg-surface-900/80">
          <p className="text-sm font-semibold text-gray-200">No baked start frame yet</p>
          <p className="text-xs text-gray-500 max-w-xs">
            Complete the checklist and bake, or load a previously saved frame from Assets.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
            <button
              type="button"
              onClick={() => setLoadAssetOpen(true)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-surface-600 hover:bg-surface-700 text-gray-200 transition-colors"
            >
              Load from Assets
            </button>
            <button
              type="button"
              onClick={() => void bakeStartFrameAction()}
              disabled={isBakingStartFrame || checklistIncomplete}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white transition-colors"
            >
              Bake Start Frame
            </button>
          </div>
        </div>
      );
    }
    if (showModelPreview && modelPreviewUrl) {
      return (
        <ModelPreviewScene payload={payload} imageUrl={modelPreviewUrl} stale={modelStale} />
      );
    }
    if (frameView === 'preview' && previewSubMode === 'framing') {
      if (COMPOSITOR_ENABLED) {
        return (
          <PoseBlockCompositorEmbed
            mannequins={mannequins}
            backdropUrl={backdropSourceUrl}
            aspectRatio={aspectRatio}
            selectedIds={compositorProps.selectedMannequinIds}
            onSelect={compositorProps.onSelect}
            onInstanceChange={compositorProps.onInstanceChange}
            shot={shot}
          />
        );
      }
      return (
        <>
          <ReferencePreviewScene
            payload={payload}
            backdropOnly
            hideBackdrop={showFramingBackdrop}
          />
          <MannequinPlacementLayer
            mannequins={mannequins}
            selectedId={selectedMannequinIds[0] ?? null}
            onSelect={(id, options) => {
              if (id === null) clearMannequinSelection();
              else selectMannequin(id, options);
            }}
            onUpdate={updateMannequin}
            onRemove={removeMannequin}
          />
        </>
      );
    }
    return (
      <ReferencePreviewScene
        payload={payload}
        backdropOnly
        hideBackdrop={showFramingBackdrop}
      />
    );
  };

  const renderMainContent = () => {
    if (frameView === 'generated' && generatedVideo) {
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
    return renderPreviewContent();
  };

  return (
    <div
      className="relative flex-1 min-h-0 overflow-hidden"
      {...uiSectionProps(UI_SECTIONS.studioPreviewPanel)}
    >
      <div
        className="absolute inset-x-0 top-0 z-30 pointer-events-none flex items-start justify-between gap-3"
        {...uiSectionProps(UI_SECTIONS.studioPreviewMainChrome)}
      >
        {isShotDesigner && (
        <div className="preview-panel-controls pointer-events-auto shrink-0 flex flex-col gap-1.5">
          <div className="preview-panel-frame-view-row flex items-center gap-2">
            <FrameViewSegment
              value={frameView}
              onChange={setFrameView}
              generatedVideoCount={generatedVideoCount}
              showBakePromptTab={bakeStartFrame}
            />
            {frameView === 'generated' && generatedVideoCount > 0 && shot && (
              <GeneratedVideoDropdown shot={shot} />
            )}
          </div>
        </div>
        )}
      </div>

      {frameView === 'bake-prompt' && isShotDesigner && (
        <div className="absolute inset-0 z-10 min-h-0">
          <BakePromptStackView />
        </div>
      )}

      {frameView === 'prompt' && isShotDesigner && (
        <div className="absolute inset-0 z-10 min-h-0">
          <PromptStackView />
        </div>
      )}

      {workspaceView === 'media-library' && (
        <div className="absolute inset-0 z-10 min-h-0">
          <MediaLibraryViewer onBack={() => navigateToPanel('shot-designer')} />
        </div>
      )}

      {workspaceView === 'character-sheet-generator' && (
        <div className="absolute inset-0 z-10 min-h-0">
          <CharacterManager />
        </div>
      )}

      {workspaceView === 'location-manager' && (
        <div className="absolute inset-0 z-10 min-h-0">
          <LocationManager />
        </div>
      )}

      {isStudioAppPanel(workspaceView) && workspaceView !== 'character-sheet-generator' && workspaceView !== 'location-manager' && (
        <div className="absolute inset-0 z-10 min-h-0">
          <AppPlaceholderPanel appId={workspaceView} />
        </div>
      )}

      {frameView !== 'prompt' && frameView !== 'bake-prompt' && isShotDesigner && (
      <div className="preview-panel-stage-shell p-4 md:p-8">
        <div
          ref={previewStageRef}
          className="relative w-full h-full max-w-5xl flex items-center justify-start min-h-0"
        >
          {showBackdropEditStack && shot && backdropSourceUrl && (
            <>
              <BackdropFramingLayer
                stageRef={previewStageRef}
                frameRef={previewFrameRef}
                imageUrl={backdropSourceUrl}
                shot={shot}
                aspectRatio={aspectRatio}
                part="dimmed"
                positionMode="stage"
              />
              <BackdropFramingControlsOverflow
                stageRef={previewStageRef}
                frameRef={previewFrameRef}
                imageUrl={backdropSourceUrl}
                shot={shot}
                aspectRatio={aspectRatio}
              />
            </>
          )}
          <div className="preview-frame-stage shrink-0 relative z-10">
            <div className="preview-frame-stage__settings">
              <PreviewProjectSettingsBar />
            </div>
            <div
              ref={previewFrameRef}
              className={`preview-frame-stage__frame preview-frame relative rounded-xl border-2 border-surface-700 overflow-hidden shadow-2xl group ${
                showFramingBackdrop ? 'bg-transparent' : 'bg-surface-800'
              }`}
              {...uiSectionProps(UI_SECTIONS.studioPreviewFrame)}
            >
          <div
            className={`preview-frame-clip absolute inset-0 ${showFramingBackdrop ? 'bg-transparent' : 'bg-surface-900'} ${showBackdropEditStack ? 'pointer-events-none' : ''}`}
            {...uiSectionProps(UI_SECTIONS.studioPreviewContent)}
          >
            {backdropCropCommitted && shot && backdropSourceUrl && !showModelPreview && (
              <BackdropFramingLayer
                stageRef={previewStageRef}
                frameRef={previewFrameRef}
                imageUrl={backdropSourceUrl}
                shot={shot}
                aspectRatio={aspectRatio}
                part="crop"
                positionMode="frame"
              />
            )}
            {showBackdropEditStack && shot && backdropSourceUrl && (
              <BackdropFramingEditStack
                frameRef={previewFrameRef}
                imageUrl={backdropSourceUrl}
                shot={shot}
                aspectRatio={aspectRatio}
              />
            )}
            {renderMainContent()}

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
                <GenerationProgressOverlay
                  title="Generating video"
                  message={progressText || 'Starting…'}
                  detail={progressDetail}
                />
              </div>
            )}

            {isPreviewFrameGenerating && (
              <div className="absolute inset-0 z-20 bg-surface-900/90 flex items-center justify-center backdrop-blur-sm">
                <GenerationProgressOverlay
                  title="Generating preview frame"
                  message={previewFrameProgress || 'Starting…'}
                  detail={previewFrameProgressDetail}
                  size="sm"
                />
              </div>
            )}

            {isBakingStartFrame && (
              <div className="absolute inset-0 z-20 bg-surface-900/90 flex items-center justify-center backdrop-blur-sm">
                <GenerationProgressOverlay
                  title="Baking start frame"
                  message={bakeProgress || 'Starting…'}
                  detail={bakeProgressDetail}
                  size="sm"
                />
              </div>
            )}
          </div>

          {showBackdropEditStack && shot && backdropSourceUrl && (
            <BackdropFramingControlsInFrame
              stageRef={previewStageRef}
              frameRef={previewFrameRef}
              imageUrl={backdropSourceUrl}
              shot={shot}
              aspectRatio={aspectRatio}
            />
          )}

          {showFramingGuides && <CompositionOverlay allowBackdropPan={showFramingBackdrop} />}

          {frameView === 'preview' && (
            <div className="absolute top-3 left-3 z-30 pointer-events-auto flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <PreviewSubModeSegment
                  value={previewSubMode}
                  onChange={setPreviewSubMode}
                  hasBakedImage={hasBakedImage}
                  bakeWorkflow={bakeStartFrame}
                  modelStale={modelStale}
                />
                {bakeStartFrame && previewSubMode === 'model' && hasBakedImage && (
                  <button
                    type="button"
                    onClick={() => void saveBakedFrameToAssets()}
                    className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-lg border border-surface-600 bg-surface-900/80 text-gray-300 hover:text-white hover:border-brand-500/50 transition-colors"
                  >
                    Save to Assets
                  </button>
                )}
              </div>
              {previewSubMode === 'model' && hasBakeVariantChoice && (
                <BakedImageVariantSegment
                  value={bakedImageVariant}
                  onChange={setBakedImageVariant}
                />
              )}
            </div>
          )}

          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-surface-900/80 backdrop-blur-md rounded-xl px-4 py-2 border border-surface-700 opacity-0 group-hover:opacity-100 transition-all z-20 pointer-events-none group-hover:pointer-events-auto"
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
            {showFramingGuides && backdropSourceUrl && (
              <button
                type="button"
                onClick={() => resetBackdropFraming()}
                className="p-2 hover:bg-surface-700 rounded-lg transition-all text-gray-400"
                title="Reset backdrop framing"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
            <div className="h-6 w-px bg-surface-600" />
            {frameView === 'preview' && !bakeStartFrame && (
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
                frameView === 'generated' && generatedVideo
                  ? 'text-brand-300 bg-brand-500/20 border-brand-500/40'
                  : showModelPreview && frameView === 'preview'
                    ? 'text-brand-300 bg-brand-500/15 border-brand-500/30'
                    : 'text-gray-400 bg-surface-700/80 border-surface-600'
              }`}
              {...uiSectionProps(UI_SECTIONS.studioPreviewBlockingLabel)}
            >
              {previewBadge}
            </span>
            {frameView === 'generated' && generatedVideo && shot && (
              <>
                <div className="h-6 w-px bg-surface-600" />
                <GeneratedVideoStrip shot={shot} />
              </>
            )}
            <div className="h-6 w-px bg-surface-600" />
            <span className="text-xs text-gray-400">{timecode}</span>
          </div>

          </div>
          </div>
        </div>
      </div>
      )}
      <LoadAssetModal
        open={loadAssetOpen}
        onClose={() => setLoadAssetOpen(false)}
        onSelect={(assetId) => {
          loadBakedFrameFromAsset(assetId);
          setLoadAssetOpen(false);
        }}
      />
    </div>
  );
}