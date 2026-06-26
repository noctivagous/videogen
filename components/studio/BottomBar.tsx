'use client';

import { useMemo, useRef, useState, type ReactNode } from 'react';
import { MentionTextarea } from '@/components/ui/MentionTextarea';
import { ManagedPopover } from '@/components/ui/ModalManager';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { buildModelPayloadStack } from '@/lib/studio/model-payload';
import { buildPromptMentionOptions } from '@/lib/studio/prompt-mentions';
import { buildGenerationRefs } from '@/lib/studio/generation-prompt';
import { getBackdropSlotIndex } from '@/lib/studio/backdrop-framing';
import { getSubjectChecklistSlotIndices } from '@/lib/studio/subject-sheet-slots';
import { getEffectiveModelId } from '@/lib/studio/provider-modalities';
import { filterRefsForImageToVideoOnly, isXAIImageToVideoOnlyModel } from '@/lib/studio/xai-video-models';
import { getWorkflowReferenceSteps, isBakeStartFrame } from '@/lib/studio/workflow';
import type { AspectRatio } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

interface PromptRefMeta {
  tag: string;
  url: string;
  dataType: string;
  parentLabel?: string;
}

interface PromptImageTagProps {
  tag: string;
  meta: PromptRefMeta;
}

function PromptImageTag({ tag, meta }: PromptImageTagProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const openPreview = () => {
    const rect = triggerRef.current?.getBoundingClientRect() ?? null;
    setAnchorRect(rect);
    setIsPreviewOpen(true);
  };

  return (
    <>
      <span
        ref={triggerRef}
        className="inline-flex items-center gap-1 rounded border border-surface-500 bg-surface-800/90 px-1 py-0.5 align-middle"
        onMouseEnter={openPreview}
        onMouseLeave={() => setIsPreviewOpen(false)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={meta.url}
          alt=""
          className="h-3.5 w-3.5 rounded object-cover bg-surface-600"
        />
        <span className="font-semibold text-brand-200">{tag}</span>
        <span className="text-gray-400">({meta.dataType}{meta.parentLabel ? ` · ${meta.parentLabel}` : ''})</span>
      </span>
      <ManagedPopover
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        anchorRect={anchorRect}
        className="pointer-events-none -translate-x-1/2 -translate-y-full"
      >
        <div className="w-40 rounded-md border border-surface-500 bg-surface-900/95 p-1 shadow-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={meta.url}
            alt=""
            className="h-24 w-full rounded object-cover bg-surface-700"
          />
        </div>
      </ManagedPopover>
    </>
  );
}

function renderPromptTextWithImageTags(
  text: string,
  refsByTag: Map<string, PromptRefMeta>,
): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /<IMAGE_(\d+)>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) != null) {
    const full = match[0];
    const start = match.index;
    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }
    const tag = full.toUpperCase();
    const meta = refsByTag.get(tag);
    if (!meta) {
      parts.push(full);
    } else {
      parts.push(<PromptImageTag key={`${tag}-${start}`} tag={tag} meta={meta} />);
    }
    lastIndex = start + full.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

export function ShotDesignerBottomBarContent() {
  const sceneSetup = useStudioStore((s) => s.sceneSetup);
  const shotActivity = useStudioStore((s) => s.shotActivity);
  const setSceneSetup = useStudioStore((s) => s.setSceneSetup);
  const setShotActivity = useStudioStore((s) => s.setShotActivity);
  const generate = useStudioStore((s) => s.generate);
  const bakeStartFrame = useStudioStore((s) => s.bakeStartFrame);
  const invalidateBakedFrame = useStudioStore((s) => s.invalidateBakedFrame);
  const isGenerating = useStudioStore((s) => s.isGenerating);
  const isBakingStartFrame = useStudioStore((s) => s.isBakingStartFrame);
  const shots = useStudioStore((s) => s.shots);
  const currentShot = useStudioStore((s) => s.currentShot);
  const setups = useStudioStore((s) => s.setups);
  const currentSetupId = useStudioStore((s) => s.currentSetupId);
  const characters = useStudioStore((s) => s.characters);
  const locations = useStudioStore((s) => s.locations);
  const project = useStudioStore((s) => s.project);
  const camera = useStudioStore((s) => s.camera);
  const lighting = useStudioStore((s) => s.lighting);
  const motion = useStudioStore((s) => s.motion);
  const ai = useStudioStore((s) => s.ai);

  const shot = shots.find((s) => s.id === currentShot) || shots[0];
  const setup = setups.find((s) => s.id === currentSetupId);
  const hasAnyImage = shot?.references.some(Boolean) ?? false;
  const mentionOptions = useMemo(
    () => buildPromptMentionOptions(shot, { setup, characters, locations }),
    [shot, setup, characters, locations],
  );
  const isBakeWorkflow = isBakeStartFrame(shot);
  const workflowSteps = shot
    ? getWorkflowReferenceSteps(shot, shot.lighting, (project.aspectRatio || '16:9') as AspectRatio)
    : [];
  const checklistTasks = workflowSteps.filter((step) => step.id !== 'bake');
  const checklistDone = checklistTasks.filter((step) => step.done).length;
  const checklistTotal = checklistTasks.length;
  const remainingChecklistSteps = checklistTasks.filter((step) => !step.done);
  const checklistReadyToBake = workflowSteps.every((step) => step.done || step.id === 'bake');
  const bakeReady = shot?.bakeStatus === 'ready' && Boolean(shot?.bakedStartFrame);
  const disableGenerate = isGenerating || (isBakeWorkflow && !bakeReady);

  const promptSettings = useMemo(() => {
    const rows = buildModelPayloadStack({
      project,
      camera,
      lighting,
      motion,
      sceneSetup: '',
      shotActivity: '',
      shot,
      ai,
    }).promptTable;
    return rows.filter((row) => row.source !== 'Scene Setup' && row.source !== 'Shot Activity');
  }, [project, camera, lighting, motion, shot, ai]);

  const refsByTag = useMemo(() => {
    const map = new Map<string, PromptRefMeta>();
    if (!shot) return map;

    let refs = buildGenerationRefs(shot, lighting, project.aspectRatio);
    if (ai.defaultVideoProvider === 'xai' && isXAIImageToVideoOnlyModel(getEffectiveModelId(ai))) {
      refs = filterRefsForImageToVideoOnly(refs);
    }

    const backdropSlotIndex = getBackdropSlotIndex(shot);
    const subjectSlots = getSubjectChecklistSlotIndices(shot);
    const setupSubjectOrdinalBySlot = new Map(subjectSlots.map((slot, ordinal) => [slot, ordinal]));
    const location = locations.find((entry) => entry.id === setup?.locationId);
    const coverage = setup?.shots.find((entry) => entry.id === shot.id);

    refs.forEach((ref, index) => {
      const tag = `<IMAGE_${index + 1}>`;
      let dataType = 'Reference';
      let parentLabel: string | undefined;

      const slotIndex = ref.slotIndex;
      const role = shot.referenceRoles[slotIndex];
      const subjectOrdinal = setupSubjectOrdinalBySlot.get(slotIndex);

      const characterMatch = characters.find((character) =>
        character.sheets.some((sheet) => sheet.url === ref.url)
          || (character.props ?? []).some((prop) => prop.url === ref.url),
      );
      const locationMatch = locations.find((entry) =>
        entry.plates.some((plate) => plate.url === ref.url)
          || (entry.setProps ?? []).some((prop) => prop.url === ref.url),
      );
      const matchedCharacterSheet = characterMatch?.sheets.find((sheet) => sheet.url === ref.url);
      const matchedCharacterProp = (characterMatch?.props ?? []).find((prop) => prop.url === ref.url);
      const matchedLocationPlate = locationMatch?.plates.find((plate) => plate.url === ref.url);
      const matchedSetProp = (locationMatch?.setProps ?? []).find((prop) => prop.url === ref.url);

      if (matchedCharacterSheet) {
        dataType = 'Character Sheet';
        parentLabel = characterMatch?.name;
      } else if (matchedCharacterProp) {
        dataType = 'Character Prop';
        parentLabel = characterMatch?.name;
      } else if (matchedLocationPlate) {
        dataType = 'Backdrop Plate';
        parentLabel = locationMatch?.name;
      } else if (matchedSetProp) {
        dataType = 'Set Prop';
        parentLabel = locationMatch?.name;
      } else if (slotIndex === backdropSlotIndex) {
        dataType = 'Backdrop Plate';
        parentLabel = location?.name ?? (coverage?.backdropId ? 'Manual' : undefined);
      } else if (subjectOrdinal != null) {
        dataType = 'Character Sheet';
        const characterId = setup?.characterSlots?.[subjectOrdinal];
        const character = characterId ? characters.find((entry) => entry.id === characterId) : null;
        parentLabel = character?.name ?? 'Manual';
      } else if (role === 'Style') {
        dataType = 'Style / Wardrobe / Prop';
      } else if (role === 'Depth') {
        dataType = 'Depth';
      } else if (role === 'Canny') {
        dataType = 'Canny';
      } else if (role === 'Subject') {
        dataType = 'Subject Reference';
      } else if (role === 'Backdrop') {
        dataType = 'Backdrop Plate';
      }

      map.set(tag, {
        tag,
        url: ref.url,
        dataType,
        parentLabel,
      });
    });

    return map;
  }, [shot, lighting, project.aspectRatio, ai, setup, locations, characters]);

  const setupTextareaClass =
    'w-full bg-transparent border-0 px-0 py-0 text-sm outline-none focus:ring-0 transition-all resize-none h-[52px]';
  const shotActivityClass =
    'w-full bg-surface-700/70 hover:bg-surface-600/80 focus:bg-surface-600/80 border border-surface-600 rounded-md px-2.5 py-2 text-xs outline-none focus:ring-1 focus:ring-brand-500 transition-all resize-none h-[44px]';

  return (
    <div className="flex gap-2 items-stretch">
          <div
            className="studio-bottom-panel flex-1 flex flex-col min-w-0"
            {...uiSectionProps(UI_SECTIONS.studioBottomPrompt)}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <label className="text-xs uppercase tracking-wider font-semibold text-gray-300">Prompt</label>
              </div>
              {hasAnyImage && (
                <div className="text-[10px] text-gray-500 italic max-w-sm text-right leading-tight">
                  References guide generation. Blocking preview shows framing only.
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="rounded-lg border border-surface-600 bg-surface-800/70 px-2.5 py-2">
                <div className="flex flex-wrap items-start gap-1 mb-2 max-h-[2.75rem] overflow-y-auto pr-1">
                  {promptSettings.length > 0 ? (
                    promptSettings.map((row, index) => (
                        <span
                          key={`${row.source}-${row.text}-${index}`}
                          className="inline-flex items-stretch rounded-md border border-surface-600 bg-surface-700/70 text-[10px] text-gray-200 leading-tight"
                          title={`${row.source}: ${row.text}`}
                        >
                        <span className="px-1.5 py-1 uppercase tracking-wider font-semibold text-brand-200 border-r border-brand-400/30 bg-brand-500/20">
                          {row.source}
                        </span>
                        <span className="px-1.5 py-1 break-words">
                          {renderPromptTextWithImageTags(row.text, refsByTag)}
                        </span>
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-gray-500 italic">
                      Prompt settings from Camera/Lighting/Motion will appear here as read-only tokens.
                    </span>
                  )}
                </div>
                <div className="border-t border-surface-600 pt-2">
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 block mb-1">
                    Scene Setup
                  </label>
                  <MentionTextarea
                    value={sceneSetup}
                    onChange={setSceneSetup}
                    mentionOptions={mentionOptions}
                    placeholder={
                      hasAnyImage
                        ? 'Add scene context here… Type @ to insert a reference from a filled slot.'
                        : 'Describe the scene… Type @ to reference a filled slot image'
                    }
                    className={setupTextareaClass}
                  />
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <label className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Shot Activity</label>
                <MentionTextarea
                  value={shotActivity}
                  onChange={setShotActivity}
                  mentionOptions={mentionOptions}
                  placeholder="Optional action notes…"
                  className={shotActivityClass}
                />
              </div>
            </div>
          </div>

          <div
            className="studio-bottom-panel studio-bottom-panel--generate shrink-0 flex"
            {...uiSectionProps(UI_SECTIONS.studioBottomGenerate)}
          >
            {isBakeWorkflow ? (
              <div className="w-full min-w-[8rem] flex flex-col gap-2">
                {bakeReady ? (
                  <button
                    type="button"
                    onClick={() => invalidateBakedFrame()}
                    disabled={isBakingStartFrame}
                    className="w-full px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-lg bg-surface-700 hover:bg-surface-600 disabled:opacity-40 text-gray-200 border border-surface-600"
                  >
                    Invalidate Baked Frame
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => bakeStartFrame()}
                      disabled={isBakingStartFrame || !checklistReadyToBake}
                      className="w-full px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white"
                    >
                      {isBakingStartFrame ? 'Baking…' : 'Bake Start Frame'}
                      {checklistTotal > 0 ? ` (${checklistDone}/${checklistTotal})` : ''}
                    </button>
                    {remainingChecklistSteps.length > 0 && (
                      <div className="rounded-md border border-surface-700 bg-surface-800/70 px-2 py-1.5">
                        <p className="text-[9px] uppercase tracking-wider text-gray-400 mb-1">
                          Remaining checklist items
                        </p>
                        <ul className="text-[10px] text-gray-300 space-y-0.5">
                          {remainingChecklistSteps.map((step) => (
                            <li key={step.id}>- {step.label}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}

                <button
                  type="button"
                  onClick={generate}
                  disabled={disableGenerate}
                  className="w-full min-w-[8rem] bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-500 disabled:opacity-40 px-4 py-3 rounded-lg font-bold text-sm transition-all shadow-lg shadow-brand-500/30 flex items-center justify-center gap-1 group"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Generate Video</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={generate}
                disabled={disableGenerate}
                className="w-full min-w-[5.5rem] bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-500 disabled:opacity-50 px-6 rounded-lg font-bold text-base transition-all shadow-lg shadow-brand-500/30 flex flex-col items-center justify-center gap-1 group"
              >
                <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Generate</span>
              </button>
            )}
          </div>
    </div>
  );
}
