'use client';

import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import {
  isImageDrag,
  readImageFromDataTransfer,
  readImageFromFile,
  type ReadImageResult,
} from '@/lib/studio/read-image-drop';
import { useEntityImageAssociateStore } from '@/store/useEntityImageAssociateStore';
import type { EntityImageAssociateKind } from '@/store/useEntityImageAssociateStore';

interface EntityImageAddButtonProps {
  kind: EntityImageAssociateKind;
  slotOrdinal?: number;
  label?: string;
  className?: string;
}

export function EntityImageAddButton({
  kind,
  slotOrdinal,
  label = 'Add image…',
  className = '',
}: EntityImageAddButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const openEntityImageAssociate = useEntityImageAssociateStore((s) => s.openEntityImageAssociate);
  const [dragActive, setDragActive] = useState(false);

  const openWithImage = (image: ReadImageResult) => {
    openEntityImageAssociate({
      kind,
      imageUrl: image.url,
      imageLabel: image.label,
      slotOrdinal,
    });
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    const image = await readImageFromFile(file);
    if (!image) return;
    openWithImage(image);
  };

  const handleDrop = async (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragActive(false);
    const image = await readImageFromDataTransfer(event.dataTransfer);
    if (!image) return;
    openWithImage(image);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={(event) => {
          if (!isImageDrag(event.dataTransfer)) return;
          event.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(event) => {
          if (!isImageDrag(event.dataTransfer)) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = 'copy';
          setDragActive(true);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setDragActive(false);
          }
        }}
        onDrop={(event) => void handleDrop(event)}
        className={`w-full flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg border border-dashed transition-colors text-[10px] font-medium ${
          dragActive
            ? 'border-brand-500 bg-brand-500/10 text-brand-300'
            : 'border-surface-600 bg-surface-800/40 hover:border-brand-500/60 hover:bg-surface-800 text-gray-400 hover:text-brand-300'
        } ${className}`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        {dragActive ? 'Drop image' : label}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void handleFile(e)}
      />
    </>
  );
}
