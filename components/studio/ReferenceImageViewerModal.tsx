'use client';

import { ManagedModal } from '@/components/ui/ModalManager';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';

export interface ReferenceImageViewerModalProps {
  open: boolean;
  imageUrl: string;
  label: string;
  onClose: () => void;
}

export function ReferenceImageViewerModal({
  open,
  imageUrl,
  label,
  onClose,
}: ReferenceImageViewerModalProps) {
  return (
    <ManagedModal
      open={open}
      onClose={onClose}
      className="reference-image-viewer__panel glass w-full max-w-5xl max-h-[92vh] rounded-2xl border border-surface-700 overflow-hidden flex flex-col modal"
      role="dialog"
      aria-modal="true"
      aria-label={`${label} reference image`}
      {...uiSectionProps(UI_SECTIONS.studioReferenceImageViewer)}
    >
      <div className="reference-image-viewer__header px-4 py-3 border-b border-surface-700 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-gray-200 truncate">{label}</span>
        <button
          type="button"
          onClick={onClose}
          className="p-2 hover:bg-surface-700 rounded-lg transition-all text-gray-400 hover:text-white shrink-0"
          aria-label="Close image viewer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="reference-image-viewer__body flex-1 min-h-0 flex items-center justify-center bg-surface-900/60 p-4">
        {imageUrl.endsWith('.mp4') || imageUrl.endsWith('.webm') || imageUrl.endsWith('.mov') || imageUrl.includes('/video') ? (
          <video
            src={imageUrl}
            controls
            playsInline
            loop
            className="reference-image-viewer__img max-w-full max-h-[calc(92vh-4.5rem)] rounded-lg"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={label}
            className="reference-image-viewer__img max-w-full max-h-[calc(92vh-4.5rem)] object-contain rounded-lg"
          />
        )}
      </div>
    </ManagedModal>
  );
}