'use client';

import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { getBackdropCropStatus } from '@/lib/studio/backdrop-framing';
import type { AspectRatio } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

export interface BackdropFramingLockButtonProps {
  aspectRatio: AspectRatio;
  className?: string;
}

export function BackdropFramingLockButton({ aspectRatio, className = '' }: BackdropFramingLockButtonProps) {
  const shots = useStudioStore((s) => s.shots);
  const currentShot = useStudioStore((s) => s.currentShot);
  const toggleBackdropFramingLock = useStudioStore((s) => s.toggleBackdropFramingLock);

  const shot = shots.find((s) => s.id === currentShot) ?? shots[0];
  if (!shot) return null;

  const backdropFramingLocked = Boolean(shot.backdropFramingByAspect?.[aspectRatio]?.locked);
  const backdropCropStatus = getBackdropCropStatus(shot, aspectRatio);
  const backdropLockPending = backdropCropStatus === 'pending';
  const backdropLockReady = backdropCropStatus === 'ready' && backdropFramingLocked;
  const backdropLockError = backdropCropStatus === 'error';

  const title = backdropLockPending
    ? 'Cropping backdrop…'
    : backdropLockError
      ? 'Backdrop crop failed — click to retry lock'
      : backdropFramingLocked
        ? 'Unlock backdrop framing'
        : 'Lock backdrop framing';

  return (
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
      } ${className}`.trim()}
      title={title}
      aria-label={title}
      {...uiSectionProps(UI_SECTIONS.studioPreviewBackdropFramingLock)}
    >
      {backdropLockPending ? (
        <span className="backdrop-framing-lock-btn__spinner" aria-hidden />
      ) : backdropLockReady ? (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      ) : backdropFramingLocked ? (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
          />
        </svg>
      )}
    </button>
  );
}
