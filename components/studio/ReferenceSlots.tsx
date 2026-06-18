'use client';

import { useRef } from 'react';
import { normalizeReferenceRole } from '@/lib/constants/camera';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { useStudioStore } from '@/store/useStudioStore';

export function ReferenceSlots() {
  const shots = useStudioStore((s) => s.shots);
  const currentShot = useStudioStore((s) => s.currentShot);
  const setReference = useStudioStore((s) => s.setReference);
  const cycleReferenceRole = useStudioStore((s) => s.cycleReferenceRole);
  const fileInputs = useRef<(HTMLInputElement | null)[]>([]);

  const shot = shots.find((s) => s.id === currentShot) || shots[0];
  if (!shot) return null;

  const hasAnyImage = shot.references.some(Boolean);

  const handleFile = (index: number, file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => setReference(index, e.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex gap-2" {...uiSectionProps(UI_SECTIONS.studioBottomReferences)}>
      {[0, 1, 2].map((index) => {
        const imgData = shot.references[index];
        const role = normalizeReferenceRole(shot.referenceRoles[index] ?? 'None');

        return (
          <div
            key={index}
            className={`reference-slot group ${imgData ? 'has-image' : ''}`}
            {...uiSectionProps(UI_SECTIONS.studioReferenceSlot, { suffix: index })}
            onClick={(e) => {
              if (!(e.target as HTMLElement).closest('.reference-label') &&
                  !(e.target as HTMLElement).closest('.reference-remove')) {
                fileInputs.current[index]?.click();
              }
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFile(index, e.dataTransfer.files[0]);
            }}
          >
            <span
              className="reference-label"
              onClick={(e) => { e.stopPropagation(); cycleReferenceRole(index); }}
            >
              {role}
            </span>

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
  );
}