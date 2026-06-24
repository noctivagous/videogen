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
    <svg
      className="backdrop-framing-lock-control__icon"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <rect x="3" y="11" width="18" height="10" rx="2" ry="2" strokeWidth="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 15v2" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function LockedLockIcon() {
  return (
    <svg
      className="backdrop-framing-lock-control__icon"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <rect x="3" y="11" width="18" height="10" rx="2" ry="2" strokeWidth="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 15v2" strokeWidth="2" strokeLinecap="round" />
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
      className={`backdrop-framing-lock-control ${
        backdropLockError
          ? 'backdrop-framing-lock-control--error'
          : backdropLockReady
            ? 'backdrop-framing-lock-control--ready'
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
        className={`backdrop-framing-lock-control__btn ${
          !lockedSelected ? 'backdrop-framing-lock-control__btn--active' : ''
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
        className={`backdrop-framing-lock-control__btn ${
          lockedSelected ? 'backdrop-framing-lock-control__btn--active' : ''
        }`}
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
