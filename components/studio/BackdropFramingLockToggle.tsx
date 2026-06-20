'use client';

import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { getBackdropCropStatus, getBackdropSlotIndex } from '@/lib/studio/backdrop-framing';
import type { AspectRatio } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

function LockIcon({ locked }: { locked: boolean }) {
  if (locked) {
    return (
      <svg className="backdrop-lock-toggle__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
    );
  }

  return (
    <svg className="backdrop-lock-toggle__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
      />
    </svg>
  );
}

export function BackdropFramingLockToggle() {
  const shots = useStudioStore((s) => s.shots);
  const currentShot = useStudioStore((s) => s.currentShot);
  const project = useStudioStore((s) => s.project);
  const toggleBackdropFramingLock = useStudioStore((s) => s.toggleBackdropFramingLock);

  const shot = shots.find((s) => s.id === currentShot) || shots[0];
  if (!shot) return null;

  const backdropSlotIndex = getBackdropSlotIndex(shot);
  if (backdropSlotIndex < 0 || !shot.references[backdropSlotIndex]) return null;

  const aspectRatio = (project.aspectRatio || '16:9') as AspectRatio;
  const backdropFramingLocked = Boolean(shot.backdropFramingByAspect?.[aspectRatio]?.locked);
  const backdropCropStatus = getBackdropCropStatus(shot, aspectRatio);
  const backdropLockPending = backdropCropStatus === 'pending';
  const backdropLockReady = backdropCropStatus === 'ready' && backdropFramingLocked;
  const backdropLockError = backdropCropStatus === 'error';

  const statusLabel = backdropLockPending
    ? 'Cropping…'
    : backdropFramingLocked
      ? 'Locked'
      : 'Not Locked';

  const title = backdropLockPending
    ? 'Cropping backdrop…'
    : backdropLockError
      ? 'Backdrop crop failed — click to retry lock'
      : backdropFramingLocked
        ? 'Unlock backdrop framing'
        : 'Lock backdrop framing';

  return (
    <div
      className={`backdrop-framing-lock-toggle-wrap ${
        backdropLockError
          ? 'backdrop-framing-lock-toggle-wrap--error'
          : backdropLockReady
            ? 'backdrop-framing-lock-toggle-wrap--ready'
            : backdropFramingLocked
              ? 'backdrop-framing-lock-toggle-wrap--locked'
              : ''
      }`}
      {...uiSectionProps(UI_SECTIONS.studioPreviewBackdropLockToggle)}
    >
      <span className="backdrop-framing-lock-toggle-wrap__label text-sm whitespace-nowrap">
        Backdrop{' '}
        <span
          className={
            backdropLockReady
              ? 'text-emerald-400'
              : backdropFramingLocked
                ? 'text-brand-300'
                : 'text-gray-400'
          }
        >
          {statusLabel}
        </span>
      </span>
      <button
        type="button"
        onClick={() => toggleBackdropFramingLock()}
        disabled={backdropLockPending}
        className={`backdrop-lock-toggle ${backdropFramingLocked ? 'active' : ''} ${
          backdropLockReady ? 'backdrop-lock-toggle--ready' : ''
        } ${backdropLockError ? 'backdrop-lock-toggle--error' : ''}`}
        aria-pressed={backdropFramingLocked}
        aria-label={title}
        title={title}
      >
        <span className="backdrop-lock-toggle__knob">
          {backdropLockPending ? (
            <span className="backdrop-lock-toggle__spinner" aria-hidden />
          ) : backdropLockReady ? (
            <svg className="backdrop-lock-toggle__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <LockIcon locked={backdropFramingLocked} />
          )}
        </span>
      </button>
    </div>
  );
}