'use client';

import { useEffect, useRef, useState, type DragEvent } from 'react';
import { normalizeReferenceRole } from '@/lib/constants/camera';
import { normalizeReferenceMode, REFERENCE_MODE_OPTIONS } from '@/lib/constants/reference-modes';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { resolveReferenceDisplayUrl } from '@/lib/storage/reference-url';
import { getBackdropCropStatus, getBackdropSlotIndex } from '@/lib/studio/backdrop-framing';
import { getEffectiveModelId } from '@/lib/studio/provider-modalities';
import {
  getReferenceSlotCount,
  getReferenceSlotIndices,
  getReferenceSlotLabel,
  isCinematographyRefs,
  MIN_REFERENCE_SLOTS,
} from '@/lib/studio/reference-slots';
import { getThemeTransformStatus } from '@/lib/studio/theme-transform';
import { restrictsReferenceSlotsToFirst } from '@/lib/studio/xai-video-models';
import { getWorkflowReferenceSteps, isLockStartFrame } from '@/lib/studio/workflow';
import { useCharacterAssignmentConnectorContext } from '@/components/studio/ThemeTransformConnectorProvider';
import { ReferenceImageViewerModal } from '@/components/studio/ReferenceImageViewerModal';
import { countMannequinsLinkedToSlot } from '@/lib/studio/mannequin-character-assignment';
import type { AspectRatio, ReferenceMode, ThemeTransformSlotStatus } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

interface ViewerSlot {
  index: number;
  url: string;
  label: string;
}

function isImageDrag(e: DragEvent): boolean {
  const types = Array.from(e.dataTransfer.types);
  return (
    types.includes('Files') ||
    types.includes('text/uri-list') ||
    types.includes('text/html') ||
    types.includes('application/x-moz-file')
  );
}

function transformStatusLabel(status: ThemeTransformSlotStatus, linked: boolean): string | null {
  if (!linked && status === 'idle') return null;
  switch (status) {
    case 'applying':
      return 'Applying…';
    case 'ready':
      return 'Themed';
    case 'stale':
      return 'Stale';
    case 'error':
      return 'Error';
    case 'idle':
      return linked ? 'Pending' : null;
    default:
      return null;
  }
}

export interface ReferenceSlotsProps {
  slotRefs?: React.MutableRefObject<(HTMLElement | null)[]>;
  hoverSlot?: number | null;
}

export function ReferenceSlots({ slotRefs, hoverSlot = null }: ReferenceSlotsProps) {
  const shots = useStudioStore((s) => s.shots);
  const currentShot = useStudioStore((s) => s.currentShot);
  const ai = useStudioStore((s) => s.ai);
  const setReference = useStudioStore((s) => s.setReference);
  const addReferenceSlot = useStudioStore((s) => s.addReferenceSlot);
  const removeReferenceSlot = useStudioStore((s) => s.removeReferenceSlot);
  const cycleReferenceRole = useStudioStore((s) => s.cycleReferenceRole);
  const setReferenceMode = useStudioStore((s) => s.setReferenceMode);
  const bakeStartFrame = useStudioStore((s) => s.bakeStartFrame);
  const invalidateBakedFrame = useStudioStore((s) => s.invalidateBakedFrame);
  const isBakingStartFrame = useStudioStore((s) => s.isBakingStartFrame);
  const toggleBackdropFramingLock = useStudioStore((s) => s.toggleBackdropFramingLock);
  const project = useStudioStore((s) => s.project);
  const fileInputs = useRef<(HTMLInputElement | null)[]>([]);
  const localSlotRefs = useRef<(HTMLElement | null)[]>([]);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [viewerSlot, setViewerSlot] = useState<ViewerSlot | null>(null);
  const characterConnector = useCharacterAssignmentConnectorContext();

  const shot = shots.find((s) => s.id === currentShot) || shots[0];
  const slotCount = getReferenceSlotCount(shot);
  const videoModelId = getEffectiveModelId(ai);
  const singleImageOnly = restrictsReferenceSlotsToFirst(ai.defaultVideoProvider, videoModelId);

  useEffect(() => {
    localSlotRefs.current = localSlotRefs.current.slice(0, slotCount);
    if (slotRefs) slotRefs.current = slotRefs.current.slice(0, slotCount);
  }, [slotCount, slotRefs]);

  useEffect(() => {
    const clearDrag = () => setDragOverIndex(null);
    window.addEventListener('dragend', clearDrag);
    window.addEventListener('drop', clearDrag);
    return () => {
      window.removeEventListener('dragend', clearDrag);
      window.removeEventListener('drop', clearDrag);
    };
  }, []);

  if (!shot) return null;

  const referenceMode = normalizeReferenceMode(shot);
  const autoRoles = isCinematographyRefs(shot);
  const hasAnyImage = shot.references.some(Boolean);
  const backdropSlotIndex = getBackdropSlotIndex(shot);
  const aspectRatio = (project.aspectRatio || '16:9') as AspectRatio;
  const backdropFramingLocked = Boolean(shot.backdropFramingByAspect?.[aspectRatio]?.locked);
  const backdropCropStatus = getBackdropCropStatus(shot, aspectRatio);
  const backdropLockPending = backdropCropStatus === 'pending';
  const backdropLockReady = backdropCropStatus === 'ready' && backdropFramingLocked;
  const backdropLockError = backdropCropStatus === 'error';

  const handleFile = (index: number, file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => setReference(index, e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const openFilePicker = (index: number) => {
    fileInputs.current[index]?.click();
  };

  const setSlotRef = (index: number, el: HTMLElement | null) => {
    while (localSlotRefs.current.length <= index) {
      localSlotRefs.current.push(null);
    }
    localSlotRefs.current[index] = el;
    if (slotRefs) {
      while (slotRefs.current.length <= index) {
        slotRefs.current.push(null);
      }
      slotRefs.current[index] = el;
    }
  };

  const slotIndices = getReferenceSlotIndices(shot);
  const lockStartFrame = isLockStartFrame(shot);
  const workflowSteps = getWorkflowReferenceSteps(shot, shot?.lighting);
  const bakeReady = shot.bakeStatus === 'ready' && Boolean(shot.bakedStartFrame);

  return (
    <>
    <div className="flex flex-col gap-1.5">
      <div className="image-references-header flex flex-col gap-1.5">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-300">
          Image References
        </span>
        {!lockStartFrame && (
          <select
            value={referenceMode}
            onChange={(e) => setReferenceMode(e.target.value as ReferenceMode)}
            className="reference-mode-select w-full"
            aria-label="Reference mode"
          >
            {REFERENCE_MODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
        {lockStartFrame && workflowSteps.length > 0 && (
          <ol
            className="workflow-steps flex flex-col gap-1 text-[10px] text-gray-400"
            aria-label="Lock start frame workflow"
          >
            {workflowSteps.map((step, i) => (
              <li key={step.id} className="flex items-center gap-1.5">
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                    step.done ? 'bg-brand-500/30 text-brand-300' : 'bg-surface-700 text-gray-500'
                  }`}
                >
                  {step.done ? '✓' : i + 1}
                </span>
                <span className={step.done ? 'text-gray-300' : ''}>{step.label}</span>
              </li>
            ))}
          </ol>
        )}
        {lockStartFrame && (
          bakeReady ? (
            <button
              type="button"
              onClick={() => invalidateBakedFrame()}
              disabled={isBakingStartFrame}
              className="w-full px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-lg bg-surface-700 hover:bg-surface-600 disabled:opacity-40 text-gray-200 border border-surface-600"
            >
              Invalidate Baked Frame
            </button>
          ) : (
            <button
              type="button"
              onClick={() => bakeStartFrame()}
              disabled={isBakingStartFrame || workflowSteps.some((s) => !s.done && s.id !== 'bake')}
              className="w-full px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white"
            >
              {isBakingStartFrame ? 'Baking…' : 'Bake Start Frame'}
            </button>
          )
        )}
      </div>

      <div className="reference-slots-stack flex flex-col gap-2">
        {slotIndices.map((index) => {
          const removable = index >= MIN_REFERENCE_SLOTS;
          const imgData = resolveReferenceDisplayUrl(shot.references[index]);
          const role = normalizeReferenceRole(shot.referenceRoles[index] ?? 'None');
          const label = getReferenceSlotLabel(shot, index, role);
          const slotDisabled = singleImageOnly && index > 0;
          const linked = shot.themeTransformLinked?.[index] ?? false;
          const status = getThemeTransformStatus(shot, index);
          const statusLabel = transformStatusLabel(status, linked);
          const transformedUrl = resolveReferenceDisplayUrl(shot.transformedReferences?.[index] ?? null);
          const showTransformed = linked && (transformedUrl || status === 'applying' || status === 'stale' || status === 'error');
          const themeTarget = hoverSlot === index && !slotDisabled && Boolean(imgData);
          const isSubjectSlot = role === 'Subject' && Boolean(imgData) && !slotDisabled;
          const characterLinkedCount = countMannequinsLinkedToSlot(shot.mannequins, index);
          const characterLinked = characterLinkedCount > 0;
          const characterDragSource =
            characterConnector?.draggingCharacterSlotIndex === index;
          const characterSlotClass =
            characterLinked && characterConnector
              ? characterConnector.subjectSlotLinkClass(index)
              : '';
          const showCharacterOutlet =
            lockStartFrame &&
            isSubjectSlot &&
            characterConnector?.characterAssignmentEnabled;

          return (
            <div key={index} className="reference-slot-row">
              <div className="reference-slot-column">
              <div
                ref={(el) => setSlotRef(index, imgData && !slotDisabled ? el : null)}
                className={`reference-slot group ${imgData ? 'has-image' : ''} ${dragOverIndex === index ? 'drag-over' : ''} ${themeTarget ? 'reference-slot--theme-target' : ''} ${linked ? 'reference-slot--theme-linked' : ''} ${characterSlotClass} ${characterDragSource ? 'reference-slot--character-drag-source' : ''} ${slotDisabled ? 'reference-slot--disabled' : ''}`}
                title={
                  slotDisabled
                    ? 'Not sent to grok-imagine-video-1.5 — image-to-video uses Image 1 only'
                    : undefined
                }
                {...uiSectionProps(UI_SECTIONS.studioReferenceSlot, { suffix: index })}
                onClick={(e) => {
                  if (slotDisabled) return;
                  const target = e.target as HTMLElement;
                  if (
                    target.closest('.reference-label') ||
                    target.closest('.reference-remove') ||
                    target.closest('.reference-replace')
                  ) {
                    return;
                  }
                  if (!imgData) {
                    openFilePicker(index);
                  }
                }}
                onDragEnter={(e) => {
                  if (slotDisabled || !isImageDrag(e)) return;
                  e.preventDefault();
                  setDragOverIndex(index);
                }}
                onDragOver={(e) => {
                  if (slotDisabled || !isImageDrag(e)) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'copy';
                  setDragOverIndex(index);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setDragOverIndex((prev) => (prev === index ? null : prev));
                  }
                }}
                onDrop={(e) => {
                  if (slotDisabled) return;
                  e.preventDefault();
                  setDragOverIndex(null);
                  handleFile(index, e.dataTransfer.files[0]);
                }}
              >
                <span
                  className={`reference-label ${autoRoles && !slotDisabled ? '' : 'pointer-events-none cursor-default hover:text-gray-400 hover:border-surface-700'}`}
                  onClick={(e) => {
                    if (!autoRoles || slotDisabled) return;
                    e.stopPropagation();
                    cycleReferenceRole(index);
                  }}
                >
                  {label}
                </span>

                {dragOverIndex === index && (
                  <div className="reference-slot-drop-hint" aria-hidden>
                    <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Drop image</span>
                  </div>
                )}

                {imgData ? (
                  <>
                    <button
                      type="button"
                      className="reference-replace"
                      disabled={slotDisabled}
                      title="Replace image"
                      aria-label={`Replace ${label} image`}
                      onClick={(e) => {
                        if (slotDisabled) return;
                        e.stopPropagation();
                        openFilePicker(index);
                      }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="reference-remove"
                      disabled={slotDisabled}
                      title="Remove image"
                      aria-label={`Remove ${label} image`}
                      onClick={(e) => {
                        if (slotDisabled) return;
                        e.stopPropagation();
                        setReference(index, null);
                      }}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgData} alt="" className="reference-preview" />
                    {showCharacterOutlet && (
                      <button
                        type="button"
                        ref={(el) => characterConnector?.setSubjectOutletRef(index, el)}
                        className={`character-link-outlet hidden lg:block ${characterConnector.subjectOutletClass(index)}`}
                        title="Drag to a mannequin to assign this character"
                        aria-label={`Link ${label} to mannequin`}
                        onPointerDown={(e) => characterConnector?.startCharacterDrag(e, index)}
                      />
                    )}
                    {characterLinked && (
                      <span className="reference-character-link-badge" aria-hidden>
                        → {characterLinkedCount}
                      </span>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center text-gray-500 group-hover:text-gray-400 transition-colors">
                    <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[8px] uppercase font-bold tracking-tighter">Add Ref</span>
                  </div>
                )}
              </div>

              {showTransformed && (
                <div
                  className={`reference-transformed ${status === 'stale' ? 'reference-transformed--stale' : ''} ${status === 'error' ? 'reference-transformed--error' : ''}`}
                  {...uiSectionProps(UI_SECTIONS.studioTransformedReference, { suffix: index })}
                >
                  {status === 'applying' ? (
                    <div className="reference-transformed__spinner" aria-hidden />
                  ) : transformedUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={transformedUrl} alt="" className="reference-transformed__img" />
                  ) : (
                    <div className="reference-transformed__placeholder" />
                  )}
                </div>
              )}

              {statusLabel && (
                <span
                  className={`reference-transform-status reference-transform-status--${status}`}
                  title={shot.themeTransformError?.[index] ?? undefined}
                >
                  {statusLabel}
                </span>
              )}

              <input
                ref={(el) => { fileInputs.current[index] = el; }}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => handleFile(index, e.target.files?.[0])}
              />
              </div>

              {(imgData || index === backdropSlotIndex) && (
                <div className="reference-slot-actions">
                  {imgData && (
                    <button
                      type="button"
                      onClick={() => setViewerSlot({ index, url: imgData, label })}
                      disabled={slotDisabled}
                      className="reference-viewer-btn"
                      title="View image"
                      aria-label={`View ${label} image`}
                      {...uiSectionProps(UI_SECTIONS.studioReferenceSlotViewer, { suffix: index })}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                  )}

                  {index === backdropSlotIndex && (
                    <button
                      type="button"
                      onClick={() => toggleBackdropFramingLock()}
                      disabled={backdropLockPending}
                      className={`backdrop-framing-lock-btn ${
                        backdropLockError
                          ? 'backdrop-framing-lock-btn--error'
                          : backdropLockReady
                            ? 'backdrop-framing-lock-btn--ready'
                            : backdropFramingLocked
                              ? 'backdrop-framing-lock-btn--locked'
                              : ''
                      }`}
                      title={
                        backdropLockPending
                          ? 'Cropping backdrop…'
                          : backdropLockError
                            ? 'Backdrop crop failed — click to retry lock'
                            : backdropFramingLocked
                              ? 'Unlock backdrop framing'
                              : 'Lock backdrop framing'
                      }
                      {...uiSectionProps(UI_SECTIONS.studioPreviewBackdropFramingLock)}
                    >
                      {backdropLockPending ? (
                        <span className="backdrop-framing-lock-btn__spinner" aria-hidden />
                      ) : backdropLockReady ? (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : backdropFramingLocked ? (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              )}

              {removable && (
                <button
                  type="button"
                  onClick={() => removeReferenceSlot(index)}
                  className="reference-slot-remove-btn"
                  title="Remove reference slot"
                  aria-label={`Remove reference slot ${index + 1}`}
                  {...uiSectionProps(UI_SECTIONS.studioReferenceSlotRemove, { suffix: index })}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => addReferenceSlot()}
          className="reference-slot-add-btn"
          title="Add reference slot"
          aria-label="Add reference slot"
          {...uiSectionProps(UI_SECTIONS.studioReferenceSlotAdd)}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {hasAnyImage && (
          <span className="sr-only">Reference images attached</span>
        )}
      </div>
    </div>

    <ReferenceImageViewerModal
      open={viewerSlot !== null}
      imageUrl={viewerSlot?.url ?? ''}
      label={viewerSlot?.label ?? 'Reference'}
      onClose={() => setViewerSlot(null)}
    />
    </>
  );
}