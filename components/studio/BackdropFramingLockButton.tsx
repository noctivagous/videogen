'use client';

import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { getBackdropCropStatus } from '@/lib/studio/backdrop-framing';
import type { AspectRatio } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

export interface BackdropFramingLockButtonProps {
  aspectRatio: AspectRatio;
  className?: string;
}

function UnlockedLockIcon() {
  return (
    <svg className="backdrop-framing-lock-segment__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
      />
    </svg>
  );
}

function LockedLockIcon() {
  return (
    <svg className="backdrop-framing-lock-segment__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
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
  const lockedSelected = backdropFramingLocked || backdropLockPending;

  const unlockTitle = 'Unlock backdrop framing';
  const lockTitle = backdropLockPending
    ? 'Cropping backdrop…'
    : backdropLockError
      ? 'Backdrop crop failed — click to retry lock'
      : 'Lock backdrop framing';

  const handleUnlock = () => {
    if (backdropLockPending || !backdropFramingLocked) return;
    toggleBackdropFramingLock();
  };

  const handleLock = () => {
    if (backdropLockPending || backdropFramingLocked) return;
    toggleBackdropFramingLock();
  };

  return (
    <div
      className={`frame-view-segment backdrop-framing-lock-segment ${
        backdropLockError
          ? 'backdrop-framing-lock-segment--error'
          : backdropLockReady
            ? 'backdrop-framing-lock-segment--ready'
            : ''
      } ${className}`.trim()}
      role="radiogroup"
      aria-label="Backdrop framing lock"
      {...uiSectionProps(UI_SECTIONS.studioPreviewBackdropFramingLock)}
    >
      <button
        type="button"
        role="radio"
        aria-checked={!lockedSelected}
        className={`frame-view-segment-btn backdrop-framing-lock-segment-btn ${
          !lockedSelected ? 'active' : ''
        }`}
        onClick={handleUnlock}
        disabled={backdropLockPending}
        title={unlockTitle}
        aria-label={unlockTitle}
      >
        <UnlockedLockIcon />
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={lockedSelected}
        className={`frame-view-segment-btn backdrop-framing-lock-segment-btn ${
          lockedSelected ? 'active' : ''
        } ${backdropLockReady ? 'backdrop-framing-lock-segment-btn--ready' : ''}`}
        onClick={handleLock}
        disabled={backdropLockPending}
        title={lockTitle}
        aria-label={lockTitle}
      >
        <LockedLockIcon />
      </button>
    </div>
  );
}
