'use client';

import { useEffect, useRef, useState, type DragEvent } from 'react';
import { normalizeReferenceRole } from '@/lib/constants/camera';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { getReferenceSlotLabel, isCinematographyRefs } from '@/lib/studio/reference-slots';
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

export function ReferenceSlots() {
  const shots = useStudioStore((s) => s.shots);
  const currentShot = useStudioStore((s) => s.currentShot);
  const setReference = useStudioStore((s) => s.setReference);
  const cycleReferenceRole = useStudioStore((s) => s.cycleReferenceRole);
  const toggleCinematographyRefs = useStudioStore((s) => s.toggleCinematographyRefs);
  const fileInputs = useRef<(HTMLInputElement | null)[]>([]);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const shot = shots.find((s) => s.id === currentShot) || shots[0];

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

  const cinematographyRefs = isCinematographyRefs(shot);
  const hasAnyImage = shot.references.some(Boolean);

  const handleFile = (index: number, file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => setReference(index, e.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2 min-w-[17rem]">
        <span
          className={`text-[10px] uppercase tracking-wider font-semibold transition-colors ${
            cinematographyRefs ? 'text-gray-300' : 'text-gray-500'
          }`}
        >
          Shot breakdown
        </span>
        <button
          type="button"
          className={`composition-toggle ${cinematographyRefs ? 'active' : ''}`}
          aria-pressed={cinematographyRefs}
          aria-label="Toggle shot breakdown reference slots"
          onClick={toggleCinematographyRefs}
        >
          <span className="composition-toggle-knob" />
        </button>
      </div>

      <div className="flex gap-2">
        {[0, 1, 2].map((index) => {
          const imgData = shot.references[index];
          const role = normalizeReferenceRole(shot.referenceRoles[index] ?? 'None');
          const label = getReferenceSlotLabel(shot, index, role);

          return (
            <div
              key={index}
              className={`reference-slot group ${imgData ? 'has-image' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
              {...uiSectionProps(UI_SECTIONS.studioReferenceSlot, { suffix: index })}
              onClick={(e) => {
                if (!(e.target as HTMLElement).closest('.reference-label') &&
                    !(e.target as HTMLElement).closest('.reference-remove')) {
                  fileInputs.current[index]?.click();
                }
              }}
              onDragEnter={(e) => {
                if (!isImageDrag(e)) return;
                e.preventDefault();
                setDragOverIndex(index);
              }}
              onDragOver={(e) => {
                if (!isImageDrag(e)) return;
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
                e.preventDefault();
                setDragOverIndex(null);
                handleFile(index, e.dataTransfer.files[0]);
              }}
            >
              <span
                className={`reference-label ${cinematographyRefs ? '' : 'pointer-events-none cursor-default hover:text-gray-400 hover:border-surface-700'}`}
                onClick={(e) => {
                  if (!cinematographyRefs) return;
                  e.stopPropagation();
                  cycleReferenceRole(index);
                }}
              >
                {label}
              </span>

              {dragOverIndex === index && (
                <div
                  className="reference-slot-drop-hint"
                  aria-hidden
                >
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
                    onClick={(e) => { e.stopPropagation(); setReference(index, null); }}
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

              <input
                ref={(el) => { fileInputs.current[index] = el; }}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => handleFile(index, e.target.files?.[0])}
              />
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