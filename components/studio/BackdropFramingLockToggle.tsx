'use client';

import { PRO_ENCLOSURE } from '@/lib/constants/prosumer-surfaces';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { getBackdropCropStatus, getEffectiveBackdropSourceUrl } from '@/lib/studio/backdrop-framing';
import type { AspectRatio } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

function LockIcon({ locked }: { locked: boolean }) {
  if (locked) {
    return (
      <svg className="preview-backdrop-lock__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
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
    <svg className="preview-backdrop-lock__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
      />
    </svg>
  );
}

function wrapStateClass(
  backdropLockError: boolean,
  backdropLockReady: boolean,
  backdropFramingLocked: boolean,
): string {
  if (backdropLockError) return 'preview-backdrop-lock--error';
  if (backdropLockReady) return 'preview-backdrop-lock--ready';
  if (backdropFramingLocked) return 'preview-backdrop-lock--locked';
  return '';
}

function statusStateClass(
  backdropLockPending: boolean,
  backdropLockReady: boolean,
  backdropFramingLocked: boolean,
  backdropLockError: boolean,
): string {
  if (backdropLockPending) return 'preview-backdrop-lock__status--pending';
  if (backdropLockReady) return 'preview-backdrop-lock__status--ready';
  if (backdropLockError) return 'preview-backdrop-lock__status--error';
  if (backdropFramingLocked) return 'preview-backdrop-lock__status--locked';
  return 'preview-backdrop-lock__status--idle';
}

export function BackdropFramingLockToggle() {
  const shots = useStudioStore((s) => s.shots);
  const currentShot = useStudioStore((s) => s.currentShot);
  const project = useStudioStore((s) => s.project);
  const toggleBackdropFramingLock = useStudioStore((s) => s.toggleBackdropFramingLock);

  const shot = shots.find((s) => s.id === currentShot) || shots[0];
  if (!shot) return null;

  const hasBackdrop = Boolean(getEffectiveBackdropSourceUrl(shot, shot.lighting));
  if (!hasBackdrop) {
    return (
      <div
        className={`${PRO_ENCLOSURE.previewBackdropLock} preview-backdrop-lock--empty`}
        {...uiSectionProps(UI_SECTIONS.studioPreviewBackdropLockToggle)}
      >
        <span className="preview-backdrop-lock__label">
          <span className="preview-backdrop-lock__status--idle">No Backdrop</span>
        </span>
      </div>
    );
  }

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
      className={`${PRO_ENCLOSURE.previewBackdropLock} ${wrapStateClass(
        backdropLockError,
        backdropLockReady,
        backdropFramingLocked,
      )}`.trim()}
      {...uiSectionProps(UI_SECTIONS.studioPreviewBackdropLockToggle)}
    >
      <span className="preview-backdrop-lock__label">
        Backdrop{' '}
        <span
          className={statusStateClass(
            backdropLockPending,
            backdropLockReady,
            backdropFramingLocked,
            backdropLockError,
          )}
        >
          {statusLabel}
        </span>
      </span>
      <button
        type="button"
        onClick={() => toggleBackdropFramingLock()}
        disabled={backdropLockPending}
        className={`preview-backdrop-lock__toggle ${
          backdropFramingLocked ? 'preview-backdrop-lock__toggle--active' : ''
        } ${backdropLockReady ? 'preview-backdrop-lock__toggle--ready' : ''} ${
          backdropLockError ? 'preview-backdrop-lock__toggle--error' : ''
        }`.trim()}
        aria-pressed={backdropFramingLocked}
        aria-label={title}
        title={title}
      >
        <span className="preview-backdrop-lock__knob">
          {backdropLockPending ? (
            <span className="preview-backdrop-lock__spinner" aria-hidden />
          ) : backdropLockReady ? (
            <svg className="preview-backdrop-lock__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
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