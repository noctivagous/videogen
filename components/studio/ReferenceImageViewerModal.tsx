'use client';

import { useEffect, useState } from 'react';
import { ManagedModal } from '@/components/ui/ModalManager';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { resolveReferenceDisplayUrl } from '@/lib/storage/reference-url';
import { useNavigateToStudioPanel } from '@/hooks/use-studio-panel-navigation';
import { useStudioStore } from '@/store/useStudioStore';

export interface ReferenceImageViewerModalProps {
  open: boolean;
  imageUrl: string;
  label: string;
  onClose: () => void;
  onOpenInMediaLibrary?: () => void;
}

function isVideoUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('data:video/')) return true;
  const base = url.split('?')[0]?.split('#')[0] ?? '';
  return /\.(mp4|webm|mov|m4v|ogg)$/i.test(base);
}

export function ReferenceImageViewerModal({
  open,
  imageUrl,
  label,
  onClose,
  onOpenInMediaLibrary,
}: ReferenceImageViewerModalProps) {
  const video = isVideoUrl(imageUrl);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const navigateToPanel = useNavigateToStudioPanel();
  const mediaLibrary = useStudioStore((s) => s.mediaLibrary);
  const globalMediaLibrary = useStudioStore((s) => s.globalMediaLibrary);
  const selectMediaLibraryItem = useStudioStore((s) => s.selectMediaLibraryItem);

  useEffect(() => {
    if (!open || !imageUrl) {
      setDimensions(null);
    }
  }, [open, imageUrl]);

  const openInMediaLibrary = () => {
    if (onOpenInMediaLibrary) {
      onOpenInMediaLibrary();
      return;
    }
    if (imageUrl) {
      const match = [...mediaLibrary, ...globalMediaLibrary].find((asset) => (
        asset.url === imageUrl || resolveReferenceDisplayUrl(asset.url) === imageUrl
      ));
      if (match) {
        selectMediaLibraryItem(match.id);
      }
    }
    onClose();
    navigateToPanel('media-library');
  };

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
      <div className="reference-image-viewer__header px-4 py-3 border-b border-surface-700 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
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
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-gray-400">
            Dimensions: {dimensions ? `${dimensions.width} × ${dimensions.height}` : 'Loading…'}
          </span>
          <button
            type="button"
            onClick={openInMediaLibrary}
            className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
          >
            Open in Media Library
          </button>
        </div>
      </div>
      <div className="reference-image-viewer__body flex-1 min-h-0 flex items-center justify-center bg-surface-900/60 p-4">
        {video ? (
          <video
            src={imageUrl}
            controls
            playsInline
            loop
            onLoadedMetadata={(e) => {
              const node = e.currentTarget;
              if (node.videoWidth && node.videoHeight) {
                setDimensions({ width: node.videoWidth, height: node.videoHeight });
              }
            }}
            className="reference-image-viewer__img max-w-full max-h-[calc(92vh-4.5rem)] rounded-lg"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={label}
            onLoad={(e) => {
              const node = e.currentTarget;
              if (node.naturalWidth && node.naturalHeight) {
                setDimensions({ width: node.naturalWidth, height: node.naturalHeight });
              }
            }}
            className="reference-image-viewer__img max-w-full max-h-[calc(92vh-4.5rem)] object-contain rounded-lg"
          />
        )}
      </div>
    </ManagedModal>
  );
}