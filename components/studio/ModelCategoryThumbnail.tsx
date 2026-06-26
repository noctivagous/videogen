'use client';

import { useState } from 'react';
import { getModelCategoryThumbnailUrl } from '@/lib/constants/model-category-thumbnails';
import type { ModelCategoryId } from '@/lib/constants/model-catalog';

const THUMB_FRAME =
  'flex items-center justify-center flex-shrink-0 ring-1 ring-inset ring-white/5 overflow-hidden rounded-sm border border-surface-500/80 bg-surface-800/80';

export function ModelCategoryThumbnail({
  categoryId,
  size = 'sm',
  title,
  className = '',
}: {
  categoryId: ModelCategoryId;
  size?: 'sm' | 'md';
  title?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const sizeClass = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8';
  const frameClass = `${sizeClass} ${THUMB_FRAME} ${className}`.trim();

  if (failed) {
    return (
      <span
        aria-hidden
        className={frameClass}
        title={title ?? 'Category thumbnail'}
      />
    );
  }

  return (
    <span aria-hidden className={frameClass} title={title}>
      <img
        src={getModelCategoryThumbnailUrl(categoryId)}
        alt=""
        className="w-full h-full object-cover"
        onError={() => setFailed(true)}
      />
    </span>
  );
}
