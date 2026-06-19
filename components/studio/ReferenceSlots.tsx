'use client';

import { useEffect, useRef, useState, type DragEvent } from 'react';
import { normalizeReferenceRole } from '@/lib/constants/camera';
import { normalizeReferenceMode, REFERENCE_MODE_OPTIONS } from '@/lib/constants/reference-modes';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { resolveReferenceDisplayUrl } from '@/lib/storage/reference-url';
import { getEffectiveModelId } from '@/lib/studio/provider-modalities';
import { getReferenceSlotLabel, isCinematographyRefs } from '@/lib/studio/reference-slots';
import { getThemeTransformStatus } from '@/lib/studio/theme-transform';
import { restrictsReferenceSlotsToFirst } from '@/lib/studio/xai-video-models';
import type { ReferenceMode, ThemeTransformSlotStatus } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

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
  inletRefs?: React.MutableRefObject<(HTMLElement | null)[]>;
  hoverInlet?: number | null;
}

export function ReferenceSlots({ inletRefs, hoverInlet = null }: ReferenceSlotsProps) {
  const shots = useStudioStore((s) => s.shots);
  const currentShot = useStudioStore((s) => s.currentShot);
  const ai = useStudioStore((s) => s.ai);
  const setReference = useStudioStore((s) => s.setReference);
  const cycleReferenceRole = useStudioStore((s) => s.cycleReferenceRole);
  const setReferenceMode = useStudioStore((s) => s.setReferenceMode);
  const fileInputs = useRef<(HTMLInputElement | null)[]>([]);
  const localInletRefs = useRef<(HTMLElement | null)[]>([null, null, null]);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const shot = shots.find((s) => s.id === currentShot) || shots[0];
  const videoModelId = getEffectiveModelId(ai);
  const singleImageOnly = restrictsReferenceSlotsToFirst(ai.defaultVideoProvider, videoModelId);

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

  const handleFile = (index: number, file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => setReference(index, e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const setInletRef = (index: number, el: HTMLElement | null) => {
    localInletRefs.current[index] = el;
    if (inletRefs) inletRefs.current[index] = el;
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="image-references-header flex flex-col gap-1.5">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-300">
          Image References
        </span>
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
      </div>

      <div className="reference-slots-stack flex flex-col gap-2">
        {[0, 1, 2].map((index) => {
          const imgData = resolveReferenceDisplayUrl(shot.references[index]);
          const role = normalizeReferenceRole(shot.referenceRoles[index] ?? 'None');
          const label = getReferenceSlotLabel(shot, index, role);
          const slotDisabled = singleImageOnly && index > 0;
          const linked = shot.themeTransformLinked?.[index] ?? false;
          const status = getThemeTransformStatus(shot, index);
          const statusLabel = transformStatusLabel(status, linked);
          const transformedUrl = resolveReferenceDisplayUrl(shot.transformedReferences?.[index] ?? null);
          const showTransformed = linked && (transformedUrl || status === 'applying' || status === 'stale' || status === 'error');
          const inletActive = hoverInlet === index && !slotDisabled && Boolean(imgData);

          return (
            <div key={index} className="reference-slot-row">
              <button
                type="button"
                ref={(el) => setInletRef(index, el)}
                className={`theme-transform-inlet ${inletActive ? 'theme-transform-inlet--active' : ''} ${linked ? 'theme-transform-inlet--linked' : ''} ${slotDisabled || !imgData ? 'theme-transform-inlet--disabled' : ''}`}
                disabled={slotDisabled || !imgData}
                aria-label={`Theme transform inlet for ${label}`}
                tabIndex={-1}
                {...uiSectionProps(UI_SECTIONS.studioThemeTransformInlet, { suffix: index })}
              />

              <div className="reference-slot-column">
              <div
                className={`reference-slot group ${imgData ? 'has-image' : ''} ${dragOverIndex === index ? 'drag-over' : ''} ${slotDisabled ? 'reference-slot--disabled' : ''}`}
                title={
                  slotDisabled
                    ? 'Not sent to grok-imagine-video-1.5 — image-to-video uses Image 1 only'
                    : undefined
                }
                {...uiSectionProps(UI_SECTIONS.studioReferenceSlot, { suffix: index })}
                onClick={(e) => {
                  if (slotDisabled) return;
                  if (!(e.target as HTMLElement).closest('.reference-label') &&
                      !(e.target as HTMLElement).closest('.reference-remove')) {
                    fileInputs.current[index]?.click();
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
                      className="reference-remove"
                      disabled={slotDisabled}
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
            </div>
          );
        })}

        {hasAnyImage && (
          <span className="sr-only">Reference images attached</span>
        )}
      </div>
    </div>
  );
}